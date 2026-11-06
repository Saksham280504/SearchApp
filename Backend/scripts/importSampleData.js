require("dotenv").config();

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getPool, isDatabaseConfigured } = require("../db/pool");
const { normalizeText, toNumber } = require("../repositories/searchRepository");

const DATA_DIR = path.join(__dirname, "../data");
const SAMPLE_DIR = path.join(DATA_DIR, "sample-files");
const CATEGORY_FILE = path.join(DATA_DIR, "OptimizedCategoryData.json");

const inferStationCode = (fileName) =>
  fileName.replace(/_ALL_?COMPOUNDS?\.txt$/i, "").replace(/_ALL_?Compounds?\.txt$/i, "");

const parseJsonFile = (filePath) => {
  try {
    const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").trim();
    if (!text) return [];
    return JSON.parse(text);
  } catch (err) {
    console.warn(`⚠️  Skipping malformed JSON file (${path.basename(filePath)}): ${err.message}`);
    return [];
  }
};

const checksum = (filePath) =>
  crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

const loadCategoryMap = () => {
  const map = new Map();
  if (!fs.existsSync(CATEGORY_FILE)) return map;

  parseJsonFile(CATEGORY_FILE).forEach((row) => {
    const name = (row.Name || "").trim();
    const formula = (row.Formula || "").trim();
    const category = (row.Category || "").trim();
    if (!name || !category) return;
    const key = `${normalizeText(name)}||${formula}`;
    if (!map.has(key)) map.set(key, category);
  });

  return map;
};

const upsertSampleFile = async (client, fileName, fileHash) => {
  const baseName = fileName.replace(/\.txt$/i, "");
  const stationCode = inferStationCode(fileName);

  // Check if file already imported with identical checksum and existing observations
  const existingCheck = await client.query(
    `SELECT sf.id, sf.checksum,
            (SELECT COUNT(*) FROM compound_observations co WHERE co.sample_file_id = sf.id) AS obs_count
     FROM sample_files sf
     WHERE sf.file_name = $1`,
    [baseName]
  );

  if (
    existingCheck.rows.length > 0 &&
    existingCheck.rows[0].checksum === fileHash &&
    Number(existingCheck.rows[0].obs_count) > 0
  ) {
    return { id: existingCheck.rows[0].id, alreadyImported: true };
  }

  const result = await client.query(
    `
      INSERT INTO sample_files (dataset_id, file_name, station_code, checksum)
      VALUES (1, $1, $2, $3)
      ON CONFLICT (file_name)
      DO UPDATE SET
        dataset_id = COALESCE(sample_files.dataset_id, 1),
        station_code = EXCLUDED.station_code,
        checksum = EXCLUDED.checksum
      RETURNING id
    `,
    [baseName, stationCode, fileHash]
  );
  return { id: result.rows[0].id, alreadyImported: false };
};

const upsertCompound = async (client, row, categoryMap, compoundCache) => {
  const name = (row.Name || "").trim();
  const formula = (row.Formula || "").trim();
  if (!name) return null;

  const normalizedName = normalizeText(name);
  const categoryKey = `${normalizedName}||${formula}`;
  const category = categoryMap.get(categoryKey) || null;
  const cacheKey = `${normalizedName}||${formula}||${category || ""}`;

  if (compoundCache.has(cacheKey)) {
    return compoundCache.get(cacheKey);
  }

  const result = await client.query(
    `
      INSERT INTO compounds (name, normalized_name, formula, category)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
      RETURNING id
    `,
    [name, normalizedName, formula || null, category]
  );

  if (result.rows[0]) {
    compoundCache.set(cacheKey, result.rows[0].id);
    return result.rows[0].id;
  }

  const existing = await client.query(
    `
      SELECT id
      FROM compounds
      WHERE normalized_name = $1
        AND COALESCE(formula, '') = $2
        AND COALESCE(category, '') = $3
      LIMIT 1
    `,
    [normalizedName, formula, category || ""]
  );

  const foundId = existing.rows[0]?.id || null;
  if (foundId) compoundCache.set(cacheKey, foundId);
  return foundId;
};

const insertObservation = async (client, sampleFileId, compoundId, row) => {
  await client.query(
    `
      INSERT INTO compound_observations (
        sample_file_id,
        compound_id,
        mz,
        rt_min,
        area_max,
        calc_mw,
        ms2,
        reference_ion,
        raw_record
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (sample_file_id, compound_id, mz, rt_min, area_max)
      DO UPDATE SET
        calc_mw = EXCLUDED.calc_mw,
        ms2 = EXCLUDED.ms2,
        reference_ion = EXCLUDED.reference_ion,
        raw_record = EXCLUDED.raw_record
    `,
    [
      sampleFileId,
      compoundId,
      toNumber(row["m/z"]),
      toNumber(row["RT [min]"]),
      toNumber(row["Area (Max.)"]),
      toNumber(row["Calc. MW"]),
      row.MS2 || null,
      row["Reference Ion"] || null,
      row,
    ]
  );
};

const main = async () => {
  if (!isDatabaseConfigured()) {
    console.log("ℹ️  DATABASE_URL is not set. Skipping sample data import (using file-scan mode).");
    process.exit(0);
  }

  const pool = getPool();
  const categoryMap = loadCategoryMap();
  const compoundCache = new Map();
  const files = fs.readdirSync(SAMPLE_DIR).filter((file) => file.endsWith(".txt"));
  const client = await pool.connect();
  let insertedObservations = 0;
  let skippedFiles = 0;
  let skippedRows = 0;

  try {
    for (const fileName of files) {
      const filePath = path.join(SAMPLE_DIR, fileName);
      const fileHash = checksum(filePath);
      const { id: sampleFileId, alreadyImported } = await upsertSampleFile(client, fileName, fileHash);

      if (alreadyImported) {
        skippedFiles += 1;
        continue;
      }

      const rows = parseJsonFile(filePath);
      if (rows.length === 0) {
        console.log(`Skipped empty/malformed file: ${fileName}`);
        continue;
      }

      await client.query("BEGIN");
      try {
        for (const row of rows) {
          const compoundId = await upsertCompound(client, row, categoryMap, compoundCache);
          if (!compoundId) {
            skippedRows += 1;
            continue;
          }
          await insertObservation(client, sampleFileId, compoundId, row);
          insertedObservations += 1;
        }
        await client.query("COMMIT");
        console.log(`✅ Imported ${rows.length} rows from ${fileName}`);
      } catch (fileErr) {
        await client.query("ROLLBACK");
        console.error(`❌ Failed importing ${fileName}:`, fileErr.message);
      }
    }

    // Link all imported sample_files to their corresponding stations
    await client.query(`
      UPDATE sample_files sf
      SET station_id = st.id,
          dataset_id = COALESCE(sf.dataset_id, 1)
      FROM stations st
      WHERE (LOWER(sf.station_code) = LOWER(st.code) OR LOWER(sf.file_name) = LOWER(st.sample_file))
        AND (sf.station_id IS NULL OR sf.station_id != st.id OR sf.dataset_id IS NULL)
    `);

    console.log(
      `🎉 Import complete. New observations: ${insertedObservations}. Unchanged files skipped: ${skippedFiles}.`
    );
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
