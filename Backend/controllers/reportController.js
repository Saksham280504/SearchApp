/**
 * controllers/reportController.js
 *
 * Phase 5 — Academic-Grade Civil Geoinformatics PDF Report Generation
 * Built for: Smart Laboratory on Clean Rivers (SLCR) — India-Denmark Initiative
 * Department of Civil Engineering, Indian Institute of Technology (BHU), Varanasi
 * Author: Saksham Modi (23065118)
 * Supervisor: Dr. Shishir Gaur
 *
 * POST /api/reports/generate   → Generates & downloads comprehensive PDF report
 * GET  /api/reports            → Lists user's past reports
 * GET  /api/reports/:id/download → Downloads archived PDF report
 */

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { query, isDatabaseConfigured } = require("../db/pool");
const { stations: seedStations } = require("../seeds/stations");

// Reports storage directory
const REPORTS_DIR = path.join(__dirname, "../uploads/reports");
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

// Institutional colour palette
const NAVY       = "#003087";
const SLCR_BLUE  = "#0a6a8b";
const GOLD       = "#C8972A";
const TEXT_DARK  = "#0f172a";
const TEXT_MUTED = "#475569";
const BORDER_COL = "#cbd5e1";
const BG_ALT     = "#f8fafc";
const RED        = "#dc2626";
const AMBER      = "#d97706";
const GREEN      = "#16a34a";

/**
 * Format date as DD/MM/YYYY
 */
const formatDDMMYYYY = (d = new Date()) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Draw horizontal separator
 */
const drawDivider = (doc, y = doc.y, col = "#e2e8f0", weight = 1) => {
  doc.moveTo(50, y).lineTo(545, y).strokeColor(col).lineWidth(weight).stroke();
};

/**
 * Standard page running header
 */
const addRunningHeader = (doc, compound) => {
  doc.save();
  doc.fontSize(8).fillColor(SLCR_BLUE).font("Helvetica-Bold")
     .text("SearchApp", 50, 28, { continued: true })
     .fillColor(TEXT_MUTED).font("Helvetica")
     .text(`  |  HRMS Technical Report: ${compound}  |  Dept. of Civil Engineering, IIT (BHU) Varanasi`, { align: "left" });
  doc.moveTo(50, 40).lineTo(545, 40).strokeColor("#cbd5e1").lineWidth(0.6).stroke();
  doc.restore();
};

// ── POST /api/reports/generate ─────────────────────────────────────────
const generateReport = async (req, res) => {
  const {
    compound,
    datasetId,
    barChartImage,
    mapConcentrationImage,
    mapZoneImage
  } = req.body;

  if (!compound) {
    return res.status(400).json({ error: "compound parameter is required." });
  }

  const userId = req.user?.id || null;
  const issueDate = formatDDMMYYYY();

  // ── 1. Fetch analytical observations across all stations ──────────
  let observations = [];

  if (isDatabaseConfigured()) {
    try {
      const params = [compound.trim().toLowerCase()];
      let dsFilter = "";
      if (datasetId) {
        params.push(datasetId);
        dsFilter = `AND sf.dataset_id = $${params.length}`;
      }

      const obsResult = await query(
        `SELECT
           c.name                   AS compound,
           st.code                  AS station,
           st.name                  AS "stationName",
           st.river,
           sf.file_name             AS "sampleFile",
           sf.sampling_date::text   AS date,
           co.area_max              AS area,
           co.mz,
           co.rt_min                AS rt,
           co.calc_mw               AS mw,
           c.formula,
           co.ms2                   AS ms2
         FROM compound_observations co
         JOIN compounds c       ON co.compound_id = c.id
         JOIN sample_files sf   ON co.sample_file_id = sf.id
         LEFT JOIN stations st  ON sf.station_id = st.id
         WHERE LOWER(c.name) = $1 ${dsFilter}
         ORDER BY co.area_max DESC NULLS LAST`,
        params
      );
      observations = obsResult.rows;
    } catch (err) {
      console.error("DB Report data fetch error:", err.message);
    }
  }

  // Fallback to file scan if no DB or DB empty
  if (observations.length === 0) {
    try {
      const { searchRequest } = require("../routes/search");
      const result = searchRequest(compound.trim(), "compound");
      if (result && result.displayData) {
        const stationLookup = new Map();
        seedStations.forEach((st) => {
          if (st.sampleFile) stationLookup.set(st.sampleFile.toLowerCase(), st);
          if (st.code) stationLookup.set(st.code.toLowerCase(), st);
        });

        observations = result.displayData.fileNames.map((fn, i) => {
          const baseName = fn.replace(".txt", "");
          const st = stationLookup.get(baseName.toLowerCase());
          return {
            compound,
            station: st ? st.code : fn.split("_")[0],
            stationName: st ? st.name : fn.split("_")[0],
            river: st ? st.river : "Ganga",
            sampleFile: baseName,
            date: "—",
            area: result.displayData.areas[i],
            mz: result.displayData.mzValues[i],
            rt: result.displayData.retentionTimes[i],
            mw: result.displayData.molecularWeights[i],
            formula: result.displayData.ChemicalFormulas[i] || "—",
            ms2: result.displayData.ms2Values[i] || "—",
          };
        }).filter(Boolean);

        // Sort descending by area
        observations.sort((a, b) => (parseFloat(b.area) || 0) - (parseFloat(a.area) || 0));
      }
    } catch (err) {
      console.error("File-scan report fallback error:", err.message);
    }
  }

  // ── 2. Create PDF document ─────────────────────────────────────────
  const filename = `SearchApp_Report_${compound.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}.pdf`;
  const filePath = path.join(REPORTS_DIR, filename);

  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
    bufferPages: true, // Enables dynamic 'Page X of Y' numbering
    autoFirstPage: true
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 1: TITLE PAGE (Matching Approved Academic Structure)
  // ═══════════════════════════════════════════════════════════════════
  doc.rect(0, 0, 595, 20).fill(NAVY);

  // Top Title
  doc.moveDown(2);
  doc.fontSize(22).fillColor(NAVY).font("Helvetica-Bold")
     .text("SearchApp", { align: "center" });

  doc.moveDown(0.4);
  doc.fontSize(11).fillColor(SLCR_BLUE).font("Helvetica-Bold")
     .text("An Advanced River Water Quality Intelligence Platform for Non-Target Chemical Screening and Spatial Remediation", {
       align: "center",
       width: 480
     });

  doc.moveDown(1.5);
  drawDivider(doc, doc.y, GOLD, 2);

  // Main Subject Title
  doc.moveDown(2);
  doc.fontSize(13).fillColor(TEXT_MUTED).font("Helvetica")
     .text("HRMS Spectrometry Analysis Report for", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(17).fillColor(NAVY).font("Helvetica-Bold")
     .text(`"${compound}"`, { align: "center", width: 490 });

  // Presented By Section
  doc.moveDown(4);
  doc.fontSize(11).fillColor(TEXT_MUTED).font("Helvetica-Bold")
     .text("Presented By", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(15).fillColor(TEXT_DARK).font("Helvetica-Bold")
     .text("Saksham Modi", { align: "center" });
  doc.fontSize(12).fillColor(TEXT_MUTED).font("Helvetica")
     .text("23065118", { align: "center" });

  // Supervisor
  doc.moveDown(2);
  doc.fontSize(11).fillColor(TEXT_MUTED).font("Helvetica-Bold")
     .text("Under the guidance of", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(14).fillColor(TEXT_DARK).font("Helvetica-Bold")
     .text("Dr. Shishir Gaur", { align: "center" });

  // Official IIT (BHU) Emblem
  const logoPath = path.join(__dirname, "../assets/iit_bhu_logo.png");
  if (fs.existsSync(logoPath)) {
    doc.moveDown(2);
    const logoY = doc.y;
    doc.image(logoPath, (595 - 90) / 2, logoY, { width: 90, height: 90 });
    doc.y = logoY + 100;
  } else {
    doc.moveDown(4);
  }

  // Institutional Affiliation
  doc.moveDown(1);
  doc.fontSize(12).fillColor(NAVY).font("Helvetica-Bold")
     .text("Department of Civil Engineering", { align: "center" });
  doc.moveDown(0.2);
  doc.fontSize(12).fillColor(TEXT_DARK).font("Helvetica-Bold")
     .text("INDIAN INSTITUTE OF TECHNOLOGY", { align: "center" });
  doc.fontSize(11).fillColor(TEXT_DARK).font("Helvetica-Bold")
     .text("(BANARAS HINDU UNIVERSITY)", { align: "center" });
  doc.fontSize(11).fillColor(TEXT_MUTED).font("Helvetica")
     .text("VARANASI – 221 005", { align: "center" });

  // Date
  doc.moveDown(2);
  doc.fontSize(11).fillColor(SLCR_BLUE).font("Helvetica-Bold")
     .text(`Date of Issue: ${issueDate}`, { align: "center" });

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 2: ABSTRACT PAGE
  // ═══════════════════════════════════════════════════════════════════
  doc.addPage();
  addRunningHeader(doc, compound);

  doc.moveDown(2);
  doc.fontSize(18).fillColor(NAVY).font("Helvetica-Bold")
     .text("ABSTRACT", 50, 60, { align: "center" });
  drawDivider(doc, 85, GOLD, 1.5);

  doc.fontSize(10).fillColor("#1e293b").font("Helvetica").lineGap(4);
  doc.text(
    "Rapid urbanisation and industrial activity in India have severely degraded the water quality of rivers, particularly smaller tributaries that serve as lifelines for civil settlements and agricultural systems. Reliable, real-time access to water quality data — including the chemical composition of water samples — is a critical need for environmental engineers and researchers working on river restoration.",
    50, 105, { align: "justify", width: 495 }
  );

  doc.moveDown(1);
  doc.text(
    "This report presents SearchApp, a full-stack web application designed to help researchers and environmental scientists search, sort, and visualise high-resolution mass spectrometry (HRMS) compound data collected from river water samples. The application is developed under the Smart Laboratory on Clean Rivers (SLCR) framework — a collaborative India-Denmark initiative — and supports evidence-based environmental decision-making.",
    { align: "justify", width: 495 }
  );

  doc.moveDown(1);
  doc.text(
    "SearchApp provides an integrated suite of analytical modules:",
    { align: "justify", width: 495 }
  );

  const modules = [
    { title: "Compound Search", desc: "Enables instantaneous querying across multi-file spectrometry datasets by compound name, extracting precursor mass-to-charge ratios (m/z), retention times (RT), molecular formulas, and peak area abundances." },
    { title: "Category Search", desc: "Facilitates systematic browsing and classification of chemical contaminants across functional families (e.g., pesticides, pharmaceuticals, industrial chemicals, plasticisers)." },
    { title: "Analytics Module", desc: "Delivers interactive analytical visualisations including multi-station heatmaps, total ion chromatograms (TIC/EIC), and mass-spectrum plots for spectral verification." },
    { title: "GIS Spatial Intelligence Module", desc: "Maps monitoring stations across the river basin, visualises relative compound abundances via graduated proportional markers, delineates spatial contamination envelopes using buffered convex hull algorithms, and interconnects detection sites via Minimum Spanning Tree (MST) spatial networks." },
    { title: "RAG AI Intelligence Pipeline", desc: "Incorporates an intelligent retrieval-augmented generation conversational agent featuring hybrid live SQL routing and local vector embeddings for instant catchment intelligence." },
    { title: "Automated Report Generation", desc: "Synthesises laboratory spectrometry data, geographical dispersion patterns, and regulatory thresholds into standardized technical documentation for civil planning." }
  ];

  doc.moveDown(0.5);
  modules.forEach((m, idx) => {
    doc.font("Helvetica-Bold").text(`${idx + 1}. ${m.title}: `, { continued: true, width: 495 });
    doc.font("Helvetica").text(m.desc, { align: "justify" });
    doc.moveDown(0.3);
  });

  doc.moveDown(1);
  doc.font("Helvetica").text(
    "Results demonstrate that SearchApp substantially reduces the time required to locate specific chemical compounds in large multi-file datasets, making it a practical tool for environmental monitoring workflows. The portal is particularly relevant for Civil Engineering researchers involved in water quality characterisation, chemical oxygen demand (COD) studies, point-source pollution tracing, and river remediation planning.",
    { align: "justify", width: 495 }
  );

  doc.moveDown(1.5);
  doc.font("Helvetica-Bold").fillColor(SLCR_BLUE).text("Keywords: ", { continued: true });
  doc.font("Helvetica").fillColor(TEXT_MUTED)
     .text("Civil Geoinformatics, River Water Quality, HRMS Spectrometry, Ganga Basin, SLCR, Spatial Analysis Zone, Non-Target Screening.");

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 3: INTRODUCTION & OBJECTIVES
  // ═══════════════════════════════════════════════════════════════════
  doc.addPage();
  addRunningHeader(doc, compound);

  doc.moveDown(1.5);
  doc.fontSize(15).fillColor(NAVY).font("Helvetica-Bold")
     .text("1. INTRODUCTION", 50, 58);
  drawDivider(doc, 76, GOLD, 1.5);

  doc.fontSize(9.5).fillColor("#1e293b").font("Helvetica").lineGap(2.8);
  doc.text(
    "River systems across India — particularly the Ganga Basin and its tributaries — face severe water quality challenges from municipal effluents, industrial discharge, and agricultural runoff. Civil and environmental engineers monitoring river health collect water samples analysed through High-Resolution Mass Spectrometry (HRMS). These analytical campaigns generate extensive multi-compound datasets containing thousands of organic contaminants, metabolites, and pollutants across dozens of spatial monitoring stations.",
    50, 88, { align: "justify", width: 495 }
  );

  doc.moveDown(0.6);
  doc.text(
    "Developed under the Smart Laboratory on Clean Rivers (SLCR) — a collaborative India-Denmark initiative — SearchApp provides a purpose-built computational intelligence portal. The system automates non-target chemical screening, spatial dispersion mapping, and technical compliance reporting across surface water (SW), groundwater (GW), wastewater (WW), and sewage treatment plants (STP), eliminating time-consuming and error-prone manual spreadsheet cross-referencing.",
    { align: "justify", width: 495 }
  );

  // Key Objectives
  doc.moveDown(0.9);
  doc.fontSize(12).fillColor(NAVY).font("Helvetica-Bold").text("1.1 Key Objectives of SearchApp");
  doc.moveDown(0.3);

  const objectives = [
    { name: "Query Engine", text: "Instantaneous compound and category querying across 40+ heterogeneous river monitoring sample files." },
    { name: "Interactive Analytics", text: "Interactive spectral verification via ion chromatograms, mass spectra, and multi-station heatmaps." },
    { name: "GIS Spatial Intelligence", text: "Catchment mapping with graduated abundance markers, buffered contamination zones, and MST networks." },
    { name: "RAG AI Assistant", text: "Live database routing and environmental literature retrieval for real-time catchment insights." },
    { name: "Automated Reporting", text: "Standardized technical PDF synthesis combining laboratory observations and cartographic footprints." }
  ];

  objectives.forEach((obj) => {
    doc.fontSize(9).font("Helvetica-Bold").fillColor(TEXT_DARK).text(`• ${obj.name}: `, { continued: true });
    doc.font("Helvetica").fillColor("#334155").text(obj.text, { align: "justify" });
    doc.moveDown(0.18);
  });

  // Scope
  doc.moveDown(0.7);
  doc.fontSize(12).fillColor(NAVY).font("Helvetica-Bold").text("1.2 Scope of the Application");
  doc.moveDown(0.3);
  doc.fontSize(9).font("Helvetica").fillColor("#1e293b").text(
    "SearchApp serves as a civil geoinformatics platform for hydrological researchers, environmental engineers, and regulatory authorities (such as CPCB and NMCG). The application supports point-source pollution tracing, catchment vulnerability assessment, and targeted environmental remediation planning across Indian river basins.",
    { align: "justify", width: 495 }
  );

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 4: COMPOUND SEARCH MODULE RESULTS (Top 10 Table + Bar Chart)
  // ═══════════════════════════════════════════════════════════════════
  doc.addPage();
  addRunningHeader(doc, compound);

  doc.moveDown(1.5);
  doc.fontSize(14).fillColor(NAVY).font("Helvetica-Bold")
     .text("2. COMPOUND SEARCH MODULE & SPECTRAL OBSERVATIONS", 50, 58);
  drawDivider(doc, 76, GOLD, 1.5);

  doc.fontSize(8.5).fillColor("#1e293b").font("Helvetica").lineGap(2);
  doc.text(
    `In high-resolution mass spectrometry (HRMS) non-target screening, compounds are identified via high-precision mass-to-charge ratios (m/z), retention times (RT), molecular formulas, and fragmentation spectra (MS2). Chemical abundance across monitoring stations is quantified via integrated Peak Area (Area (Max.)). Below are the top 10 analytical observations for "${compound}".`,
    50, 84, { align: "justify", width: 495 }
  );

  // Table Heading
  doc.moveDown(0.6);
  doc.fontSize(10).fillColor(NAVY).font("Helvetica-Bold")
     .text(`Table 2.1: Top 10 Multi-Station Analytical Observations for "${compound}"`);
  doc.moveDown(0.3);

  // Table Headers
  const colX = [50, 105, 215, 265, 315, 375, 435, 480];
  const headers = ["Station", "Sample File", "m/z", "RT (min)", "MW", "Formula", "MS2", "Area (Max.)"];
  const headerY = doc.y;

  doc.rect(50, headerY, 495, 16).fill(NAVY);
  doc.fontSize(7.5).fillColor("#ffffff").font("Helvetica-Bold");
  headers.forEach((h, i) => {
    doc.text(h, colX[i] + 2, headerY + 4, { width: (colX[i+1] || 545) - colX[i] - 2, lineBreak: false });
  });
  doc.y = headerY + 18;

  // Table Rows: Max 10 rows!
  const maxRows = Math.min(observations.length, 10);
  for (let i = 0; i < maxRows; i++) {
    const row = observations[i];
    const rowY = doc.y;
    const bg = i % 2 === 0 ? BG_ALT : "#ffffff";
    doc.rect(50, rowY, 495, 13).fill(bg);

    doc.fontSize(7).fillColor(TEXT_DARK).font("Helvetica");
    const areaVal = parseFloat(row.area) || 0;

    const cells = [
      row.station || "—",
      row.sampleFile ? row.sampleFile.replace("_ALL_COMPOUNDS", "") : "—",
      row.mz ? parseFloat(row.mz).toFixed(4) : "—",
      row.rt ? parseFloat(row.rt).toFixed(2) : "—",
      row.mw ? parseFloat(row.mw).toFixed(2) : "—",
      row.formula || "—",
      row.ms2 && row.ms2 !== "—" ? "Yes" : "No",
      areaVal > 0 ? areaVal.toLocaleString("en-IN") : "—"
    ];

    cells.forEach((val, c) => {
      const isBold = c === 0 || c === 7;
      if (isBold) doc.font("Helvetica-Bold");
      else doc.font("Helvetica");
      doc.text(String(val), colX[c] + 2, rowY + 3, {
        width: (colX[c+1] || 545) - colX[c] - 2,
        lineBreak: false
      });
    });

    doc.y = rowY + 13;
  }

  // Registry Footnote
  doc.moveDown(0.2);
  if (observations.length > 10) {
    doc.fontSize(7.5).fillColor(TEXT_MUTED).font("Helvetica-Oblique")
       .text(`...and ${observations.length - 10} additional monitoring observations recorded in the laboratory registry.`, 55);
  }

  // Directly embed Bar Chart Image on the same page!
  if (barChartImage) {
    try {
      const base64Data = barChartImage.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(base64Data, "base64");

      doc.moveDown(0.5);
      const chartY = doc.y;
      doc.image(imgBuffer, 50, chartY, { width: 495, height: 215 });
      doc.y = chartY + 220;

      doc.fontSize(8).fillColor(TEXT_MUTED).font("Helvetica-Bold")
         .text(`Figure 2.1: Relative abundance (Peak Area) distribution of "${compound}" across top 10 detecting monitoring stations.`, {
           align: "center",
           width: 495
         });
    } catch (e) {
      console.warn("Could not embed bar chart image into PDF:", e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 5: GIS SPATIAL INTELLIGENCE & CATCHMENT DISPERSION
  // ═══════════════════════════════════════════════════════════════════
  doc.addPage();
  addRunningHeader(doc, compound);

  doc.moveDown(1.5);
  doc.fontSize(14).fillColor(NAVY).font("Helvetica-Bold")
     .text("3. GIS SPATIAL INTELLIGENCE & CONTAMINATION DELINEATION", 50, 58);
  drawDivider(doc, 76, GOLD, 1.5);

  doc.fontSize(8.5).fillColor("#1e293b").font("Helvetica").lineGap(2);
  doc.text(
    `In river catchment hydrology, spatial dispersion analysis determines whether chemical detections represent localized point-source pollution (such as industrial outfalls or municipal drains) or widespread non-point contamination. Monitoring stations represent Surface Water (SW), Groundwater (GW), Wastewater (WW), and Sewage Treatment Plants (STP). The cartographic map below illustrates the spatial abundance distribution across Varanasi monitoring stations.`,
    50, 84, { align: "justify", width: 495 }
  );

  // Map 1: Peak Area % Concentration Map
  if (mapConcentrationImage) {
    try {
      const base64Data = mapConcentrationImage.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(base64Data, "base64");

      doc.moveDown(0.6);
      const map1Y = doc.y;
      doc.image(imgBuffer, 50, map1Y, { width: 495, height: 310 });
      doc.y = map1Y + 315;

      doc.fontSize(8).fillColor(TEXT_MUTED).font("Helvetica-Bold")
         .text(`Figure 3.1: Spatial distribution and relative abundance of "${compound}" across Varanasi monitoring stations.`, {
           align: "center",
           width: 495
         });
    } catch (e) {
      console.warn("Could not embed concentration map image into PDF:", e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 6: SPATIAL CONTAMINATION ENVELOPE & CONNECTIVITY NETWORK
  // ═══════════════════════════════════════════════════════════════════
  if (mapZoneImage) {
    doc.addPage();
    addRunningHeader(doc, compound);

    doc.moveDown(1.5);
    doc.fontSize(14).fillColor(NAVY).font("Helvetica-Bold")
       .text("3.1 Delineated Spatial Contamination Envelope & Network", 50, 58);
    drawDivider(doc, 76, GOLD, 1.5);

    doc.fontSize(8.5).fillColor("#1e293b").font("Helvetica").lineGap(2);
    doc.text(
      "The shaded translucent buffer polygon represents the geographic contamination envelope encompassing all monitoring sites where the compound was detected with a ~700m dispersion margin. The dashed network lines trace the Minimum Spanning Tree (MST) connecting both perimeter and interior stations, demonstrating spatial continuity across the catchment.",
      50, 84, { align: "justify", width: 495 }
    );

    try {
      const base64Data = mapZoneImage.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(base64Data, "base64");

      doc.moveDown(0.6);
      const map2Y = doc.y;
      doc.image(imgBuffer, 50, map2Y, { width: 495, height: 310 });
      doc.y = map2Y + 315;

      doc.fontSize(8).fillColor(TEXT_MUTED).font("Helvetica-Bold")
         .text(`Figure 3.2: Delineated spatial contamination envelope and station connectivity network for "${compound}".`, {
           align: "center",
           width: 495
         });
    } catch (e) {
      console.warn("Could not embed spatial zone map image into PDF:", e.message);
    }
  }

  // ── 3. Page Numbering & Footer Pass (Page X of Y) ──────────────────
  const range = doc.bufferedPageRange();
  const totalPages = range.count;
  console.log(`[PDF Generator] Rendered ${totalPages} total pages for "${compound}".`);

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    // Suppress footer on Title Page (Page 1)
    if (i === 0) continue;

    doc.save();
    doc.moveTo(50, 785).lineTo(545, 785).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
    doc.fontSize(8).fillColor(TEXT_MUTED).font("Helvetica")
       .text(`SearchApp | Civil Engineering, IIT (BHU) Varanasi`, 50, 792, { align: "left" })
       .text(`Page ${i + 1} of ${totalPages}`, 50, 792, { align: "right", width: 495 });
    doc.restore();
  }

  doc.end();

  // ── 4. Stream response to client ───────────────────────────────────
  stream.on("finish", async () => {
    const reportId = String(Date.now());
    const userIdentifier = req.user?.id ? String(req.user.id) : (req.user?.email || "guest");
    const userEmail = (req.user?.email || "").toLowerCase();

    // Record into user reports index file
    if (!isDatabaseConfigured()) {
      try {
        const indexPath = path.join(REPORTS_DIR, "user_reports_index.json");
        let indexData = [];
        if (fs.existsSync(indexPath)) {
          try {
            indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));
            if (!Array.isArray(indexData)) indexData = [];
          } catch {}
        }
        indexData.unshift({
          id: reportId,
          userId: userIdentifier,
          userEmail: userEmail,
          file_name: filename,
          file_path: filePath,
          created_at: new Date().toISOString(),
          query_json: { compound, datasetId, observationsCount: observations.length }
        });
        fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
      } catch (err) {
        console.warn("User report index write error:", err.message);
      }
    } else {
      try {
        await query(
          `INSERT INTO reports (user_id, query_json, file_path)
           VALUES ($1, $2, $3)`,
          [userId, JSON.stringify({ compound, datasetId, observationsCount: observations.length }), filePath]
        );
      } catch (err) {
        console.warn("Report log DB error:", err.message);
      }
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  });

  stream.on("error", (err) => {
    console.error("PDF stream error:", err.message);
    res.status(500).json({ error: "Failed to generate technical PDF report." });
  });
};

// ── GET /api/reports ──────────────────────────────────────────────────
// Returns ONLY reports generated by the authenticated user (irrespective of role)
const listReports = async (req, res) => {
  const userIdentifier = req.user?.id ? String(req.user.id) : (req.user?.email || "");
  const userEmail = (req.user?.email || "").toLowerCase();

  if (!isDatabaseConfigured()) {
    try {
      const indexPath = path.join(REPORTS_DIR, "user_reports_index.json");
      if (!fs.existsSync(indexPath)) {
        return res.json({ reports: [] });
      }
      const indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      if (!Array.isArray(indexData)) return res.json({ reports: [] });

      // ONLY return reports created by this specific user
      const userReports = indexData.filter((r) => {
        const rEmail = (r.userEmail || "").toLowerCase();
        if (userEmail && rEmail) {
          return rEmail === userEmail;
        }
        if (userIdentifier && r.userId) {
          return String(r.userId) === String(userIdentifier);
        }
        return false;
      });
      return res.json({ reports: userReports });
    } catch {
      return res.json({ reports: [] });
    }
  }

  try {
    // Strictly user_id = $1 (users only see their own reports)
    const { rows } = await query(
      `SELECT id, query_json, file_path, created_at
       FROM reports
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    return res.json({ reports: rows });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch reports." });
  }
};

// ── GET /api/reports/:id/download ─────────────────────────────────────
const downloadReport = async (req, res) => {
  const userIdentifier = req.user?.id ? String(req.user.id) : (req.user?.email || "");
  const userEmail = (req.user?.email || "").toLowerCase();

  if (!isDatabaseConfigured()) {
    try {
      const indexPath = path.join(REPORTS_DIR, "user_reports_index.json");
      if (!fs.existsSync(indexPath)) return res.status(404).json({ error: "Report not found." });
      const indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      const item = indexData.find((r) => String(r.id) === String(req.params.id));
      if (!item) return res.status(404).json({ error: "Report not found." });

      const rEmail = (item.userEmail || "").toLowerCase();
      const isOwner = (userEmail && rEmail && rEmail === userEmail) ||
                      (!userEmail && userIdentifier && String(item.userId) === String(userIdentifier));
      if (!isOwner) {
        return res.status(403).json({ error: "Access denied. You can only download your own reports." });
      }

      if (!fs.existsSync(item.file_path)) {
        return res.status(404).json({ error: "Report file no longer exists." });
      }

      const compound = item.query_json?.compound || "report";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="SearchApp_Report_${compound}.pdf"`);
      return fs.createReadStream(item.file_path).pipe(res);
    } catch (e) {
      return res.status(500).json({ error: "Failed to download report." });
    }
  }

  try {
    const { rows } = await query(
      "SELECT file_path, query_json FROM reports WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (rows.length === 0 || !rows[0].file_path) {
      return res.status(404).json({ error: "Report not found or access denied." });
    }
    const filePath = rows[0].file_path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Report file not found." });
    }
    const compound = rows[0].query_json?.compound || "report";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="SearchApp_Report_${compound}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    return res.status(500).json({ error: "Failed to download report." });
  }
};

module.exports = { generateReport, listReports, downloadReport };
