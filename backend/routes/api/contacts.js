const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { parseContacts } = require("../../utils/parser");

const router = express.Router();

const contactDir = path.join(__dirname, "..", "..", "contacts");
const dataDir = path.join(__dirname, "..", "..", "data");

// Multer setup for saving contact groups
const contactStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, contactDir),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const contactUpload = multer({ storage: contactStorage });

// API routes for contacts
router.get("/", (req, res) => {
    fs.readdir(contactDir, (err, files) => {
        if (err) return res.status(500).json({ error: "Could not read contacts directory" });
        const progressData = JSON.parse(fs.readFileSync(path.join(dataDir, "contact_progress.json")));
        const response = files
            .filter((f) => f.endsWith(".csv") || f.endsWith(".xlsx") || f.endsWith(".xls"))
            .map((file) => ({ name: file, progress: progressData[file] || 0 }));
        res.json(response);
    });
});

router.post("/upload", contactUpload.single("contactFile"), (req, res) => res.json({ success: true, file: req.file }));

router.delete("/:filename", (req, res) => {
    const filePath = path.join(contactDir, req.params.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const progressData = JSON.parse(fs.readFileSync(path.join(dataDir, "contact_progress.json")));
    delete progressData[req.params.filename];
    fs.writeFileSync(path.join(dataDir, "contact_progress.json"), JSON.stringify(progressData, null, 2));
    res.json({ success: true });
});

router.get("/:filename", (req, res) => {
    const filePath = path.join(contactDir, req.params.filename);
    parseContacts(null, filePath, (err, contacts) => {
        if (err) return res.status(500).json({ error: "Could not read contact file." });
        res.json(contacts);
    });
});

router.post("/:filename/reset", (req, res) => {
    const progressData = JSON.parse(fs.readFileSync(path.join(dataDir, "contact_progress.json")));
    delete progressData[req.params.filename];
    fs.writeFileSync(path.join(dataDir, "contact_progress.json"), JSON.stringify(progressData, null, 2));
    res.json({ success: true });
});

router.post("/:filename", (req, res) => {
    const contacts = req.body;
    const filePath = path.join(contactDir, req.params.filename);
    try {
        const worksheet = xlsx.utils.json_to_sheet(contacts);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Contacts");
        xlsx.writeFile(workbook, filePath);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to save file." });
    }
});

module.exports = router;