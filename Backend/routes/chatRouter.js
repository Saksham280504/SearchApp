/**
 * routes/chatRouter.js
 */

const express = require("express");
const { authenticate } = require("../middleware/auth");
const { handleChat } = require("../controllers/chatController");

const router = express.Router();

router.use(authenticate);

router.post("/", handleChat);

module.exports = router;
