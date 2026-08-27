const chalk = require("chalk");

function getTimestamp() {
  const now = new Date();
  return chalk.gray(`[${now.toTimeString().split(" ")[0]}]`);
}

function formatTag(tag) {
  const upper = (tag || "INFO").toUpperCase();
  switch (upper) {
    case "SERVER":
      return chalk.bold.cyan(`[${upper}]`);
    case "WHATSAPP":
      return chalk.bold.green(`[${upper}]`);
    case "SOCKET":
      return chalk.bold.magenta(`[${upper}]`);
    case "CAMPAIGN":
      return chalk.bold.yellow(`[${upper}]`);
    case "MEDIA":
      return chalk.bold.blue(`[${upper}]`);
    default:
      return chalk.bold.white(`[${upper}]`);
  }
}

const logger = {
  banner: (port) => {
    console.log("\n" + chalk.bold.hex("#10b981")("  🌌 HALO — WhatsApp Automation Server"));
    console.log(`  ${chalk.green("➜")}  ${chalk.bold("Local:")}     ${chalk.cyan.underline(`http://localhost:${port}`)}`);
    console.log(`  ${chalk.green("➜")}  ${chalk.bold("WebSocket:")} ${chalk.magenta("Ready & Listening")}`);
    console.log(chalk.gray("  ──────────────────────────────────────────\n"));
  },
  info: (tag, message) => {
    console.log(`${getTimestamp()} ${formatTag(tag)} ${chalk.white(message)}`);
  },
  success: (tag, message) => {
    console.log(`${getTimestamp()} ${formatTag(tag)} ${chalk.greenBright("✔ " + message)}`);
  },
  warn: (tag, message) => {
    console.log(`${getTimestamp()} ${formatTag(tag)} ${chalk.yellowBright("⚠ " + message)}`);
  },
  error: (tag, message, err = "") => {
    console.error(`${getTimestamp()} ${formatTag(tag)} ${chalk.redBright("✖ " + message)}`, err ? chalk.red(err) : "");
  },
  qr: (count, isFirst = false) => {
    const time = getTimestamp();
    const tag = formatTag("WHATSAPP");
    if (isFirst) {
      console.log(`${time} ${tag} ${chalk.hex("#38bdf8")("📱 QR Code Generated (#1) — Scan with WhatsApp on your phone.")}`);
    } else {
      console.log(`${time} ${tag} ${chalk.hex("#fbbf24")(`🔄 QR Code Refreshed (#${count}) — Waiting for scan...`)}`);
    }
  },
};

module.exports = logger;
