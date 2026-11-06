/**
 * controllers/chatController.js
 * Phase 4/5 Refinement — Chat agent with RAG
 */

const { generateChatResponse } = require("../services/ragService");

// ── POST /api/chat ───────────────────────────────────────────────────
const handleChat = async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  // Generate and stream response
  await generateChatResponse(message, history, res);
};

module.exports = {
  handleChat
};
