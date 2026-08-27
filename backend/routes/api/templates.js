const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const dataDir = path.join(__dirname, "..", "..", "data");

// Helpers
const loadTemplates = () => JSON.parse(fs.readFileSync(path.join(dataDir, "templates.json")));
const saveTemplates = (t) => fs.writeFileSync(path.join(dataDir, "templates.json"), JSON.stringify(t, null, 2));

// API routes for templates
router.get("/", (req, res) => res.sendFile(path.join(dataDir, "templates.json")));

router.get("/:id", (req, res) => {
    const templates = loadTemplates();
    const template = templates.find(t => t.id == req.params.id);
    if (template) {
        res.json(template);
    } else {
        res.status(404).json({ error: "Template not found" });
    }
});

router.post("/", (req, res) => {
  let templates = loadTemplates();
  const newTemplate = { id: Date.now(), ...req.body };
  templates.push(newTemplate);
  saveTemplates(templates);
  res.json(newTemplate);
});

router.put("/:id", (req, res) => {
  let templates = loadTemplates();
  const index = templates.findIndex((t) => t.id == req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Template not found" });
  templates[index] = { ...templates[index], ...req.body };
  saveTemplates(templates);
  res.json(templates[index]);
});

router.delete("/:id", (req, res) => {
  let templates = loadTemplates();
  templates = templates.filter((t) => t.id != req.params.id);
  saveTemplates(templates);
  res.json({ success: true });
});

module.exports = router;