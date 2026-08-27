const express = require("express");
const router = express.Router();

// Import individual route modules
const campaignRoutes = require("./api/campaign");
const contactRoutes = require("./api/contacts");
const mediaRoutes = require("./api/media");
const reportRoutes = require("./api/reports");
const statsRoutes = require("./api/stats");
const templateRoutes = require("./api/templates");
const authRoutes = require("./api/auth");

// Use the imported routes
router.use("/campaign", campaignRoutes);
router.use("/contacts", contactRoutes);
router.use("/media", mediaRoutes);
router.use("/reports", reportRoutes);
router.use("/stats", statsRoutes);
router.use("/templates", templateRoutes);
router.use("/auth", authRoutes);

module.exports = router;