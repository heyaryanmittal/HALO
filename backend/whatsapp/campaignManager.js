const fs = require("fs");
const path = require("path");
const { parseContacts } = require("../utils/parser");
const logger = require("../utils/logger");
let sendBatch;
let stopSending;

// --- CAMPAIGN STATE OBJECT ---
let campaign = {
  isPaused: false,
  isRunning: false,
  contacts: [],
  contactGroup: null,
  templates: [],
  currentIndex: 0,
  totalContacts: 0,
  batchSize: 20,
  currentBatchIndex: 0,
  dailyLimit: 100,
  sentToday: 0,
  sentThisCampaign: 0,
  failedThisCampaign: 0,
  minDelay: 30,
  maxDelay: 90,
  minTypingDelay: 5000,
  maxTypingDelay: 10000,
  minAttachDelay: 1000,
  maxAttachDelay: 3000,
  simulationStyle: "random",
  simulateReading: false,
  warmUp: {
    enabled: false,
    start: 20,
    increment: 10,
    days: 7,
    currentDay: 1,
  },
  report: [],
  reportName: null,
  campaignStartIndex: 0,
};

// --- LIFECYCLE FUNCTIONS ---

function getCampaignState() {
  return {
    isRunning: campaign.isRunning,
    isPaused: campaign.isPaused,
    sent: campaign.sentThisCampaign,
    failed: campaign.failedThisCampaign,
    total: campaign.totalContacts,
    current: campaign.currentIndex,
  };
}

function onClientDisconnect(io) {
    if (campaign.isRunning) {
        campaign.isRunning = false;
        io.emit("log", "Campaign stopped due to disconnection.");
        io.emit("campaignState", getCampaignState());
    }
}

function pauseCampaign(io) {
  if (campaign.isRunning) {
    campaign.isPaused = true;
    io.emit("log", "PAUSED: Campaign has been paused by the user.");
    io.emit("campaignState", getCampaignState());
  }
}

function resumeCampaign(io) {
  if (campaign.isRunning && campaign.isPaused) {
    campaign.isPaused = false;
    io.emit("log", "RESUMED: Campaign has been resumed by the user.");
    io.emit("campaignState", getCampaignState());
    sendBatch(io);
  }
}

function endCampaign(io) {
  if (campaign.isRunning) {
    io.emit("log", "STOPPED: Campaign has been ended by the user.");
    campaign.isRunning = false;
    if (!stopSending) {
    ({ stopSending } = require("./sender"));
}
stopSending(); // Signal the sender to stop any loops

    if (campaign.report.length > 0) {
      saveReport(io);
      updateStats(io, campaign.sentThisCampaign);
    }

    if (campaign.contactGroup) {
      updateContactProgress(campaign.contactGroup, campaign.currentIndex);
      io.emit(
        "log",
        `Progress for group "${campaign.contactGroup}" saved at contact #${campaign.currentIndex}.`
      );
    }
    io.emit("campaignState", getCampaignState());
  }
}

function startNewCampaign(io, data) {
    if (campaign.isRunning) {
        io.emit('log', 'ERROR: A campaign is already in progress.');
        return;
    }
    campaign.isRunning = true;
    io.emit('campaignState', getCampaignState());

    const isGroup = !!data.contactGroup;
    let contactFilePath = isGroup ?
        path.join(__dirname, '..', 'contacts', data.contactGroup) :
        data.contactFile.path;

    parseContacts(io, contactFilePath, (err, contacts) => {
        if (err || !contacts || contacts.length === 0) {
            io.emit('log', `ERROR parsing contact file: ${err ? err.message : 'No valid contacts found.'}`);
            io.emit('log', "Ensure file has a column header named 'number'.");
            campaign.isRunning = false;
            io.emit('campaignState', getCampaignState());
            return;
        }
        io.emit('log', `SUCCESS: Parsed contact file. Found ${contacts.length} contacts.`);

        const progressData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'contact_progress.json')));
        const startIndex = (isGroup && progressData[data.contactGroup]) ? progressData[data.contactGroup] : 0;

        if (isGroup && startIndex > 0) {
            io.emit('log', `Resuming campaign for group "${data.contactGroup}" from contact #${startIndex + 1}.`);
        }

        campaign = {
            ...campaign,
            isRunning: true,
            isPaused: false,
            currentIndex: startIndex,
            campaignStartIndex: startIndex,
            currentBatchIndex: 0,
            sentToday: 0,
            sentThisCampaign: 0,
            failedThisCampaign: 0,
            report: [],
        };

        const allTemplates = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'templates.json')));
        const templateIds = Array.isArray(data.templateIds) ? data.templateIds : (data.templateIds ? [data.templateIds] : []);
        const uniqueIds = [...new Set(templateIds.map(id => String(id)))];
        campaign.templates = uniqueIds.map(id => allTemplates.find(t => String(t.id) === id)).filter(Boolean);

        if (campaign.templates.length === 0) {
            io.emit('log', 'Error: No valid templates selected.');
            campaign.isRunning = false;
            io.emit('campaignState', getCampaignState());
            return;
        }
        
        campaign.contacts = contacts;
        campaign.totalContacts = contacts.length;
        campaign.contactGroup = isGroup ? data.contactGroup : null;
        campaign.minDelay = parseInt(data.minDelay, 10);
        campaign.maxDelay = parseInt(data.maxDelay, 10);
        campaign.batchSize = parseInt(data.batchSize, 10);
        campaign.minTypingDelay = parseInt(data.minTypingDelay, 10);
        campaign.maxTypingDelay = parseInt(data.maxTypingDelay, 10);
        campaign.minAttachDelay = parseInt(data.minAttachDelay, 10);
        campaign.maxAttachDelay = parseInt(data.maxAttachDelay, 10);
        campaign.simulationStyle = data.simulationStyle;
        campaign.simulateReading = data.simulateReading === 'on';
        campaign.warmUp.enabled = data.warmUpEnabled === 'on';
        if (campaign.warmUp.enabled) {
            campaign.warmUp.start = parseInt(data.warmUpStart, 10);
            campaign.warmUp.increment = parseInt(data.warmUpIncrement, 10);
            campaign.warmUp.days = parseInt(data.warmUpDays, 10);
            campaign.warmUp.currentDay = 1;
            campaign.dailyLimit = campaign.warmUp.start;
            io.emit('log', `WARM-UP MODE: Daily limit set to ${campaign.dailyLimit} for day 1.`);
        } else {
            campaign.dailyLimit = parseInt(data.dailyLimit, 10);
        }

        if (isGroup) {
            campaign.reportName = `report-${data.contactGroup}.csv`;
        } else {
            campaign.reportName = `report-upload-${Date.now()}.csv`;
        }
        
        io.emit('log', `Campaign started with ${campaign.contacts.length} contacts and ${campaign.templates.length} message(s) per contact.`);
        io.emit('campaignState', getCampaignState());
        if (!sendBatch) {
          ({ sendBatch } = require("./sender"));
        }
        sendBatch(io);
    });
}

function sendNextBatch(io) {
  if (campaign.isRunning) sendBatch(io);
}

// --- DATA HELPER FUNCTIONS ---

function updateContactProgress(groupName, index) {
  const progressPath = path.join(__dirname, '..', 'data', "contact_progress.json");
  if (!fs.existsSync(progressPath)) return;
  const progressData = JSON.parse(fs.readFileSync(progressPath));
  progressData[groupName] = index;
  fs.writeFileSync(progressPath, JSON.stringify(progressData, null, 2));
}

function updateStats(io, sentCount) {
  const statsPath = path.join(__dirname, '..', 'data', "stats.json");
  let stats = { totalSent: 0, daily: [] };
  if (fs.existsSync(statsPath)) {
    stats = JSON.parse(fs.readFileSync(statsPath));
  }
  const today = new Date().toISOString().split("T")[0];

  stats.totalSent = (stats.totalSent || 0) + sentCount;
  stats.daily = stats.daily || [];

  const todayEntry = stats.daily.find((d) => d.date === today);
  if (todayEntry) {
    todayEntry.sent += sentCount;
  } else {
    stats.daily.push({ date: today, sent: sentCount });
  }

  fs.writeFileSync(statsPath, JSON.stringify(stats));
  io.emit("statsUpdated");
}

function saveReport(io) {
  if (!campaign.reportName || campaign.report.length === 0) return;
  io.emit(
    "log",
    `SAVING REPORT: ${campaign.reportName} with ${campaign.report.length} entries.`
  );
  const reportPath = path.join(__dirname, '..', 'data', campaign.reportName);
  const headers = "number,name,status\n";

  const fileExists = fs.existsSync(reportPath);
  const writeStream = fs.createWriteStream(reportPath, { flags: "a" });

  if (!fileExists) {
    writeStream.write(headers);
  }

  const csvContent = campaign.report
    .map((r) => `${r.number},${r.name || ""},"${r.status.replace(/"/g, '""')}"`)
    .join("\n");
  writeStream.write(csvContent + "\n");
  writeStream.end();

  logger.info("CAMPAIGN", `Report data saved to ${reportPath}`);
}

const getCampaign = () => campaign;

// CORRECTED: initializeWhatsAppClient is no longer exported from here
module.exports = {
  getCampaign,
  getCampaignState,
  startNewCampaign,
  sendNextBatch,
  pauseCampaign,
  resumeCampaign,
  endCampaign,
  onClientDisconnect,
  updateContactProgress,
  updateStats,
  saveReport
};