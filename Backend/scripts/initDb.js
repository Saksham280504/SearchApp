/**
 * scripts/initDb.js
 *
 * One-time / startup database initializer.
 * Run with: node scripts/initDb.js
 *
 * Actions:
 *   1. Apply schema.sql (idempotent — uses IF NOT EXISTS everywhere)
 *   2. Ensure baseline dataset (id = 1, "Varanasi HRMS") exists
 *   3. Upsert all 37+ stations from seeds/stations.js with latest coordinates & sampleFile mappings
 *   4. Link existing sample_files to stations and baseline dataset
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { getPool, isDatabaseConfigured } = require("../db/pool");
const { stations } = require("../seeds/stations");

const SCHEMA_PATH = path.join(__dirname, "../db/schema.sql");

const applySchema = async (client) => {
  console.log("📐 Applying schema...");
  const sql = fs.readFileSync(SCHEMA_PATH, "utf8");
  await client.query(sql);
  console.log("✅ Schema applied.");
};

const ensureBaselineDataset = async (client) => {
  console.log("📦 Ensuring baseline dataset exists...");
  await client.query(`
    INSERT INTO datasets (id, name, description, location, river)
    VALUES (1, 'Varanasi HRMS', 'Baseline 40-station Varanasi river water quality dataset', 'Varanasi, India', 'Ganga')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      location = EXCLUDED.location,
      river = EXCLUDED.river
  `);
  await client.query(`
    SELECT setval(pg_get_serial_sequence('datasets', 'id'), GREATEST((SELECT MAX(id) FROM datasets), 1))
  `);
  console.log("✅ Baseline dataset ready (id = 1).");
};

const seedStations = async (client) => {
  console.log("🌍 Upserting stations...");
  let upserted = 0;

  for (const s of stations) {
    await client.query(
      `
        INSERT INTO stations (code, name, source, sample_file, river, district, state, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          source = EXCLUDED.source,
          sample_file = EXCLUDED.sample_file,
          river = EXCLUDED.river,
          district = EXCLUDED.district,
          state = EXCLUDED.state,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude
      `,
      [
        s.code,
        s.name,
        s.source || null,
        s.sampleFile || null,
        s.river,
        s.district,
        s.state,
        s.latitude,
        s.longitude,
      ]
    );
    upserted++;
  }

  console.log(`✅ Stations synchronized: ${upserted} total stations.`);
};

const linkSampleFilesToStations = async (client) => {
  console.log("🔗 Linking sample_files to stations and baseline dataset...");
  await client.query(`
    UPDATE sample_files
    SET dataset_id = 1
    WHERE dataset_id IS NULL
  `);

  const result = await client.query(`
    UPDATE sample_files sf
    SET station_id = st.id
    FROM stations st
    WHERE (LOWER(sf.station_code) = LOWER(st.code) OR LOWER(sf.file_name) = LOWER(st.sample_file))
      AND (sf.station_id IS NULL OR sf.station_id != st.id)
  `);
  console.log(`✅ Linked ${result.rowCount} sample file(s) to their stations.`);
};

const main = async () => {
  if (!isDatabaseConfigured()) {
    console.log("ℹ️  DATABASE_URL is not set. Skipping DB initialization (using file-scan mode).");
    process.exit(0);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await applySchema(client);
    await ensureBaselineDataset(client);
    await seedStations(client);
    await linkSampleFilesToStations(client);
    await client.query("COMMIT");
    console.log("\n🎉 Database initialization complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Initialization failed:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
