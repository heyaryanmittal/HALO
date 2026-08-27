const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const apiRoutes = require("./routes");

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
    methods: ["GET", "POST"]
  }
});

// Add io to the app object to make it accessible in routes
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
  // If dist not built yet, inform developer
  app.get("/", (req, res) => {
    res.send("<h1>HALO Server Running</h1><p>Run <code>npm run build</code> or <code>npm run dev</code> to launch the React frontend.</p>");
  });
}

// --- WHATSAPP & SOCKET.IO INITIALIZATION ---
initializeWhatsAppClient(io);
io.on("connection", (socket) => {
  socket.emit("campaignState", getCampaignState());
  socket.on("sendNextBatch", () => sendNextBatch(io));
  socket.on("pauseCampaign", () => pauseCampaign(io));
  socket.on("resumeCampaign", () => resumeCampaign(io));
  socket.on("endCampaign", () => endCampaign(io));
});

server.listen(PORT, () => {
  console.log(`HALO Server is running on http://localhost:${PORT}`);
});