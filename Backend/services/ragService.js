/**
 * services/ragService.js
 * Optimized Local RAG Pipeline using Ollama.
 * Integrates persistent caching (JSON fallback) and Semantic Knowledge Chunking.
 */

const { isDatabaseConfigured, query } = require("../db/pool");
const { TextToJSON } = require("../utils/TextToJson");
const fs = require("fs");
const path = require("path");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBEDDING_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3";

const CACHE_PATH = path.join(__dirname, "../data/vectorStore.json");
const KNOWLEDGE_DIR = path.join(__dirname, "../data/knowledge");
const SAMPLE_FILES_DIR = path.join(__dirname, "../data/sample-files");

let vectorStore = [];
let isStoreInitialized = false;

// ── 1. Helper: Cosine Similarity ─────────────────────────────────────
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return normA === 0 || normB === 0 ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── 2. Helper: Get Embedding from Ollama ──────────────────────────────
async function getEmbedding(text) {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text })
    });
    if (!res.ok) throw new Error(`Ollama embedding error: ${res.statusText}`);
    const data = await res.json();
    return data.embedding;
  } catch (error) {
    console.error("Failed to get embedding from Ollama:", error.message);
    throw error;
  }
}

// ── 3. Init Vector Store (Chunking & Caching) ─────────────────────────
async function initVectorStore() {
  if (isStoreInitialized) return;
  console.log("Initializing RAG vector store...");

  // Load from cache first if available to save embedding time & handle offline
  if (fs.existsSync(CACHE_PATH)) {
    try {
      const cached = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
      if (Array.isArray(cached) && cached.length > 0) {
        vectorStore = cached;
        isStoreInitialized = true;
        console.log(`RAG loaded ${vectorStore.length} chunks from cache.`);
        return;
      }
    } catch (e) {
      console.warn("Failed to read vector store cache, rebuilding...");
    }
  }

  const chunks = [];

  // A. Semantic Knowledge Chunking
  if (fs.existsSync(KNOWLEDGE_DIR)) {
    const files = fs.readdirSync(KNOWLEDGE_DIR);
    files.forEach(file => {
      if (file.endsWith(".md")) {
        const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), "utf8");
        // Split by markdown headings
        const sections = content.split(/\n(?=## )/);
        sections.forEach(sec => {
          const clean = sec.trim();
          if (clean) chunks.push({ topic: file.replace('.md', ''), text: clean });
        });
      }
    });
  }

  // B. Structural Data (Fallback or DB)
  if (isDatabaseConfigured()) {
    try {
      const dsRes = await query("SELECT name, location FROM datasets LIMIT 5");
      dsRes.rows.forEach(d => chunks.push({ topic: "Datasets", text: `Dataset Name: ${d.name}, Location: ${d.location}` }));
    } catch (e) { console.warn("RAG DB Init failed:", e.message); }
  } else {
    chunks.push({ topic: "Environment", text: `This is a file-scan mode environment without a connected database.` });
  }

  // Generate embeddings for all chunks
  let successCount = 0;
  for (const chunk of chunks) {
    try {
      const emb = await getEmbedding(chunk.text);
      vectorStore.push({ text: chunk.text, topic: chunk.topic, embedding: emb });
      successCount++;
    } catch (e) {
      // Offline or missing model, skip the rest to avoid hanging
      console.warn("Ollama unavailable, halting embedding generation.");
      break;
    }
  }

  if (successCount > 0) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(vectorStore), "utf8");
  }

  isStoreInitialized = true;
  console.log(`RAG vector store initialized with ${vectorStore.length} chunks.`);
}

// ── 4. Retrieve Context ───────────────────────────────────────────────
async function retrieveContext(queryText, topK = 3) {
  if (!isStoreInitialized) await initVectorStore();
  if (vectorStore.length === 0) return "No background context available.";

  try {
    const queryEmb = await getEmbedding(queryText);
    const scored = vectorStore.map(chunk => ({
      text: chunk.text,
      score: cosineSimilarity(queryEmb, chunk.embedding)
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(t => t.text).join("\n\n");
  } catch (error) {
    console.error("Retrieval failed:", error.message);
    return "Failed to retrieve context (Ollama offline).";
  }
}

// ── 4.5. Hybrid Live Data Routing (Postgres or File-Scan Mode) ─────────
let fileScanIndex = null;
let knownCompoundsList = null;

function getFileScanData() {
  if (fileScanIndex) return fileScanIndex;
  fileScanIndex = new Map();

  if (!fs.existsSync(SAMPLE_FILES_DIR)) return fileScanIndex;

  const files = fs.readdirSync(SAMPLE_FILES_DIR).filter(f => f.endsWith(".txt"));
  files.forEach(file => {
    const filePath = path.join(SAMPLE_FILES_DIR, file);
    try {
      const data = TextToJSON(filePath);
      if (Array.isArray(data)) {
        const stationName = file.replace(".txt", "");
        data.forEach(row => {
          if (!row.Name) return;
          const key = row.Name.trim().toLowerCase();
          if (!fileScanIndex.has(key)) {
            fileScanIndex.set(key, {
              name: row.Name.trim(),
              formula: row.Formula || "",
              observations: []
            });
          }
          const area = parseFloat(row["Area (Max.)"]) || 0;
          fileScanIndex.get(key).observations.push({
            station: stationName,
            area: area,
            rt: row["RT [min]"] || "",
            mz: row["m/z"] || ""
          });
        });
      }
    } catch (e) {
      // Ignore empty or malformed files
    }
  });

  return fileScanIndex;
}

async function getKnownCompounds() {
  if (knownCompoundsList) return knownCompoundsList;

  if (isDatabaseConfigured()) {
    try {
      const res = await query("SELECT name FROM compounds");
      knownCompoundsList = res.rows.map(r => r.name).sort((a, b) => b.length - a.length);
      return knownCompoundsList;
    } catch (e) {
      console.warn("DB compound list load failed, falling back to file scan:", e.message);
    }
  }

  // File-scan mode: extract from sample files
  const idx = getFileScanData();
  knownCompoundsList = Array.from(idx.values())
    .map(c => c.name)
    .sort((a, b) => b.length - a.length);

  return knownCompoundsList;
}

async function fetchLiveDatasetContext(message) {
  const compounds = await getKnownCompounds();
  if (!compounds || compounds.length === 0) return null;

  const msgLower = message.toLowerCase();
  const foundCompound = compounds.find(k => msgLower.includes(k.toLowerCase()));
  if (!foundCompound) return null;

  // 1. Postgres Database Mode
  if (isDatabaseConfigured()) {
    try {
      const res = await query(`
        SELECT c.name as compound, s.code as station, co.area_max as area 
        FROM compound_observations co
        JOIN compounds c ON co.compound_id = c.id
        JOIN sample_files sf ON co.sample_file_id = sf.id
        JOIN stations s ON sf.station_id = s.id
        WHERE c.name = $1
        ORDER BY co.area_max DESC NULLS LAST
        LIMIT 5
      `, [foundCompound]);

      if (res.rows.length === 0) {
        return `LIVE DATA CONTEXT: Compound "${foundCompound}" was identified, but 0 observation records were found in the database.`;
      }

      const stats = res.rows.map((r, i) => `${i + 1}. Station: ${r.station} | Peak Area: ${Number(r.area).toLocaleString()}`).join("\n");
      return `LIVE DATA CONTEXT (Live PostgreSQL Observations for ${foundCompound}):\n${stats}`;
    } catch (e) {
      console.error("SQL Context Failed:", e.message);
    }
  }

  // 2. File-Scan Mode (using actual sample-files: SBW1_ALL_COMPOUNDS, SD3_ALL_Compounds, etc.)
  const idx = getFileScanData();
  const entry = idx.get(foundCompound.toLowerCase());
  if (!entry || entry.observations.length === 0) {
    return `LIVE DATA CONTEXT: Compound "${foundCompound}" was identified, but 0 observation records were found in the dataset sample files.`;
  }

  // Aggregate by station: keep highest area per station
  const stationMap = new Map();
  entry.observations.forEach(obs => {
    const existing = stationMap.get(obs.station);
    if (!existing || obs.area > existing.area) {
      stationMap.set(obs.station, obs);
    }
  });

  const sortedStations = Array.from(stationMap.values())
    .sort((a, b) => b.area - a.area)
    .slice(0, 5);

  const stats = sortedStations.map((r, i) => 
    `${i + 1}. Station: ${r.station} | Peak Area: ${Math.round(r.area).toLocaleString()}${r.rt ? ` | RT: ${r.rt} min` : ""}`
  ).join("\n");

  return `LIVE DATA CONTEXT (Live Sample File Observations for ${foundCompound}):\n${stats}`;
}

// ── 5. Generate Response (Streaming) ──────────────────────────────────
async function generateChatResponse(message, history, res) {
  try {
    // Proactively check if Ollama is reachable before retrieving context
    const ping = await fetch(`${OLLAMA_URL}/api/tags`).catch(() => null);
    if (!ping || !ping.ok) throw new Error("Failed to connect to local Ollama agent.");

    // Retrieve Static Knowledge (Vector DB)
    const context = await retrieveContext(message);
    
    // Retrieve Live Data (Postgres or File-Scan)
    const liveContext = await fetchLiveDatasetContext(message);

    let prompt = `You are an expert environmental chemistry AI assistant for the SearchApp platform.\n\n`;
    prompt += `CRITICAL ACCURACY & INTEGRITY RULES:\n`;
    prompt += `1. DO NOT invent, hallucinate, or make up station names (such as "Station 12", "Station 5", "Station ABC") or fake detection numbers.\n`;
    prompt += `2. Real station names in this platform correspond to specific sampling station codes and files (e.g., SD3_ALL_Compounds, SP2_ALL_Compounds, SBW1_ALL_COMPOUNDS).\n`;
    prompt += `3. When asked about top stations or detections for a chemical compound, ONLY report the exact stations and numbers provided in the LIVE DATA CONTEXT below. Answer directly.\n`;
    prompt += `4. If no detections are recorded or if the compound has no observations, explicitly state: "No detection records were found for [compound name] in the dataset." Never make up fictional stations or levels.\n`;
    prompt += `5. DO NOT confuse Schymanski confidence levels (Level 1–5 from methodology) with station names. Only mention confidence levels if asked about methodology or if explicitly specified in the data.\n`;
    prompt += `6. If the user's message is only a greeting (like "hello", "hi"), respond with a friendly 1-2 sentence greeting and ask how you can help. Do NOT greet if the user is asking a question.\n`;
    prompt += `7. Keep formatting neat with markdown bullet points and short concise answers.\n\n`;

    if (liveContext) {
      prompt += `${liveContext}\n\n`;
    }
    prompt += `BACKGROUND KNOWLEDGE:\n${context}\n\n`;
    prompt += `USER QUESTION: ${message}\n`;
    prompt += `YOUR ANSWER:\n`;

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: CHAT_MODEL, prompt: prompt, stream: true })
    });

    if (!response.ok) {
      res.write(`data: [ERROR] Ollama request failed: ${response.statusText}\n\n`);
      res.end();
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            const safeText = parsed.response.replace(/\n/g, "\\n");
            res.write(`data: ${safeText}\n\n`);
          }
        } catch (e) {}
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();

  } catch (error) {
    console.error("Chat Generation Error:", error.message);
    res.setHeader('Content-Type', 'text/event-stream');
    res.write(`data: [ERROR] Failed to connect to local Ollama agent.\n\n`);
    res.end();
  }
}

module.exports = { initVectorStore, generateChatResponse };
