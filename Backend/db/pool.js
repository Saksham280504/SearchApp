require("dotenv").config();

const { Pool } = require("pg");

let pool = null;

const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL);

const getPool = () => {
  if (!isDatabaseConfigured()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }
  return pool;
};

const query = (text, params) => {
  const activePool = getPool();
  if (!activePool) {
    throw new Error("DATABASE_URL is not configured");
  }
  return activePool.query(text, params);
};

module.exports = {
  getPool,
  isDatabaseConfigured,
  query,
};
