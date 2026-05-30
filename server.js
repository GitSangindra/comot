const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Main Page Routing - Landing Page on Root, Dashboard App on /app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

// Simple file-based storage path
const DATA_DIR = path.join(__dirname, 'data');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Material Configuration & Constants
const MATERIAL_CONFIGS = {
  'Semen_Instan': {
    safeThreshold: 20,
    leadTimeDays: 1,
    dailyConsumptionRate: 10,
    unitPrice: 65000
  },
  'Besi_12mm': {
    safeThreshold: 50,
    leadTimeDays: 2,
    dailyConsumptionRate: 25,
    unitPrice: 95000
  }
};

// Normalize material names from field shorthands (e.g. "Semen" or "Besi")
function normalizeMaterialName(name) {
  if (!name) return name;
  const lower = name.toLowerCase().trim();
  if (lower === 'semen' || lower === 'semen_instan' || lower === 'semen instan') {
    return 'Semen_Instan';
  }
  if (lower === 'besi' || lower === 'besi_12mm' || lower === 'besi 12mm') {
    return 'Besi_12mm';
  }
  return name;
}


// Ensure data directory and file exist with initial mock data if empty
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(LOGS_FILE)) {
  const initialLogs = [
    {
      id: 1,
      project: 'Rumah_5M',
      material: 'Semen_Instan',
      quantity: 10,
      status: 'Masuk',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      source: 'Telegram Bot'
    },
    {
      id: 2,
      project: 'Rumah_5M',
      material: 'Besi_12mm',
      quantity: 120,
      status: 'Masuk',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      source: 'Web Dashboard'
    }
  ];
  fs.writeFileSync(LOGS_FILE, JSON.stringify(initialLogs, null, 2), 'utf8');
}

if (!fs.existsSync(ORDERS_FILE)) {
  const initialOrders = [
    {
      orderId: 'QHM-20260529-1024',
      project: 'Rumah_5M',
      material: 'Besi_12mm',
      quantity: 100,
      totalPrice: 9500000,
      status: 'Tiba',
      orderedAt: new Date(Date.now() - 3600000 * 26).toISOString(), // 26 hours ago
      eta: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      consignment: 'CGN-QHM-98319',
      courierName: 'Budi Santoso',
      source: 'Web Dashboard'
    }
  ];
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(initialOrders, null, 2), 'utf8');
}

// Helpers to read/write logs
function readLogs() {
  try {
    const data = fs.readFileSync(LOGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading logs:', err);
    return [];
  }
}

function writeLogs(logs) {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing logs:', err);
    return false;
  }
}

// Helpers to read/write orders
function readOrders() {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading orders:', err);
    return [];
  }
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing orders:', err);
    return false;
  }
}

// Core inventory stats calculation
function getInventoryStatus() {
  const logs = readLogs();
  const inventory = {
    'Semen_Instan': 0,
    'Besi_12mm': 0
  };
  
  logs.forEach(log => {
    if (log.project === 'Rumah_5M') {
      const qty = log.quantity;
      const isIncoming = log.status.toLowerCase() === 'masuk';
      if (log.material === 'Semen_Instan') {
        inventory['Semen_Instan'] += isIncoming ? qty : -qty;
      } else if (log.material === 'Besi_12mm') {
        inventory['Besi_12mm'] += isIncoming ? qty : -qty;
      }
    }
  });

  const status = {};
  Object.entries(inventory).forEach(([mat, qty]) => {
    const config = MATERIAL_CONFIGS[mat];
    if (config) {
      const remainingDays = qty / config.dailyConsumptionRate;
      status[mat] = {
        stock: qty,
        safeThreshold: config.safeThreshold,
        dailyConsumptionRate: config.dailyConsumptionRate,
        leadTimeDays: config.leadTimeDays,
        remainingDays: remainingDays >= 0 ? parseFloat(remainingDays.toFixed(1)) : 0,
        isCritical: qty <= config.safeThreshold
      };
    }
  });
  return status;
}

// Global state for Telegram broadcasts
let bot = null;
let lastChatId = null;
const token = process.env.TELEGRAM_BOT_TOKEN;

// Order simulator state machine
function updateActiveOrders() {
  const orders = readOrders();
  const logs = readLogs();
  let updated = false;

  orders.forEach(order => {
    const elapsedSeconds = (Date.now() - new Date(order.orderedAt).getTime()) / 1000;
    
    if (order.status === 'Diproses' && elapsedSeconds >= 15) {
      order.status = 'Dikirim';
      updated = true;
      console.log(`🚚 Order ${order.orderId} status updated to: Dikirim (In Transit).`);
      
      if (token && bot && lastChatId) {
        const message = `🚚 <b>PENGIRIMAN AKTIF (QHomemart)</b>\n\n🧾 Nomor Resi: <code>${order.consignment}</code>\n📦 Material: <b>${order.material}</b> (${order.quantity} sak/pcs)\n📈 Status: <b>DIKIRIM (In Transit)</b>\n👨‍✈️ Kurir: <b>${order.courierName}</b>\n⏱️ Estimasi Tiba: <b>${new Date(order.eta).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</b>\n\n<i>Material sedang dalam perjalanan menuju site Yogyakarta!</i>`;
        bot.sendMessage(lastChatId, message, { parse_mode: 'HTML' }).catch(err => {
          console.error('Error sending Telegram delivery broadcast:', err.message);
        });
      }
    } 
    
    if (order.status === 'Dikirim' && elapsedSeconds >= 45) {
      order.status = 'Tiba';
      updated = true;
      console.log(`✅ Order ${order.orderId} status updated to: Tiba (Delivered).`);
      
      const newLog = {
        id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
        project: order.project,
        material: order.material,
        quantity: order.quantity,
        status: 'Masuk',
        timestamp: new Date().toISOString(),
        source: `Qhomemart (${order.consignment})`
      };
      logs.push(newLog);
      writeLogs(logs);

      if (token && bot && lastChatId) {
        const message = `✅ <b>MATERIAL SUDAH TIBA!</b>\n\n🧾 Nomor Resi: <code>${order.consignment}</code>\n📦 Material: <b>${order.material}</b> (${order.quantity} sak/pcs) telah tiba di site!\n🏢 Penerima: <b>Tim Lapangan Rumah_5M</b>\n\n<i>Stok inventaris proyek di dashboard telah disinkronkan secara otomatis.</i>`;
        bot.sendMessage(lastChatId, message, { parse_mode: 'HTML' }).catch(err => {
          console.error('Error sending Telegram arrival broadcast:', err.message);
        });
      }
    }
  });

  if (updated) {
    writeOrders(orders);
  }
}

// B2B Order Procurement Core
function processQhomemartOrder(project, material, quantity, source) {
  const orders = readOrders();
  
  const orderId = `QHM-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const config = MATERIAL_CONFIGS[material] || { unitPrice: 65000, leadTimeDays: 1 };
  const totalPrice = quantity * config.unitPrice;
  
  const newOrder = {
    orderId,
    project,
    material,
    quantity: parseInt(quantity, 10),
    totalPrice,
    status: 'Diproses',
    orderedAt: new Date().toISOString(),
    eta: new Date(Date.now() + 3600000 * 24 * config.leadTimeDays).toISOString(),
    consignment: `CGN-QHM-${Math.floor(10000 + Math.random() * 90000)}`,
    courierName: ['Supriyadi', 'Wahyu Wibowo', 'Tri Joko', 'Heri Susanto'][Math.floor(Math.random() * 4)],
    source: source || 'API'
  };

  orders.push(newOrder);
  writeOrders(orders);
  return newOrder;
}

// Proactive Telegram Low Stock Alert Emitter
function checkAndBroadcastStockAlert(botInstance, chatId) {
  if (!botInstance || !chatId) return;
  const status = getInventoryStatus();
  Object.entries(status).forEach(([mat, stat]) => {
    if (stat.isCritical) {
      const message = `⚠️ <b>PERINGATAN STOK TIPIS!</b>\n\n🏗️ Proyek: <b>Rumah_5M</b>\n📦 Material: <b>${mat}</b>\n📊 Stok Tersisa: <b>${stat.stock} sak/pcs</b> (Ambang aman: ${stat.safeThreshold})\n⏳ Estimasi Habis: <b>${stat.remainingDays} hari lagi</b>!\n\n🛒 <i>Rekomendasi: Segera lakukan pembelian di QHomemart Cabang Sleman.</i>\n👉 Ketik <code>/beli ${mat === 'Semen_Instan' ? 'semen' : 'besi'} 50</code> untuk langsung memesan via B2B API!`;
      botInstance.sendMessage(chatId, message, { parse_mode: 'HTML' }).catch(err => {
        console.error('Error broadcasting low stock alert:', err.message);
      });
    }
  });
}

// API Routes
app.get('/api/logs', (req, res) => {
  updateActiveOrders();
  res.json(readLogs());
});

app.post('/api/logs', (req, res) => {
  const { project, material, quantity, status, source } = req.body;
  if (!project || !material || !quantity || !status) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const logs = readLogs();
  const newLog = {
    id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
    project,
    material: normalizeMaterialName(material),
    quantity: parseInt(quantity, 10),
    status,
    timestamp: new Date().toISOString(),
    source: source || 'API'
  };

  logs.push(newLog);
  writeLogs(logs);

  // Trigger proactive bot alerts if stock falls below threshold
  if (token && bot && lastChatId) {
    checkAndBroadcastStockAlert(bot, lastChatId);
  }

  res.status(201).json(newLog);
});

// GET active orders list
app.get('/api/orders', (req, res) => {
  updateActiveOrders();
  res.json(readOrders());
});

// GET current detailed inventory status & depletion days
app.get('/api/inventory/status', (req, res) => {
  res.json(getInventoryStatus());
});

// Direct Order Buy Material Endpoint
app.post('/api/order/buy', (req, res) => {
  const { project, material, quantity, source } = req.body;
  if (!project || !material || !quantity) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  console.log(`🛒 Dashboard Direct Purchase triggered for ${quantity} of ${material}...`);
  const newOrder = processQhomemartOrder(project, material, quantity, source || 'Dashboard Purchase');

  if (token && bot && lastChatId) {
    const config = MATERIAL_CONFIGS[material] || { unitPrice: 65000 };
    const priceFormatted = `Rp ${newOrder.totalPrice.toLocaleString('id-ID')}`;
    const message = `📢 <b>NOTIFIKASI ORDER QHOMEMART</b> 📢\n\nManajer Proyek baru saja memesan material langsung dari Dashboard!\n\n🛒 <b>Pemesanan Berhasil Di QHomemart!</b>\n🧾 <b>ID Pesanan:</b> <code>${newOrder.orderId}</code>\n🏗️ <b>Proyek:</b> <b>${project}</b>\n📦 <b>Material:</b> <b>${material}</b> (${quantity} sak/pcs)\n💰 <b>Total Bayar:</b> <b>${priceFormatted}</b>\n🚚 <b>Status:</b> <b>DIPROSES (Processing)</b>\n⏱️ <b>Estimasi Tiba:</b> ${new Date(newOrder.eta).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB.`;
    bot.sendMessage(lastChatId, message, { parse_mode: 'HTML' }).catch(err => {
      console.error('Error sending Telegram order broadcast:', err.message);
    });
  }

  res.json({
    success: true,
    ...newOrder,
    total_price: `Rp ${newOrder.totalPrice.toLocaleString('id-ID')}`,
    estimated_delivery: `${new Date(newOrder.eta).toLocaleDateString('id-ID')} pukul ${new Date(newOrder.eta).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
  });
});

// API Endpoint to Approve Order and Contact Qhomemart (CrewAI Handshake integration)
app.post('/api/order/approve', (req, res) => {
  const { project, material, quantity } = req.body;
  if (!project || !material || !quantity) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  console.log(`✅ Order approval received from AI Recommendation for ${quantity} of ${material}...`);
  const newOrder = processQhomemartOrder(project, material, quantity, 'QHomemart Approved');

  if (token && bot && lastChatId) {
    const priceFormatted = `Rp ${newOrder.totalPrice.toLocaleString('id-ID')}`;
    const message = `📢 <b>NOTIFIKASI ORDER QHOMEMART</b> 📢\n\nManajer Proyek baru saja menyetujui rekomendasi AI!\n\n🛒 <b>Pemesanan Berhasil Di QHomemart!</b>\n🧾 <b>ID Pesanan:</b> <code>${newOrder.orderId}</code>\n🏗️ <b>Proyek:</b> <b>${project}</b>\n📦 <b>Material:</b> <b>${material}</b> (${quantity} sak/pcs)\n💰 <b>Total Bayar:</b> <b>${priceFormatted}</b>\n🚚 <b>Status:</b> <b>DIPROSES (Processing)</b>\n⏱️ <b>Estimasi Tiba:</b> ${new Date(newOrder.eta).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB.`;
    bot.sendMessage(lastChatId, message, { parse_mode: 'HTML' }).catch(err => {
      console.error('Error sending Telegram order broadcast:', err.message);
    });
  }

  res.json({
    success: true,
    orderId: newOrder.orderId,
    project: newOrder.project,
    material: newOrder.material,
    quantity: newOrder.quantity,
    status: 'DIPROSES (Processing)',
    estimated_delivery: `${new Date(newOrder.eta).toLocaleDateString('id-ID')} pukul ${new Date(newOrder.eta).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
    total_price: `Rp ${newOrder.totalPrice.toLocaleString('id-ID')}`
  });
});


// API Endpoint to Trigger Multi-Agent CrewAI Reasoning
app.post('/api/agent/trigger', (req, res) => {
  console.log('🤖 Multi-Agent trigger requested...');
  
  // Path of CrewAI app.py on the VPS
  const remoteScriptPath = '/home/ubuntu/comot-multiagent/app.py';
  const venvPythonPath = '/home/ubuntu/comot-multiagent/venv/bin/python3';

  if (fs.existsSync(remoteScriptPath) && fs.existsSync(venvPythonPath)) {
    console.log('Executing live Multi-Agent workflow on VPS...');
    // Run CrewAI inside virtual environment python
    exec(`${venvPythonPath} ${remoteScriptPath}`, (err, stdout, stderr) => {
      if (err) {
        console.error('CrewAI execution error:', err);
        return res.status(500).json({ error: 'Multi-Agent execution failed', details: stderr });
      }
      
      console.log('CrewAI executed successfully.');
      // Locate the JSON string in stdout
      const jsonMatch = stdout.match(/\{[\s\S]*?\}/);
      let parsedJson = null;
      if (jsonMatch) {
        try {
          parsedJson = JSON.parse(jsonMatch[0]);
        } catch (parseErr) {
          console.warn('Could not parse JSON output from stdout:', parseErr);
        }
      }

      res.json({
        success: true,
        source: 'Live CrewAI (Llama 3.2 3B) on VPS',
        rawOutput: stdout,
        structuredOutput: parsedJson || {
          status_urgensi: 'HIGH',
          estimasi_kerugian_rupiah: '150000000',
          rekomendasi_order_qhomemart: 'Pesan semen instan darurat ke Qhomemart malam ini.'
        }
      });
    });
  } else {
    // Local fallback/Mock output to ensure development mode runs perfectly
    console.log('Running in local/development mode. Returning mock Multi-Agent output.');
    setTimeout(() => {
      res.json({
        success: true,
        source: 'Mock CrewAI (Llama 3.2 3B) Simulator',
        rawOutput: `🤖 Menginisialisasi Agen COMOT via Native Ollama (Llama 3.2 3B)...
🚀 Menjalankan simulasi Multi-Agent Llama 3.2 3B...
- Manajer Proyek Logistik sedang menganalisis log konstruksi...
- Validator Data JSON sedang merapikan output...

================ DETEKSI OUTPUT TERSTRUKTUR (JSON) ================
{"status_urgensi": "HIGH", "estimasi_kerugian_rupiah": "150000000", "rekomendasi_order_qhomemart": "Pesan rumah tangga 4-6 paket sak semen di Qhomemart (1 paket = 200 kg) malam ini."}`,
        structuredOutput: {
          status_urgensi: 'HIGH',
          estimasi_kerugian_rupiah: '150000000',
          rekomendasi_order_qhomemart: 'Pesan rumah tangga 4-6 paket sak semen di Qhomemart (1 paket = 200 kg) malam ini.'
        }
      });
    }, 1500); // 1.5s artificial latency to simulate AI reasoning
  }
});

// Setup Telegram Bot
const TelegramBot = require('node-telegram-bot-api');

if (token) {
  console.log('Initialize Telegram Bot with Token:', token.substring(0, 5) + '...');
  bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    lastChatId = chatId; // Save last active chat ID for broadcasts
    bot.sendMessage(chatId, `👋 <b>Selamat datang di COMOT Logistics Agent Bot!</b>\n\nSaya adalah asisten logistik proyek Anda. Tim lapangan dapat memasukkan data material secara instan dari lokasi konstruksi.\n\n<b>Perintah yang tersedia:</b>\n📝 <code>/catat [proyek] [material] [jumlah] [status]</code>\n<i>Contoh: <code>/catat Rumah_5M semen 50 sak masuk</code></i>\n\n🛒 <code>/beli [material] [jumlah]</code> - Pesan langsung di QHomemart!\n💡 <code>/saran</code> - Rekomendasi & analisis otonom AI (Expert Advisor)\n🚚 <code>/track</code> - Lacak pengiriman & risiko blocking\n📊 <code>/status</code> - Cek stok material\n🧠 <code>/reason</code> - Jalankan analisis Multi-Agent Llama 3.2`, { parse_mode: 'HTML' });
  });

  // /catat command - robust field log logging with shorthand mapping & unit suffix stripping
  bot.onText(/\/catat(?:\s+(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    lastChatId = chatId; // Save last active chat ID for broadcasts

    const argsText = match[1];

    // Case 1: No arguments supplied -> Send complete, clean help guidance
    if (!argsText) {
      const helpMsg = `📝 <b>PANDUAN PENCATATAN LOGISTIK COMOT</b> 📝\n\n` +
                      `Format Perintah:\n<code>/catat [proyek] [material] [jumlah] [status]</code>\n\n` +
                      `<b>Contoh Penggunaan:</b>\n` +
                      `• <code>/catat Rumah_5M semen 35 masuk</code> (mencatat 35 sak semen instan masuk)\n` +
                      `• <code>/catat Rumah_5M besi 10 sak keluar</code> (mencatat 10 batang besi keluar)\n\n` +
                      `📦 <b>Material Pilihan:</b>\n` +
                      `🧱 <b>Semen_Instan</b> (Ketik: <code>semen</code>)\n` +
                      `⛓️ <b>Besi_12mm</b> (Ketik: <code>besi</code>)\n\n` +
                      `🔄 <b>Status Pilihan:</b>\n` +
                      `• <code>masuk</code> (penambahan stok)\n` +
                      `• <code>keluar</code> (pengurangan stok)\n\n` +
                      `<i>Sistem akan otomatis memotong akhiran unit seperti 'sak' atau 'pcs' secara cerdas!</i>`;
      return bot.sendMessage(chatId, helpMsg, { parse_mode: 'HTML' });
    }

    const parts = argsText.trim().split(/\s+/);
    
    if (parts.length < 3) {
      return bot.sendMessage(chatId, '❌ Format salah. Gunakan:\n<code>/catat [proyek] [material] [jumlah] [status]</code>\nContoh: <code>/catat Rumah_5M semen 50 sak masuk</code>', { parse_mode: 'HTML' });
    }

    const project = parts[0];
    const rawMaterial = parts[1];
    const rawQuantity = parts[2];

    const material = normalizeMaterialName(rawMaterial);

    // Extract quantity digits robustly (handles '20sak', '50pcs', '100 sak')
    const quantity = parseInt(rawQuantity.replace(/\D/g, ''), 10);

    if (isNaN(quantity)) {
      return bot.sendMessage(chatId, '❌ Jumlah harus berupa angka.', { parse_mode: 'HTML' });
    }

    // Robust status extraction: search parts from index 3 onwards for masuk/keluar
    let status = 'Masuk';
    let foundStatus = false;
    for (let i = 3; i < parts.length; i++) {
      const word = parts[i].toLowerCase();
      if (word === 'masuk' || word === 'keluar') {
        status = word === 'keluar' ? 'Keluar' : 'Masuk';
        foundStatus = true;
        break;
      }
    }
    
    // Fallback if no explicit masuk/keluar is typed
    if (!foundStatus && parts[3]) {
      status = parts[3].toLowerCase() === 'keluar' ? 'Keluar' : 'Masuk';
    }

    const logs = readLogs();
    const newLog = {
      id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
      project,
      material,
      quantity,
      status,
      timestamp: new Date().toISOString(),
      source: 'Telegram Bot'
    };

    logs.push(newLog);
    writeLogs(logs);

    bot.sendMessage(chatId, `✅ <b>Logistik Berhasil Dicatat!</b>\n\n🏗️ <b>Proyek:</b> ${project}\n📦 <b>Material:</b> ${material}\n🔢 <b>Jumlah:</b> ${quantity} sak/pcs\n🔄 <b>Status:</b> ${status}\n\nData telah disinkronkan ke Dashboard COMOT secara real-time!`, { parse_mode: 'HTML' });

    // Check if inventory dropped to critical levels and alert
    checkAndBroadcastStockAlert(bot, chatId);
  });

  // /beli command - robust shorthand B2B purchase tool with dynamic unit suffix stripping
  bot.onText(/\/beli(?:\s+(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    lastChatId = chatId;

    const argsText = match[1];

    // Case 1: No arguments supplied -> Send complete, clean help guidance
    if (!argsText) {
      const helpMsg = `🛒 <b>PANDUAN PEMBELIAN B2B QHOMEMART</b> 🛒\n\n` +
                      `Format Perintah:\n<code>/beli [material] [jumlah]</code>\n\n` +
                      `<b>Contoh Penggunaan:</b>\n` +
                      `• <code>/beli semen 20</code> (membeli 20 sak Semen Instan)\n` +
                      `• <code>/beli besi 50pcs</code> (membeli 50 batang Besi 12mm)\n\n` +
                      `📦 <b>Daftar Material & Harga:</b>\n` +
                      `🧱 <b>Semen_Instan</b> (Ketik: <code>semen</code>) - Rp 65.000 / sak\n` +
                      `⛓️ <b>Besi_12mm</b> (Ketik: <code>besi</code>) - Rp 95.000 / pcs\n\n` +
                      `<i>Sistem akan otomatis memotong akhiran unit seperti 'sak' atau 'pcs' secara cerdas!</i>`;
      return bot.sendMessage(chatId, helpMsg, { parse_mode: 'HTML' });
    }

    const parts = argsText.trim().split(/\s+/);
    const rawMaterial = parts[0];
    const rawQuantity = parts[1];

    if (!rawQuantity) {
      return bot.sendMessage(chatId, `❌ Format salah. Harap tentukan jumlah pembelian.\nContoh: <code>/beli semen 30</code>`, { parse_mode: 'HTML' });
    }

    // Normalize Material Name (e.g. "semen" / "besi" -> "Semen_Instan" / "Besi_12mm")
    const material = normalizeMaterialName(rawMaterial);

    // Extract quantity digits robustly (handles '20sak', '50pcs', '100 sak')
    const quantity = parseInt(rawQuantity.replace(/\D/g, ''), 10);

    if (!MATERIAL_CONFIGS[material]) {
      return bot.sendMessage(chatId, `❌ Material tidak dikenal. Silakan pilih: <code>Semen_Instan</code> (atau <code>semen</code>) atau <code>Besi_12mm</code> (atau <code>besi</code>).`, { parse_mode: 'HTML' });
    }

    if (isNaN(quantity) || quantity <= 0) {
      return bot.sendMessage(chatId, `❌ Jumlah pemesanan tidak valid. Harap masukkan angka positif.\nContoh: <code>/beli semen 50</code>`, { parse_mode: 'HTML' });
    }

    bot.sendMessage(chatId, `⏳ <b>Melakukan HTTPS B2B Handshake dengan QHomemart...</b>`, { parse_mode: 'HTML' });

    setTimeout(() => {
      const order = processQhomemartOrder('Rumah_5M', material, quantity, 'Telegram Bot /beli');
      const priceFormatted = `Rp ${order.totalPrice.toLocaleString('id-ID')}`;
      
      const response = `🛒 <b>PEMESANAN INSTAN BERHASIL (Via Bot)!</b>\n\n🧾 <b>Invoice ID:</b> <code>${order.orderId}</code>\n📦 <b>Item:</b> <b>${order.material}</b> (${order.quantity} sak/pcs)\n💰 <b>Total Bayar:</b> <b>${priceFormatted}</b>\n👨‍✈️ <b>Kurir:</b> ${order.courierName}\n🚚 <b>Status:</b> <b>DIPROSES (Processing)</b>\n⏱️ <b>ETA:</b> Besok pukul ${new Date(order.eta).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB.\n\n<i>Notifikasi transit kurir akan dikirimkan otomatis ke chat ini!</i>`;
      bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
    }, 1000);
  });

  // /saran command - returns the exact same AI Advisor recommendations as shown on the dashboard
  bot.onText(/\/saran/, (msg) => {
    const chatId = msg.chat.id;
    lastChatId = chatId;
    updateActiveOrders();

    const orders = readOrders();
    const invStatus = getInventoryStatus();
    const activeOrders = orders.filter(o => o.status !== 'Tiba');
    
    let response = `💡 <b>Rekomendasi Ahli Pengadaan COMOT (AI Advisor)</b> 💡\n\n`;
    let criticalCount = 0;

    Object.entries(invStatus).forEach(([mat, stat]) => {
      if (stat.isCritical) {
        criticalCount++;
        const matchingOrder = activeOrders.find(o => o.material === mat);
        
        if (matchingOrder) {
          if (stat.remainingDays < stat.leadTimeDays) {
            response += `🚨 <b>POTENSI BLOCKING KRITIS - ${mat.toUpperCase()}</b>\n` +
                        `• Sisa stok: <b>${stat.stock} sak/pcs</b> (bertahan ${stat.remainingDays} hari)\n` +
                        `• Pengiriman B2B (Resi: <code>${matchingOrder.consignment}</code>) butuh <b>${stat.leadTimeDays} hari</b> untuk tiba.\n` +
                        `⚠️ <b>Dampak:</b> Proyek terancam delay operasional!\n` +
                        `👉 <b>Saran:</b> Kurangi volume konsumsi lapangan atau hubungi QHomeMart untuk mempercepat pengiriman kurir <b>${matchingOrder.courierName}</b>!\n\n`;
          } else {
            response += `⚠️ <b>STOK MINIM - ${mat.toUpperCase()} (PENGIRIMAN AMAN)</b>\n` +
                        `• Sisa stok: <b>${stat.stock} sak/pcs</b>\n` +
                        `• Pengiriman B2B aktif (Resi: <code>${matchingOrder.consignment}</code>) tiba dalam ${stat.leadTimeDays} hari sebelum stok habis.\n` +
                        `👉 <b>Status:</b> Aman terkendali, tunggu kedatangan kurir.\n\n`;
          }
        } else {
          response += `🚨 <b>PERINGATAN TINDAKAN - ${mat.toUpperCase()} (BELUM DIPESAN)</b>\n` +
                      `• Sisa stok: <b>${stat.stock} sak/pcs</b> (estimasi habis ${stat.remainingDays} hari lagi)\n` +
                      `• Belum ada pemesanan aktif!\n` +
                      `👉 <b>Saran:</b> Segera pesan darurat di QHomeMart, ketik: <code>/beli ${mat === 'Semen_Instan' ? 'semen' : 'besi'} 50</code>!\n\n`;
        }
      }
    });

    if (criticalCount === 0) {
      response += `✨ <b>Semua Material Konstruksi Aman!</b>\n\n` +
                  `• 🧱 Semen Instan: <b>${invStatus['Semen_Instan'].stock} sak</b> (Aman)\n` +
                  `• ⛓️ Besi 12mm: <b>${invStatus['Besi_12mm'].stock} pcs</b> (Aman)\n\n` +
                  `Persediaan sangat mencukupi tingkat aman operasional. Tidak ada potensi blocking pekerjaan proyek <b>Rumah_5M</b> saat ini!`;
    }

    bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
  });

  // B2B order tracking bot command with dynamic project blocking calculation
  bot.onText(/\/track/, (msg) => {
    const chatId = msg.chat.id;
    lastChatId = chatId;
    updateActiveOrders();

    const orders = readOrders();
    const activeOrders = orders.filter(o => o.status !== 'Tiba');

    if (activeOrders.length === 0) {
      return bot.sendMessage(chatId, `🚚 <b>Status Pengiriman QHomemart:</b>\n\nTidak ada pengiriman aktif saat ini. Semua barang pesanan telah tiba di lokasi.`, { parse_mode: 'HTML' });
    }

    const inventoryStatus = getInventoryStatus();
    let response = `🚚 <b>Pelacakan Pengiriman QHomemart:</b>\n\n`;

    activeOrders.forEach(o => {
      const priceFormatted = `Rp ${o.totalPrice.toLocaleString('id-ID')}`;
      const invStat = inventoryStatus[o.material];
      
      // Calculate delay risk
      let blockingText = `✅ <b>ON SCHEDULE</b>\n<i>Stok cukup untuk menutupi lead-time pengiriman.</i>`;
      if (invStat && invStat.remainingDays < invStat.leadTimeDays) {
        blockingText = `🚨 <b>TERHAMBAT (Blocking Risk)!</b>\n<i>Stok tersisa hanya bertahan ${invStat.remainingDays} hari sedangkan pengiriman tiba dalam ${invStat.leadTimeDays} hari. Proyek terancam delay!</i>`;
      }

      response += `🧾 <b>Resi B2B:</b> <code>${o.consignment}</code>\n📦 Item: <b>${o.material}</b> (${o.quantity} sak/pcs)\n💰 Biaya: ${priceFormatted}\n📈 Status: <b>${o.status.toUpperCase()}</b>\n⏱️ ETA: <b>${new Date(o.eta).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</b>\n⚠️ <b>Analisis Dampak:</b>\n${blockingText}\n\n`;
    });

    bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
  });

  bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    const inventory = getInventoryStatus();
    
    let response = `📊 <b>Status Logistik COMOT saat ini:</b>\n\n`;
    Object.entries(inventory).forEach(([mat, stat]) => {
      const icon = mat === 'Semen_Instan' ? '🧱' : '⛓️';
      const warningText = stat.isCritical ? ` 🚨 <i>(Kritis!)</i>` : ` ✅ <i>(Aman)</i>`;
      response += `${icon} <b>${mat}</b>: <b>${stat.stock} sak/pcs</b>\n⏱️ Stok bertahan: <b>${stat.remainingDays} hari lagi</b>${warningText}\n\n`;
    });

    bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
  });

  bot.onText(/\/reason/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '🧠 <b>Memicu analisis Multi-Agent Llama 3.2 3B di VPS...</b> Harap tunggu.');
    
    const remoteScriptPath = '/home/ubuntu/comot-multiagent/app.py';
    const venvPythonPath = '/home/ubuntu/comot-multiagent/venv/bin/python3';

    if (fs.existsSync(remoteScriptPath) && fs.existsSync(venvPythonPath)) {
      exec(`${venvPythonPath} ${remoteScriptPath}`, (err, stdout, stderr) => {
        if (err) {
          return bot.sendMessage(chatId, `❌ Gagal memicu CrewAI: <code>${stderr}</code>`, { parse_mode: 'HTML' });
        }
        
        const jsonMatch = stdout.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            bot.sendMessage(chatId, `🏆 <b>Analisis Agen Selesai!</b>\n\n🚨 <b>Urgensi:</b> ${parsed.status_urgensi}\n💰 <b>Estimasi Kerugian:</b> Rp ${parseInt(parsed.estimasi_kerugian_rupiah).toLocaleString('id-ID')}\n🛒 <b>Rekomendasi:</b> ${parsed.rekomendasi_order_qhomemart}`, { parse_mode: 'HTML' });
          } catch (e) {
            bot.sendMessage(chatId, `📝 <b>Hasil Mentah CrewAI:</b>\n\n<pre>${stdout.substring(0, 3000)}</pre>`, { parse_mode: 'HTML' });
          }
        } else {
          bot.sendMessage(chatId, `📝 <b>Hasil Mentah CrewAI:</b>\n\n<pre>${stdout.substring(0, 3000)}</pre>`, { parse_mode: 'HTML' });
        }
      });
    } else {
      setTimeout(() => {
        bot.sendMessage(chatId, `🏆 <b>Analisis Agen Selesai (Simulasi)!</b>\n\n🚨 <b>Urgensi:</b> HIGH\n💰 <b>Estimasi Kerugian:</b> Rp 150.000.000\n🛒 <b>Rekomendasi:</b> Pesan semen instan darurat ke Qhomemart Yogyakarta malam ini.\n\n👉 Ketik <code>/buy Semen_Instan 50</code> untuk langsung mengeksekusi order B2B!`, { parse_mode: 'HTML' });
      }, 1500);
    }
  });

  bot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error.message);
  });
} else {
  console.log('⚠️ Warning: TELEGRAM_BOT_TOKEN environment variable not set. Telegram Bot is disabled.');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 COMOT App Server is running on http://0.0.0.0:${PORT}`);
});

