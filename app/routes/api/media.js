const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const mediaDir = path.join(__dirname, "..", "..", "media");
const dataDir = path.join(__dirname, "..", "..", "data");

// Helpers
const loadTemplates = () => JSON.parse(fs.readFileSync(path.join(dataDir, "templates.json")));
const saveTemplates = (t) => fs.writeFileSync(path.join(dataDir, "templates.json"), JSON.stringify(t, null, 2));

// Multer setup for saving media files
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, mediaDir),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const mediaUpload = multer({ storage: mediaStorage });

// API routes for media
router.get("/", (req, res) => {
  fs.readdir(mediaDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Could not read media directory" });
    const fileData = files.map((file) => ({
      name: file,
      isImage: [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(
        path.extname(file).toLowerCase()
      ),
    }));
    res.json(fileData);
  });
});

router.post("/upload", mediaUpload.array("mediaFiles", 10), (req, res) => res.json({ success: true, files: req.files }));

router.delete("/:filename", (req, res) => {
  const filePath = path.join(mediaDir, req.params.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ success: true });
});

router.put("/rename", (req, res) => {
  const { oldName, newName } = req.body;
  const oldPath = path.join(mediaDir, oldName);
  const newPath = path.join(mediaDir, newName);

  if (!oldName || !newName || oldName === newName || !fs.existsSync(oldPath)) {
    return res.status(400).json({ error: "Invalid filenames" });
  }
  if (fs.existsSync(newPath)) {
    return res.status(400).json({ error: "A file with that name already exists." });
  }

  fs.renameSync(oldPath, newPath);
  let templates = loadTemplates();
  templates.forEach((t) => {
    if (t.filePaths && Array.isArray(t.filePaths)) {
      const index = t.filePaths.indexOf(oldName);
      if (index > -1) t.filePaths[index] = newName;
    }
  });
  saveTemplates(templates);
  res.json({ success: true });
});

module.exports = router;