import { marked } from "https://esm.sh/marked@^15.0.8";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const API_KEY = "AIzaSyDkAVtL00WxWCslXTONGyjpvLNUgySHg64";

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

function unformatRupiah(rupiah_string) { 
    if (!rupiah_string || typeof rupiah_string !== "string") return 0; 
    return parseFloat(rupiah_string.replace(/\./g, "")); 
}

document.addEventListener("DOMContentLoaded", function () {
    const chartColors = { accent: "#007AFF", accentLight: "rgba(0, 122, 255, 0.2)", text: "#333", grid: "rgba(0, 0, 0, 0.05)", green: "#34C759", orange: "#FF9500", purple: "#AF52DE", gray: "#8E8E93", red: "#FF3B30", yellow: "#FFCC00", tokopediaColor: "#42b549", shopeeColor: "#ee4d2d" };
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = chartColors.text;

    const navItems = document.querySelectorAll(".nav-item");
    const contentSections = document.querySelectorAll(".content-section");
    const labInputs = document.querySelectorAll('#lab input');

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
    
    if (document.getElementById("gmvChart")) { new Chart(document.getElementById("gmvChart"), { type: "line", data: { labels: ["Q4 2023", "Q2 2024", "Q4 2024", "Q2 2025 (Est.)"], datasets: [{ label: "GMV (US$ Miliar)", data: [75, 82, 88, 95], borderColor: chartColors.accent, backgroundColor: chartColors.accentLight, fill: true, tension: 0.4 }] }, options: { maintainAspectRatio: false, responsive: true, plugins: { legend: { display: false } }, scales: { y: { border: { display: false } }, x: { border: { display: false } } } } }); }
    if (document.getElementById("marketShareChart")) { new Chart(document.getElementById("marketShareChart"), { type: "doughnut", data: { labels: ["TikTok-Tokopedia", "Shopee", "Lazada", "Blibli", "Lainnya"], datasets: [{ label: "Pangsa Pasar GMV", data: [41, 40, 9, 4, 6], backgroundColor: [chartColors.tokopediaColor, chartColors.shopeeColor, chartColors.orange, chartColors.purple, chartColors.gray], borderColor: "#f8f7f4", borderWidth: 4, hoverOffset: 8 }] }, options: { maintainAspectRatio: false, responsive: true, plugins: { legend: { display: true, position: "bottom", labels: { padding: 15 } } } } }); }
    
    const priceSlider = document.getElementById('price-position');
    const qualitySlider = document.getElementById('quality-position');
    const outputContainer = document.getElementById('strategy-output');
    const titleEl = document.getElementById('positioning-title');
    const descEl = document.getElementById('positioning-desc');
    const analysisEl = document.getElementById('positioning-analysis');
    const platformEl = document.getElementById('positioning-platform');

    const strategies = {
        volume: { title: "Arena Kecepatan & Harga", desc: "Fokus pada penjualan massal dengan harga kompetitif. Membutuhkan efisiensi operasional dan penguasaan tren cepat.", analysis: ["<b>Kekuatan:</b> Jangkauan pasar luas, potensi penjualan tinggi.", "<b>Kelemahan:</b> Margin tipis, rentan perang harga.", "<b>Fokus AISAS:</b> Attention (lewat promo) & Action (lewat harga murah)."], platform: "TikTok, Shopee, Tokopedia" },
        value: { title: "Benteng Kualitas & Kepercayaan", desc: "Fokus membangun brand premium dengan kualitas dan layanan superior. Menargetkan pelanggan loyal.", analysis: ["<b>Kekuatan:</b> Margin tebal, loyalitas pelanggan tinggi.", "<b>Kelemahan:</b> Pasar lebih kecil, butuh investasi branding besar.", "<b>Fokus AISAS:</b> Interest (lewat kualitas) & Share (lewat kepuasan)."], platform: "Lazada (LazMall), Blibli, Website Sendiri" },
        challenger: { title: "Penantang Cerdas", desc: "Menawarkan kualitas premium dengan harga yang lebih terjangkau. 'Affordable luxury'.", analysis: ["<b>Kekuatan:</b> Proposisi nilai sangat kuat.", "<b>Kelemahan:</b> Perlu edukasi pasar, bisa terjepit di tengah.", "<b>Fokus AISAS:</b> Search (perbandingan) & Share (word-of-mouth)."], platform: "Tokopedia, Shopee Mall, TikTok" },
        trap: { title: "Jebakan Komoditas", desc: "Harga premium namun kualitas dirasa standar. Berisiko tinggi ditinggalkan pelanggan.", analysis: ["<b>Kekuatan:</b> Potensi profit awal jika marketing berhasil.", "<b>Kelemahan:</b> Tidak berkelanjutan, churn rate tinggi.", "<b>Fokus AISAS:</b> Sangat bergantung pada Attention, tapi lemah di Action & Share."], platform: "Semua platform berisiko tinggi" }
    };

    function updateStrategySimulation() {
        const price = priceSlider.value;
        const quality = qualitySlider.value;
        let strategyKey;
        if (price < 50 && quality < 50) strategyKey = 'volume';
        else if (price >= 50 && quality >= 50) strategyKey = 'value';
        else if (price < 50 && quality >= 50) strategyKey = 'challenger';
        else strategyKey = 'trap';
        const selectedStrategy = strategies[strategyKey];
        titleEl.textContent = selectedStrategy.title;
        descEl.textContent = selectedStrategy.desc;
        analysisEl.innerHTML = selectedStrategy.analysis.map(item => `<li>${item}</li>`).join('');
        platformEl.textContent = selectedStrategy.platform;
        outputContainer.classList.remove('bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-red-100');
        if(strategyKey === 'volume') outputContainer.classList.add('bg-blue-100');
        if(strategyKey === 'value') outputContainer.classList.add('bg-green-100');
        if(strategyKey === 'challenger') outputContainer.classList.add('bg-purple-100');
        if(strategyKey === 'trap') outputContainer.classList.add('bg-red-100');
    }

    priceSlider.addEventListener('input', updateStrategySimulation);
    qualitySlider.addEventListener('input', updateStrategySimulation);
    updateStrategySimulation();

    function runFullSimulation() {
        const hargaJual = unformatRupiah(document.getElementById("hargaJual").value);
        const hpp = unformatRupiah(document.getElementById("hpp").value);
        const cac = unformatRupiah(document.getElementById("biayaIklan").value);
        const biayaLainPersen = parseFloat(document.getElementById("biayaPlatform").value) || 0;
        const biayaTetap = unformatRupiah(document.getElementById("fixedCosts").value);
        const penjualanBulan = parseFloat(document.getElementById("avgSales").value) || 0;
        const avgPurchaseValue = unformatRupiah(document.getElementById("avgPurchaseValue").value) || hargaJual;
        const purchaseFrequency = parseFloat(document.getElementById("purchaseFrequency").value) || 0;
        const customerLifespan = parseFloat(document.getElementById("customerLifespan").value) || 0;

        const biayaLainRp = hargaJual * (biayaLainPersen / 100);
        const profitPerUnit = hargaJual - hpp - cac - biayaLainRp;
        const netMargin = hargaJual > 0 ? (profitPerUnit / hargaJual) * 100 : 0;
        const bepUnits = profitPerUnit > 0 ? Math.ceil(biayaTetap / profitPerUnit) : 0;
        const annualRevenue = (hargaJual * penjualanBulan) * 12;
        const ltv = avgPurchaseValue * purchaseFrequency * customerLifespan;
        const monthlyRevenue = hargaJual * penjualanBulan;
        const monthlyCOGS = hpp * penjualanBulan;
        const monthlyOpex = (cac * penjualanBulan) + biayaTetap + (monthlyRevenue * (biayaLainPersen / 100));
        const netProfit = monthlyRevenue - monthlyCOGS - monthlyOpex;
        const annualProfit = netProfit * 12;
        const totalAdSpend = cac * penjualanBulan;
        const roas = totalAdSpend > 0 ? monthlyRevenue / totalAdSpend : 0;
        const cashIn = monthlyRevenue;
        const cashOut = monthlyCOGS + monthlyOpex;
        const netCashFlow = cashIn - cashOut;

        const hasProfitabilityInput = hargaJual > 0 || hpp > 0 || cac > 0;
        if (hasProfitabilityInput) {
            document.getElementById("profitPerUnit").textContent = formatRupiah(profitPerUnit);
            document.getElementById("profitPerUnit").style.color = profitPerUnit >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
            document.getElementById("netMargin").textContent = `${netMargin.toFixed(1)}%`;
            document.getElementById("netMargin").style.color = netMargin >= 15 ? 'var(--success-color)' : 'var(--danger-color)';
        } else {
            document.getElementById("profitPerUnit").innerHTML = `<span class="text-sm text-gray-400">Isi data untuk melihat profit.</span>`;
        }

        if (biayaTetap > 0 && profitPerUnit > 0) {
            document.getElementById("bepResult").innerHTML = `Anda perlu menjual <span class="text-2xl accent-color">${bepUnits.toLocaleString("id-ID")}</span> unit/bulan untuk BEP.`;
        } else {
            document.getElementById("bepResult").innerHTML = `<span class="text-sm text-gray-400">Hitung titik impas bisnismu.</span>`;
        }

        if (penjualanBulan > 0 && hargaJual > 0) {
            document.getElementById("revenueResult").innerHTML = `Proyeksi Pendapatan Tahunan: <br><span class="text-2xl accent-color">${formatRupiah(annualRevenue)}</span>`;
        } else {
            document.getElementById("revenueResult").innerHTML = `<span class="text-sm text-gray-400">Prediksikan potensi omzet tahunan.</span>`;
        }

        if (avgPurchaseValue > 0 && purchaseFrequency > 0 && customerLifespan > 0) {
             document.getElementById("ltvResult").innerHTML = `Estimasi LTV per Pelanggan: <br><span class="text-2xl accent-color">${formatRupiah(ltv)}</span>`;
        } else {
            document.getElementById("ltvResult").innerHTML = `<span class="text-sm text-gray-400">Ukur nilai jangka panjang pelanggan.</span>`;
        }

        const hasInput = hargaJual > 0 || penjualanBulan > 0;
        document.getElementById('projection-output').classList.toggle('hidden', !hasInput);
        document.getElementById('projection-placeholder').classList.toggle('hidden', hasInput);
        document.getElementById('action-plan-output').classList.toggle('hidden', !hasInput);
        document.getElementById('action-plan-placeholder').classList.toggle('hidden', hasInput);

        if (hasInput) {
            document.getElementById('income-revenue').textContent = formatRupiah(monthlyRevenue);
            document.getElementById('income-cogs').textContent = `- ${formatRupiah(monthlyCOGS)}`;
            document.getElementById('income-gross-profit').textContent = formatRupiah(monthlyRevenue - monthlyCOGS);
            document.getElementById('income-opex').textContent = `- ${formatRupiah(monthlyOpex)}`;
            document.getElementById('income-net-profit').textContent = formatRupiah(netProfit);
            document.getElementById('income-net-profit').style.color = netProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
            document.getElementById('cashflow-in').textContent = `+ ${formatRupiah(cashIn)}`;
            document.getElementById('cashflow-out').textContent = `- ${formatRupiah(cashOut)}`;
            document.getElementById('cashflow-net').textContent = formatRupiah(netCashFlow);
            document.getElementById('cashflow-net').style.color = netCashFlow >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
            document.getElementById("finalRevenue").textContent = formatRupiah(annualRevenue);
            document.getElementById("finalProfit").textContent = formatRupiah(annualProfit);
            document.getElementById("finalProfit").style.color = annualProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
            document.getElementById("finalROAS").textContent = `${roas.toFixed(2)}x`;
            const verdictEl = document.getElementById("strategicVerdict");
            if (netProfit > 0 && netCashFlow > 0) { verdictEl.innerHTML = `<strong class="text-green-600">Strategi Sehat.</strong> Bisnis profitabel dengan arus kas positif. Fokus pada skala dan optimasi.`; } 
            else if (netProfit > 0 && netCashFlow < 0) { verdictEl.innerHTML = `<strong class="text-yellow-600">Profitabel, Tapi Hati-Hati.</strong> Bisnis mencetak laba, namun arus kas negatif. Perhatikan modal kerja dan siklus pembayaran.`; } 
            else { verdictEl.innerHTML = `<strong class="text-red-600">Peringatan Kritis.</strong> Arus kas dan profit negatif. Ini adalah resep bakar uang. Bongkar total struktur harga dan biaya Anda.`; }
        
            const { platformTitle, platformDesc } = getPlatformRecommendation(netMargin, roas);
            document.getElementById('action-platform-title').textContent = platformTitle;
            document.getElementById('action-platform-desc').textContent = platformDesc;

            const { contentTitle, contentDesc } = getContentRecommendation(netMargin, roas);
            document.getElementById('action-content-title').textContent = contentTitle;
            document.getElementById('action-content-desc').textContent = contentDesc;

            const { monetizationTitle, monetizationDesc } = getMonetizationRecommendation(netMargin, ltv, cac);
            document.getElementById('action-monetization-title').textContent = monetizationTitle;
            document.getElementById('action-monetization-desc').textContent = monetizationDesc;
        }
    }

    function getPlatformRecommendation(margin, roas) {
        if (margin > 25 && roas > 3) {
            return {
                platformTitle: "1. Perluas ke Arena Premium",
                platformDesc: "Margin dan ROAS Anda sehat. Saatnya membangun 'Benteng Kualitas' di platform seperti Lazada (LazMall) atau Blibli untuk menangkap audiens dengan AOV lebih tinggi dan memperkuat brand."
            };
        }
        return {
            platformTitle: "1. Dominasi Medan Perang Volume",
            platformDesc: "Fokus utama adalah memaksimalkan jangkauan di 'Arena Kecepatan & Harga'. Kuasai TikTok dan Shopee dengan menjadi yang paling relevan dan responsif terhadap tren."
        };
    }

    function getContentRecommendation(margin, roas) {
        if (margin > 25) {
            return {
                contentTitle: "2. Bangun Narasi, Bukan Sekadar Jualan",
                contentDesc: "Kuasai video commerce dengan konten yang mendalam. Buat video edukatif, tunjukkan proses di balik layar, dan jadikan testimoni pelanggan sebagai pilar utama untuk membangun kepercayaan."
            };
        }
        return {
            contentTitle: "2. Jadilah Raja Konten Cepat",
            contentDesc: "Alokasikan sumber daya untuk live streaming harian di jam prime-time (18:00-21:00) dan produksi video pendek yang mengikuti tren secara agresif. Kecepatan adalah kunci konversi."
        };
    }

    function getMonetizationRecommendation(margin, ltv, cac) {
        if (margin < 15) {
            return {
                monetizationTitle: "3. Perang Jangka Panjang, Bukan Adu Murah",
                monetizationDesc: "Margin Anda tipis, hindari perang harga langsung. Fokus pada bundling cerdas untuk menaikkan AOV dan gunakan opsi BNPL untuk meringankan beban pembeli tanpa memotong profit Anda."
            };
        }
        return {
            monetizationTitle: "3. Justifikasi Harga Premium Anda",
            monetizationDesc: "Margin sehat adalah aset. Perkuat ini dengan menawarkan garansi kepuasan, layanan purna jual yang superior, dan program loyalitas eksklusif untuk membuat pelanggan merasa harga yang mereka bayar sepadan."
        };
    }

    const rupiahInputs = document.querySelectorAll('input[inputmode="numeric"]');
    rupiahInputs.forEach(input => {
        input.addEventListener('keyup', function(e) {
            const value = this.value.replace(/[^\d]/g, '');
            this.value = formatRupiah(value, false);
        });
    });

    labInputs.forEach(input => input.addEventListener('input', runFullSimulation));
    
    const businessModelForm = document.getElementById("businessModelForm");
    if (businessModelForm) {
        businessModelForm.addEventListener("click", (e) => {
            if (e.target.tagName === 'BUTTON') {
                const group = e.target.parentElement.dataset.group;
                e.target.parentElement.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                const margin = businessModelForm.querySelector('[data-group="margin"] .active')?.dataset.value;
                const branding = businessModelForm.querySelector('[data-group="branding"] .active')?.dataset.value;
                const resultEl = document.getElementById("businessModelResult");
                
                if (margin && branding) {
                    if (margin === "high" && branding === "strong") {
                        resultEl.innerHTML = `<span class="text-green-600">Rekomendasi: Jalur B (Nilai).</span> Fokus pada Lazada/Blibli.`;
                    } else if (margin === "low" && branding === "new") {
                        resultEl.innerHTML = `<span class="accent-color">Rekomendasi: Jalur A (Volume).</span> Fokus pada TikTok-Tokopedia/Shopee.`;
                    } else {
                        resultEl.innerHTML = `<span class="text-orange-500">Hybrid.</span> Perlu strategi cerdas di kedua jalur.`;
                    }
                }
            }
        });
    }

    const opportunityForm = document.getElementById("opportunityForm");
    if (opportunityForm) {
        const brandingScoreEl = document.getElementById("brandingScore");
        const agilityScoreEl = document.getElementById("agilityScore");
        const marketingScoreEl = document.getElementById("marketingScore");
        const opportunityResultEl = document.getElementById("opportunityResult");

        function updateOpportunityScore() {
            const branding = parseInt(brandingScoreEl.value);
            const agility = parseInt(agilityScoreEl.value);
            const marketing = parseInt(marketingScoreEl.value);
            const score = Math.round(((branding + agility + marketing) / 30) * 100);
            opportunityResultEl.textContent = `${score}/100`;
        }
        opportunityForm.addEventListener("input", updateOpportunityScore);
        updateOpportunityScore();
    }

    const analyzeButton = document.getElementById("analyze-button");
    const outputDiv = document.getElementById("ai-analysis-output");
    
    if (analyzeButton) {
        analyzeButton.addEventListener("click", async () => {
            if (!API_KEY) {
                outputDiv.innerHTML = `<p class="text-red-500 font-bold">Error: API_KEY tidak dikonfigurasi.</p>`;
                return;
            }

            const labData = {
                hargaJual: unformatRupiah(document.getElementById("hargaJual").value),
                hpp: unformatRupiah(document.getElementById("hpp").value),
                cac: unformatRupiah(document.getElementById("biayaIklan").value),
                penjualanBulan: parseFloat(document.getElementById("avgSales").value) || 0,
            };

            const namaProduk = document.getElementById("ai-nama-produk").value;
            const segmentasi = document.getElementById("ai-segmentasi").value;
            const modal = unformatRupiah(document.getElementById("ai-modal").value);
            const strategi = document.getElementById("ai-strategi").value;
            
            if (!namaProduk || !strategi || !segmentasi) {
                outputDiv.innerHTML = `<p class="text-orange-500 font-bold">Harap isi semua input strategis (Nama, Segmentasi, Strategi).</p>`;
                return;
            }

            outputDiv.innerHTML = `
                <div class="space-y-3">
                    <div class="ai-thinking-step" style="animation-delay: 0s;">✅ Oke, gue terima datanya. Mulai bongkar...</div>
                    <div class="ai-thinking-step" style="animation-delay: 0.5s;">🧠 Menganalisis profitabilitas & kelayakan modal...</div>
                    <div class="ai-thinking-step" style="animation-delay: 1.5s;">📊 Mengklasifikasikan strategi marketing lo...</div>
                    <div class="ai-thinking-step" style="animation-delay: 2.5s;">🎯 Menyusun perintah perang & rekomendasi taktis...</div>
                </div>
            `;
            
            analyzeButton.disabled = true;
            analyzeButton.classList.add("opacity-50", "cursor-not-allowed");

            const prompt = `
                Persona: Kamu adalah AI Business Analyst yang brutal, cerdas, dan to-the-point. Gunakan bahasa "lo-gue" yang tajam. Jangan basa-basi.

                DATA MENTAH:
                - Nama Produk: "${namaProduk}"
                - Segmentasi Target: "${segmentasi}"
                - Modal Marketing: Rp ${formatRupiah(modal, false)}
                - Harga Jual: Rp ${formatRupiah(labData.hargaJual, false)}
                - HPP: Rp ${formatRupiah(labData.hpp, false)}
                - Penjualan/Bulan: ${labData.penjualanBulan} unit
                - Klaim Strategi Marketing: "${strategi}"

                TUGAS LO:
                Bantai data ini. Beri gue analisis tajam dan perintah eksekusi dalam format Markdown.

                ### 1. Bongkar Profitabilitas & Kelayakan Modal
                - Hitung **Margin Kontribusi** per unit.
                - Analisis: Dengan modal marketing segitu, strategi yang lo sebutin itu masuk akal atau cuma mimpi? Berapa lama modal itu bakal habis kalau CAC (biaya iklan per unit) nya adalah Rp ${formatRupiah(labData.cac, false)}?

                ### 2. Kuliti Strategi Marketing & Funnel
                - Klasifikasikan strategi yang diklaim ke **TOFU, MOFU, BOFU**.
                - Beri vonis: Funnel-nya seimbang atau pincang? Di mana lubang terbesarnya?

                ### 3. Perintah Perang (Rekomendasi Taktis)
                - **Prioritas #1 (URGENT):** Apa satu hal yang harus segera diperbaiki biar gak rugi?
                - **Prioritas #2 (JANGKA PENDEK):** Apa langkah paling logis untuk naikin PROFIT, bukan cuma omset?
                - **Vonis Akhir:** Produk ini main di **Red Ocean** (perang harga) atau **Blue Ocean** (niche)?

                Tutup dengan pertanyaan tajam yang bikin foundernya mikir.
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
                outputDiv.innerHTML = `<p class="text-red-500 font-bold">Gagal menghubungi AI. Periksa konsol dan API Key Anda.</p><p class="text-xs text-gray-500">${err.message}</p>`;
            } finally {
                analyzeButton.disabled = false;
                analyzeButton.classList.remove("opacity-50", "cursor-not-allowed");
            }
        });
    }
    runFullSimulation();
});
