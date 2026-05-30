# Task List - COMOT Custom Domain Mapping & HTTPS SSL Setup

This checklist tracks the implementation steps for routing `comot.simpel.fun` to serve the landing page, `/app` to serve the dashboard, and securing the domain with SSL.

## Phase 1: VPS Hermes Catalysis & Prompt Orchestration
- [x] Create automation generation script `Artifacts/generate-landing.js`
- [x] Programmatically invoke `hermes3` model via SSH Ollama command on VPS to generate the HTML base structure
- [x] Ensure all 8 winning slides are fully mapped into the generated code structure
- [x] Pull generated `landing.html` locally into `/Users/aditif/Development/COMOT/public/landing.html`

## Phase 2: Refine Visual Layout & Optimize Performance (No Glassmorphism)
- [x] Inject custom Google Fonts (`Outfit`, `Inter`) and CSS layout variables
- [x] Ensure a premium, dark space-neon style utilizing solid dark colors and native GPU-accelerated CSS radial backgrounds
- [x] Verify that all blurs (`backdrop-filter`) and dynamic glow animations are removed/simplified to guarantee 60 FPS rendering
- [x] Build a highly responsive, clean mobile-friendly slide transition framework (desktop tabs + mobile stacked/vertical layouts)

## Phase 3: Implement Interactive Deck Widgets
- [x] Slide 2: Implement the **Interactive 3% Profit Leakage Calculator** (dynamic sliders for project value & daily penalty)
- [x] Slide 4: Build the **Interactive 4-Agent Workflow Flowchart** (glowing micro-animations and status transitions)
- [x] Slide 7: Integrate the **Live Telegram & B2B Purchasing simulator panel** (preset command buttons feeding telemetry log views in real-time)

## Phase 4: SDLC Verification & VPS Sync
- [x] Synchronize completed `landing.html` to VPS at `/home/ubuntu/comot-app/public/landing.html`
- [x] Update Playwright automated test script `verify-comot.cjs` to assert slide transitions, calculator values, and viewport scaling
- [x] Run automated SDLC test script to verify perfect mobile responsiveness and confirm 0 layout breaks
- [x] Capture final visual validation confirmation and verify page live at `http://43.133.139.131:8000/landing.html`

## Phase 5: Custom Domain comot.simpel.fun Mapping & HTTPS SSL Setup
- [x] Add explicit `/` and `/app` route definitions inside backend `server.js`
- [x] Convert relative style/script links in `public/index.html` to absolute relative paths (`/index.css` & `/app.js`)
- [x] Update header/Slide 8 links in `public/landing.html` to map clean `/app` route
- [x] Sync updated local codebase to VPS (`/home/ubuntu/comot-app/`)
- [x] Install and configure Nginx reverse proxy on Tencent Cloud VPS
- [x] Procure and configure Let's Encrypt SSL HTTPS certificate for `comot.simpel.fun`
- [x] Update Playwright automated test script `verify-comot.cjs` to verify both routes on host port 8000 (verified live on domain via HTTPS!)

## Phase 6: About Us Slide & Dashboard Back Navigation
- [x] Copy Indra Haryadi portrait photo `/Users/aditif/.gemini/antigravity-ide/brain/a039b17b-a3ec-4ea4-b911-0bef330207f4/media__1780099735474.jpg` to `public/indra.jpg`
- [x] Add "Kembali ke Halaman Depan" button inside the main COMOT app dashboard header (`public/index.html`)
- [x] Insert the "About Us" slide as Slide 2 in `public/landing.html`, featuring profiles of Indra Haryadi, Gemini, Antigravity, and Hermes
- [x] Shift Slide 2-8 IDs to Slide 3-9 IDs and update `TOTAL_SLIDES = 9` and footer text to: "COMOT Construction Material Order & Tracking - Simpel.Fun AI Yogyakarta"
- [x] Deploy and synchronize local modifications (HTML, CSS, Image) to Tencent Cloud VPS via secure SCP
- [x] Update automated Playwright verification script `verify-comot.cjs` to reflect the shifted slide mapping and run verification successfully
- [x] Generate and view updated smartphone responsive dashboard and landing screenshots

