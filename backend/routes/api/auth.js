const express = require("express");
const router = express.Router();
const { logoutClient, getAuthStatus } = require("../../whatsapp/client");
const logger = require("../../utils/logger");

// GET current authentication status
router.get("/status", (req, res) => {
  try {
    const status = getAuthStatus();
    res.json(status);
  } catch (error) {
    logger.error("AUTH_API", "Error getting auth status:", error.message || error);
    res.status(500).json({ error: "Failed to get auth status" });
  }
});

// POST logout from WhatsApp
router.post("/logout", async (req, res) => {
  try {
    logger.info("AUTH_API", "Received WhatsApp logout request from API client.");
    const result = await logoutClient();
    res.json(result);
  } catch (error) {
    logger.error("AUTH_API", "Error during logout:", error.message || error);
    res.status(500).json({ error: "Failed to logout", message: error.message });
  }
});

module.exports = router;
