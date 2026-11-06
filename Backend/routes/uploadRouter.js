/**
 * routes/uploadRouter.js
 * Upload endpoints — restricted to researcher + admin roles.
 */

const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const { previewUpload, confirmUpload, cancelUpload } = require("../controllers/uploadController");

const router = express.Router();

// All upload routes require login + researcher or admin role
router.use(authenticate, authorize(["researcher", "admin"]));

// Step 1: Upload file and get preview
router.post("/preview", previewUpload);

// Step 2: Confirm import after metadata is filled
router.post("/confirm", confirmUpload);

// Cancel and clean up temp file
router.delete("/cancel", cancelUpload);

module.exports = router;
