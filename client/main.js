const API_BASE = '/api';

// Nexus Color Palette for Dark Glassmorphism 
const CHART_COLORS = [
    '#00f3ff', '#bd00ff', '#ff007a', '#00e676', '#facc15', 
    '#ff3b3b', '#a855f7', '#0ea5e9', '#10b981', '#f43f5e',
    '#fbbf24', '#2dd4bf', '#8b5cf6', '#ec4899', '#3b82f6'
];

// State Layers
let years = [];
let categories = [];
let squads = [];
let currentQueryDataCache = null;

// Chart References 
let charts = {
    dashboardTrend: null,
    dashboardPie: null,
    comparison: null,
    analysisTrend: null
};

// Elements
const viewQuery = document.getElementById('view-query');
const viewComparison = document.getElementById('view-comparison');
const manageMonthSelect = document.getElementById('manage-month-select');
const squadEntryTbody = document.getElementById('squad-entry-tbody');
const summaryEntryTbody = document.getElementById('summary-entry-tbody');
const analysisSubjectSelect = document.getElementById('analysis-subject-select');
const rankingTbody = document.getElementById('dashboard-ranking-tbody');

// Initialize Boot
async function init() {
    const [catRes, squadRes, yearsRes] = await Promise.all([
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/squads`),
        fetch(`${API_BASE}/years`)
    ]);
    categories = await catRes.json();
    squads = await squadRes.json();
    years = await yearsRes.json();
    if (years.length === 0) years = [2026, 2025];

    // Setup Advanced Filters for Query
    setupChecklist('query-year-dropdown', years.map(y => ({ id: y, name: `${y}年度` })), false, [years[0]]);
    setupChecklist('query-month-dropdown', Array.from({length: 12}, (_, i) => ({ id: i + 1, name: `${i + 1}月` })), true);
    
    // Combine Squads and Categories for Query view
    const combinedQueryData = [
        ...squads.map(s => ({ id: `squad_${s.id}`, name: s.name })),
        ...categories.map(c => ({ id: `category_${c.id}`, name: c.name }))
    ];
    setupChecklist('query-combined-dropdown', combinedQueryData, false);

    // Setup Advanced Filters for Comparison
    setupChecklist('comp-year-dropdown', years.map(y => ({ id: y, name: `${y}年度` })), false, [years[0], years[1] || years[0]]);
    setupChecklist('comp-month-dropdown', Array.from({length: 12}, (_, i) => ({ id: i + 1, name: `${i + 1}月` })), true);
    
    // Combine Squads and Categories for Comparison view
    const combinedComparisonData = [
        ...squads.map(s => ({ id: `squad_${s.id}`, name: s.name })),
        ...categories.map(c => ({ id: `category_${c.id}`, name: c.name }))
    ];
    setupChecklist('comp-combined-dropdown', combinedComparisonData, true);

    if (analysisSubjectSelect) {
        analysisSubjectSelect.innerHTML = '';
        const optGlobal = document.createElement('option');
        optGlobal.value = `global:all`;
        optGlobal.textContent = "全局";
        optGlobal.style.fontWeight = "bold";
        analysisSubjectSelect.appendChild(optGlobal);

        const grpSquads = document.createElement('optgroup');
        grpSquads.label = "直属大队监控列";
        squads.forEach(s => {
            const opt = document.createElement('option');
            opt.value = `squad:${s.id}`;
            opt.textContent = s.name;
            grpSquads.appendChild(opt);
        });
        analysisSubjectSelect.appendChild(grpSquads);

        const grpCats = document.createElement('optgroup');
        grpCats.label = "职能科室/其它体系";
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = `category:${c.id}`;
            opt.textContent = c.name;
            grpCats.appendChild(opt);
        });
        analysisSubjectSelect.appendChild(grpCats);
    }

    document.querySelectorAll('.year-dd').forEach(select => {
        select.innerHTML = '';
        years.forEach(year => {
            const opt = document.createElement('option');
            opt.value = year;
            opt.textContent = `${year}年度`;
            select.appendChild(opt);
        });
        select.value = years[0];
    });

    // Set default value for the second analysis year
    if (document.getElementById('analysis-year2-select') && years.length > 1) {
        document.getElementById('analysis-year2-select').value = years[1];
    }

    if (manageMonthSelect) {
        manageMonthSelect.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `${i}月节点`;
            if (i === new Date().getMonth() + 1) opt.selected = true;
            manageMonthSelect.appendChild(opt);
        }
    }

    // Navigation Router Engine
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.currentTarget;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view').forEach(v => {
                v.classList.remove('active');
                setTimeout(() => v.style.display = 'none', 50);
            });
            
            targetBtn.classList.add('active');
            const viewId = `view-${targetBtn.dataset.view}`;
            const targetView = document.getElementById(viewId);
            
            setTimeout(() => {
                targetView.style.display = '';
                void targetView.offsetWidth; 
                targetView.classList.add('active');
            }, 60);
            
            if (targetBtn.dataset.view === 'dashboard') loadDashboard();
            if (targetBtn.dataset.view === 'manage') loadEntryData();
            if (targetBtn.dataset.view === 'analysis') loadDepartmentAnalysis();
            if (targetBtn.dataset.view === 'thermal') loadThermalMatrix();
        });
    });

    if (document.getElementById('dash-year-select')) document.getElementById('dash-year-select').addEventListener('change', loadDashboard);
    if (manageMonthSelect) manageMonthSelect.addEventListener('change', loadEntryData);
    if (document.getElementById('manage-year-select')) document.getElementById('manage-year-select').addEventListener('change', loadEntryData);
    if (document.getElementById('add-year-btn')) {
        document.getElementById('add-year-btn').addEventListener('click', () => {
            const defaultYear = Math.max(...years) + 1;
            const inputSelected = prompt("请输入要新增或后补的年份 (例如: 2024)", defaultYear);
            if (inputSelected) {
                const newYear = parseInt(inputSelected.trim(), 10);
                if (!isNaN(newYear) && newYear > 2000 && newYear < 2100) {
                    if (!years.includes(newYear)) {
                        years.push(newYear);
                        years.sort((a, b) => b - a); // Maintain DESC order
                        refreshYearSelects();
                    }
                    document.getElementById('manage-year-select').value = newYear;
                    loadEntryData();
                } else {
                    alert('请输入一个有效的有效4位数字年份！');
                }
            }
        });
    }
    if (document.getElementById('save-btn')) document.getElementById('save-btn').addEventListener('click', saveRecords);
    if (document.getElementById('export-month-btn')) document.getElementById('export-month-btn').addEventListener('click', exportMonthlyReport);
    initSmartExcelImport();
    
    // Query Tools
    if (document.getElementById('query-search-btn')) document.getElementById('query-search-btn').addEventListener('click', executeQueryAction);
    if (document.getElementById('query-reset-btn')) document.getElementById('query-reset-btn').addEventListener('click', () => resetChecklists('query', [years[0]]));
    if (document.getElementById('query-export-btn')) document.getElementById('query-export-btn').addEventListener('click', showExportModeModal);
    if (document.getElementById('modal-close-btn')) document.getElementById('modal-close-btn').addEventListener('click', closeExportModal);
    if (document.getElementById('export-mode-breakdown')) document.getElementById('export-mode-breakdown').addEventListener('click', () => exportQueryToExcel('breakdown'));
    if (document.getElementById('export-mode-summary')) document.getElementById('export-mode-summary').addEventListener('click', () => exportQueryToExcel('summary'));
    const expModal = document.getElementById('query-export-modal');
    if (expModal) {
        expModal.addEventListener('click', (e) => {
            if (e.target === expModal) closeExportModal();
        });
    }
    
    // Comparison Tools
    if (document.getElementById('comp-search-btn')) document.getElementById('comp-search-btn').addEventListener('click', executeComparisonAction);
    if (document.getElementById('comp-reset-btn')) document.getElementById('comp-reset-btn').addEventListener('click', () => resetChecklists('comp', [years[0], years[1] || years[0]]));

    if (analysisSubjectSelect) analysisSubjectSelect.addEventListener('change', loadDepartmentAnalysis);
    if (document.getElementById('analysis-year1-select')) document.getElementById('analysis-year1-select').addEventListener('change', loadDepartmentAnalysis);
    if (document.getElementById('analysis-year2-select')) document.getElementById('analysis-year2-select').addEventListener('change', loadDepartmentAnalysis);

    if (document.getElementById('thermal-year-select')) document.getElementById('thermal-year-select').addEventListener('change', loadThermalMatrix);

    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            // Fullscreen API Handling wrapper
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => console.error(err));
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        });
    }

    document.addEventListener('fullscreenchange', () => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            if (document.fullscreenElement) {
                sidebar.classList.add('collapsed');
            } else {
                sidebar.classList.remove('collapsed');
            }
        }
    });


    Chart.defaults.color = '#8c8cab';
    Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(31, 31, 49, 0.95)';
    Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
    Chart.defaults.plugins.tooltip.bodyColor = '#00f3ff';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(0, 243, 255, 0.3)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    
    // Add glowing drop shadow to lines if supported, or just keep them thick.
    // Shadow manipulation will be handled mostly by thick lines and gradients.
    
    initCustomSelects();
    loadDashboard();
    
    // Start System Monitor
    updateSystemStatus();
    setInterval(updateSystemStatus, 5000);
}

async function updateSystemStatus() {
    const start = Date.now();
    try {
        const res = await fetch(`${API_BASE}/sys-status`);
        if (!res.ok) throw new Error("Offline");
        const latency = Date.now() - start;
        const data = await res.json();
        
        const latencyEl = document.getElementById('mon-latency');
        if (latencyEl) {
            latencyEl.textContent = `${latency} ms`;
            latencyEl.style.color = latency < 50 ? '#00e676' : (latency < 150 ? '#facc15' : '#ff007a');
        }
        
        const storageEl = document.getElementById('mon-storage');
        if (storageEl) {
            storageEl.textContent = data.dbSize;
            if (data.dbSize === 'Cloudflare D1') {
                storageEl.style.color = 'var(--success-color)';
                storageEl.style.textShadow = '0 0 8px rgba(0, 230, 118, 0.4)';
            }
        }
        if (document.getElementById('mon-total')) document.getElementById('mon-total').textContent = data.totalRecords.toLocaleString();
        if (document.getElementById('mon-version')) document.getElementById('mon-version').textContent = `BUILD ${data.version}`;
        if (document.getElementById('mon-time')) document.getElementById('mon-time').textContent = data.serverTime;
        
        const statusEl = document.querySelector('.mon-status');
        if (statusEl) {
            statusEl.classList.remove('status-offline');
            statusEl.textContent = 'ONLINE';
        }
    } catch (e) {
        const statusEl = document.querySelector('.mon-status');
        if (statusEl) {
            statusEl.classList.add('status-offline');
            statusEl.textContent = 'OFFLINE';
        }
        if (document.getElementById('mon-latency')) document.getElementById('mon-latency').textContent = `-- ms`;
    }
}

// --- Dashboard Engine ---
async function loadDashboard() {
    const year = document.getElementById('dash-year-select')?.value || new Date().getFullYear();
    document.querySelectorAll('.title-year').forEach(el => el.textContent = year);

    const statsRes = await fetch(`${API_BASE}/stats/${year}`);
    const stats = await statsRes.json();
    const currentYearTotal = stats.find(s=>s.year==year)?.total || 0;
    
    animateValue("stat-main-total", 0, currentYearTotal, 1000);

    const trendRes = await fetch(`${API_BASE}/trend/${year}`);
    const trendData = await trendRes.json();
    const trendValues = Array(12).fill(0);
    trendData.forEach(d => trendValues[d.month - 1] = d.total);
    
    if (charts.dashboardTrend) charts.dashboardTrend.destroy();
    const trendCanvas = document.getElementById('dashboard-trend-chart')?.getContext('2d');
    if(!trendCanvas) return;
    
    const gradient = trendCanvas.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 243, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 243, 255, 0.01)');

    charts.dashboardTrend = new Chart(trendCanvas, {
        type: 'line',
        data: {
            labels: Array.from({length:12}, (_,i)=>`${i+1}月`),
            datasets: [{ 
                label: '全委业务波形', 
                data: trendValues, 
                borderColor: '#00f3ff', 
                borderWidth: 4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#00f3ff',
                pointBorderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 8,
                tension: 0.45, 
                fill: true, 
                backgroundColor: gradient 
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, beginAtZero: true },
                x: { grid: { display: false, drawBorder: false } }
            }
        }
    });

    const allMonths = '1,2,3,4,5,6,7,8,9,10,11,12';
    const squadIds = squads.map(s => s.id).join(',');
    
    const [compRes, squadQueryRes] = await Promise.all([
        fetch(`${API_BASE}/comparison?year1=${year}&year2=${year-1}`),
        fetch(`${API_BASE}/advanced-query?years=${year}&months=${allMonths}&squadIds=${squadIds}`)
    ]);

    const compData = await compRes.json();
    const sortedData = [...compData].sort((a, b) => b.year1_total - a.year1_total);
    
    const squadQueryData = await squadQueryRes.json();
    const squadTotals = {};
    squadQueryData.forEach(d => {
        squadTotals[d.subject] = (squadTotals[d.subject] || 0) + (d.workload || 0);
    });

    // Populate the category stat cards
    const urbanTotal = compData.find(d => d.category === '市容市貌')?.year1_total || 0;
    const illegalTotal = compData.find(d => d.category === '违法建设')?.year1_total || 0;
    const municipalTotal = compData.find(d => d.category === '市政设施')?.year1_total || 0;
    const landscapeTotal = compData.find(d => d.category === '园林绿化')?.year1_total || 0;
    const sanitationTotal = compData.find(d => d.category === '环境卫生')?.year1_total || 0;

    const squad2Total = compData.find(d => d.category && d.category.includes('二大队'))?.year1_total || 0;
    const squad3Total = compData.find(d => d.category && d.category.includes('三大队'))?.year1_total || 0;
    
    const approvalTotal = compData.find(d => d.category === '审批中心')?.year1_total || 0;
    const hrfinTotal = compData.find(d => d.category === '人事财务股')?.year1_total || 0;

    if (document.getElementById('stat-urban-total')) animateValue('stat-urban-total', 0, urbanTotal, 1000);
    if (document.getElementById('stat-illegal-total')) animateValue('stat-illegal-total', 0, illegalTotal, 1000);
    if (document.getElementById('stat-municipal-total')) animateValue('stat-municipal-total', 0, municipalTotal, 1000);
    if (document.getElementById('stat-landscape-total')) animateValue('stat-landscape-total', 0, landscapeTotal, 1000);
    if (document.getElementById('stat-sanitation-total')) animateValue('stat-sanitation-total', 0, sanitationTotal, 1000);
    if (document.getElementById('stat-squad2-total')) animateValue('stat-squad2-total', 0, squad2Total, 1000);
    if (document.getElementById('stat-squad3-total')) animateValue('stat-squad3-total', 0, squad3Total, 1000);
    if (document.getElementById('stat-approval-total')) animateValue('stat-approval-total', 0, approvalTotal, 1000);
    if (document.getElementById('stat-hrfin-total')) animateValue('stat-hrfin-total', 0, hrfinTotal, 1000);


    if (charts.dashboardPie) charts.dashboardPie.destroy();
    charts.dashboardPie = new Chart(document.getElementById('dashboard-pie-chart'), {
        type: 'doughnut',
        data: {
            labels: sortedData.map(d=>d.category),
            datasets: [{ 
                data: sortedData.map(d=>d.year1_total), 
                backgroundColor: CHART_COLORS, 
                borderWidth: 0, 
                borderColor: '#1f1f31',
                hoverOffset: 8
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { 
                legend: { position: 'right', labels: { boxWidth: 10, usePointStyle: true, padding: 15 } } 
            } 
        }
    });

    if (rankingTbody) {
        // Build ranking: remove 市容市貌/违法建设, replace with individual squad totals
        const otherCategories = sortedData
            .filter(d => !['市容市貌', '违法建设'].includes(d.category))
            .map(d => ({ name: d.category, total: d.year1_total, type: 'category' }));

        const squadRanking = Object.entries(squadTotals).map(([name, total]) => ({ name, total, type: 'squad' }));

        // Merge and sort
        const combined = [...otherCategories, ...squadRanking].sort((a, b) => b.total - a.total);

        rankingTbody.innerHTML = combined.map((d, index) => {
            const percent = currentYearTotal > 0 ? ((d.total / currentYearTotal) * 100).toFixed(1) : 0;
            return `
                <tr class="fade-in" style="animation-delay: ${index * 0.05}s">
                    <td><span class="rank-badge rank-${index+1}">${index+1}</span></td>
                    <td class="fw-500">${d.name}</td>
                    <td><b class="text-blue number-font">${d.total.toLocaleString()}</b></td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div class="progress-bar-bg" style="width: 60px; height: 6px; background: rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                                <div style="width: ${percent}%; height:100%; background: ${CHART_COLORS[index % CHART_COLORS.length]};"></div>
                            </div>
                            <span class="text-secondary" style="font-size: 0.8rem">${percent}%</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// --- Data Entry Logic ---
async function loadEntryData() {
    const year = document.getElementById('manage-year-select').value;
    const month = manageMonthSelect.value;
    if (!year || !month) return;

    const [squadRes, generalRes] = await Promise.all([
        fetch(`${API_BASE}/squad-records/${year}/${month}`),
        fetch(`${API_BASE}/records/${year}/${month}`)
    ]);
    const squadRecords = await squadRes.json();
    const generalRecords = await generalRes.json();

    squadEntryTbody.innerHTML = '';
    const squadCats = categories.filter(c => ['市容市貌', '违法建设'].includes(c.name));
    squads.forEach(squad => {
        const tr = document.createElement('tr');
        const urbanVal = squadRecords.find(r => r.squad_id === squad.id && r.category_name === '市容市貌')?.workload || 0;
        const illegalVal = squadRecords.find(r => r.squad_id === squad.id && r.category_name === '违法建设')?.workload || 0;
        tr.innerHTML = `
            <td>${squad.name}</td>
            <td><input type="number" class="sq-input glass-input" data-sid="${squad.id}" data-cid="${squadCats.find(c=>c.name==='市容市貌').id}" value="${urbanVal}"></td>
            <td><input type="number" class="sq-input glass-input" data-sid="${squad.id}" data-cid="${squadCats.find(c=>c.name==='违法建设').id}" value="${illegalVal}"></td>
            <td class="row-total fw-bold number-font">${urbanVal + illegalVal}</td>
        `;
        squadEntryTbody.appendChild(tr);
    });

    summaryEntryTbody.innerHTML = '';
    generalRecords.forEach(rec => {
        const tr = document.createElement('tr');
        const isComputed = ['市容市貌', '违法建设'].includes(rec.name);
        tr.innerHTML = `
            <td>${rec.name}</td>
            <td>
                <input type="number" class="gen-input glass-input ${isComputed?'computed':''}" data-cid="${rec.category_id}" value="${rec.workload}" ${isComputed?'readonly':''}>
            </td>
        `;
        summaryEntryTbody.appendChild(tr);
    });

    updateTally();
    document.querySelectorAll('.sq-input').forEach(input => {
        input.addEventListener('input', () => {
            const row = input.closest('tr');
            row.querySelector('.row-total').textContent = Array.from(row.querySelectorAll('.sq-input')).reduce((a, b) => a + (parseInt(b.value) || 0), 0);
            updateTally();
        });
    });

    document.querySelectorAll('.gen-input').forEach(input => {
        input.addEventListener('input', updateTally);
    });
}

function updateTally() {
    const squadInputs = Array.from(document.querySelectorAll('.sq-input'));
    const urbanId = categories.find(c=>c.name==='市容市貌')?.id;
    const illegalId = categories.find(c=>c.name==='违法建设')?.id;
    if (!urbanId || !illegalId) return;

    const urbanSum = squadInputs.filter(i => i.dataset.cid == urbanId).reduce((a, b) => a + (parseInt(b.value) || 0), 0);
    const illegalSum = squadInputs.filter(i => i.dataset.cid == illegalId).reduce((a, b) => a + (parseInt(b.value) || 0), 0);
    
    if (document.getElementById('squad-sum-urban')) document.getElementById('squad-sum-urban').textContent = urbanSum;
    if (document.getElementById('squad-sum-illegal')) document.getElementById('squad-sum-illegal').textContent = illegalSum;
    if (document.getElementById('squad-sum-total')) document.getElementById('squad-sum-total').textContent = urbanSum + illegalSum;

    const urbanInput = document.querySelector(`.gen-input[data-cid="${urbanId}"]`);
    const illegalInput = document.querySelector(`.gen-input[data-cid="${illegalId}"]`);
    if (urbanInput) urbanInput.value = urbanSum;
    if (illegalInput) illegalInput.value = illegalSum;

    const genTotal = Array.from(document.querySelectorAll('.gen-input')).reduce((a, b) => a + (parseInt(b.value) || 0), 0);
    if (document.getElementById('summary-total-sum')) document.getElementById('summary-total-sum').textContent = genTotal.toLocaleString();
}

async function saveRecords() {
    const btn = document.getElementById('save-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> 同步中...';
    btn.disabled = true;

    try {
        const year = document.getElementById('manage-year-select').value;
        const month = manageMonthSelect.value;
        const res = await fetch(`${API_BASE}/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                year, month, 
                data: Array.from(document.querySelectorAll('.gen-input')).map(i => ({ category_id: parseInt(i.dataset.cid), workload: parseInt(i.value) || 0 })),
                squadData: Array.from(document.querySelectorAll('.sq-input')).map(i => ({ squad_id: parseInt(i.dataset.sid), category_id: parseInt(i.dataset.cid), workload: parseInt(i.value) || 0 }))
            })
        });
        if (res.ok) {
            btn.innerHTML = '<svg class="svg-icon" viewBox="0 0 24 24" style="stroke: #000; vertical-align: -2px; margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg> 同步固化成功';
            setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
        }
    } catch(e) {
        alert("网络通信异常: " + e.message);
        btn.innerHTML = originalText; 
        btn.disabled = false;
    }
}

// --- Checklist Core Widget ---
function setupChecklist(id, items, defaultToAll = false, selectSpecificIds = []) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;
    const header = dropdown.querySelector('.checklist-header');
    const content = dropdown.querySelector('.checklist-content');
    const countSpan = header.querySelector('.selected-count');

    header.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.checklist-content').forEach(c => { if(c !== content) c.classList.remove('active') });
        content.classList.toggle('active');
    });

    content.innerHTML = `
        <div class="checklist-item select-all-wrapper" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom:0.5rem; margin-bottom:0.5rem;">
            <input type="checkbox" id="${id}-all" class="custom-chk select-all-chk">
            <label for="${id}-all" style="font-weight: 600; color: #60a5fa;">全选 / 取消全选</label>
        </div>
    ` + items.map(item => {
        const isChecked = defaultToAll || selectSpecificIds.includes(item.id);
        return `
        <div class="checklist-item">
            <input type="checkbox" id="${id}-${item.id}" value="${item.id}" class="custom-chk item-chk" ${isChecked ? 'checked' : ''}>
            <label for="${id}-${item.id}">${item.name}</label>
        </div>
    `}).join('');

    const updateCount = () => {
        const allItemChks = content.querySelectorAll('.item-chk');
        const checked = content.querySelectorAll('.item-chk:checked').length;
        const selectAllChk = content.querySelector('.select-all-chk');
        
        selectAllChk.checked = (checked === allItemChks.length && allItemChks.length > 0);
        
        countSpan.textContent = checked;
        header.classList.toggle('glow-border', checked > 0);
    };

    const selectAllChk = content.querySelector('.select-all-chk');
    selectAllChk.addEventListener('change', (e) => {
        content.querySelectorAll('.item-chk').forEach(i => i.checked = e.target.checked);
        updateCount();
    });

    content.querySelectorAll('.item-chk').forEach(i => i.addEventListener('change', updateCount));
    updateCount();
}

function getChecklistValues(id) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return [];
    return Array.from(dropdown.querySelectorAll('.item-chk:checked')).map(i => i.value);
}

function resetChecklists(prefix, defaultYearIds = []) {
    document.querySelectorAll(`[id^="${prefix}-"] .checklist-content .item-chk`).forEach(i => i.checked = false);
    
    if(defaultYearIds.length > 0) {
        defaultYearIds.forEach(id => {
            const el = document.getElementById(`${prefix}-year-dropdown-${id}`);
            if(el) el.checked = true;
        });
    }

    document.querySelectorAll(`[id^="${prefix}-"].checklist-dropdown`).forEach(d => {
        const countSpan = d.querySelector('.selected-count');
        const allItemChks = d.querySelectorAll('.item-chk');
        const checked = d.querySelectorAll('.item-chk:checked').length;
        const selectAllChk = d.querySelector('.select-all-chk');
        
        if(selectAllChk) selectAllChk.checked = (checked === allItemChks.length && allItemChks.length > 0);
        if(countSpan) countSpan.textContent = checked;
        d.querySelector('.checklist-header').classList.toggle('glow-border', checked > 0);
    });
}

// --- PURE QUERY (TABLE ONLY) ---
async function executeQueryAction() {
    const btn = document.getElementById('query-search-btn');
    btn.disabled = true;
    const years = getChecklistValues('query-year-dropdown');
    const months = getChecklistValues('query-month-dropdown');
    
    const combinedVals = getChecklistValues('query-combined-dropdown');
    const squads = combinedVals.filter(v => v.startsWith('squad_')).map(v => v.split('_')[1]);
    const categories = combinedVals.filter(v => v.startsWith('category_')).map(v => v.split('_')[1]);

    const tbody = document.getElementById('query-results-tbody');

    if (years.length === 0 || months.length === 0) {
        alert('系统拦截: 请至少选取一个年度节点和一个月份节点');
        btn.disabled = false;
        return;
    }

    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;"><div class="sys-pulse" style="display:inline-block; padding:2rem 0;">检索核心数据库中...</div></td></tr>';

    try {
        const query = new URLSearchParams({ years: years.join(','), months: months.join(','), squadIds: squads.join(','), categoryIds: categories.join(',') });
        const res = await fetch(`${API_BASE}/advanced-query?${query}`);
        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
            throw new Error(data?.error || `服务器响应异常 (${res.status})`);
        }

        const thead = document.querySelector('#view-query .glass-table thead');
        let tfoot = document.getElementById('query-results-tfoot');
        if (!tfoot) {
            tfoot = document.createElement('tfoot');
            tfoot.id = 'query-results-tfoot';
            const table = document.querySelector('#view-query .glass-table');
            if (table) table.appendChild(tfoot);
        }

        if (data.length === 0) {
            thead.innerHTML = `<tr><th>统计对象</th><th>时间节点</th><th>业务量 (件)</th></tr>`;
            tbody.innerHTML = '<tr><td colspan="100" class="no-data" style="padding:2rem;">数据库中无命中记录，请放宽搜索维度</td></tr>';
            tfoot.innerHTML = '';
            tfoot.style.display = 'none';
        } else {
            // Group logic for pivot table
            const timeNodes = Array.from(new Set(data.map(d => `${d.year}年度 / ${d.month}月`)));
            timeNodes.sort((a, b) => {
                const [yA, mA] = a.match(/\d+/g).map(Number);
                const [yB, mB] = b.match(/\d+/g).map(Number);
                if (yA !== yB) return yA - yB;
                return mA - mB; 
            });

            const subjects = {};
            const squadDetailMap = {};
            const generalCategoryMap = {};

            data.forEach(d => {
                const key = `${d.year}年度 / ${d.month}月`;
                if (!subjects[d.subject]) subjects[d.subject] = { type: d.type, workloads: {} };
                subjects[d.subject].workloads[key] = (subjects[d.subject].workloads[key] || 0) + (d.workload || 0);

                if (d.type === 'squad') {
                    if (!squadDetailMap[d.subject]) squadDetailMap[d.subject] = { name: d.subject, urban: 0, illegal: 0 };
                    if (d.category_name === '市容市貌') squadDetailMap[d.subject].urban += (d.workload || 0);
                    else if (d.category_name === '违法建设') squadDetailMap[d.subject].illegal += (d.workload || 0);
                } else if (d.type === 'category') {
                    generalCategoryMap[d.subject] = (generalCategoryMap[d.subject] || 0) + (d.workload || 0);
                }
            });

            thead.innerHTML = `
                <tr>
                    <th style="min-width: 180px;">统计对象</th>
                    ${timeNodes.map(tn => `<th>${tn}</th>`).join('')}
                    <th style="color: var(--primary-color);">汇总共计</th>
                </tr>
            `;

            // Sort: squads first, then categories; within each group sort by total descending
            const subjectEntries = Object.entries(subjects).map(([subject, info]) => {
                let total = 0;
                timeNodes.forEach(tn => total += (info.workloads[tn] || 0));
                return [subject, info, total];
            });
            subjectEntries.sort((a, b) => {
                // Group by type: squad first, category second
                const typeOrder = { squad: 0, category: 1 };
                const typeA = typeOrder[a[1].type] ?? 1;
                const typeB = typeOrder[b[1].type] ?? 1;
                if (typeA !== typeB) return typeA - typeB;
                // Within same type, sort by total descending
                return b[2] - a[2];
            });

            tbody.innerHTML = subjectEntries.map(([subject, info, _total], i) => {
                let subjectTotal = 0;
                const cols = timeNodes.map(tn => {
                    const val = info.workloads[tn] || 0;
                    subjectTotal += val;
                    return `<td><b class="${val > 0 ? 'text-gradient' : 'text-secondary'} number-font" style="font-size:1.1rem;">${val.toLocaleString()}</b></td>`;
                }).join('');
                
                return `
                <tr class="fade-in" style="animation-delay: ${Math.min(i*0.02, 0.5)}s">
                    <td><div style="display:flex; align-items:center; gap:10px;">
                        <span class="icon-tag ${info.type === 'squad' ? 'bg-indigo' : 'bg-emerald'}"></span>
                        <span class="fw-bold">${subject}</span> <small class="text-secondary" style="margin-left:8px;">${info.type === 'squad' ? '大队' : '业务类'}</small>
                    </div></td>
                    ${cols}
                    <td><b class="text-primary number-font" style="font-size:1.1rem;">${subjectTotal.toLocaleString()}</b></td>
                </tr>
                `;
            }).join('');

            // Calculate column totals & grand total without duplicate counting:
            // When squads are present, Urban/Illegal from categories are displayed in the table,
            // but excluded from bottom column totals because squad totals already aggregate them.
            const hasSquads = subjectEntries.some(([_, info]) => info.type === 'squad');
            const columnTotals = {};
            let grandTotal = 0;
            timeNodes.forEach(tn => {
                let colSum = 0;
                subjectEntries.forEach(([subject, info]) => {
                    if (hasSquads && info.type === 'category' && (subject === '市容市貌' || subject === '违法建设')) {
                        return; // Prevent double counting
                    }
                    colSum += (info.workloads[tn] || 0);
                });
                columnTotals[tn] = colSum;
                grandTotal += colSum;
            });

            const footerCols = timeNodes.map(tn => {
                const colSum = columnTotals[tn] || 0;
                return `<td><b class="text-mint number-font" style="font-size:1.1rem;">${colSum.toLocaleString()}</b></td>`;
            }).join('');

            tfoot.innerHTML = `
                <tr class="total-row glass-highlight">
                    <td><span class="fw-bold">汇总合计</span></td>
                    ${footerCols}
                    <td><b class="text-gradient number-font" style="font-size:1.1rem;">${grandTotal.toLocaleString()}</b></td>
                </tr>
            `;
            tfoot.style.display = '';

            // Cache query results for Excel export
            currentQueryDataCache = {
                timeNodes,
                subjectEntries,
                squadDetailMap,
                generalCategoryMap,
                hasSquads,
                columnTotals,
                grandTotal,
                years,
                months
            };
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="100" class="text-red">系统错误: ${e.message}</td></tr>`;
        const tfoot = document.getElementById('query-results-tfoot');
        if (tfoot) {
            tfoot.innerHTML = '';
            tfoot.style.display = 'none';
        }
        currentQueryDataCache = null;
    } finally {
        btn.disabled = false;
    }
}

// --- PURE COMPARISON (CHART ONLY) ---
async function executeComparisonAction() {
    const btn = document.getElementById('comp-search-btn');
    btn.disabled = true;
    document.getElementById('comp-loading').style.display = 'inline-block';
    
    const years = getChecklistValues('comp-year-dropdown');
    const months = getChecklistValues('comp-month-dropdown');
    
    const combinedVals = getChecklistValues('comp-combined-dropdown');
    const squads = combinedVals.filter(v => v.startsWith('squad_')).map(v => v.split('_')[1]);
    const categories = combinedVals.filter(v => v.startsWith('category_')).map(v => v.split('_')[1]);

    if (years.length === 0 || months.length === 0) {
        alert('渲染约束: 必须指定至少一个年份与一个月份维度进行多维对比');
        document.getElementById('comp-loading').style.display = 'none';
        btn.disabled = false;
        return;
    }

    try {
        const query = new URLSearchParams({ years: years.join(','), months: months.join(','), squadIds: squads.join(','), categoryIds: categories.join(',') });
        const res = await fetch(`${API_BASE}/advanced-query?${query}`);
        const data = await res.json();

        if (charts.comparison) charts.comparison.destroy();
        
        const subjects = [...new Set(data.map(d => d.subject))];
        const yearList = [...new Set(data.map(d => d.year))].sort();
        
        const datasets = yearList.map((y, i) => {
            const yearData = subjects.map(s => {
                return data.filter(d => d.year == y && d.subject == s).reduce((acc, curr) => acc + curr.workload, 0);
            });
            return {
                label: `[${y}] 年度截面`,
                data: yearData,
                backgroundColor: i === 0 ? 'rgba(0, 243, 255, 0.8)' : (i === 1 ? 'rgba(189, 0, 255, 0.8)' : CHART_COLORS[(i + 5)%CHART_COLORS.length]),
                borderColor: i === 0 ? '#00f3ff' : (i === 1 ? '#bd00ff' : CHART_COLORS[(i + 5)%CHART_COLORS.length]),
                borderWidth: 0,
                borderRadius: 6,
                borderSkipped: false
            };
        });

        charts.comparison = new Chart(document.getElementById('comparison-chart'), {
            type: 'bar',
            data: { labels: subjects.length ? subjects : ['空数据集'], datasets: datasets.length ? datasets : [{label: '无数据', data: [0]}] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }
                    }, 
                    x: { 
                        grid: { display: false, drawBorder: false },
                        ticks: { maxRotation: 45, minRotation: 0 }
                    } 
                },
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 15, padding: 20 } },
                    tooltip: { mode: 'index', intersect: false }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });
    } catch (e) {
        alert("图表渲染引擎异常: " + e.message);
    } finally {
        document.getElementById('comp-loading').style.display = 'none';
        btn.disabled = false;
    }
}

// --- Analysis View Logic ---
async function loadDepartmentAnalysis() {
    const val = analysisSubjectSelect.value;
    if (!val) return;
    const [type, id] = val.split(':');
    const subjectName = analysisSubjectSelect.options[analysisSubjectSelect.selectedIndex].text;

    const res = await fetch(`${API_BASE}/subject-stats?type=${type}&id=${id}`);
    const rawData = await res.json();
    
    const year1 = document.getElementById('analysis-year1-select')?.value;
    const year2 = document.getElementById('analysis-year2-select')?.value;
    const selectedYears = [year1, year2].filter(Boolean);
    const uniqueSelectedYears = [...new Set(selectedYears)].sort((a, b) => b - a);
    
    const data = rawData.filter(d => uniqueSelectedYears.includes(d.year.toString()));
    const datasets = [];
    const statsContainer = document.getElementById('analysis-stats-container');
    statsContainer.innerHTML = ''; // 清空

    let totalSum = 0;
    const yearTotals = {};

    uniqueSelectedYears.forEach((y, i) => {
        const yearData = Array(12).fill(0);
        let yearSum = 0;
        data.filter(d => d.year == y).forEach(d => {
            yearData[d.month - 1] += d.workload;
            yearSum += d.workload;
        });
        
        yearTotals[y] = yearSum;
        totalSum += yearSum;

        datasets.push({ 
            label: `${y}年度`, 
            data: yearData, 
            borderColor: CHART_COLORS[i % CHART_COLORS.length], 
            backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + '20',
            borderWidth: 4,
            tension: 0.45,
            pointRadius: 5,
            pointBackgroundColor: '#ffffff',
            pointBorderWidth: 3
        });

        // 创建年度卡片
        const card = document.createElement('div');
        card.className = `stat-card glass-panel glow-${i === 0 ? 'cyan' : 'purple'}`;
        card.style.flex = "1";
        card.innerHTML = `
            <div class="stat-icon">${i === 0 ? '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>' : '<svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>'}</div>
            <div class="stat-content">
                <div class="label">${y}年度 · ${subjectName}</div>
                <div class="value counter" id="analysis-val-${y}">0</div>
            </div>
        `;
        statsContainer.appendChild(card);
        animateValue(`analysis-val-${y}`, 0, yearSum, 800);
    });

    // 如果选了两个不同年份，增加一个合计卡片
    if (uniqueSelectedYears.length > 1) {
        const totalCard = document.createElement('div');
        totalCard.className = "stat-card glass-panel glow-pink";
        totalCard.style.flex = "1";
        totalCard.innerHTML = `
            <div class="stat-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></div>
            <div class="stat-content">
                <div class="label">所选周期聚合总计</div>
                <div class="value counter" id="analysis-total-val">0</div>
            </div>
        `;
        statsContainer.appendChild(totalCard);
        animateValue("analysis-total-val", 0, totalSum, 800);
    }

    if (charts.analysisTrend) charts.analysisTrend.destroy();
    charts.analysisTrend = new Chart(document.getElementById('analysis-trend-chart'), {
        type: 'line',
        data: { labels: Array.from({length:12}, (_,i)=>`${i+1}月`), datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top' } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });
}

function animateValue(id, start, end, duration) {
    if (start === end) {
        document.getElementById(id).textContent = end.toLocaleString();
        return;
    }
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        obj.textContent = Math.floor(ease * (end - start) + start).toLocaleString();
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

document.addEventListener('click', (e) => {
    if(!e.target.closest('.checklist-dropdown')){
        document.querySelectorAll('.checklist-content').forEach(c => c.classList.remove('active'));
    }
});

function refreshYearSelects() {
    document.querySelectorAll('.year-dd').forEach(select => {
        const currentVal = select.value;
        select.innerHTML = '';
        years.forEach(year => {
            const opt = document.createElement('option');
            opt.value = year;
            opt.textContent = `${year}年度`;
            select.appendChild(opt);
        });
        // Try to restore previous value, or default to new first one
        if (Array.from(select.options).some(o => o.value == currentVal)) {
            select.value = currentVal;
        } else {
            select.value = years[0];
        }
    });
}

// --- Thermal Matrix Feature ---
async function loadThermalMatrix() {
    const year = document.getElementById('thermal-year-select')?.value || Math.max(...years);
    const container = document.getElementById('thermal-matrix-render');
    if (!container) return;
    
    container.innerHTML = '<div class="sys-pulse" style="color:var(--text-secondary); padding: 2rem; text-align: center;">正在汇聚全年态势矩阵数据...</div>';

    try {
        const allMonths = '1,2,3,4,5,6,7,8,9,10,11,12';
        const squadIds = squads.map(s => s.id).join(',');
        const [squadRes, catMonthsRes] = await Promise.all([
            fetch(`${API_BASE}/advanced-query?years=${year}&months=${allMonths}&squadIds=${squadIds}`),
            fetch(`${API_BASE}/advanced-query?years=${year}&months=${allMonths}`)
        ]);
        
        const squadData = await squadRes.json();
        const catMonthsData = await catMonthsRes.json();

        // Combine
        const allData = [...squadData, ...catMonthsData.filter(d => d.type === 'category' && d.subject !== '市容市貌' && d.subject !== '违法建设')];

        // Format data: subject -> month -> workload
        const matrix = {};
        const subjectsList = [];
        allData.forEach(d => {
            if (!matrix[d.subject]) {
                matrix[d.subject] = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0, 11:0, 12:0, _total: 0 };
                subjectsList.push(d.subject);
            }
            const val = d.workload || 0;
            matrix[d.subject][d.month] += val;
            matrix[d.subject]._total += val;
        });

        const uniqueSubjects = [...new Set(subjectsList)].sort((a,b) => matrix[b]._total - matrix[a]._total);

        let maxWorkload = 1;
        uniqueSubjects.forEach(sub => {
            for(let i=1; i<=12; i++) {
                if(matrix[sub][i] > maxWorkload) maxWorkload = matrix[sub][i];
            }
        });

        let html = `
            <div class="thermal-header-row">
                <div class="thermal-header-spacer"></div>
                <div class="thermal-header-months">
                    ${Array.from({length:12}, (_, i) => `<div class="thermal-header-month">${i+1}月</div>`).join('')}
                </div>
            </div>
        `;

        uniqueSubjects.forEach(sub => {
            html += `<div class="thermal-row">`;
            html += `<div class="thermal-label" title="${sub}">${sub}</div>`;
            html += `<div class="thermal-months">`;
            for(let i=1; i<=12; i++) {
                const val = matrix[sub][i] || 0;
                let intensity = val / maxWorkload;
                
                let bgColor = 'rgba(255, 255, 255, 0.05)';
                let glow = '';
                if(val > 0) {
                    if (intensity < 0.2) intensity = 0.2;
                    if (intensity < 0.4) {
                        bgColor = `rgba(0, 243, 255, ${intensity * 1.5})`; 
                    } else if (intensity < 0.7) {
                        bgColor = `rgba(189, 0, 255, ${intensity * 1.2})`;
                    } else {
                        bgColor = `rgba(255, 0, 122, ${intensity})`;
                        glow = `box-shadow: 0 0 8px rgba(255,0,122,0.6); z-index: 5;`;
                    }
                }
                
                html += `<div class="thermal-cell" style="background: ${bgColor}; ${glow}" title="${sub} - ${i}月工单量: ${val}件"></div>`;
            }
            html += `</div></div>`;
        });

        if (uniqueSubjects.length === 0) {
            container.innerHTML = `<div style="color:var(--text-secondary); padding: 2rem; text-align: center;">当前年份暂无数据档案</div>`;
        } else {
            container.innerHTML = html;
        }

    } catch (e) {
        container.innerHTML = `<div style="color:#ff007a; padding: 1rem;">矩阵数据读取失败: ${e.message}</div>`;
    }
}

init();

function initCustomSelects() {
    document.querySelectorAll('.transparent-select').forEach(select => {
        if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select-ui')) return;
        
        select.style.display = 'none';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-ui';
        
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        const selectedOpt = select.options[select.selectedIndex];
        trigger.innerHTML = `<span class="c-select-text">${selectedOpt ? selectedOpt.textContent : ''}</span> <i class="fas fa-chevron-down" style="font-size:0.75em; margin-left:8px; opacity:0.8;"></i>`;
        
        const optionsList = document.createElement('div');
        optionsList.className = 'custom-select-options custom-scrollbar';
        
        Array.from(select.children).forEach(child => {
            if (child.tagName.toLowerCase() === 'optgroup') {
                const grpLabel = document.createElement('div');
                grpLabel.className = 'custom-select-optgroup-label';
                grpLabel.textContent = child.label;
                optionsList.appendChild(grpLabel);
                
                Array.from(child.children).forEach(opt => {
                    const optionDiv = document.createElement('div');
                    optionDiv.className = 'custom-select-option' + (opt.selected ? ' selected' : '');
                    optionDiv.textContent = opt.textContent;
                    optionDiv.dataset.value = opt.value;
                    optionsList.appendChild(optionDiv);
                });
            } else if (child.tagName.toLowerCase() === 'option') {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'custom-select-option' + (child.selected ? ' selected' : '');
                optionDiv.textContent = child.textContent;
                optionDiv.dataset.value = child.value;
                optionsList.appendChild(optionDiv);
            }
        });
        
        wrapper.appendChild(trigger);
        wrapper.appendChild(optionsList);
        select.parentNode.insertBefore(wrapper, select.nextSibling);
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains('open');
            document.querySelectorAll('.custom-select-ui').forEach(ui => ui.classList.remove('open'));
            if (!isOpen) wrapper.classList.add('open');
        });
        
        optionsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('custom-select-option')) {
                const val = e.target.dataset.value;
                const text = e.target.textContent;
                select.value = val;
                trigger.querySelector('.c-select-text').textContent = text;
                
                optionsList.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected'));
                e.target.classList.add('selected');
                wrapper.classList.remove('open');
                select.dispatchEvent(new Event('change'));
            }
        });
    });
    
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-ui').forEach(ui => ui.classList.remove('open'));
    });
}

function showExportModeModal() {
    if (!currentQueryDataCache || !currentQueryDataCache.subjectEntries || currentQueryDataCache.subjectEntries.length === 0) {
        alert("当前没有可导出的查询结果，请先执行查询。");
        return;
    }
    const modal = document.getElementById('query-export-modal');
    if (modal) {
        modal.classList.add('active');
    } else {
        exportQueryToExcel('breakdown');
    }
}

function closeExportModal() {
    const modal = document.getElementById('query-export-modal');
    if (modal) modal.classList.remove('active');
}

// --- 导出查询结果为标准 Excel 报表 ---
async function exportQueryToExcel(mode = 'breakdown') {
    closeExportModal();
    const btn = document.getElementById('query-export-btn');
    const originalHTML = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<span class="spinner"></span> 导出中...';
        btn.disabled = true;
    }

    try {
        if (!currentQueryDataCache || !currentQueryDataCache.subjectEntries || currentQueryDataCache.subjectEntries.length === 0) {
            alert('当前没有可导出的查询结果，请先执行查询。');
            if (btn) { btn.innerHTML = originalHTML; btn.disabled = false; }
            return;
        }

        if (typeof ExcelJS === 'undefined') {
            alert('ExcelJS 组件加载失败，请刷新页面后重试');
            if (btn) { btn.innerHTML = originalHTML; btn.disabled = false; }
            return;
        }

        const { timeNodes, subjectEntries, columnTotals, grandTotal, years, months } = currentQueryDataCache;

        // ---- 统一配色标准 (与数据录入导出保持高度一致) ----
        const COLOR_TITLE_BG   = '1F497D'; // 深蓝 - 标题背景
        const COLOR_HEADER_BG  = 'D9E1F2'; // 浅蓝 - 表头背景
        const COLOR_TOTAL_BG   = 'FFF2CC'; // 浅黄 - 汇总行背景
        const COLOR_ROW_ALT    = 'F5F7FB'; // 交替行浅灰
        const COLOR_WHITE      = 'FFFFFF';
        const COLOR_BORDER     = '9DC3E6'; // 边框蓝灰
        const COLOR_TEXT_DARK  = '1A1A2E';

        const borderStyle = {
            top:    { style: 'thin', color: { argb: COLOR_BORDER } },
            left:   { style: 'thin', color: { argb: COLOR_BORDER } },
            bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
            right:  { style: 'thin', color: { argb: COLOR_BORDER } }
        };

        const wb = new ExcelJS.Workbook();
        wb.creator = '12345 态势感知平台';
        wb.created = new Date();

        const yearLabel = years.length === 1 ? `${years[0]}年度` : `${years.join('、')}年度`;
        const monthLabel = months.length === 12 ? '全年(1-12月)' : (months.length > 1 ? `${Math.min(...months)}-${Math.max(...months)}月` : `${months[0]}月`);
        const timeRangeText = `${yearLabel} ${monthLabel}`;

        if (mode === 'breakdown') {
            // ================= 模式 1：月度明细表 (单月逐列展示 + 汇总共计) =================
            const ws = wb.addWorksheet('月度明细检索表', {
                pageSetup: { orientation: 'landscape', fitToPage: true }
            });

            // 列宽分配
            const colDefs = [
                { width: 22 }, // A 统计对象
                { width: 14 }, // B 部门类别
                ...timeNodes.map(() => ({ width: 15 })), // 各时间节点
                { width: 16 }  // 汇总共计
            ];
            ws.columns = colDefs;
            const totalCols = colDefs.length;

            // 行1: 大标题
            const titleRow = ws.addRow([`${timeRangeText} 城管业务统计检索结果明细表`, ...Array(totalCols - 1).fill('')]);
            ws.mergeCells(1, 1, 1, totalCols);
            const titleCell = ws.getCell('A1');
            titleCell.font      = { bold: true, size: 15, color: { argb: COLOR_WHITE }, name: '微软雅黑' };
            titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TITLE_BG } };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
            titleRow.height = 36;

            // 行2: 副标题/检索条件信息
            const metaRow = ws.addRow([`检索区间: ${timeRangeText}    |    导出时间: ${new Date().toLocaleString('zh-CN')}    |    直属大队与全局业务类多维汇总`, ...Array(totalCols - 1).fill('')]);
            ws.mergeCells(2, 1, 2, totalCols);
            const metaCell = ws.getCell('A2');
            metaCell.font      = { size: 9.5, color: { argb: '595959' }, name: '微软雅黑', italic: true };
            metaCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            metaRow.height = 20;

            // 行3: 表头
            const headerValues = ['统计对象', '类型', ...timeNodes, '汇总共计'];
            const headerRow = ws.addRow(headerValues);
            headerRow.height = 24;
            for (let c = 1; c <= totalCols; c++) {
                const cell = headerRow.getCell(c);
                cell.font      = { bold: true, size: 10.5, color: { argb: COLOR_TITLE_BG }, name: '微软雅黑' };
                cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border    = borderStyle;
            }

            // 行4+: 数据行
            subjectEntries.forEach(([subject, info, total], idx) => {
                const isAlt = (idx % 2 === 1);
                const rowBg = isAlt ? COLOR_ROW_ALT : COLOR_WHITE;
                const nodeVals = timeNodes.map(tn => info.workloads[tn] || 0);

                const rowValues = [
                    subject,
                    info.type === 'squad' ? '直属大队' : '业务类',
                    ...nodeVals,
                    total
                ];
                const dRow = ws.addRow(rowValues);
                dRow.height = 20;

                for (let c = 1; c <= totalCols; c++) {
                    const cell = dRow.getCell(c);
                    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
                    cell.border = borderStyle;
                    cell.font   = { size: 10, name: '微软雅黑', color: { argb: COLOR_TEXT_DARK } };

                    if (c === 1) {
                        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
                        cell.font      = { bold: true, size: 10, name: '微软雅黑', color: { argb: COLOR_TEXT_DARK } };
                    } else if (c === 2) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        cell.font      = { size: 9.5, name: '微软雅黑', color: { argb: info.type === 'squad' ? '1F497D' : '048A81' } };
                    } else {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        cell.numFmt    = '#,##0';
                        if (c === totalCols) {
                            cell.font = { bold: true, size: 10.5, name: '微软雅黑', color: { argb: COLOR_TITLE_BG } };
                        }
                    }
                }
            });

            // 汇总合计行
            const footerNodeVals = timeNodes.map(tn => columnTotals[tn] || 0);
            const totalRowVals = [
                '汇总合计',
                '全局总计',
                ...footerNodeVals,
                grandTotal
            ];
            const fRow = ws.addRow(totalRowVals);
            fRow.height = 24;

            for (let c = 1; c <= totalCols; c++) {
                const cell = fRow.getCell(c);
                cell.font      = { bold: true, size: 11, name: '微软雅黑', color: { argb: COLOR_TITLE_BG } };
                cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL_BG } };
                cell.alignment = { vertical: 'middle', horizontal: c <= 2 ? 'center' : 'center' };
                cell.border    = {
                    top:    { style: 'medium', color: { argb: COLOR_TITLE_BG } },
                    left:   { style: 'thin',   color: { argb: COLOR_BORDER } },
                    bottom: { style: 'medium', color: { argb: COLOR_TITLE_BG } },
                    right:  { style: 'thin',   color: { argb: COLOR_BORDER } },
                };
                if (c > 2) cell.numFmt = '#,##0';
            }

        } else {
            // ================= 模式 2：区间汇总表 (与数据录入导出 100% 完全一模一样格式和样式) =================
            const ws = wb.addWorksheet('业务统计汇总', {
                pageSetup: { orientation: 'landscape', fitToPage: true }
            });

            // ---- 列宽 (与数据录入导出完全一致) ----
            ws.columns = [
                { width: 18 },   // A 大队建制
                { width: 14 },   // B 市容市貌
                { width: 14 },   // C 违法建设
                { width: 12 },   // D 小计
                { width: 4  },   // E 分隔列
                { width: 32 },   // F 统计科目
                { width: 16 },   // G 工单量 (件)
            ];

            // ====== 行1: 大标题 ======
            const titleRow = ws.addRow([`${timeRangeText} 城管业务统计汇总表`, '', '', '', '', '', '']);
            ws.mergeCells('A1:G1');
            const titleCell = ws.getCell('A1');
            titleCell.font      = { bold: true, size: 16, color: { argb: COLOR_WHITE }, name: '微软雅黑' };
            titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TITLE_BG } };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
            titleRow.height = 36;

            // ====== 行2: 区块子标题 ======
            const subRow = ws.addRow(['一、大队接件数明细 (市容 / 违建)', '', '', '', '', '二、全局业务宏观汇总', '']);
            ws.mergeCells('A2:D2');
            ws.mergeCells('F2:G2');
            ['A2', 'F2'].forEach(addr => {
                const c = ws.getCell(addr);
                c.font      = { bold: true, size: 11, color: { argb: COLOR_TITLE_BG }, name: '微软雅黑' };
                c.alignment = { vertical: 'middle', horizontal: 'left' };
            });
            subRow.height = 24;

            // ====== 行3: 表头 ======
            const headerRow = ws.addRow(['大队建制', '市容市貌', '违法建设', '小计', '', '统计科目', '工单量 (件)']);
            headerRow.height = 22;
            ['A', 'B', 'C', 'D', 'F', 'G'].forEach(col => {
                const c = ws.getCell(`${col}3`);
                c.font      = { bold: true, size: 11, color: { argb: COLOR_TITLE_BG }, name: '微软雅黑' };
                c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
                c.alignment = { vertical: 'middle', horizontal: 'center' };
                c.border    = borderStyle;
            });

            // ====== 行4+: 数据行 ======
            // 大队明细行
            const squadRows = Object.values(currentQueryDataCache.squadDetailMap || {});
            
            // 业务汇总行按标准规范顺序
            const standardCatOrder = ['市容市貌', '违法建设', '市政设施', '环境卫生', '三大队（施工噪音扬尘渣土）', '三大队', '二大队', '园林绿化', '人事财务股', '审批中心'];
            const generalRows = [];
            const genMap = currentQueryDataCache.generalCategoryMap || {};
            const matchedCats = new Set();
            standardCatOrder.forEach(name => {
                const matchedKey = Object.keys(genMap).find(k => k === name || k.includes(name) || name.includes(k));
                if (matchedKey && !matchedCats.has(matchedKey)) {
                    matchedCats.add(matchedKey);
                    generalRows.push({ name: matchedKey, val: genMap[matchedKey] });
                }
            });
            Object.keys(genMap).forEach(k => {
                if (!matchedCats.has(k)) {
                    generalRows.push({ name: k, val: genMap[k] });
                }
            });

            const maxLen = Math.max(squadRows.length, generalRows.length);
            for (let i = 0; i < maxLen; i++) {
                const sq  = squadRows[i];
                const gen = generalRows[i];
                const isAlt = (i % 2 === 1);
                const rowBg = isAlt ? COLOR_ROW_ALT : COLOR_WHITE;

                const dataRow = ws.addRow([
                    sq  ? sq.name  : '',
                    sq  ? sq.urban : '',
                    sq  ? sq.illegal : '',
                    sq  ? (sq.urban + sq.illegal) : '',
                    '',
                    gen ? gen.name : '',
                    gen ? gen.val  : ''
                ]);
                dataRow.height = 20;

                // 大队明细格
                ['A', 'B', 'C', 'D'].forEach(col => {
                    const c = ws.getCell(`${col}${dataRow.number}`);
                    c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
                    c.alignment = { vertical: 'middle', horizontal: col === 'A' ? 'left' : 'center' };
                    c.border    = borderStyle;
                    c.font      = { size: 10, name: '微软雅黑', color: { argb: COLOR_TEXT_DARK } };
                    if (['B', 'C', 'D'].includes(col) && sq) {
                        c.numFmt = '#,##0';
                    }
                });

                // 汇总格
                ['F', 'G'].forEach(col => {
                    const c = ws.getCell(`${col}${dataRow.number}`);
                    c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
                    c.alignment = { vertical: 'middle', horizontal: col === 'F' ? 'left' : 'center' };
                    c.border    = borderStyle;
                    c.font      = { size: 10, name: '微软雅黑', color: { argb: COLOR_TEXT_DARK } };
                    if (col === 'G' && gen) c.numFmt = '#,##0';
                });
            }

            // ====== 汇总行 ======
            const urbanTotal   = squadRows.reduce((s, r) => s + (r.urban || 0),   0);
            const illegalTotal = squadRows.reduce((s, r) => s + (r.illegal || 0), 0);
            const genTotal     = currentQueryDataCache.grandTotal;

            const totalRow = ws.addRow([
                '合计 / 汇算求和', urbanTotal, illegalTotal, urbanTotal + illegalTotal,
                '', '工单总计', genTotal
            ]);
            totalRow.height = 22;

            ['A', 'B', 'C', 'D', 'F', 'G'].forEach(col => {
                const c = ws.getCell(`${col}${totalRow.number}`);
                c.font      = { bold: true, size: 11, name: '微软雅黑', color: { argb: COLOR_TITLE_BG } };
                c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL_BG } };
                c.alignment = { vertical: 'middle', horizontal: col === 'A' || col === 'F' ? 'left' : 'center' };
                c.border    = {
                    top:    { style: 'medium', color: { argb: '1F497D' } },
                    left:   { style: 'thin',   color: { argb: COLOR_BORDER } },
                    bottom: { style: 'medium', color: { argb: '1F497D' } },
                    right:  { style: 'thin',   color: { argb: COLOR_BORDER } },
                };
                if (['B', 'C', 'D', 'G'].includes(col)) c.numFmt = '#,##0';
            });
        }

        // ====== 导出并下载文件 ======
        const buffer = await wb.xlsx.writeBuffer();
        const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url    = URL.createObjectURL(blob);
        const link   = document.createElement('a');
        link.href     = url;
        const modeSuffix = mode === 'breakdown' ? '月度明细' : '区间总和';
        link.download = `${timeRangeText.replace(/\s+/g, '_')}_城管业务统计检索表_${modeSuffix}.xlsx`;
        link.className = 'hidden-exporter';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (btn) {
            btn.innerHTML = '<svg class="svg-icon" viewBox="0 0 24 24" style="stroke: var(--success-color); vertical-align: -2px; margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg> 导出成功';
            setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; }, 2000);
        }
    } catch (e) {
        console.error('Excel 导出失败:', e);
        alert('导出失败: ' + e.message);
        if (btn) {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }
}

// --- 导出当月统计表格 ---
async function exportMonthlyReport() {
    const btn = document.getElementById('export-month-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> 生成中...';
    btn.disabled = true;

    try {
        const year = document.getElementById('manage-year-select').value;
        const month = manageMonthSelect.value;
        if (!year || !month) {
            alert('请先选择年份和月份');
            btn.innerHTML = originalHTML; btn.disabled = false; return;
        }

        // 从页面读取大队明细数据
        const squadRows = [];
        document.querySelectorAll('#squad-entry-tbody tr').forEach(tr => {
            const tds = tr.querySelectorAll('td');
            const name = tds[0] ? tds[0].textContent.trim() : '';
            const inputs = tr.querySelectorAll('.sq-input');
            const urban = parseInt(inputs[0] ? inputs[0].value : '0') || 0;
            const illegal = parseInt(inputs[1] ? inputs[1].value : '0') || 0;
            if (name) squadRows.push({ name, urban, illegal });
        });

        // 从页面读取全局汇总数据
        const generalRows = [];
        document.querySelectorAll('#summary-entry-tbody tr').forEach(tr => {
            const tds = tr.querySelectorAll('td');
            const name = tds[0] ? tds[0].textContent.trim() : '';
            const inp = tr.querySelector('input');
            const val = parseInt(inp ? inp.value : '0') || 0;
            if (name) generalRows.push({ name, val });
        });

        if (typeof ExcelJS === 'undefined') {
            alert('ExcelJS 库加载失败，请刷新页面后重试');
            btn.innerHTML = originalHTML; btn.disabled = false;
            return;
        }

        // ---- 样式常量 ----
        const COLOR_TITLE_BG   = '1F497D'; // 深蓝 - 标题背景
        const COLOR_HEADER_BG  = 'D9E1F2'; // 浅蓝 - 表头背景
        const COLOR_TOTAL_BG   = 'FFF2CC'; // 浅黄 - 汇总行背景
        const COLOR_ROW_ALT    = 'F5F7FB'; // 交替行浅灰
        const COLOR_WHITE      = 'FFFFFF';
        const COLOR_BORDER     = '9DC3E6'; // 边框蓝灰
        const COLOR_TEXT_DARK  = '1A1A2E';

        const borderStyle = {
            top:    { style: 'thin', color: { argb: COLOR_BORDER } },
            left:   { style: 'thin', color: { argb: COLOR_BORDER } },
            bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
            right:  { style: 'thin', color: { argb: COLOR_BORDER } }
        };

        const wb = new ExcelJS.Workbook();
        wb.creator = '12345 态势感知平台';
        wb.created = new Date();

        const ws = wb.addWorksheet('业务统计汇总', {
            pageSetup: { orientation: 'landscape', fitToPage: true }
        });

        // ---- 列宽 ----
        ws.columns = [
            { width: 18 },   // A 大队建制
            { width: 14 },   // B 市容市貌
            { width: 14 },   // C 违法建设
            { width: 12 },   // D 小计
            { width: 4  },   // E 分隔列
            { width: 32 },   // F 统计科目
            { width: 16 },   // G 工单量
        ];

        // ====== 行1: 大标题 ======
        const titleRow = ws.addRow([`${year}年${month}月 城管业务统计汇总表`, '', '', '', '', '', '']);
        ws.mergeCells('A1:G1');
        const titleCell = ws.getCell('A1');
        titleCell.font     = { bold: true, size: 16, color: { argb: COLOR_WHITE }, name: '微软雅黑' };
        titleCell.fill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TITLE_BG } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        titleRow.height = 36;

        // ====== 行2: 区块子标题 ======
        const subRow = ws.addRow(['一、大队接件数明细 (市容 / 违建)', '', '', '', '', '二、全局业务宏观汇总', '']);
        ws.mergeCells('A2:D2');
        ws.mergeCells('F2:G2');
        ['A2', 'F2'].forEach(addr => {
            const c = ws.getCell(addr);
            c.font      = { bold: true, size: 11, color: { argb: COLOR_TITLE_BG }, name: '微软雅黑' };
            c.alignment = { vertical: 'middle', horizontal: 'left' };
        });
        subRow.height = 24;

        // ====== 行3: 表头 ======
        const headerRow = ws.addRow(['大队建制', '市容市貌', '违法建设', '小计', '', '统计科目', '工单量 (件)']);
        headerRow.height = 22;
        ['A', 'B', 'C', 'D', 'F', 'G'].forEach(col => {
            const c = ws.getCell(`${col}3`);
            c.font      = { bold: true, size: 11, color: { argb: COLOR_TITLE_BG }, name: '微软雅黑' };
            c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
            c.alignment = { vertical: 'middle', horizontal: 'center' };
            c.border    = borderStyle;
        });

        // ====== 行4+: 数据行 ======
        const maxLen = Math.max(squadRows.length, generalRows.length);
        for (let i = 0; i < maxLen; i++) {
            const sq  = squadRows[i];
            const gen = generalRows[i];
            const isAlt = (i % 2 === 1);
            const rowBg = isAlt ? COLOR_ROW_ALT : COLOR_WHITE;

            const dataRow = ws.addRow([
                sq  ? sq.name  : '',
                sq  ? sq.urban : '',
                sq  ? sq.illegal : '',
                sq  ? (sq.urban + sq.illegal) : '',
                '',
                gen ? gen.name : '',
                gen ? gen.val  : ''
            ]);
            dataRow.height = 20;

            // 大队明细格
            ['A', 'B', 'C', 'D'].forEach(col => {
                const c = ws.getCell(`${col}${dataRow.number}`);
                c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
                c.alignment = { vertical: 'middle', horizontal: col === 'A' ? 'left' : 'center' };
                c.border    = borderStyle;
                c.font      = { size: 10, name: '微软雅黑', color: { argb: COLOR_TEXT_DARK } };
                if (['B', 'C', 'D'].includes(col) && sq) {
                    c.numFmt = '#,##0';
                }
            });

            // 汇总格
            ['F', 'G'].forEach(col => {
                const c = ws.getCell(`${col}${dataRow.number}`);
                c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
                c.alignment = { vertical: 'middle', horizontal: col === 'F' ? 'left' : 'center' };
                c.border    = borderStyle;
                c.font      = { size: 10, name: '微软雅黑', color: { argb: COLOR_TEXT_DARK } };
                if (col === 'G' && gen) c.numFmt = '#,##0';
            });
        }

        // ====== 汇总行 ======
        const urbanTotal   = squadRows.reduce((s, r) => s + r.urban,   0);
        const illegalTotal = squadRows.reduce((s, r) => s + r.illegal, 0);
        const genTotal     = generalRows.reduce((s, r) => s + r.val,   0);

        const totalRow = ws.addRow([
            '合计 / 汇算求和', urbanTotal, illegalTotal, urbanTotal + illegalTotal,
            '', '工单总计', genTotal
        ]);
        totalRow.height = 22;

        ['A', 'B', 'C', 'D', 'F', 'G'].forEach(col => {
            const c = ws.getCell(`${col}${totalRow.number}`);
            c.font      = { bold: true, size: 11, name: '微软雅黑', color: { argb: COLOR_TITLE_BG } };
            c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL_BG } };
            c.alignment = { vertical: 'middle', horizontal: col === 'A' || col === 'F' ? 'left' : 'center' };
            c.border    = {
                top:    { style: 'medium', color: { argb: '1F497D' } },
                left:   { style: 'thin',   color: { argb: COLOR_BORDER } },
                bottom: { style: 'medium', color: { argb: '1F497D' } },
                right:  { style: 'thin',   color: { argb: COLOR_BORDER } },
            };
            if (['B', 'C', 'D', 'G'].includes(col)) c.numFmt = '#,##0';
        });

        // ====== 导出下载 ======
        const buffer = await wb.xlsx.writeBuffer();
        const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url    = URL.createObjectURL(blob);
        const link   = document.createElement('a');
        link.href     = url;
        link.download = `${year}年${month}月城管业务统计汇总表.xlsx`;
        link.className = 'hidden-exporter';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        btn.innerHTML = '<svg class="svg-icon" viewBox="0 0 24 24" style="stroke: #fff; vertical-align: -2px; margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg> 导出成功';
        setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; }, 2000);
    } catch (e) {
        console.error('导出失败:', e);
        alert('导出失败: ' + e.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

// ==========================================
// 12345 案件表格智能解析 (一键自动填报) 模块
// ==========================================
function initSmartExcelImport() {
    const dropzone = document.getElementById('smart-import-dropzone');
    const fileInput = document.getElementById('smart-excel-file-input');
    const uploadBtn = document.getElementById('smart-excel-upload-btn');

    if (!dropzone || !fileInput || !uploadBtn) return;

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleSmartExcelParse(e.target.files[0]);
        }
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#00f3ff';
        dropzone.style.background = 'rgba(0, 243, 255, 0.1)';
    });

    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'rgba(0, 243, 255, 0.4)';
        dropzone.style.background = 'rgba(0, 243, 255, 0.03)';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'rgba(0, 243, 255, 0.4)';
        dropzone.style.background = 'rgba(0, 243, 255, 0.03)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleSmartExcelParse(e.dataTransfer.files[0]);
        }
    });
}

const SMART_PERSON_MAP = {
    '孟晶琦': '向阳大队',
    '许艺凡': '振兴大队',
    '张振泽': '松州大队',
    '杨书欣': '铁东大队',
    '王振威': '兴安大队',
    '王端阳': '玉龙大队',
    '王杰文': '全宁大队',
    '李颖': '松城大队',
    '梁宏达': '二大队',
    '贾春生': '三大队',
    '李立': '园林中心',
    '朱新园': '市政中心',
    '宗梓祺': '环卫中心',
    '成凤枝': '人事财务股',
    '杨欣蕾': '审批中心'
};

async function handleSmartExcelParse(file) {
    const statusText = document.getElementById('smart-import-status');
    const uploadBtn = document.getElementById('smart-excel-upload-btn');
    const originalBtnHtml = uploadBtn.innerHTML;

    if (!file.name.endsWith('.xlsx')) {
        alert('请选择 .xlsx 格式的 Excel 表格！');
        return;
    }

    if (typeof ExcelJS === 'undefined') {
        alert('ExcelJS 组件未就绪，请刷新页面重试！');
        return;
    }

    uploadBtn.innerHTML = '<svg class="svg-icon" viewBox="0 0 24 24" style="stroke: #000; animation: spin 1s linear infinite; vertical-align: -2px; margin-right: 4px;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> 正在极速解析...';
    uploadBtn.disabled = true;
    if (statusText) statusText.innerHTML = `<span style="color:#00f3ff;">正在读取并分析表格: <b>${file.name}</b> ...</span>`;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(arrayBuffer);
        const ws = wb.worksheets[0];

        // 识别表头列序号
        let colIndex = {};
        for (let r = 1; r <= Math.min(5, ws.rowCount); r++) {
            const row = ws.getRow(r);
            let foundHeaders = 0;
            row.eachCell((cell, colNum) => {
                const txt = String(cell.value || cell.text || '').trim();
                if (txt.includes('审批结果')) { colIndex['审批结果'] = colNum; foundHeaders++; }
                if (txt.includes('审批状态')) { colIndex['审批状态'] = colNum; foundHeaders++; }
                if (txt.includes('当前负责人')) { colIndex['当前负责人'] = colNum; foundHeaders++; }
                if (txt.includes('历史审批人')) { colIndex['历史审批人'] = colNum; foundHeaders++; }
                if (txt.includes('案件详情')) { colIndex['案件详情'] = colNum; foundHeaders++; }
                if (txt.includes('审批单标题')) { colIndex['审批单标题'] = colNum; }
                if (txt.includes('创建人部门')) { colIndex['创建人部门'] = colNum; }
            });
            if (foundHeaders >= 3) break;
        }

        if (!colIndex['审批结果'] || !colIndex['审批状态'] || !colIndex['案件详情']) {
            throw new Error('未识别到案件表头字段（需包含“审批结果”、“审批状态”、“案件详情”等）');
        }

        const squadStats = {
            '向阳大队': { urban: 0, illegal: 0 },
            '兴安大队': { urban: 0, illegal: 0 },
            '全宁大队': { urban: 0, illegal: 0 },
            '振兴大队': { urban: 0, illegal: 0 },
            '松州大队': { urban: 0, illegal: 0 },
            '玉龙大队': { urban: 0, illegal: 0 },
            '铁东大队': { urban: 0, illegal: 0 },
            '松城大队': { urban: 0, illegal: 0 }
        };

        const centerStats = {
            '市政中心': 0,
            '环卫中心': 0,
            '三大队': 0,
            '二大队': 0,
            '园林中心': 0,
            '人事财务股': 0,
            '审批中心': 0
        };

        let validCount = 0;
        let passCount = 0;
        let pendingCount = 0;

        for (let r = 2; r <= ws.rowCount; r++) {
            const row = ws.getRow(r);
            const spResult = String(row.getCell(colIndex['审批结果'])?.text || '').trim();
            const spStatus = String(row.getCell(colIndex['审批状态'])?.text || '').trim();

            const isPassed = (spResult === '审批通过');
            const isPending = (spStatus === '审批中');
            if (!isPassed && !isPending) continue;

            validCount++;
            if (isPassed) passCount++;
            if (isPending) pendingCount++;

            const curPerson = String(row.getCell(colIndex['当前负责人'])?.text || '').trim();
            const histPersons = String(row.getCell(colIndex['历史审批人'])?.text || '').trim();
            const details = String(row.getCell(colIndex['案件详情'])?.text || '').trim();

            // 责任人判定：严格通过工单状态与人员字段
            const targetPersonStr = isPending ? curPerson : (histPersons || curPerson);
            let matchedDept = '其他/未匹配';

            for (const [p, d] of Object.entries(SMART_PERSON_MAP)) {
                if (targetPersonStr.includes(p)) {
                    matchedDept = d;
                    break;
                }
            }

            const hasIllegal = details.includes('违建');

            if (squadStats[matchedDept]) {
                if (hasIllegal) {
                    squadStats[matchedDept].illegal++;
                } else {
                    squadStats[matchedDept].urban++;
                }
            } else if (centerStats[matchedDept] !== undefined) {
                centerStats[matchedDept]++;
            }
        }

        // 填报左表
        document.querySelectorAll('#squad-entry-tbody tr').forEach(tr => {
            const squadName = tr.querySelector('td')?.textContent?.trim();
            if (squadName && squadStats[squadName]) {
                const inputs = tr.querySelectorAll('.sq-input');
                if (inputs.length >= 2) {
                    inputs[0].value = squadStats[squadName].urban;
                    inputs[1].value = squadStats[squadName].illegal;
                    inputs[0].style.transition = 'all 0.3s ease';
                    inputs[1].style.transition = 'all 0.3s ease';
                    inputs[0].style.border = '1px solid #00f3ff';
                    inputs[1].style.border = '1px solid #00f3ff';
                    inputs[0].style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.4)';
                    inputs[1].style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.4)';
                    setTimeout(() => {
                        inputs[0].style.border = '';
                        inputs[1].style.border = '';
                        inputs[0].style.boxShadow = '';
                        inputs[1].style.boxShadow = '';
                    }, 3000);
                }
                const rowTotalEl = tr.querySelector('.row-total');
                if (rowTotalEl) {
                    rowTotalEl.textContent = squadStats[squadName].urban + squadStats[squadName].illegal;
                }
            }
        });

        // 填报右表
        document.querySelectorAll('#summary-entry-tbody tr').forEach(tr => {
            const subjectName = tr.querySelector('td')?.textContent?.trim();
            const input = tr.querySelector('input');
            if (!input || !subjectName) return;

            let val = null;
            if (subjectName.includes('市政设施')) val = centerStats['市政中心'];
            else if (subjectName.includes('环境卫生')) val = centerStats['环卫中心'];
            else if (subjectName.includes('三大队')) val = centerStats['三大队'];
            else if (subjectName.includes('二大队')) val = centerStats['二大队'];
            else if (subjectName.includes('园林绿化')) val = centerStats['园林中心'];
            else if (subjectName.includes('人事财务股')) val = centerStats['人事财务股'];
            else if (subjectName.includes('审批中心')) val = centerStats['审批中心'];

            if (val !== null) {
                input.value = val;
                input.style.transition = 'all 0.3s ease';
                input.style.border = '1px solid #00f3ff';
                input.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.4)';
                setTimeout(() => {
                    input.style.border = '';
                    input.style.boxShadow = '';
                }, 3000);
            }
        });

        // 自动计算汇总
        if (typeof updateTally === 'function') {
            updateTally();
        }

        if (statusText) {
            statusText.innerHTML = `
                <span style="color:#00e676; font-weight:600; display: inline-flex; align-items: center; gap: 4px;">
                    <svg class="svg-icon" viewBox="0 0 24 24" style="stroke: #00e676;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    智能填报成功！文件: <b>${file.name}</b> (有效纳管 <b>${validCount}</b> 件: 审批通过 ${passCount} 件, 审批中 ${pendingCount} 件)
                </span>
                <span style="color:#a5f3fc; margin-left: 8px;">数据已全部精确回填，请核对后点击右下方【同步固化并封存数据】。</span>
            `;
        }

        uploadBtn.innerHTML = '<svg class="svg-icon" viewBox="0 0 24 24" style="stroke: #000; vertical-align: -2px; margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg> 填报完成';
        setTimeout(() => {
            uploadBtn.innerHTML = originalBtnHtml;
            uploadBtn.disabled = false;
        }, 3000);

    } catch (err) {
        console.error('智能解析表格失败:', err);
        alert('解析表格失败: ' + err.message);
        if (statusText) statusText.innerHTML = `<span style="color:#ff3b3b; display: inline-flex; align-items: center; gap: 4px;"><svg class="svg-icon" viewBox="0 0 24 24" style="stroke: #ff3b3b;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> 解析表格失败: ${err.message}</span>`;
        uploadBtn.innerHTML = originalBtnHtml;
        uploadBtn.disabled = false;
    }
}


