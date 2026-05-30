# COMOT System Context & Architecture Reference

This document serves as the **source of truth** and system context for **COMOT** (Logistics & Procurement AI System). It outlines the business context, architectural design, current MVP state, strategic partnership models, and developer guidelines to enable other AI Agents (or human developers) to resume or extend the codebase seamlessly.

---

## 🏗️ 1. Project Background & Business Context

### What is COMOT?
**COMOT** is an autonomous real-time logistics tracking and B2B automated procurement system designed to solve critical logistics delays in residential construction. It acts as a bridge between the field construction site, the Project Manager's dashboard, autonomous Multi-Agent AI coordinators, and B2B building material suppliers.

* **Tagline**: *Standardizing Autonomous Construction Logistics.*
* **Strategic Business Focus**: Memangkas 3% Kebocoran Profit Konstruksi Melalui Autonomous AI.

### The Problem & Alasan Pembuatan (Cost of Problem)
1. **Construction Site Context**: The system is actively deployed for the **Rumah_5M** project—a luxury residential house construction site valued at **Rp 5,000,000,000** located in **Sleman, Yogyakarta**.
2. **Logistics Vulnerability**: Manual record-keeping on construction sites is historically slow, friction-heavy, and inaccurate. Workers are reluctant to use complex tracking apps. Deficits of critical materials (like *Semen Instan* or *Besi 12mm*) will immediately halt critical operations (like Floor 2 concrete casting).
3. **Severe Financial Overhead (Friction & Financial Leakage)**: 
   - A project delay triggers massive financial penalties and overhead. 
   - Under the construction risk formula: **Overhead damage = (3% of Project Value) / 100 per day**.
   - For a Rp 5 Billion project, a single day of blocking results in a loss of **Rp 150,000,000**!

---

## ⚙️ 2. System Architecture & Tech Stack

COMOT utilizes a lightweight, highly portable, and robust stack, optimized for low-latency visual performance on both desktop and mobile screens:

* **Backend Core**: Node.js & Express (`server.js`).
* **Database Layer**: Simple, high-speed, local file-based JSON engines (`data/logs.json` and `data/orders.json`).
* **Telegram Interface**: Polling daemon using `node-telegram-bot-api`, configured entirely in **HTML Parse Mode** to avoid character parsing breaks. Allows workers to easily input logs from the field without installing any new apps.
* **Orchestration Core**: Integrated Multi-Agent CrewAI Python logic (running Llama 3.2 3B inside native Ollama on the VPS) to validate risk margins.
* **Frontend Dashboard**: Beautiful, space-neon Vanilla CSS/JS Single Page Application served statically from the Express server.
* **Rendering Performance**: Optimized using CSS **radial gradients** calculated natively by the GPU (completely removing CPU Gaussian `filter: blur()` repaints for 0ms typing lag and maximum responsiveness).
* **Responsive Scaling**: Grid boundaries set with `min-width: 0` and `width: 100%`, ensuring 100% viewport adaptation on smartphones with isolated table horizontal scrolling.

---

## 🤖 3. The Multi-Agent Orchestration Engine (Core Logic)

The COMOT MVP shifts the paradigm from traditional rigid IF-ELSE backend logic to an **AI-Native Multi-Agent Orchestration** system. The application serves as a **Shell (Cangkang)** and **Orkestrator**, while **4 autonomous sub-agents** run the core reasoning, risk evaluation, and B2B procurement calculations in the background.

```
[ Input Kontraktor via Telegram/Web ] 
                 │
                 ▼
       ( Aplikasi COMOT Shell )
                 │
                 ▼
    [ 1. Project Coordinator Agent ]
                 │
   ┌─────────────┴─────────────┐
   ▼                           ▼
[ 2. Material Forecaster ]  [ 3. Procurement Agent ]
   │                           │
   └─────────────┬─────────────┘
                 ▼
    [ 4. Structured Output Guard ]
                 │
                 ▼ (Clean JSON Output)
       ( Dashboard COMOT UI )
                 │
        [ 1-Click Approve ]
                 │
                 ▼
      ( B2B Purchasing API )
```

### The 4 Sub-Agent Roles & Collaboration

#### 1. Project Coordinator Agent
* **Role**: The main interface that intercepts contractor input texts/logs (e.g. *"Semen sisa 10 sak, pengerjaan cor lantai 2 mulai besok"*).
* **Otonomi**: Menganalisis konteks kebutuhan di site. Ia menyadari bahwa aktivitas pengecoran kritis akan dimulai sedangkan stok menipis. Coordinator mendelegasikan analisis detail secara paralel kepada **Material Forecaster** dan **Procurement Agent**.

#### 2. Material Forecaster Agent
* **Role**: The risk assessor and financial cost calculator.
* **Otonomi**: Melakukan *reasoning* (penalaran) berdasarkan data historis proyek Rumah_5M. Ia menghitung:
  - Sisa 10 sak semen dengan daily consumption rate 10 sak berarti stok bertahan 1 hari (24 jam).
  - Pengecoran lantai 2 membutuhkan lead time pengiriman semen minimal 24 jam.
  - Menghitung risiko delay proyek dan potensi pembengkakan overhead akibat penundaan cor: **Overhead Loss = Rp 150.000.000 per hari delay**.

#### 3. Procurement Agent
* **Role**: The B2B supplier researcher and order structurer.
* **Otonomi**: Menggunakan *Tools* (API integration) secara otonom untuk "mengetuk" katalog digital B2B QHomemart Sleman. Ia memeriksa ketersediaan stok material, harga terkini, mengamankan estimasi jadwal pengiriman kurir tercepat, dan menyusun kuotasi harga terbaik.

#### 4. Structured Output Guard
* **Role**: The data formatter and syntax schema enforcer.
* **Otonomi**: Mengambil hasil analisis Material Forecaster (estimasi risiko & kerugian delay) serta kuotasi dari Procurement Agent. Sesuai kriteria standard lomba (Structured Output), ia menyusun hasil rekomendasi tersebut ke format JSON terstruktur yang bersih tanpa teks basa-basi, untuk kemudian disuplai kembali ke UI Dashboard.

### The 1-Click Purchase Pipeline
Untuk menjamin keamanan finansial, sistem menerapkan **Human-in-the-loop (1-Click Approval)**:
1. Output JSON dari **Structured Output Guard** dirender di dashboard dalam bentuk box rekomendasi yang sangat jelas:
   > **Rekomendasi AI**: *"Semen habis besok. Potensi rugi proyek Rp 150.000.000/hari. QHomemart Sleman memiliki stok semen instan siap kirim sekarang dengan biaya total Rp 3.250.000."*
2. Pengguna cukup menekan tombol **"Setujui Pemesanan"** di Dashboard Web atau membalas lewat bot Telegram.
3. Express Backend langsung menembak B2B API purchasing QHomemart untuk mendaftarkan order, menjadwalkan kurir, dan memicu kurir simulator.

---

## 🤝 4. Sinergi Strategis QHomeMart (Direct Revenue Funnel)

COMOT mengunci keuntungan operasional dan menciptakan nilai komersial yang luar biasa bagi **QHomeMart Yogyakarta**:

1. **Automatic PO (Seamless Order)**: COMOT secara otomatis mengubah rekomendasi AI menjadi draf *Purchase Order* resmi yang dikirim ke sistem QHomeMart, mempercepat siklus transaksi dari hari ke menit.
2. **Customer Lock-in (Retensi Kontraktor)**: Kontraktor Yogyakarta akan secara konsisten bertransaksi di QHomeMart karena sistem pergudangan lapangan mereka terintegrasi secara otonom (seamless) dengan AI logistik COMOT.
3. **Data Insight (Data Prediktif Real-Time)**: QHomeMart mendapatkan data prediktif mengenai tren kebutuhan material konstruksi di Yogyakarta (Sleman, Bantul, Kodya) secara langsung dan real-time sebelum kontraktor memesannya secara manual.

---

## 🌐 5. Production Deployment & Custom Domain

COMOT is fully deployed and operational on production infrastructure with HTTPS:

### Live URLs
* **Landing Page / Pitch Deck**: [https://comot.simpel.fun](https://comot.simpel.fun)
* **Real-Time Dashboard App**: [https://comot.simpel.fun/app](https://comot.simpel.fun/app)
* **Telegram Bot**: [@mrcomot_bot](https://t.me/mrcomot_bot)

### Infrastructure Stack
* **VPS**: Tencent Cloud (8GB RAM, Ubuntu), IP `43.133.139.131`
* **Reverse Proxy**: Nginx with Let's Encrypt TLSv1.3 SSL termination
* **Domain**: `comot.simpel.fun` hosted via Hostinger DNS A record
* **Routing**:
  - `/` → `public/landing.html` (9-Slide Pitch Deck)
  - `/app` → `public/index.html` (Logistics Dashboard)
* **Process Manager**: Node.js daemon via `nohup` on internal port 8000, Nginx proxying ports 80/443 → 8000

---

## 💬 6. Telegram Bot Commands (Bahasa Indonesia)

The Telegram bot (`@mrcomot_bot`) runs as a polling daemon integrated directly into `server.js`. All commands are localized in Bahasa Indonesia with robust shorthand parsing:

### `/catat` — Catat Log Lapangan
* **Shorthand support**: `/catat Rumah_5M semen 35 masuk` or `/catat Rumah_5M besi 10 keluar`
* Strips non-digit characters from qty field (`20sak` → `20`)
* Responds with a formatted HTML confirmation card

### `/beli` — Beli Material via B2B API
* **Shorthand support**: `/beli semen 50` or `/beli besi 20`
* Displays pricing tables (Semen Instan Rp 65.000/sak, Besi 12mm Rp 95.000/pcs)
* Triggers the B2B purchasing pipeline with courier simulator

### `/saran` — AI Procurement Expert Advisor
* Replicates the dashboard's Procurement Expert analysis directly into chat
* Compares remaining stock lifetime against supplier lead times
* Provides emergency action recommendations with direct `/beli` syntax shortcuts

---

## 🎤 7. The 9-Slide Pitch Deck (`landing.html`)

The landing page doubles as a competition-grade interactive presentation deck:

| Slide | Title | Key Feature |
|-------|-------|-------------|
| 1 | Hook & Identity | Tagline + Rp 5M project stats |
| 2 | About Us | 4-card team profiles (Indra Haryadi, Antigravity, Hermes Agent, QHomeMart) |
| 3 | The Problem | Interactive Overhead Loss Calculator (drag slider Rp 1B–10B) |
| 4 | The Solution | COMOT Shell architecture (Telegram + Dashboard + AI) |
| 5 | Technical Excellence | Interactive 4-Agent Flowchart with glowing step animations |
| 6 | QHomeMart B2B Edge | Automatic PO, Customer Lock-in, Supply Insights |
| 7 | Jogja Rollout Roadmap | 3-Month action plan (MVP → Pilot → API Integration) |
| 8 | Progress Validation | Live Telegram & B2B Simulator console panel |
| 9 | Vision & CTA | Call to action for QHomeMart API Sandbox collaboration |

### About Us Team (Slide 2)
* **Indra Haryadi** — *Chief AI Architect & Systems Engineer*: Deployed and optimized the local AI VPS infrastructure (Ubuntu + Llama 3.2 3B). Architected the multi-agent orchestration via CrewAI with 100% stable, production-ready JSON pipelines.
* **Antigravity** — *Frontend & Integration Lead*: Developing the centralized COMOT 'Shell' application (FastAPI for CRUD telemetry). Spearheading the Telegram Bot architecture for frictionless field-worker reporting.
* **Hermes Agent** — *Strategic AI Operation & Marketing*: The orchestrator behind this operation. Hermes validates logic, builds strategies, and optimizes deck marketing material to ensure COMOT services is running well and ready to served.
* **QHomeMart** — *Immediate Post-Presentation Target (Pending Approval)*: Proposed collaboration to integrate COMOT's automated JSON output with QHomeMart's Procurement API for 10 Jogja Site sandboxes.

---

## 📈 8. Quick Action Plan & Roadmap (The Jogja Rollout)

Roadmap implementasi nyata pasca-kompetisi (3-Month Rollout):
* **Bulan 1 (Finalizing COMOT)**: Finalisasi integrasi Telegram Bot, dasbor CRUD, dan enkapsulasi model AI ke status *Production Ready*.
* **Bulan 2 (The Jogja Sandbox)**: Uji coba pilot project di lapangan bekerja sama dengan **10 Kontraktor Yogyakarta terpilih** untuk memvalidasi performa di lapangan.
* **Bulan 3 (API Integration)**: Sinkronisasi penuh dan integrasi mendalam antara output rekomendasi AI COMOT dengan **API Procurement internal QHomeMart** untuk transaksi otonom penuh.

---

## 🏆 9. Progress Validation (Already Functional!)

COMOT bukanlah sebuah konsep di atas kertas (bukan mock belaka), melainkan sistem yang **telah diuji dan berfungsi penuh**:

1. **Infrastruktur Produksi**: VPS Tencent Cloud (8GB RAM) dalam status Aktif 24/7, secured via HTTPS (Let's Encrypt TLSv1.3).
2. **Custom Domain Live**: `comot.simpel.fun` aktif melayani Landing Page dan Dashboard App secara simultan melalui Nginx reverse proxy.
3. **Engine AI Lokal**: Ollama, Hermes, dan engine Llama 3.2 terinstal dan aktif merespon analisis real-time di server.
4. **Telegram Bot Active**: `@mrcomot_bot` berjalan 24/7 dengan command `/catat`, `/beli`, dan `/saran` yang telah diuji oleh tim lapangan.
5. **9-Slide Interactive Pitch Deck**: Landing page presentasi interaktif dengan calculator widget, flowchart animator, dan console simulator — semuanya berjalan langsung di browser tanpa framework tambahan.
6. **Automated SDLC Verification**: Skrip Playwright (`verify-comot.cjs`) memvalidasi responsivitas mobile, transisi slide, dan integritas DOM secara otomatis pada viewport 375x812.
7. **Validasi Skenario**: Pengujian skenario logistik pada proyek Rumah_5M **telah sukses** mensimulasikan kegagalan rantai pasok dan menghasilkan output mitigasi logistik dengan data presisi (`estimasi_kerugian_rupiah: 150000000`).

---

## 📜 10. Developer & AI Agent Guidelines

For future AI Agents working on this repository, please adhere strictly to these rules:

1. **Keep Codebases Separated**:
   - Ensure the COMOT project remains strictly isolated from the adjacent `Pakdodi` codebase.
2. **Local & VPS Synchronization Paths**:
   - Local: `/Users/aditif/Development/COMOT`
   - Remote VPS: `ubuntu@43.133.139.131` → `/home/ubuntu/comot-app`
   - CrewAI Location: `/home/ubuntu/comot-multiagent`
   - SSH Alias: `comot-vps`
3. **Zero Placeholders**:
   - Always write concrete, complete logic. Mock data must display realistic Yogyakarta site names, prices, and names to keep the prototype highly premium.
4. **Telegram Polling Precautions**:
   - Never write unescaped markdown or loose text in bot emitters. **Always use HTML parse mode** (`<b>`, `<i>`, `<code>`) for safe entity parsing.
5. **Standard SDLC Verification**:
   - Before completing tasks, always run `verify-comot.cjs` inside the `Artifacts` folder via `NODE_PATH` relative resolution to assert rendering safety and viewport responsiveness.
6. **Performance Constraints**:
   - No `backdrop-filter: blur()` or heavy CSS Gaussian blurs. Use solid backgrounds and CSS radial gradients only. Target 60 FPS on all devices.
7. **GitHub Repository**:
   - Remote: `https://github.com/GitSangindra/comot.git`
   - Always commit and push after completing significant feature milestones.

