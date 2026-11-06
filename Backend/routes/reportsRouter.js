/**
 * routes/reportsRouter.js
 * Phase 5 — Report generation + threshold management.
 */

const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const { generateReport, listReports, downloadReport } = require("../controllers/reportController");
const { getThresholds, createThreshold, updateThreshold, deleteThreshold } = require("../controllers/thresholdController");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ── Reports ───────────────────────────────────────────────────────────
router.post("/generate", generateReport);   // all roles can generate
router.get("/",          listReports);
router.get("/:id/download", downloadReport);

// ── Thresholds ────────────────────────────────────────────────────────
router.get("/thresholds",       getThresholds);                              // all roles
router.post("/thresholds",      authorize(["admin"]), createThreshold);
router.put("/thresholds/:id",   authorize(["admin"]), updateThreshold);
router.delete("/thresholds/:id",authorize(["admin"]), deleteThreshold);

module.exports = router;
