const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const dataDir = path.join(__dirname, "..", "..", "data");

router.get("/", (req, res) => {
  const statsPath = path.join(dataDir, "stats.json");
  if (!fs.existsSync(statsPath)) {
    return res.json({ totalSent: 0, totalCampaigns: 0, daily: [] });
  }
  const stats = JSON.parse(fs.readFileSync(statsPath));
  const reports = fs
    .readdirSync(dataDir)
    .filter((file) => file.startsWith("report-"));
  stats.totalCampaigns = reports.length;
  res.json(stats);
});

router.post("/reset", (req, res) => {
  fs.writeFileSync(
    path.join(dataDir, "stats.json"),
    JSON.stringify({ totalSent: 0, daily: [] })
  );
  fs.readdirSync(dataDir)
    .filter((f) => f.startsWith("report-"))
    .forEach((f) => fs.unlinkSync(path.join(dataDir, f)));
  res.json({ success: true });
});

module.exports = router;