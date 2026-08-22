const express = require("express");
const multer = require("multer");
const path = require("path");
const { startNewCampaign } = require("../../whatsapp/campaignManager");

const router = express.Router();

// Multer setup for temporary contact file uploads
const tempContactStorage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "..", "..", "..", "uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const tempContactUpload = multer({ storage: tempContactStorage });

// Route to start a new campaign
router.post(
  "/start",
  tempContactUpload.single("contactFile"),
  (req, res) => {
    const io = req.app.get("socketio"); // Get io instance from app
    const raw = req.body.templateIds;
    const asArray = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const templateIds = [...new Set(asArray.map((id) => String(id)))];

    const campaignData = { ...req.body, templateIds, contactFile: req.file };
    startNewCampaign(io, campaignData);
    res.json({ success: true, message: "Campaign started." });
  }
);

module.exports = router;