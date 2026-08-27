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

async function simulateReadingActivity(io) {
  const client = getClient();
  try {
    io.emit("log", "SIMULATING: Pausing for idle activity...");
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 10000 + 5000),
    );
    const chats = await client.getChats();
    if (chats.length > 0) {
      const randomChat =
        chats[Math.floor(Math.random() * Math.min(chats.length, 10))];
      io.emit(
        "log",
        `SIMULATING: Opening chat with "${randomChat.name}" to look human...`,
      );
      await randomChat.sendStateTyping();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await randomChat.clearState();
    }
  } catch (e) {
    io.emit("log", "Could not simulate reading activity.");
  }
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
    const name = contact.name || "";
    let number = String(contact.number).replace(/\D/g, "");

    if (number.length === 10 && !number.startsWith("91")) {
      number = "91" + number;
    }

    const formattedNumber = `${number}@c.us`;

    try {
      io.emit(
        "log",
        `[${i + 1}/${campaign.totalContacts}] Processing contact: ${number}`,
      );

      const isRegistered = await client.isRegisteredUser(formattedNumber);

      if (!isRegistered) {
        io.emit("log", `Skipping ${number}: Not on WhatsApp.`);
        campaign.report.push({ number, name, status: "Not on WhatsApp" });
        campaign.failedThisCampaign++;
        continue;
      }

      const chat = await client.getChatById(formattedNumber);

      for (
        let templateIndex = 0;
        templateIndex < campaign.templates.length;
        templateIndex++
      ) {
        const template = campaign.templates[templateIndex];

        let messageText = template.text || template.message || "";
        messageText = messageText.replace(/{{name}}/g, name);

        if (template.filePaths && template.filePaths.length > 0) {
          for (const file of template.filePaths) {
            const mediaPath = path.resolve(__dirname, "../media", file);

            logger.info("MEDIA", `Attaching media asset: ${mediaPath}`);

            if (fs.existsSync(mediaPath)) {
              const media = MessageMedia.fromFilePath(mediaPath);

              io.emit("log", `Sending media ${file} to ${number}`);

              await chat.sendMessage(media, { caption: messageText });
            } else {
              io.emit("log", `Media file not found: ${file}`);

              await chat.sendMessage(messageText);
            }

            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        } else {
          await chat.sendMessage(messageText);
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      campaign.report.push({ number, name, status: "Sent" });

      campaign.sentToday++;
      campaign.sentThisCampaign++;

      io.emit("log", `Messages sent to ${number}`);
    } catch (err) {
      io.emit("log", `ERROR sending to ${number}: ${err.message}`);

      campaign.report.push({
        number,
        name,
        status: `Failed: ${err.message}`,
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
