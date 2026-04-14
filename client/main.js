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
    
    // Query Tools
    if (document.getElementById('query-search-btn')) document.getElementById('query-search-btn').addEventListener('click', executeQueryAction);
    if (document.getElementById('query-reset-btn')) document.getElementById('query-reset-btn').addEventListener('click', () => resetChecklists('query', [years[0]]));
    if (document.getElementById('query-export-btn')) document.getElementById('query-export-btn').addEventListener('click', exportQueryToCSV);
    
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
        
        if (document.getElementById('mon-storage')) document.getElementById('mon-storage').textContent = data.dbSize;
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
            btn.innerHTML = '✅ 同步固化成功';
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
    const summary = document.getElementById('query-summary');
    const totalSum = document.getElementById('query-total-sum');

    if (years.length === 0 || months.length === 0) {
        alert('系统拦截: 请至少选取一个年度节点和一个月份节点');
        btn.disabled = false;
        return;
    }

    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;"><div class="sys-pulse" style="display:inline-block; padding:2rem 0;">检索核心数据库中...</div></td></tr>';
    summary.style.display = 'none';

    try {
        const query = new URLSearchParams({ years: years.join(','), months: months.join(','), squadIds: squads.join(','), categoryIds: categories.join(',') });
        const res = await fetch(`${API_BASE}/advanced-query?${query}`);
        const data = await res.json();

        const thead = document.querySelector('#view-query .glass-table thead');

        if (data.length === 0) {
            thead.innerHTML = `<tr><th>统计对象</th><th>时间节点</th><th>业务量 (件)</th></tr>`;
            tbody.innerHTML = '<tr><td colspan="100" class="no-data" style="padding:2rem;">数据库中无命中记录，请放宽搜索维度</td></tr>';
            summary.style.display = 'none';
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
            let totalRecords = 0;
            data.forEach(d => {
                totalRecords += d.workload || 0;
                if (!subjects[d.subject]) subjects[d.subject] = { type: d.type, workloads: {} };
                const key = `${d.year}年度 / ${d.month}月`;
                subjects[d.subject].workloads[key] = (subjects[d.subject].workloads[key] || 0) + (d.workload || 0);
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
            
            animateValue("query-total-sum", 0, totalRecords, 500);
            summary.style.display = 'block';
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="100" class="text-red">系统错误: ${e.message}</td></tr>`;
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
            <div class="stat-icon">${i === 0 ? '📊' : '📈'}</div>
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
            <div class="stat-icon">🎯</div>
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
                ${Array.from({length:12}, (_, i) => `<div class="thermal-header-month">${i+1}月</div>`).join('')}
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

function exportQueryToCSV() {
    const table = document.querySelector('#view-query .glass-table');
    if (!table) return;

    const rows = Array.from(table.rows);
    // 如果只有表头或者显示暂无数据，则拦截
    if (rows.length <= 1 || rows[1].classList.contains('no-data')) {
        alert("当前没有可导出的查询结果，请先执行查询。");
        return;
    }

    let csvContent = "";
    
    rows.forEach((row, rowIndex) => {
        const cells = Array.from(row.cells).map((cell, colIndex) => {
            // 提取纯文本，去除图标字符和换行
            let text = cell.innerText.replace(/\n/g, ' ').replace(/\s\s+/g, ' ').trim();
            
            // 如果是首列（统计对象列），且不是第一行（标题行），则剥离“ 大队”或“ 业务类”后缀
            if (colIndex === 0 && rowIndex > 0) {
                text = text.replace(/\s(大队|业务类)$/, '');
            }

            // 处理 CSV 特殊字符：如果包含引号，需要转义；如果包含逗号或换行，整个字段需由引号包裹
            if (text.includes('"')) {
                text = text.replace(/"/g, '""');
            }
            if (text.includes(',') || text.includes('"')) {
                text = `"${text}"`;
            }
            return text;
        });
        csvContent += cells.join(",") + "\r\n";
    });

    // 额外追加合计行
    const totalSumEl = document.getElementById('query-total-sum');
    const summaryDiv = document.getElementById('query-summary');
    if (totalSumEl && summaryDiv && summaryDiv.style.display !== 'none') {
        const totalValue = totalSumEl.innerText.replace(/,/g, '');
        // 构造一行为空，最后一列为合计的行（根据表头长度确定）
        const colCount = rows[0].cells.length;
        const totalRow = Array(colCount).fill("");
        totalRow[0] = "合计所有筛选结果";
        totalRow[colCount - 1] = totalValue;
        csvContent += totalRow.join(",") + "\r\n";
    }

    // 解决中文字符乱码问题：在文件开头添加 UTF-8 BOM
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const token = new Date().getTime().toString().slice(-6);
    const link = document.createElement("a");
    link.className = "hidden-exporter";
    link.setAttribute("href", url);
    link.setAttribute("download", `12345_查询报表_${new Date().toLocaleDateString()}_${token}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 释放 URL 对象，防止内存泄漏
    setTimeout(() => URL.revokeObjectURL(url), 100);
}
