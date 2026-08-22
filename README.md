# ⚡ HALO — Next-Gen WhatsApp Automation & Campaign Hub

<div align="center">

![HALO Banner](https://img.shields.io/badge/HALO-WhatsApp%20Automation-10b981?style=for-the-badge&logo=whatsapp&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-38bdf8?style=for-the-badge&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20Socket.IO-22c55e?style=for-the-badge&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)

**A high-performance, web-based WhatsApp bulk messaging and campaign automation suite built with React and Node.js.**

[Features](#-key-features) • [Installation](#-installation--quickstart) • [Architecture](#-architecture) • [Anti-Ban Protection](#-anti-ban--human-simulation) • [License](#-license)

</div>

---

## 🚀 Key Features

* **⚡ Real-Time React Single Page Application (SPA)**: Ultra-responsive modern dark glassmorphism dashboard built with React (JS/JSX), Vite, Tailwind CSS, and Lucide icons.
* **📱 Seamless QR Authentication**: Live streaming QR code via Socket.IO for one-tap WhatsApp Web session pairing directly in your browser.
* **📂 Smart Contact Manager**: Drag-and-drop CSV / Excel (`.xlsx`, `.xls`) file parsing with dynamic variable token support and session progress tracking.
* **✍️ Template Studio with Live Phone Simulator**: Craft personalized messages with placeholders (`{name}`, `{number}`, etc.) and preview real-time WhatsApp rendering with formatting (`*bold*`, `_italic_`, `~strikethrough~`).
* **🖼️ Media Vault**: Attach images, brochures, documents, and videos directly to individual or batched campaigns.
* **🛡️ Anti-Ban & Human Simulation Suite**:
  * Customizable random dispatch delays between contacts.
  * Human-like typing simulation & media attachment timing.
  * Account warm-up mode for newly registered WhatsApp numbers.
* **📊 Comprehensive Analytics & Audit Reports**: Track lifetime message dispatches, view detailed campaign outcomes, and export CSV audit logs.

---

## 🛠️ Tech Stack

* **Frontend**: React (JS/JSX), Vite, Tailwind CSS v4, Lucide Icons, QRCode.react, Socket.IO-client
* **Backend**: Node.js, Express.js, Socket.IO, Multer, CSV-Parser, XLSX
* **Engine**: WhatsApp-Web.js with Puppeteer Chromium automation

---

## 📦 Installation & Quickstart

### 1. Clone the Repository
```bash
git clone https://github.com/heyaryanmittal/HALO.git
cd HALO
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build & Run
```bash
# Build the React frontend
npm run build

# Start the unified HALO server
npm start
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 📖 How to Use

1. **Link WhatsApp**: Open the dashboard at `http://localhost:3000`. Click **Scan QR Code**, open WhatsApp on your phone $\rightarrow$ **Linked Devices** $\rightarrow$ **Link a Device**, and scan the QR code.
2. **Import Contacts**: Go to the **Contacts** tab and upload your CSV or Excel list (ensure it contains a column header named `number` with country codes e.g. `919876543210`).
3. **Create Templates**: Go to **Templates** to create your message draft using dynamic tags like `{name}`.
4. **Launch Campaign**: Select your audience and template in the **Campaign Hub**, configure your desired rate-limiting delays, and click **Launch WhatsApp Campaign**!

---

## 🛡️ Anti-Ban & Rate Limiting Best Practices

* Always keep **Min Delay** $\ge$ 15s and **Max Delay** $\ge$ 45s for high deliverability.
* Use the **Warm-Up Mode** when using a newly registered SIM card to gradually ramp up message volume over 7 days.
* Avoid spamming unverified contacts; ensure recipients have consented to receive communication.

---

## 👤 Author

* **Aryan Mittal** — [@heyaryanmittal](https://github.com/heyaryanmittal)
* Repository: [https://github.com/heyaryanmittal/HALO](https://github.com/heyaryanmittal/HALO)

---

## 📄 License

This project is licensed under the MIT License.
