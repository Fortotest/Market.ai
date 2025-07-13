/*
  File: script.js
  Deskripsi: Logika dan fungsionalitas untuk dasbor interaktif.
*/

// Impor library yang dibutuhkan
import { marked } from "https://esm.sh/marked@^15.0.8";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

// --- KONFIGURASI & VARIABEL GLOBAL ---
const API_KEY = "AIzaSyDkAVtL00WxWCslXTONGyjpvLNUgySHg64"; // Ganti dengan API Key Anda

// --- FUNGSI-FUNGSI BANTUAN ---

/**
 * Memformat angka menjadi format mata uang Rupiah.
 * @param {string|number} rupiah_string - Angka yang akan diformat.
 * @param {boolean} withPrefix - Apakah akan menyertakan "Rp " atau tidak.
 * @returns {string} String dalam format Rupiah.
 */
function formatRupiah(rupiah_string, withPrefix = true) {
    let number_string = String(rupiah_string).replace(/[^\d]/g, '');
    if (number_string === "" || isNaN(parseInt(number_string))) return withPrefix ? "Rp 0" : "0";
    
    let sisa = number_string.length % 3;
    let rupiah = number_string.substr(0, sisa);
    let ribuan = number_string.substr(sisa).match(/\d{3}/g);

    if (ribuan) {
        let separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }
    
    return (withPrefix ? "Rp " : "") + rupiah;
}

/**
 * Mengubah format Rupiah kembali menjadi angka.
 * @param {string} rupiah_string - String Rupiah.
 * @returns {number} Angka dari string Rupiah.
 */
function unformatRupiah(rupiah_string) { 
    if (!rupiah_string || typeof rupiah_string !== "string") return 0; 
    return parseFloat(rupiah_string.replace(/\./g, "")); 
}

// --- INISIALISASI SAAT DOM SIAP ---

document.addEventListener("DOMContentLoaded", function () {
    // --- KONSTANTA ELEMEN DOM ---
    const navItems = document.querySelectorAll(".nav-item");
    const contentSections = document.querySelectorAll(".content-section");
    const labInputs = document.querySelectorAll('#lab input');
    const priceSlider = document.getElementById('price-position');
    const qualitySlider = document.getElementById('quality-position');
    const analyzeButton = document.getElementById("analyze-button");
    const outputDiv = document.getElementById("ai-analysis-output");
    
    // Konfigurasi warna untuk chart
    const chartColors = { accent: "#007AFF", accentLight: "rgba(0, 122, 255, 0.2)", text: "#333", grid: "rgba(0, 0, 0, 0.05)", green: "#34C759", orange: "#FF9500", purple: "#AF52DE", gray: "#8E8E93", red: "#FF3B30", yellow: "#FFCC00", tokopediaColor: "#42b549", shopeeColor: "#ee4d2d" };
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = chartColors.text;

    // --- LOGIKA NAVIGASI & SCROLL ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navItems.forEach(link => {
                    link.classList.toggle("active", link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { rootMargin: "-50% 0px -50% 0px" });

    contentSections.forEach(section => observer.observe(section));

    // --- INISIALISASI CHART ---
    if (document.getElementById("gmvChart")) { 
        new Chart(document.getElementById("gmvChart"), { 
            type: "line", 
            data: { 
                labels: ["Q4 2023", "Q2 2024", "Q4 2024", "Q2 2025 (Est.)"], 
                datasets: [{ 
                    label: "GMV (US$ Miliar)", 
                    data: [75, 82, 88, 95], 
                    borderColor: chartColors.accent, 
                    backgroundColor: chartColors.accentLight, 
                    fill: true, 
                    tension: 0.4 
                }] 
            }, 
            options: { 
                maintainAspectRatio: false, 
                responsive: true, 
                plugins: { legend: { display: false } }, 
                scales: { y: { border: { display: false } }, x: { border: { display: false } } } 
            } 
        }); 
    }
    
    if (document.getElementById("marketShareChart")) { 
        new Chart(document.getElementById("marketShareChart"), { 
            type: "doughnut", 
            data: { 
                labels: ["TikTok-Tokopedia", "Shopee", "Lazada", "Blibli", "Lainnya"], 
                datasets: [{ 
                    label: "Pangsa Pasar GMV", 
                    data: [41, 40, 9, 4, 6], 
                    backgroundColor: [chartColors.tokopediaColor, chartColors.shopeeColor, chartColors.orange, chartColors.purple, chartColors.gray], 
                    borderColor: "#f8f7f4", 
                    borderWidth: 4, 
                    hoverOffset: 8 
                }] 
            }, 
            options: { 
                maintainAspectRatio: false, 
                responsive: true, 
                plugins: { legend: { display: true, position: "bottom", labels: { padding: 15 } } } 
            } 
        }); 
    }

    // --- LOGIKA SIMULASI STRATEGI (SLIDER) ---
    const strategies = {
        volume: { title: "Arena Kecepatan & Harga", desc: "Fokus pada penjualan massal dengan harga kompetitif...", analysis: ["..."], platform: "TikTok, Shopee, Tokopedia" },
        value: { title: "Benteng Kualitas & Kepercayaan", desc: "Fokus membangun brand premium...", analysis: ["..."], platform: "Lazada (LazMall), Blibli, Website Sendiri" },
        challenger: { title: "Penantang Cerdas", desc: "Menawarkan kualitas premium dengan harga terjangkau...", analysis: ["..."], platform: "Tokopedia, Shopee Mall, TikTok" },
        trap: { title: "Jebakan Komoditas", desc: "Harga premium namun kualitas standar...", analysis: ["..."], platform: "Semua platform berisiko tinggi" }
    };

    function updateStrategySimulation() {
        if (!priceSlider || !qualitySlider) return;
        const price = priceSlider.value;
        const quality = qualitySlider.value;
        let strategyKey;
        if (price < 50 && quality < 50) strategyKey = 'volume';
        else if (price >= 50 && quality >= 50) strategyKey = 'value';
        else if (price < 50 && quality >= 50) strategyKey = 'challenger';
        else strategyKey = 'trap';
        
        const selectedStrategy = strategies[strategyKey];
        const outputContainer = document.getElementById('strategy-output');
        
        document.getElementById('positioning-title').textContent = selectedStrategy.title;
        document.getElementById('positioning-desc').textContent = selectedStrategy.desc;
        document.getElementById('positioning-analysis').innerHTML = selectedStrategy.analysis.map(item => `<li>${item}</li>`).join('');
        document.getElementById('positioning-platform').textContent = selectedStrategy.platform;
        
        outputContainer.className = 'mt-8 p-4 rounded-xl'; // Reset classes
        if(strategyKey === 'volume') outputContainer.classList.add('bg-blue-100');
        if(strategyKey === 'value') outputContainer.classList.add('bg-green-100');
        if(strategyKey === 'challenger') outputContainer.classList.add('bg-purple-100');
        if(strategyKey === 'trap') outputContainer.classList.add('bg-red-100');
    }

    if (priceSlider) priceSlider.addEventListener('input', updateStrategySimulation);
    if (qualitySlider) qualitySlider.addEventListener('input', updateStrategySimulation);
    
    // --- LOGIKA KALKULATOR & SIMULASI KEUANGAN ---
    function runFullSimulation() {
        // Mengambil nilai dari semua input
        const hargaJual = unformatRupiah(document.getElementById("hargaJual").value);
        const hpp = unformatRupiah(document.getElementById("hpp").value);
        const cac = unformatRupiah(document.getElementById("biayaIklan").value);
        const biayaLainPersen = parseFloat(document.getElementById("biayaPlatform").value) || 0;
        const biayaTetap = unformatRupiah(document.getElementById("fixedCosts").value);
        const penjualanBulan = parseFloat(document.getElementById("avgSales").value) || 0;
        const avgPurchaseValue = unformatRupiah(document.getElementById("avgPurchaseValue").value) || hargaJual;
        const purchaseFrequency = parseFloat(document.getElementById("purchaseFrequency").value) || 0;
        const customerLifespan = parseFloat(document.getElementById("customerLifespan").value) || 0;

        // Kalkulasi Metrik
        const biayaLainRp = hargaJual * (biayaLainPersen / 100);
        const profitPerUnit = hargaJual - hpp - cac - biayaLainRp;
        const netMargin = hargaJual > 0 ? (profitPerUnit / hargaJual) * 100 : 0;
        const bepUnits = profitPerUnit > 0 ? Math.ceil(biayaTetap / profitPerUnit) : 0;
        const ltv = avgPurchaseValue * purchaseFrequency * customerLifespan;
        const monthlyRevenue = hargaJual * penjualanBulan;
        const monthlyCOGS = hpp * penjualanBulan;
        const monthlyOpex = (cac * penjualanBulan) + biayaTetap + (monthlyRevenue * (biayaLainPersen / 100));
        const netProfit = monthlyRevenue - monthlyCOGS - monthlyOpex;
        const annualRevenue = monthlyRevenue * 12;
        const annualProfit = netProfit * 12;
        const totalAdSpend = cac * penjualanBulan;
        const roas = totalAdSpend > 0 ? monthlyRevenue / totalAdSpend : 0;
        const cashIn = monthlyRevenue;
        const cashOut = monthlyCOGS + monthlyOpex;
        const netCashFlow = cashIn - cashOut;

        // Update UI Kalkulator
        document.getElementById("profitPerUnit").textContent = formatRupiah(profitPerUnit);
        document.getElementById("profitPerUnit").style.color = profitPerUnit >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        document.getElementById("netMargin").textContent = `${netMargin.toFixed(1)}%`;
        document.getElementById("netMargin").style.color = netMargin >= 15 ? 'var(--success-color)' : 'var(--danger-color)';
        document.getElementById("bepResult").innerHTML = biayaTetap > 0 && profitPerUnit > 0 ? `Anda perlu menjual <span class="text-2xl accent-color">${bepUnits.toLocaleString("id-ID")}</span> unit/bulan untuk BEP.` : `<span class="text-sm text-gray-400">Hitung titik impas bisnismu.</span>`;
        document.getElementById("revenueResult").innerHTML = penjualanBulan > 0 && hargaJual > 0 ? `Proyeksi Pendapatan Tahunan: <br><span class="text-2xl accent-color">${formatRupiah(annualRevenue)}</span>` : `<span class="text-sm text-gray-400">Prediksikan potensi omzet tahunan.</span>`;
        document.getElementById("ltvResult").innerHTML = ltv > 0 ? `Estimasi LTV per Pelanggan: <br><span class="text-2xl accent-color">${formatRupiah(ltv)}</span>` : `<span class="text-sm text-gray-400">Ukur nilai jangka panjang pelanggan.</span>`;

        // Update UI Proyeksi & Rencana Aksi
        const hasInput = hargaJual > 0 || penjualanBulan > 0;
        document.getElementById('projection-output').classList.toggle('hidden', !hasInput);
        document.getElementById('projection-placeholder').classList.toggle('hidden', hasInput);
        document.getElementById('action-plan-output').classList.toggle('hidden', !hasInput);
        document.getElementById('action-plan-placeholder').classList.toggle('hidden', hasInput);

        if (hasInput) {
            // Update tabel keuangan
            document.getElementById('income-revenue').textContent = formatRupiah(monthlyRevenue);
            document.getElementById('income-cogs').textContent = `- ${formatRupiah(monthlyCOGS)}`;
            document.getElementById('income-gross-profit').textContent = formatRupiah(monthlyRevenue - monthlyCOGS);
            document.getElementById('income-opex').textContent = `- ${formatRupiah(monthlyOpex)}`;
            document.getElementById('income-net-profit').textContent = formatRupiah(netProfit);
            document.getElementById('cashflow-in').textContent = `+ ${formatRupiah(cashIn)}`;
            document.getElementById('cashflow-out').textContent = `- ${formatRupiah(cashOut)}`;
            document.getElementById('cashflow-net').textContent = formatRupiah(netCashFlow);
            
            // Update KPI utama
            document.getElementById("finalRevenue").textContent = formatRupiah(annualRevenue);
            document.getElementById("finalProfit").textContent = formatRupiah(annualProfit);
            document.getElementById("finalROAS").textContent = `${roas.toFixed(2)}x`;

            // Update vonis & rekomendasi
            const verdictEl = document.getElementById("strategicVerdict");
            if (netProfit > 0 && netCashFlow > 0) { verdictEl.innerHTML = `<strong class="text-green-600">Strategi Sehat.</strong>...`; } 
            else if (netProfit > 0 && netCashFlow < 0) { verdictEl.innerHTML = `<strong class="text-yellow-600">Profitabel, Tapi Hati-Hati.</strong>...`; } 
            else { verdictEl.innerHTML = `<strong class="text-red-600">Peringatan Kritis.</strong>...`; }
        }
    }

    // Event listener untuk input Rupiah
    document.querySelectorAll('input[inputmode="numeric"]').forEach(input => {
        input.addEventListener('keyup', function(e) {
            this.value = formatRupiah(this.value, false);
        });
    });

    labInputs.forEach(input => input.addEventListener('input', runFullSimulation));

    // --- LOGIKA VALIDATOR & SKOR ---
    const businessModelForm = document.getElementById("businessModelForm");
    if (businessModelForm) {
        businessModelForm.addEventListener("click", (e) => {
            if (e.target.tagName === 'BUTTON') {
                // Logika untuk tombol segmented control
            }
        });
    }

    const opportunityForm = document.getElementById("opportunityForm");
    if (opportunityForm) {
        function updateOpportunityScore() {
            // Logika untuk kalkulator skor peluang
        }
        opportunityForm.addEventListener("input", updateOpportunityScore);
        updateOpportunityScore();
    }

    // --- LOGIKA ANALISIS AI ---
    if (analyzeButton) {
        analyzeButton.addEventListener("click", async () => {
            if (!API_KEY || API_KEY === "GANTI_DENGAN_API_KEY_ANDA") {
                outputDiv.innerHTML = `<p class="text-red-500 font-bold">Error: API_KEY belum dikonfigurasi.</p>`;
                return;
            }

            // Mengambil data dari form
            const labData = { /* ... */ };
            const namaProduk = document.getElementById("ai-nama-produk").value;
            // ... (ambil data lainnya)

            if (!namaProduk /* ... */) {
                outputDiv.innerHTML = `<p class="text-orange-500 font-bold">Harap isi semua input strategis.</p>`;
                return;
            }

            outputDiv.innerHTML = `
                <div class="space-y-3">
                    <div class="ai-thinking-step">✅ Menerima data...</div>
                    <div class="ai-thinking-step">🧠 Menganalisis profitabilitas...</div>
                    <div class="ai-thinking-step">🎯 Menyusun rekomendasi...</div>
                </div>
            `;
            
            analyzeButton.disabled = true;
            analyzeButton.classList.add("opacity-50");

            const prompt = `
                Persona: Kamu adalah AI Business Analyst yang brutal, cerdas, dan to-the-point...
                
                DATA MENTAH:
                - Nama Produk: "${namaProduk}"
                ...

                TUGAS LO:
                ...
            `;

            try {
                const genAI = new GoogleGenerativeAI(API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                
                if (text) {
                    outputDiv.innerHTML = await marked.parse(text);
                } else {
                    outputDiv.innerHTML = `<p class="text-orange-500 font-bold">AI tidak memberikan respons.</p>`;
                }
            } catch (err) {
                console.error("AI Analysis Failed:", err);
                outputDiv.innerHTML = `<p class="text-red-500 font-bold">Gagal menghubungi AI. Periksa konsol dan API Key Anda.</p>`;
            } finally {
                analyzeButton.disabled = false;
                analyzeButton.classList.remove("opacity-50");
            }
        });
    }

    // --- INISIALISASI AWAL ---
    updateStrategySimulation();
    runFullSimulation();
});
