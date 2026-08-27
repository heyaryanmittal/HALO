const { MessageMedia } = require("whatsapp-web.js");
const path = require("path");
const fs = require("fs");
const { getClient } = require("./client");
const logger = require("../utils/logger");
const {
  getCampaign,
  getCampaignState,
  updateContactProgress,
  updateStats,
  saveReport,
} = require("./campaignManager");

let campaignShouldStop = false;

function stopSending() {
  campaignShouldStop = true;
}

function formatMessageTemplate(templateText, contact) {
  let text = templateText || "";
  if (!text) return "";

  // Replace standard and custom placeholders: {name}, {{name}}, {phone}, {{phone}}, etc.
  Object.keys(contact).forEach((key) => {
    const val = String(contact[key] ?? "");
    const regexDouble = new RegExp(`{{${key}}}`, "gi");
    const regexSingle = new RegExp(`{${key}}`, "gi");
    text = text.replace(regexDouble, val).replace(regexSingle, val);
  });

  return text;
}

async function sendBatch(io) {
  const client = getClient();
  let campaign = getCampaign();
  campaignShouldStop = false;

  io.emit(
    "log",
    `Starting to send batch #${campaign.currentBatchIndex + 1}...`,
  );

  const startingIndexInLoop = campaign.currentIndex;
  const batchEndIndex = Math.min(
    startingIndexInLoop + campaign.batchSize,
    campaign.contacts.length,
  );

  for (let i = startingIndexInLoop; i < batchEndIndex; i++) {
    if (campaignShouldStop || !campaign.isRunning || campaign.isPaused) {
      io.emit("log", "Campaign stopped or paused.");
      return;
    }

    if (campaign.sentToday >= campaign.dailyLimit) {
      io.emit("log", `Daily limit of ${campaign.dailyLimit} reached.`);
      io.emit("campaignPaused", "Daily limit reached.");
      return;
    }

    const contact = campaign.contacts[i];
    const name = contact.name || contact.Name || "";
    let rawNumber = String(contact.number || contact.Number || contact.phone || contact.Phone || "").replace(/\D/g, "");

    // Default to Indian international format if 10 digits provided
    if (rawNumber.length === 10 && !rawNumber.startsWith("91")) {
      rawNumber = "91" + rawNumber;
    }

    try {
      io.emit(
        "log",
        `[${i + 1}/${campaign.totalContacts}] Processing contact: ${rawNumber}${name ? ` (${name})` : ""}`,
      );

      // Verify WhatsApp registration using official getNumberId API
      const numberDetails = await client.getNumberId(rawNumber);

      if (!numberDetails) {
        io.emit("log", `Skipping ${rawNumber}: Not registered on WhatsApp.`);
        campaign.report.push({ number: rawNumber, name, status: "Not on WhatsApp" });
        campaign.failedThisCampaign++;
        continue;
      }

      const targetJid = numberDetails._serialized; // e.g. "919876543210@c.us"

      for (
        let templateIndex = 0;
        templateIndex < campaign.templates.length;
        templateIndex++
      ) {
        const template = campaign.templates[templateIndex];
        const rawTemplateText = template.text || template.message || "";
        const messageText = formatMessageTemplate(rawTemplateText, contact);

        if (template.filePaths && template.filePaths.length > 0) {
          for (const file of template.filePaths) {
            const mediaPath = path.resolve(__dirname, "../media", file);

            logger.info("MEDIA", `Attaching media asset: ${file}`);

            if (fs.existsSync(mediaPath)) {
              const media = MessageMedia.fromFilePath(mediaPath);
              io.emit("log", `Sending media attachment (${file}) to ${rawNumber}`);
              await client.sendMessage(targetJid, media, { caption: messageText });
            } else {
              io.emit("log", `Media file not found (${file}), sending text only.`);
              await client.sendMessage(targetJid, messageText);
            }

            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        } else {
          await client.sendMessage(targetJid, messageText);
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      campaign.report.push({ number: rawNumber, name, status: "Sent" });
      campaign.sentToday++;
      campaign.sentThisCampaign++;

      io.emit("log", `✔ Message sent to ${rawNumber}`);
    } catch (err) {
      const errorMsg = err.message || String(err);
      logger.error("CAMPAIGN", `Error sending to ${rawNumber}:`, errorMsg);
      io.emit("log", `ERROR sending to ${rawNumber}: ${errorMsg}`);

      campaign.report.push({
        number: rawNumber,
        name,
        status: `Failed: ${errorMsg}`,
      });

      campaign.failedThisCampaign++;
    } finally {
      campaign.currentIndex = i + 1;

      if (campaign.contactGroup) {
        updateContactProgress(campaign.contactGroup, campaign.currentIndex);
      }

      io.emit("campaignState", getCampaignState());
    }

    const delay =
      Math.floor(
        Math.random() * (campaign.maxDelay - campaign.minDelay + 1) +
          campaign.minDelay,
      ) * 1000;

    io.emit("log", `Waiting ${delay / 1000} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  campaign.currentBatchIndex++;

  if (campaign.currentIndex >= campaign.contacts.length) {
    io.emit("log", "Campaign finished!");
    campaign.isRunning = false;
    saveReport(io);
    updateStats(io, campaign.sentThisCampaign);
    io.emit("campaignState", getCampaignState());
  } else {
    io.emit("log", `Batch complete. Click start for next batch.`);
    io.emit("batchComplete", {
      nextBatch: campaign.currentBatchIndex + 1,
    });
  }
}

module.exports = { sendBatch, stopSending };
