// Suppress Node.js DEP0040 punycode deprecation warning from dependencies
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
  if (
    (typeof warning === "string" && warning.includes("punycode")) ||
    (warning && (warning.code === "DEP0040" || warning.name === "DeprecationWarning" && String(warning).includes("punycode")))
  ) {
    return;
  }
  return originalEmitWarning.call(process, warning, ...args);
};

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const apiRoutes = require("./routes");
const logger = require("./utils/logger");

const { initializeWhatsAppClient } = require("./whatsapp/client");
const {
  getCampaignState,
  sendNextBatch,
  pauseCampaign,
  resumeCampaign,
  endCampaign,
} = require("./whatsapp/campaignManager");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("socketio", io);

const PORT = process.env.PORT || 3000;

// --- DIRECTORY SETUP ---
const mediaDir = path.join(__dirname, "media");
const dataDir = path.join(__dirname, "data");
const contactDir = path.join(__dirname, "contacts");
const sessionDir = path.join(__dirname, "session");
const contactUploadDir = path.join(__dirname, "uploads");
const distDir = path.join(__dirname, "..", "frontend", "dist");

[mediaDir, dataDir, contactDir, contactUploadDir, sessionDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// --- INITIAL FILE CREATION ---
if (!fs.existsSync(path.join(dataDir, "templates.json"))) {
  fs.writeFileSync(path.join(dataDir, "templates.json"), "[]");
}
if (!fs.existsSync(path.join(dataDir, "stats.json"))) {
  fs.writeFileSync(
    path.join(dataDir, "stats.json"),
    JSON.stringify({ totalSent: 0, daily: [] })
  );
}
if (!fs.existsSync(path.join(dataDir, "contact_progress.json"))) {
  fs.writeFileSync(path.join(dataDir, "contact_progress.json"), "{}");
}

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media
app.use(
  "/media",
  express.static(mediaDir, {
    setHeaders: (res) => res.set("Cache-Control", "no-store"),
  })
);

// --- API ROUTES ---
app.use("/api", apiRoutes);

// --- SERVE REACT STATIC BUILD ---
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("<h1>HALO Server Running</h1><p>Run <code>cd frontend && npm run dev</code> to launch the React frontend dashboard.</p>");
  });
}

// --- CAMPAIGN SOCKET EVENTS ---
io.on("connection", (socket) => {
  socket.emit("campaignState", getCampaignState());
  socket.on("sendNextBatch", () => sendNextBatch(io));
  socket.on("pauseCampaign", () => pauseCampaign(io));
  socket.on("resumeCampaign", () => resumeCampaign(io));
  socket.on("endCampaign", () => endCampaign(io));
});

// --- SERVER START & WHATSAPP ENGINE INITIALIZATION ---
server.listen(PORT, () => {
  logger.banner(PORT);
  initializeWhatsAppClient(io);
});