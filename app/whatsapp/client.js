const { Client, LocalAuth } = require("whatsapp-web.js");
const path = require("path");
const { onClientDisconnect } = require("./campaignManager");

let client;
let io;
let isRestarting = false;

function startClient() {
  console.log("-----------------------------------------");
  console.log("Initializing new WhatsApp client instance...");
  io.emit("status", "Initializing client...");
  const sessionPath = path.join(__dirname, "..", "session");

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    qrTimeout: 60000,
    authTimeoutMs: 60000,
  });

  client.on("loading_screen", (percent) => {
    io.emit("status", `Connecting to WhatsApp... (${percent}%)`);
  });

  client.on("qr", (qr) => {
    console.log("QR RECEIVED: Please scan.");
    io.emit("status", "QR code received. Please scan.");
    io.emit("qr", qr);
  });

  client.on("ready", () => {
    console.log("CLIENT READY: Session is valid. Client is connected.");
    io.emit("status", "Connected");
    io.emit("authenticated");
  });

  client.on("authenticated", () => {
    console.log("AUTHENTICATED: Session file validated.");
  });

  client.on("auth_failure", (msg) => {
    console.error(`AUTHENTICATION FAILURE: ${msg}`);
    handleDisconnect(`Authentication Failure: ${msg}`);
  });

  client.on("disconnected", (reason) => {
    handleDisconnect(reason);
  });

  io.emit("status", "Launching browser...");
  client.initialize().catch((err) => {
    console.error("Client initialization error:", err);
    handleDisconnect("Initialization Timeout");
  });
}

async function handleDisconnect(reason) {
    if (isRestarting) return;
    isRestarting = true;
    
    console.log(`Client disconnected: "${reason}". Restarting...`);
    io.emit("status", `Client disconnected. Restarting...`);
    io.emit("show_qr");
    
    onClientDisconnect(io);

    try {
        if (client) await client.destroy();
        console.log("Old client instance destroyed.");
    } catch (e) {
        console.error("Error during client destruction: ", e);
    }

    setTimeout(() => {
        startClient();
        isRestarting = false;
    }, 5000);
}

function initializeWhatsAppClient(socketIo) {
  io = socketIo;
  startClient();

  io.on("connection", (socket) => {
    console.log("UI CONNECTED: A user opened the web interface.");
    if (client && client.info) {
      console.log("UI STATUS: Informing user that client is already connected.");
      socket.emit("status", "Connected");
      socket.emit("authenticated");
    } else {
      console.log("UI STATUS: Informing user that client is initializing.");
      socket.emit("status", "Initializing client... Please wait.");
    }
  });
}

const getClient = () => client;

module.exports = { initializeWhatsAppClient, getClient };