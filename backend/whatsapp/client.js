const { Client, LocalAuth } = require("whatsapp-web.js");
const path = require("path");
const { onClientDisconnect } = require("./campaignManager");
const logger = require("../utils/logger");

let client;
let io;
let isRestarting = false;
let currentQr = null;
let isAuthenticated = false;
let isReady = false;
let qrRefreshCount = 0;
let lastStatus = "Initializing WhatsApp client...";

function updateStatus(newStatus) {
  lastStatus = newStatus;
  if (io) io.emit("status", newStatus);
}

function startClient() {
  qrRefreshCount = 0;
  currentQr = null;
  isAuthenticated = false;
  isReady = false;

  logger.info("WHATSAPP", "Launching headless browser and initializing engine...");
  updateStatus("Launching browser engine...");

  const sessionPath = path.join(__dirname, "..", "session");

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-default-apps",
        "--disable-sync",
        "--mute-audio",
      ],
    },
    qrTimeout: 0,
    authTimeoutMs: 60000,
  });

  client.on("loading_screen", (percent) => {
    const msg = `Connecting to WhatsApp (${percent}%)...`;
    updateStatus(msg);
    logger.info("WHATSAPP", `⏳ Loading WhatsApp chats (${percent}%)...`);
  });

  client.on("qr", (qr) => {
    currentQr = qr;
    qrRefreshCount += 1;
    isAuthenticated = false;
    isReady = false;

    updateStatus("QR code received. Please scan.");
    if (io) {
      io.emit("qr", qr);
      io.emit("show_qr");
    }

    logger.qr(qrRefreshCount, qrRefreshCount === 1);
  });

  client.on("authenticated", () => {
    isAuthenticated = true;
    currentQr = null;
    logger.success("WHATSAPP", "Authentication successful. Session validated.");
    updateStatus("Session authenticated. Syncing chats...");
    if (io) io.emit("authenticated");
  });

  client.on("ready", () => {
    isReady = true;
    isAuthenticated = true;
    currentQr = null;
    qrRefreshCount = 0;

    const userNumber = client.info?.wid?.user || "Unknown";
    const pushName = client.info?.pushname ? ` (${client.info.pushname})` : "";
    logger.success("WHATSAPP", `Client ready and connected as +${userNumber}${pushName}.`);

    updateStatus("Connected");
    if (io) {
      io.emit("status", "Connected");
      io.emit("authenticated");
    }
  });

  client.on("auth_failure", (msg) => {
    logger.error("WHATSAPP", `Authentication failed: ${msg}`);
    handleDisconnect(`Authentication Failure: ${msg}`);
  });

  client.on("disconnected", (reason) => {
    logger.warn("WHATSAPP", `Session disconnected: "${reason}".`);
    handleDisconnect(reason);
  });

  client.initialize().catch((err) => {
    logger.error("WHATSAPP", "Client initialization error:", err.message || err);
    handleDisconnect("Initialization Timeout");
  });
}

async function handleDisconnect(reason) {
  if (isRestarting) return;
  isRestarting = true;
  isAuthenticated = false;
  isReady = false;
  currentQr = null;

  updateStatus("Client disconnected. Restarting...");
  if (io) io.emit("show_qr");

  if (io) onClientDisconnect(io);

  try {
    if (client) await client.destroy();
    logger.info("WHATSAPP", "Cleaned up previous WhatsApp browser instance.");
  } catch (e) {
    logger.warn("WHATSAPP", `Warning during client cleanup: ${e.message}`);
  }

  logger.info("WHATSAPP", "Restarting client in 5 seconds...");
  setTimeout(() => {
    startClient();
    isRestarting = false;
  }, 5000);
}

function initializeWhatsAppClient(socketIo) {
  io = socketIo;
  startClient();

  io.on("connection", (socket) => {
    logger.info("SOCKET", `Client connected (${socket.id}). Total clients: ${io.engine.clientsCount}`);

    // Immediately push current state to newly connected client without delay
    if (isReady || (client && client.info)) {
      socket.emit("status", "Connected");
      socket.emit("authenticated");
    } else if (currentQr) {
      socket.emit("status", "QR code received. Please scan.");
      socket.emit("qr", currentQr);
      socket.emit("show_qr");
    } else {
      socket.emit("status", lastStatus);
    }

    socket.on("disconnect", () => {
      logger.info("SOCKET", `Client disconnected (${socket.id}).`);
    });
  });
}

const getClient = () => client;

module.exports = { initializeWhatsAppClient, getClient };