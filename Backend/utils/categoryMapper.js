// utils/categoryMapper.js
// Maps clean category names to all variations found in the dataset.

const CATEGORY_MAP = {
  "Industrial / Waste": [
    "industrial",
    "industrial use",
    "industrial waste"
  ],
  "Agriculture": [
    "agriculture"
  ],
  "Antibiotic": [
    "antibiotic"
  ],
  "Carboxylic Acid": [
    "carboxylic acid"
  ],
  "Chemicals & Reagents": [
    "chemcual compound",
    "chemical",
    "chemical and drugs",
    "chemical compound",
    "chemical compound & reagent",
    "chemical compound and reagant",
    "chemical compound and reagent",
    "chemical compounds & reagents",
    "general chemicals",
    "genral chemical"
  ],
  "Cosmetics": [
    "cosmetic ingrediebt",
    "cosmetic product"
  ],
  "Drugs": [
    "drug",
    "drugs"
  ],
  "Dyes": [
    "dyes"
  ],
  "Environmental Pollutant": [
    "environmental pollutant",
    "environment pollutant"
  ],
  "Enzyme": [
    "enzyme"
  ],
  "Fat Soluble Antioxidant": [
    "fat soluble antioxidant"
  ],
  "Fatty Acids & Alcohols": [
    "fatty acid",
    "fatty acids",
    "fatty alcohol",
    "omega-hydroxy fatty acid",
    "medium-chain fatty acid"
  ],
  "Food Industry": [
    "food additive",
    "food industry",
    "food preservative"
  ],
  "Metabolite": [
    "metabolite",
    "metabolite, fatty acid",
    "metabolites"
  ],
  "Natural Product": [
    "natural product"
  ],
  "Organic Compounds": [
    "organic chemical compound",
    "organic compound",
    "organic compound and reagant",
    "organic compound and reagent",
    "organic compound, metabolite",
    "organic compounds",
    "organic heteromonocyclic compound",
    "synthetic organic compounds"
  ],
  "Peptide / Amino Acid": [
    "peptide/amino acid",
    "tertiary amino compound"
  ],
  "Personal Care & Toiletries": [
    "personal",
    "personal care products (pcps)",
    "personal care products/drugs",
    "personal care products/toileteries",
    "personal care products/toilteries",
    "toilteries"
  ],
  "PFAS": [
    "pfas"
  ],
  "Pharmaceuticals": [
    "pharmaceutical",
    "pharmaceutical, herbicides, dyes",
    "pharmaceuticals"
  ],
  "Plasticizer": [
    "plasticizer",
    "plasticizer/drugs"
  ],
  "Polymer Industry": [
    "polymer industry",
    "polymer/agriculture/drugs"
  ],
  "Refrigerant": [
    "refrigent",
    "refrigerent",
    "referigent"
  ],
  "Surfactant": [
    "surfactant"
  ]
};

// Flatten map for reverse lookup (dirty name -> clean category)
const REVERSE_MAP = {};
Object.entries(CATEGORY_MAP).forEach(([cleanName, dirtyList]) => {
  dirtyList.forEach(dirty => {
    REVERSE_MAP[dirty.toLowerCase()] = cleanName;
  });
});

/**
 * Gets the clean category name for a given raw category string.
 */
function getCleanCategory(rawCategory) {
  if (!rawCategory) return null;
  const clean = rawCategory.trim().toLowerCase();
  if (!clean) return null;
  return REVERSE_MAP[clean] || null; // Will return null if it's a blank/unmapped category
}

/**
 * Returns all dirty variations for a given clean category name.
 */
function getVariations(cleanCategory) {
  return CATEGORY_MAP[cleanCategory] || [];
}

module.exports = {
  CATEGORY_MAP,
  getCleanCategory,
  getVariations
};
