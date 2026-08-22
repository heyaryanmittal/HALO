const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const dataDir = path.join(__dirname, "..", "..", "data");

router.get("/", (req, res) => {
  fs.readdir(dataDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Could not read reports directory" });
    const reportFiles = files.filter(
      (file) => file.startsWith("report-") && file.endsWith(".csv")
    );
    res.json(reportFiles);
  });
});

router.get("/:filename", (req, res) => {
  const filePath = path.join(dataDir, req.params.filename);
  const results = [];
  fs.createReadStream(filePath)
    .pipe(require("csv-parser")())
    .on("data", (data) => results.push(data))
    .on("end", () => res.json(results))
    .on("error", () =>
      res.status(500).json({ error: "Could not read report file." })
    );
});

router.delete("/:filename", (req, res) => {
  const filePath = path.join(dataDir, req.params.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ success: true });
});

module.exports = router;