/**
 * routes/analyticsRouter.js
 * Analytics + GIS endpoints — all require authentication.
 */

const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  getStations,
  getCompoundMap,
  getCategoryCounts,
} = require("../controllers/analyticsController");

const router = express.Router();

// All analytics routes require a valid JWT
router.use(authenticate);

router.get("/stations", getStations);
router.get("/map", getCompoundMap);
router.get("/category-counts", getCategoryCounts);

module.exports = router;
