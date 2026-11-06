/**
 * routes/datasetRouter.js
 */

const express = require("express");
const { authenticate } = require("../middleware/auth");
const { getDatasets, getDatasetStations } = require("../controllers/datasetController");

const router = express.Router();

router.use(authenticate);

router.get("/", getDatasets);
router.get("/:id/stations", getDatasetStations);

module.exports = router;
