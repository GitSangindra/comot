const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONTEXT_PATH = path.join(__dirname, 'Context.md');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'landing.html');

console.log('📖 Reading Context.md...');
const contextContent = fs.readFileSync(CONTEXT_PATH, 'utf8');

const prompt = `
You are Hermes, a world-class front-end engineer and copywriter.
Analyze the following COMOT context and build a single-file, highly interactive, stunning presentation landing page (landing.html) for a B2B logistics/AI event contest.

CONTEXT:
${contextContent}

INSTRUCTIONS FOR THE PRESENTATION LANDING PAGE:
1. Tech Stack: Single HTML5 file containing embedded CSS (Vanilla, no external libraries except Google Fonts) and modern Vanilla JavaScript.
2. Layout Concept: A dark space-neon style (Midnight black background #090a0f, cobalt blue #2563eb, bright purple #a855f7, emerald green #10b981).
3. Performance Guarantee: DO NOT use expensive 'filter: blur()' or 'backdrop-filter: blur()' dynamic repaints. Use solid colors, modern high-contrast cards, and native GPU-accelerated radial-gradients for body background.
4. Structure: An interactive 8-Slide Pitch Deck which judges can step through using 'Previous' and 'Next' buttons, or jump directly using numbered slide indicators. Also support vertical scroll.
5. The 8 Slides to Implement:
   - Slide 1: The Hook & Identity (Tagline: Standardizing Autonomous Construction Logistics. Pitch: Memangkas 3% Kebocoran Profit. Sleman Rumah_5M).
   - Slide 2: The Problem & Financial Cost (Cost of problem. Interactive Range Slider for project values Rp 1B - Rp 10B, reactively updating daily overhead loss = (3% * Value)/100).
   - Slide 3: The Solution (COMOT Shell & Interface: Telegram Bot -> Cangkang Dashboard -> Multi-Agent AI).
   - Slide 4: Technical Excellence (Local Multi-Agent brain, htop verification screenshot area, interactive 4-subagent flow showing messages passing).
   - Slide 5: The QHomeMart B2B Edge (Direct Revenue Funnel, Automatic PO, Customer Lock-in, Yogyakarta Predictive supply demand data).
   - Slide 6: Mission & Yogyakarta Rollout Roadmap (3-Month action plan: Bulan 1 Finalizing, Bulan 2 Jogja Sandbox with 10 contractors, Bulan 3 API QHomeMart integration).
   - Slide 7: Progress Validation (Tencent Cloud live testing proof. Include an interactive Telegram simulator where user clicks buttons like 'Trigger Cement Out Log' or 'Emergency Purchase' and it prints live JSON data streams and SSL handshakes).
   - Slide 8: Team, Vision & Call to Action (Call to IT QHomeMart to open Sandbox API, team photo container, standardizing autonomous construction logistics).

Generate ONLY the fully complete, valid HTML document starting with <!DOCTYPE html> and ending with </html>. Do not wrap in markdown quotes. Ensure the output is clean and syntactically flawless.
`;

console.log('🚀 Triggering Hermes3 on VPS...');

// Write prompt to a temp file on VPS to avoid command line length limits
const tempPromptFile = path.join(__dirname, 'temp_prompt.txt');
fs.writeFileSync(tempPromptFile, prompt, 'utf8');

// Copy temp file to VPS and execute Ollama
const vpsDest = 'comot-vps:/home/ubuntu/comot-app/Artifacts/temp_prompt.txt';
console.log('📤 Uploading prompt file to VPS...');

exec(`scp ${tempPromptFile} ${vpsDest}`, (scpErr) => {
  if (scpErr) {
    console.error('❌ Failed to upload prompt file:', scpErr);
    fs.unlinkSync(tempPromptFile);
    return;
  }
  
  console.log('🤖 Running Ollama hermes3 on VPS. This may take 1-2 minutes...');
  const remoteCommand = 'cat /home/ubuntu/comot-app/Artifacts/temp_prompt.txt | ollama run hermes3';
  
  exec(`ssh comot-vps "${remoteCommand}"`, { maxBuffer: 1024 * 1024 * 20 }, (ollamaErr, stdout, stderr) => {
    // Clean up temp files
    fs.unlinkSync(tempPromptFile);
    exec('ssh comot-vps "rm /home/ubuntu/comot-app/Artifacts/temp_prompt.txt"');

    if (ollamaErr) {
      console.error('❌ Failed to execute Ollama:', ollamaErr);
      console.error(stderr);
      return;
    }

    console.log('📥 Processing generated code...');
    let cleanHtml = stdout.trim();
    
    // If output is wrapped in markdown code blocks, strip them
    if (cleanHtml.startsWith('```html')) {
      cleanHtml = cleanHtml.substring(7);
    } else if (cleanHtml.startsWith('```')) {
      cleanHtml = cleanHtml.substring(3);
    }
    
    if (cleanHtml.endsWith('```')) {
      cleanHtml = cleanHtml.substring(0, cleanHtml.length - 3);
    }
    
    cleanHtml = cleanHtml.trim();

    fs.writeFileSync(OUTPUT_PATH, cleanHtml, 'utf8');
    console.log(`✅ Success! Generated presentation landing page saved to: ${OUTPUT_PATH}`);
  });
});
