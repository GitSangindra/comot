document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const logsTbody = document.getElementById('logs-tbody');
  const btnRefresh = document.getElementById('btn-refresh');
  const btnTriggerAi = document.getElementById('btn-trigger-ai');
  const terminalOutput = document.getElementById('terminal-output');
  const hostIp = document.getElementById('host-ip');
  
  // Qhomemart Approval Elements
  const btnApproveOrder = document.getElementById('btn-approve-order');
  const orderModal = document.getElementById('order-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const receiptInvoiceId = document.getElementById('receipt-invoice-id');
  const receiptProject = document.getElementById('receipt-project');
  const receiptMaterial = document.getElementById('receipt-material');
  const receiptQuantity = document.getElementById('receipt-quantity');
  const receiptTotal = document.getElementById('receipt-total');
  const receiptStatus = document.getElementById('receipt-status');
  const receiptEta = document.getElementById('receipt-eta');
  
  // Stats Elements
  const cementQty = document.getElementById('cement-qty');
  const cementProgress = document.getElementById('cement-progress');
  const cementAlert = document.getElementById('cement-alert');
  const steelQty = document.getElementById('steel-qty');
  const steelProgress = document.getElementById('steel-progress');
  const steelAlert = document.getElementById('steel-alert');
  
  // Telegram Simulator Elements
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const tgStatusPill = document.getElementById('tg-status-pill');

  // B2B Buy Material Selector Elements
  const buyMaterialSelect = document.getElementById('buy-material-select');
  const buyQtyInput = document.getElementById('buy-qty-input');
  const buyUnitPrice = document.getElementById('buy-unit-price');
  const buyTotalPrice = document.getElementById('buy-total-price');
  const buyLeadTime = document.getElementById('buy-lead-time');
  const btnBuyMaterial = document.getElementById('btn-buy-material');

  // Shipment Order Tracker Elements
  const trackerTbody = document.getElementById('tracker-tbody');
  const blockingAlertBanner = document.getElementById('blocking-alert-banner');

  // COMOT Procurement Expert Advisor DOM Elements
  const expertAiIndicator = document.getElementById('expert-ai-indicator');
  const expertAiStatus = document.getElementById('expert-ai-status');
  const expertAdvisorContent = document.getElementById('expert-advisor-content');

  // API Config
  // Detect if we are running locally or on the VPS IP
  const currentHost = window.location.hostname;
  const API_BASE_URL = window.location.origin;

  hostIp.textContent = currentHost;

  // Material Config Data mapping standard prices and lead times
  const MATERIAL_PRICES = {
    'Semen_Instan': { price: 65000, leadTime: '1 Hari (Sleman Warehouse)' },
    'Besi_12mm': { price: 95000, leadTime: '2 Hari (Sleman Warehouse)' }
  };

  // Toggle AI Indicator breathing animations
  function setExpertThinking(isThinking) {
    if (isThinking) {
      expertAiIndicator.className = 'pulse-indicator thinking';
      expertAiStatus.textContent = 'AI Menganalisis...';
    } else {
      // Brief simulated delay for user to notice AI thinking state, then go idle
      setTimeout(() => {
        expertAiIndicator.className = 'pulse-indicator idle';
        expertAiStatus.textContent = 'AI Aktif';
      }, 500);
    }
  }

  // Reactive price preview updates
  function updatePricePreview() {
    const mat = buyMaterialSelect.value;
    const qty = parseInt(buyQtyInput.value, 10) || 0;
    const config = MATERIAL_PRICES[mat];
    
    buyUnitPrice.textContent = `Rp ${config.price.toLocaleString('id-ID')}`;
    buyTotalPrice.textContent = `Rp ${(config.price * qty).toLocaleString('id-ID')}`;
    buyLeadTime.textContent = config.leadTime;
  }

  buyMaterialSelect.addEventListener('change', updatePricePreview);
  buyQtyInput.addEventListener('input', updatePricePreview);

  // 1. Fetch Logs and Render Dashboard
  async function fetchLogs() {
    setExpertThinking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/logs`);
      const logs = await res.json();
      renderLogs(logs);
      updateInventoryStats(logs);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setExpertThinking(false);
    }
  }

  function renderLogs(logs) {
    if (logs.length === 0) {
      logsTbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Belum ada logs logistik lapangan.</td></tr>`;
      return;
    }

    // Sort by timestamp descending
    const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    logsTbody.innerHTML = sortedLogs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const statusBadge = log.status.toLowerCase() === 'masuk' ? 'in' : 'out';
      
      let sourceIcon = '🖥️';
      if (log.source.includes('Telegram')) sourceIcon = '💬';
      
      return `
        <tr>
          <td><span class="text-muted">${time}</span></td>
          <td><strong>${log.project}</strong></td>
          <td>${log.material}</td>
          <td><strong>${log.quantity}</strong> sak/pcs</td>
          <td><span class="badge ${statusBadge}">${log.status}</span></td>
          <td>
            <div class="source-badge">
              <span>${sourceIcon}</span>
              <span class="text-muted">${log.source}</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function updateInventoryStats(logs) {
    let cementStock = 0;
    let steelStock = 0;

    logs.forEach(log => {
      if (log.project === 'Rumah_5M') {
        const qty = log.quantity;
        const isIncoming = log.status.toLowerCase() === 'masuk';

        if (log.material === 'Semen_Instan') {
          cementStock += isIncoming ? qty : -qty;
        } else if (log.material === 'Besi_12mm') {
          steelStock += isIncoming ? qty : -qty;
        }
      }
    });

    // Render Cement Stock
    cementQty.textContent = `${cementStock} sak`;
    const cementPct = Math.min((cementStock / 100) * 100, 100);
    cementProgress.style.width = `${cementPct}%`;
    
    if (cementStock < 20) {
      cementProgress.className = 'progress-fill alert';
      cementAlert.style.display = 'block';
    } else {
      cementProgress.className = 'progress-fill success';
      cementAlert.style.display = 'none';
    }

    // Render Steel Stock
    steelQty.textContent = `${steelStock} pcs`;
    const steelPct = Math.min((steelStock / 200) * 100, 100);
    steelProgress.style.width = `${steelPct}%`;
    
    if (steelStock < 50) {
      steelProgress.className = 'progress-fill alert';
      steelAlert.innerHTML = '🚨 Stok menipis (&lt; 50 pcs)';
      steelAlert.className = 'stat-alert-text text-danger';
    } else {
      steelProgress.className = 'progress-fill success';
      steelAlert.innerHTML = '✅ Stok Cukup';
      steelAlert.className = 'stat-alert-text text-success';
    }
  }

  // 2. Fetch Active Shipping Orders & Dynamic Blocking Tracker
  async function fetchOrders() {
    setExpertThinking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`);
      const orders = await res.json();
      
      const invStatusRes = await fetch(`${API_BASE_URL}/api/inventory/status`);
      const invStatus = await invStatusRes.json();
      
      renderOrders(orders, invStatus);
      updateExpertAdvisor(orders, invStatus);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setExpertThinking(false);
    }
  }

  function renderOrders(orders, invStatus) {
    const activeOrders = orders.filter(o => o.status !== 'Tiba');
    
    // Sort descending by orderedAt
    const sortedOrders = [...orders].sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));

    if (sortedOrders.length === 0) {
      trackerTbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Belum ada pengiriman aktif.</td></tr>`;
      blockingAlertBanner.style.display = 'none';
      return;
    }

    trackerTbody.innerHTML = sortedOrders.map(o => {
      let statusBadge = 'processed';
      if (o.status === 'Dikirim') statusBadge = 'transit';
      if (o.status === 'Tiba') statusBadge = 'success';

      const etaTime = new Date(o.eta).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const etaDate = new Date(o.eta).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
      
      return `
        <tr>
          <td><code>${o.orderId}</code></td>
          <td><strong>${o.material}</strong></td>
          <td><strong>${o.quantity}</strong> sak/pcs</td>
          <td><span class="text-warning" style="font-weight: 600;">Rp ${o.totalPrice.toLocaleString('id-ID')}</span></td>
          <td>
            <div style="font-size: 0.85rem; line-height: 1.3;">
              <span>📦 ${o.consignment}</span><br>
              <span class="text-muted">👨‍✈️ ${o.courierName}</span>
            </div>
          </td>
          <td>
            <div style="font-size: 0.85rem; line-height: 1.3;">
              <span>🕒 ${etaTime} WIB</span><br>
              <span class="text-muted">📅 ${etaDate}</span>
            </div>
          </td>
          <td><span class="badge ${statusBadge}">${o.status}</span></td>
        </tr>
      `;
    }).join('');

    // Dynamic project blocking and delay calculation
    let hasBlocking = false;
    let blockingHtml = '';

    activeOrders.forEach(o => {
      const stat = invStatus[o.material];
      if (stat && stat.remainingDays < stat.leadTimeDays) {
        hasBlocking = true;
        blockingHtml += `
          <div class="blocking-alert-title">🚨 PERINGATAN KETERHAMBATAN PROYEK (Delay Risk)!</div>
          <div class="blocking-alert-desc" style="margin-top: 4px;">
            Pengiriman <b>${o.material}</b> (Resi: <code>${o.consignment}</code>) diperkirakan tiba besok, namun stok tersisa di site <b>Rumah_5M</b> hanya cukup bertahan selama <b>${stat.stock} sak/pcs (${stat.remainingDays} hari)</b>! Konsumsi harian site adalah <b>${stat.dailyConsumptionRate} sak/pcs</b>.<br>
            ⚠️ <b>Dampak: Pekerjaan cor lantai 2 terancam dihentikan (BLOCKING)!</b><br>
            ⏱️ <i>Rekomendasi Penjadwalan: Pemesanan harusnya dilakukan paling lambat pada pukul 09:00 pagi hari ini!</i>
          </div>
        `;
      }
    });

    if (hasBlocking) {
      blockingAlertBanner.innerHTML = blockingHtml;
      blockingAlertBanner.style.display = 'block';
    } else {
      blockingAlertBanner.style.display = 'none';
    }
  }

  // Procurement Expert Advisory Calculation
  function updateExpertAdvisor(orders, invStatus) {
    const activeOrders = orders.filter(o => o.status !== 'Tiba');
    let warningsHtml = '';
    let criticalCount = 0;

    Object.entries(invStatus).forEach(([mat, stat]) => {
      if (stat.isCritical) {
        criticalCount++;
        // Find if there is an active B2B order for this material
        const matchingOrder = activeOrders.find(o => o.material === mat);
        
        if (matchingOrder) {
          // If there is an active order in transit
          if (stat.remainingDays < stat.leadTimeDays) {
            // CRITICAL DELAY RISK (Stok Habis sebelum barang tiba)
            warningsHtml += `
              <div style="margin-bottom: 12px; border-bottom: 1px dashed rgba(240,70,70,0.15); padding-bottom: 12px; line-height: 1.5;">
                <span class="text-danger" style="font-weight: 700;">🚨 POTENSI BLOCKING KRITIS - ${mat.toUpperCase()}</span><br>
                <span>Stok <b>${mat}</b> kritis tersisa <b>${stat.stock} sak/pcs</b> (estimasi habis <b>${stat.remainingDays} hari</b>). Pengiriman aktif (Resi: <code>${matchingOrder.consignment}</code>) membutuhkan waktu <b>${stat.leadTimeDays} hari</b> untuk sampai.</span><br>
                <span style="color: var(--warning); font-weight: 600;">👉 Saran Tindakan:</span> Kurangi volume konsumsi lapangan sementara atau hubungi QHomemart Yogyakarta Cabang Sleman untuk mempercepat pengiriman kurir <b>${matchingOrder.courierName}</b>!
              </div>
            `;
          } else {
            // STOCK CRITICAL BUT SHIPMENT ON SCHEDULE
            warningsHtml += `
              <div style="margin-bottom: 12px; border-bottom: 1px dashed rgba(38,180,90,0.15); padding-bottom: 12px; line-height: 1.5;">
                <span class="text-warning" style="font-weight: 700;">⚠️ STOK MINIM - ${mat.toUpperCase()} (PENGIRIMAN AMAN)</span><br>
                <span>Stok <b>${mat}</b> minim tersisa <b>${stat.stock} sak/pcs</b>. Pengiriman aktif (Resi: <code>${matchingOrder.consignment}</code>) dijadwalkan tiba dalam <b>${stat.leadTimeDays} hari</b> sebelum stok habis.</span><br>
                <span class="text-success" style="font-weight: 600;">👉 Status:</span> Aman terkendali, tunggu kedatangan kurir pengiriman.
              </div>
            `;
          }
        } else {
          // NO ACTIVE ORDER (Stok Kritis dan belum dipesan)
          warningsHtml += `
              <div style="margin-bottom: 12px; border-bottom: 1px dashed rgba(240,70,70,0.15); padding-bottom: 12px; line-height: 1.5;">
                <span class="text-danger" style="font-weight: 700;">🚨 PERINGATAN TINDAKAN - ${mat.toUpperCase()} (BELUM DIPESAN)</span><br>
                <span>Stok <b>${mat}</b> kritis tersisa <b>${stat.stock} sak/pcs</b> dan belum ada pemesanan aktif! Stok akan habis dalam <b>${stat.remainingDays} hari</b>.</span><br>
                <span style="color: var(--warning); font-weight: 600;">👉 Saran Tindakan:</span> Segera klik panel <b>Pesan Material QHomemart</b> di kanan atau ketik <code>/buy ${mat} 50</code> di Telegram Bot untuk pemesanan darurat!
              </div>
            `;
        }
      }
    });

    if (criticalCount === 0) {
      // ALL SAFE
      expertAdvisorContent.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <span style="font-size: 1.5rem;">✨</span>
          <div style="line-height: 1.5;">
            <strong class="text-success" style="font-size: 1rem; display: block; margin-bottom: 4px;">Semua Material Konstruksi Aman!</strong>
            <span class="text-muted">Persediaan Semen Instan (${invStatus['Semen_Instan'] ? invStatus['Semen_Instan'].stock : 0} sak) dan Besi 12mm (${invStatus['Besi_12mm'] ? invStatus['Besi_12mm'].stock : 0} pcs) sangat mencukupi tingkat aman operasional. Tidak ada potensi blocking pekerjaan proyek <b>Rumah_5M</b> saat ini!</span>
          </div>
        </div>
      `;
      expertAdvisorContent.style.borderLeft = '4px solid var(--success)';
    } else {
      expertAdvisorContent.innerHTML = warningsHtml;
      expertAdvisorContent.style.borderLeft = '4px solid var(--danger)';
    }
  }

  // 3. Direct B2B order purchase backend trigger
  async function handleDirectBuy() {
    const material = buyMaterialSelect.value;
    const quantity = parseInt(buyQtyInput.value, 10);
    
    if (isNaN(quantity) || quantity <= 0) {
      alert('Kuantitas pemesanan tidak valid.');
      return;
    }

    btnBuyMaterial.disabled = true;
    btnBuyMaterial.textContent = '⏳ Menghubungi QHomemart API...';
    terminalOutput.textContent += `\n🔗 [Direct B2B] Membuka HTTPS Handshake dengan api.qhomemart.co.id...`;
    terminalOutput.scrollTop = terminalOutput.scrollHeight;

    try {
      const res = await fetch(`${API_BASE_URL}/api/order/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: 'Rumah_5M',
          material,
          quantity,
          source: 'Web Dashboard Direct'
        })
      });
      const data = await res.json();

      if (data.success) {
        terminalOutput.textContent += `\n🛒 [QHomemart API] ORDER PEMBELIAN LANGSUNG DISETUJUI!\n🧾 Invoice: ${data.orderId}\n🚚 Resi: ${data.consignment}\n👨‍✈️ Kurir: ${data.courierName}\n`;
        terminalOutput.scrollTop = terminalOutput.scrollHeight;

        // Trigger modal receipt display
        receiptInvoiceId.textContent = data.orderId;
        receiptProject.textContent = data.project;
        receiptMaterial.textContent = data.material;
        receiptQuantity.textContent = `${data.quantity} sak/pcs`;
        receiptTotal.textContent = data.total_price;
        receiptStatus.textContent = data.status;
        receiptEta.textContent = data.estimated_delivery;

        orderModal.style.display = 'flex';
        fetchLogs();
        fetchOrders();
      } else {
        terminalOutput.textContent += `\n❌ Gagal mengirimkan order ke QHomemart API.\n`;
      }
    } catch (err) {
      console.error('Error in Direct Buy API:', err);
      terminalOutput.textContent += `\n❌ API Error: ${err.message}\n`;
    } finally {
      btnBuyMaterial.disabled = false;
      btnBuyMaterial.textContent = '🛒 Beli via B2B API';
    }
  }

  btnBuyMaterial.addEventListener('click', handleDirectBuy);

  // 4. Trigger Multi-Agent AI Simulation
  async function triggerAiWorkflow() {
    btnTriggerAi.disabled = true;
    terminalOutput.textContent = '🤖 Mengirim request orkestrasi ke CrewAI di VPS...\n';
    
    // Simulate dynamic terminal stream loading
    const logs = [
      '🐳 [Docker/Ollama] Menarik model Llama 3.2 (3B)... OK.',
      '🤖 [CrewAI] Menginisialisasi 2 Agen Otonom (Manajer Proyek Logistik & Validator JSON)...',
      '💬 [Project Coordinator] Menerima Log Harian Proyek: "Stok semen instan hanya tersisa 10 sak."',
      '📊 [Project Coordinator] Memulai penalaran logika dan perhitungan risiko keuangan...',
      '🔍 [Project Coordinator] RUMUS OVERHEAD: 3% dari Nilai Proyek 5 Miliar = 150.000.000 Rupiah.',
      '🛒 [Procurement Specialist] Menerima delegasi tugas: "Cari stok semen darurat di Qhomemart."',
      '🚀 [CrewAI] Menjalankan proses validasi data output akhir...',
      '🔒 [Validator Data JSON] Memilah teks bebas dan mencetak JSON murni...'
    ];

    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < logs.length) {
        terminalOutput.textContent += `${logs[lineIndex]}\n`;
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        lineIndex++;
      } else {
        clearInterval(interval);
        executeRealBackendTrigger();
      }
    }, 400);
  }

  // State for AI-generated logistics recommendation
  let currentRecommendation = null;

  async function executeRealBackendTrigger() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/trigger`, { method: 'POST' });
      const data = await res.json();
      
      terminalOutput.textContent += `\n================ OUTPUT AKHIR DITERIMA ================\n`;
      terminalOutput.textContent += `Source: ${data.source}\n\n`;
      terminalOutput.textContent += `${data.rawOutput}\n`;
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
      
      if (data.success && data.structuredOutput) {
        currentRecommendation = data.structuredOutput;
        // Make the glowing green "Approve & Order" button visible
        btnApproveOrder.style.display = 'block';
        btnApproveOrder.scrollIntoView({ behavior: 'smooth' });
        
        terminalOutput.textContent += `\n💡 SISTEM MENUNGGU APPROVAL: Rekomendasi pembelian semen instan terdeteksi. Silakan klik tombol hijau "Setujui & Pesan di Qhomemart" di sebelah kiri untuk menyelesaikan pemesanan.\n`;
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
      }
      
      fetchLogs();
      fetchOrders();
    } catch (err) {
      terminalOutput.textContent += `\n❌ Error memicu CrewAI: ${err.message}\n`;
    } finally {
      btnTriggerAi.disabled = false;
    }
  }

  // Handle Qhomemart Order Approvals
  async function handleOrderApproval() {
    if (!currentRecommendation) return;
    
    btnApproveOrder.disabled = true;
    btnApproveOrder.textContent = '⏳ Mengirim Order Ke Qhomemart...';
    terminalOutput.textContent += `\n🛒 [System] Menghubungi API Qhomemart untuk pemesanan material...\n`;
    terminalOutput.scrollTop = terminalOutput.scrollHeight;

    try {
      // Send approval POST to Express server
      const res = await fetch(`${API_BASE_URL}/api/order/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: 'Rumah_5M',
          material: 'Semen_Instan',
          quantity: 50 // Order 50 bags to fix critical stock
        })
      });
      const data = await res.json();

      if (data.success) {
        terminalOutput.textContent += `\n🚀 [Qhomemart API] TRANSAKSI BERHASIL!\n🧾 ID Pesanan: ${data.orderId}\n🚚 Status: ${data.status}\n⏱️ Estimasi Tiba: ${data.estimated_delivery}\n💰 Total Biaya: ${data.total_price}\n`;
        terminalOutput.scrollTop = terminalOutput.scrollHeight;

        // Populate and display receipt modal
        receiptInvoiceId.textContent = data.orderId;
        receiptProject.textContent = data.project;
        receiptMaterial.textContent = data.material;
        receiptQuantity.textContent = `${data.quantity} sak/pcs`;
        receiptTotal.textContent = data.total_price;
        receiptStatus.textContent = data.status;
        receiptEta.textContent = data.estimated_delivery;

        orderModal.style.display = 'flex';
        btnApproveOrder.style.display = 'none'; // Hide button after order completes
        
        fetchLogs(); // Reload data
        fetchOrders();
      } else {
        terminalOutput.textContent += `\n❌ Qhomemart API error: Gagal menempatkan order.\n`;
      }
    } catch (err) {
      terminalOutput.textContent += `\n❌ Error Qhomemart API: ${err.message}\n`;
    } finally {
      btnApproveOrder.disabled = false;
      btnApproveOrder.textContent = '🛒 Setujui & Pesan di Qhomemart';
    }
  }

  // 5. Telegram Simulator Logic
  function addChatMessage(sender, text, isBot = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${isBot ? 'bot-msg' : 'user-msg'}`;
    msgDiv.innerHTML = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function handleTelegramSend() {
    const input = chatInput.value.trim();
    if (!input) return;

    chatInput.value = '';
    addChatMessage('You', input, false);

    // Parse commands locally in simulator to match real bot
    if (input === '/start') {
      setTimeout(() => {
        addChatMessage('Bot', `👋 <strong>Selamat datang di COMOT Logistics Agent Bot!</strong><br><br>Saya adalah asisten logistik proyek Anda. Tim lapangan dapat memasukkan data material secara instan dari lokasi.<br><br><strong>Perintah yang tersedia:</strong><br>📝 <code>/log [proyek] [material] [jumlah] [status]</code><br>🛒 <code>/buy [material] [jumlah]</code> - Pesan langsung B2B!<br>🚚 <code>/track</code> - Lacak pengiriman & risiko blocking<br>📊 <code>/status</code> - Cek stok material<br>🧠 <code>/reason</code> - Jalankan CrewAI`, true);
      }, 500);
    } else if (input.startsWith('/log ')) {
      const cleanInput = input.replace('/log ', '').trim();
      const parts = cleanInput.split(/\s+/);
      
      if (parts.length < 3) {
        setTimeout(() => {
          addChatMessage('Bot', '❌ Format salah. Gunakan:<br><code>/log [proyek] [material] [jumlah] [status]</code><br>Contoh: <code>/log Rumah_5M Semen_Instan 50 Masuk</code>', true);
        }, 500);
        return;
      }

      const project = parts[0];
      const material = parts[1];
      const quantity = parseInt(parts[2], 10);

      if (isNaN(quantity)) {
        setTimeout(() => {
          addChatMessage('Bot', '❌ Jumlah harus berupa angka.', true);
        }, 500);
        return;
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
      
      // Fallback
      if (!foundStatus && parts[3]) {
        status = parts[3].toLowerCase() === 'keluar' ? 'Keluar' : 'Masuk';
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project, material, quantity, status, source: 'Telegram Bot' })
        });
        const log = await res.json();
        
        setTimeout(() => {
          addChatMessage('Bot', `✅ <strong>Logistik Berhasil Dicatat!</strong><br><br>🏗️ <strong>Proyek:</strong> ${project}<br>📦 <strong>Material:</strong> ${material}<br>🔢 <strong>Jumlah:</strong> ${quantity} sak/pcs<br>🔄 <strong>Status:</strong> ${status}<br><br>Data telah disinkronkan ke Dashboard COMOT!`, true);
          fetchLogs(); // Reload table
          fetchOrders();
        }, 800);
      } catch (err) {
        addChatMessage('Bot', `❌ Error menyimpan log: ${err.message}`, true);
      }
    } else if (input.startsWith('/buy ')) {
      const match = input.match(/\/buy\s+(\S+)\s+(\d+)/);
      if (!match) {
        setTimeout(() => {
          addChatMessage('Bot', '❌ Format salah. Gunakan:<br><code>/buy [material] [jumlah]</code><br>Contoh: <code>/buy Semen_Instan 50</code>', true);
        }, 500);
        return;
      }

      const material = match[1];
      const qty = parseInt(match[2], 10);

      try {
        const res = await fetch(`${API_BASE_URL}/api/order/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: 'Rumah_5M', material, quantity: qty, source: 'Telegram Bot /buy' })
        });
        const order = await res.json();
        
        setTimeout(() => {
          addChatMessage('Bot', `🛒 <strong>PEMESANAN INSTAN BERHASIL (Bot Simulator)!</strong><br><br>🧾 <strong>Invoice ID:</strong> <code>${order.orderId}</code><br>📦 <strong>Item:</strong> ${order.material} (${order.quantity} sak/pcs)<br>💰 <strong>Total Bayar:</strong> Rp ${order.totalPrice.toLocaleString('id-ID')}<br>🚚 <strong>Status:</strong> ${order.status}<br>⏱️ <strong>ETA:</strong> ${order.estimated_delivery}`, true);
          fetchLogs();
          fetchOrders();
        }, 800);
      } catch (err) {
        addChatMessage('Bot', `❌ Error memproses order: ${err.message}`, true);
      }
    } else if (input === '/track') {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders`);
        const orders = await res.json();
        const activeOrders = orders.filter(o => o.status !== 'Tiba');

        if (activeOrders.length === 0) {
          setTimeout(() => {
            addChatMessage('Bot', '🚚 <strong>Pelacakan Pengiriman:</strong><br><br>Tidak ada pengiriman aktif saat ini. Semua barang telah tiba di site.', true);
          }, 500);
          return;
        }

        const invRes = await fetch(`${API_BASE_URL}/api/inventory/status`);
        const invStatus = await invRes.json();
        
        let response = `🚚 <strong>Pelacakan Pengiriman QHomemart:</strong><br><br>`;
        activeOrders.forEach(o => {
          const stat = invStatus[o.material];
          let risk = `✅ ON SCHEDULE (Stok aman)`;
          if (stat && stat.remainingDays < stat.leadTimeDays) {
            risk = `🚨 <strong>BLOCKING RISK!</strong> Stok bertahan ${stat.remainingDays} hari sedangkan pengiriman tiba dalam ${stat.leadTimeDays} hari!`;
          }
          response += `🧾 <strong>Resi:</strong> <code>${o.consignment}</code><br>📦 Item: ${o.material} (${o.quantity} sak/pcs)<br>📈 Status: <strong>${o.status.toUpperCase()}</strong><br>⏱️ ETA: ${new Date(o.eta).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB<br>⚠️ Dampak: ${risk}<br><br>`;
        });

        setTimeout(() => {
          addChatMessage('Bot', response, true);
        }, 600);
      } catch (err) {
        addChatMessage('Bot', `❌ Error tracking: ${err.message}`, true);
      }
    } else if (input === '/status') {
      try {
        const invRes = await fetch(`${API_BASE_URL}/api/inventory/status`);
        const inventory = await invRes.json();
        
        let response = `📊 <strong>Status Logistik COMOT saat ini:</strong><br><br>`;
        Object.entries(inventory).forEach(([mat, stat]) => {
          const icon = mat === 'Semen_Instan' ? '🧱' : '⛓️';
          const alertPill = stat.isCritical ? ' 🚨 <strong>STOK TIPIS!</strong>' : ' ✅ <i>Aman</i>';
          response += `${icon} <strong>${mat}</strong>: <strong>${stat.stock} sak/pcs</strong><br>⏱️ Stok bertahan: <b>${stat.remainingDays} hari lagi</b>${alertPill}<br><br>`;
        });

        setTimeout(() => {
          addChatMessage('Bot', response, true);
        }, 600);
      } catch (err) {
        addChatMessage('Bot', `❌ Error mengambil status: ${err.message}`, true);
      }
    } else if (input === '/reason') {
      setTimeout(() => {
        addChatMessage('Bot', '🧠 <strong>Memicu analisis Multi-Agent Llama 3.2 3B di VPS...</strong> Harap tunggu.', true);
        triggerAiWorkflowFromBot();
      }, 500);
    } else {
      setTimeout(() => {
        addChatMessage('Bot', '❓ Perintah tidak dikenal. Ketik <code>/start</code> untuk melihat daftar perintah.', true);
      }, 500);
    }
  }

  async function triggerAiWorkflowFromBot() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/trigger`, { method: 'POST' });
      const data = await res.json();
      const parsed = data.structuredOutput;

      setTimeout(() => {
        addChatMessage('Bot', `🏆 <strong>Analisis Agen Selesai!</strong><br><br>🚨 <strong>Urgensi:</strong> ${parsed.status_urgensi}<br>💰 <strong>Estimasi Kerugian:</strong> Rp ${parseInt(parsed.estimasi_kerugian_rupiah).toLocaleString('id-ID')}<br>🛒 <strong>Rekomendasi:</strong> ${parsed.rekomendasi_order_qhomemart}<br><br>👉 Ketik <code>/buy Semen_Instan 50</code> untuk langsung memesan!`, true);
        fetchLogs();
        fetchOrders();
      }, 1000);
    } catch (err) {
      addChatMessage('Bot', `❌ Gagal memicu CrewAI: ${err.message}`, true);
    }
  }

  // Bind Events
  btnRefresh.addEventListener('click', () => {
    fetchLogs();
    fetchOrders();
  });
  btnTriggerAi.addEventListener('click', triggerAiWorkflow);
  btnApproveOrder.addEventListener('click', handleOrderApproval);
  
  btnCloseModal.addEventListener('click', () => {
    orderModal.style.display = 'none';
  });
  
  chatSend.addEventListener('click', handleTelegramSend);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleTelegramSend();
  });

  // Initial dashboard load
  fetchLogs();
  fetchOrders();
  updatePricePreview();
  
  // Set polling interval for real-time updates every 3 seconds
  setInterval(() => {
    fetchLogs();
    fetchOrders();
  }, 3000);
});
