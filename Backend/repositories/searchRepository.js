const { query, isDatabaseConfigured } = require("../db/pool");
const { getVariations } = require("../utils/categoryMapper");

const normalizeText = (value = "") => value.toString().trim().toLowerCase();

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapCompoundRowsToLegacyShape = (rows, compound) => ({
  success: true,
  Compound: compound,
  fileNames: rows.map((row) => row.file_name),
  mzValues: rows.map((row) => row.mz),
  retentionTimes: rows.map((row) => row.rt_min),
  molecularWeights: rows.map((row) => row.calc_mw),
  ChemicalFormulas: rows.map((row) => row.formula),
  ms2Values: rows.map((row) => row.ms2),
  ReferenceIons: rows.map((row) => row.reference_ion),
  areas: rows.map((row) => row.area_max),
});

const searchCompound = async (keyword, limit = 500) => {
  const normalized = normalizeText(keyword);
  const { rows } = await query(
    `
      SELECT
        sf.file_name,
        c.name,
        c.formula,
        c.category,
        co.mz,
        co.rt_min,
        co.area_max,
        co.calc_mw,
        co.ms2,
        co.reference_ion
      FROM compound_observations co
      JOIN compounds c ON c.id = co.compound_id
      JOIN sample_files sf ON sf.id = co.sample_file_id
      WHERE c.normalized_name ILIKE '%' || $1 || '%'
      ORDER BY co.area_max DESC NULLS LAST, sf.file_name ASC
      LIMIT $2
    `,
    [normalized, limit]
  );

  return {
    rows,
    legacy: mapCompoundRowsToLegacyShape(rows, keyword),
    exportRows: rows.map((row) => ({
      File: row.file_name,
      Name: row.name,
      Formula: row.formula,
      Category: row.category,
      "m/z": row.mz,
      "RT [min]": row.rt_min,
      "Calc. MW": row.calc_mw,
      MS2: row.ms2,
      "Reference Ion": row.reference_ion,
      "Area (Max.)": row.area_max,
    })),
  };
};

const searchCategory = async (keyword) => {
  const variations = getVariations(keyword).map((v) => v.toLowerCase().trim());
  const matchList = variations.length > 0 ? variations : [normalizeText(keyword)];

  const { rows } = await query(
    `
      SELECT DISTINCT ON (c.normalized_name, COALESCE(c.formula, ''))
        c.name,
        c.formula
      FROM compounds c
      WHERE LOWER(TRIM(COALESCE(c.category, ''))) = ANY($1::text[])
      ORDER BY c.normalized_name, COALESCE(c.formula, ''), c.name
    `,
    [matchList]
  );

  if (rows.length === 0) return null;

  return {
    Count: rows.length,
    CompoundNames: rows.map((row) => row.name),
    CompoundFormulas: rows.map((row) => row.formula),
  };
};

const autocompleteCompounds = async (input, limit = 10) => {
  const normalized = normalizeText(input);
  const { rows } = await query(
    `
      SELECT DISTINCT c.name
      FROM compounds c
      WHERE c.normalized_name ILIKE '%' || $1 || '%'
      ORDER BY c.name ASC
      LIMIT $2
    `,
    [normalized, limit]
  );
  return rows.map((row) => row.name);
};

module.exports = {
  isDatabaseConfigured,
  normalizeText,
  toNumber,
  searchCompound,
  searchCategory,
  autocompleteCompounds,
};
