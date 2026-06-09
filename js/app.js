// -*- coding: utf-8 -*-
// 梅花易数 — 主应用逻辑

const REFRESH_MS = 30000;
let liveMode = true;
let activeMethod = null;
let methods = [];
let castCallback = null;
let refreshTimer = null;

// ── 初始化 ────────────────────────────────────────────────
async function initApp() {
    // 加载笔画数据
    await loadStrokes();

    // 创建起卦方法
    methods = [
        new TimeMethod(),
        new StrokesMethod(),
        new SoundMethod(),
        new BehaviorMethod(),
        new ObjectMethod(),
    ];

    methods.forEach(m => m.setCastCallback(() => refresh()));

    activeMethod = methods[0];

    // 构建 UI
    buildTabBar();
    buildRefTable();
    bindEvents();
    updateTabStates();

    if (liveMode) {
        refresh();
        scheduleRefresh();
    } else {
        showMethodPanel();
    }
}

// ── 标签栏 ────────────────────────────────────────────────
function buildTabBar() {
    const bar = document.getElementById('tabBar');
    bar.innerHTML = '';

    // 实时按钮
    const liveBtn = document.createElement('button');
    liveBtn.textContent = '实时';
    liveBtn.className = 'tab-btn live-btn';
    liveBtn.id = 'liveBtn';
    liveBtn.addEventListener('click', setLive);
    bar.appendChild(liveBtn);

    const sep = document.createElement('span');
    sep.className = 'tab-sep';
    bar.appendChild(sep);

    // 五个方法按钮
    methods.forEach(m => {
        const btn = document.createElement('button');
        btn.textContent = `${m.icon} ${m.name}`;
        btn.className = 'tab-btn';
        btn.addEventListener('click', () => selectMethod(m));
        bar.appendChild(btn);
    });
}

function updateTabStates() {
    const liveBtn = document.getElementById('liveBtn');
    if (liveBtn) {
        liveBtn.className = liveMode ? 'tab-btn live-btn active' : 'tab-btn live-btn';
    }
    const btns = document.querySelectorAll('#tabBar .tab-btn:not(.live-btn)');
    btns.forEach(btn => {
        const idx = Array.from(btns).indexOf(btn);
        btn.className = methods[idx] === activeMethod && !liveMode
            ? 'tab-btn active' : 'tab-btn';
    });
}

function setLive() {
    liveMode = true;
    document.getElementById('methodPanel').classList.remove('visible');
    updateTabStates();
    refresh();
    scheduleRefresh();
}

function selectMethod(method) {
    liveMode = false;
    activeMethod = method;
    stopRefresh();
    updateTabStates();
    showMethodPanel();
}

// ── 事件绑定 ──────────────────────────────────────────────
function bindEvents() {
    // 点击主区域（卦象/信息区）→ 关闭方法面板，回实时模式
    const mainAreas = ['infoSection', 'hexSection'];
    mainAreas.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', function(e) {
                if (!liveMode) {
                    if (e.target.closest('button') || e.target.closest('select') ||
                        e.target.closest('input') || e.target.closest('#methodPanel')) {
                        return;
                    }
                    setLive();
                }
            });
            // iOS Safari touch 兼容
            el.addEventListener('touchend', function(e) {
                if (!liveMode) {
                    if (e.target.closest('button') || e.target.closest('select') ||
                        e.target.closest('input') || e.target.closest('#methodPanel')) {
                        return;
                    }
                    setLive();
                }
            });
        }
    });

    // 速查面板 — 切换按钮
    const refToggle = document.getElementById('refToggle');
    if (refToggle) {
        refToggle.addEventListener('click', toggleRef);
    }

    // 速查面板 — 关闭按钮
    const refClose = document.getElementById('refCloseBtn');
    if (refClose) {
        refClose.addEventListener('click', closeRef);
        refClose.addEventListener('touchend', function(e) {
            e.preventDefault();
            closeRef();
        });
    }

    // 速查面板 — 点遮罩关闭
    const overlay = document.getElementById('refOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeRef);
        overlay.addEventListener('touchend', function(e) {
            e.preventDefault();
            closeRef();
        });
    }
}

// ── 方法面板 ──────────────────────────────────────────────
function showMethodPanel() {
    const panel = document.getElementById('methodPanel');
    const content = document.getElementById('panelContent');
    activeMethod.buildPanel(content);
    activeMethod.activate();
    panel.classList.add('visible');
}

// ── 起卦 & 渲染 ─────────────────────────────────────────
function refresh() {
    let result;
    if (liveMode) {
        result = computeLive();
    } else {
        result = activeMethod.compute();
    }

    if (result) {
        render(result);
    }
}

function computeLive() {
    const now = new Date();
    const p = getFourPillars(now);
    const yn = BRANCH_NUM[p.yearGz[1]];
    const mn = p.lunarMonth;
    const dn = p.lunarDay;
    const hn = BRANCH_NUM[p.hourBranch];
    const leapS = p.isLeap ? '（闰）' : '';
    const label = `${p.yearGz}年  ${p.monthGz}月  ${p.dayGz}日  ${p.hourGz}时`;
    const detail = `农历${p.lunarYear}年${leapS}${LUNAR_MONTH_NAMES[mn-1]}${LUNAR_DAY_NAMES[dn-1]}`;
    return calcHexagram(yn, mn, dn, hn, label, detail);
}

function render(result) {
    document.getElementById('lblPillars').textContent = result.label;
    document.getElementById('lblDetail').textContent = result.detail;

    // 三卦
    const titles = ['本卦', '互卦', '变卦'];
    for (let col = 0; col < 3; col++) {
        const canvas = document.getElementById(`hexCanvas${col}`);
        const info = drawHexagram(canvas, result, col);

        document.getElementById(`hexTitle${col}`).textContent = titles[col];
        document.getElementById(`hexName${col}`).textContent = info.name;

        // 爻位标签（HTML 渲染，清晰矢量字）
        const labelDiv = document.getElementById(`yaoLabels${col}`);
        labelDiv.innerHTML = info.yaoLabels.map(l => `<span>${l}</span>`).join('');

        document.getElementById(`hexUpper${col}`).innerHTML =
            `<span style="color:${WUXING_COLOR[WUXING[info.upIdx]]}">${BAGUA_NAMES[info.upIdx-1]}（${WUXING[info.upIdx]}）</span>`;
        document.getElementById(`hexLower${col}`).innerHTML =
            `<span style="color:${WUXING_COLOR[WUXING[info.loIdx]]}">${BAGUA_NAMES[info.loIdx-1]}（${WUXING[info.loIdx]}）</span>`;
    }

    // 体用分析
    document.getElementById('tiYongRow').innerHTML = tiYongHTML(result);
}

// ── 定时刷新 ──────────────────────────────────────────────
function scheduleRefresh() {
    stopRefresh();
    refreshTimer = setInterval(refresh, REFRESH_MS);
}

function stopRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

// ── 速查面板 ──────────────────────────────────────────────
function buildRefTable() {
    const BAGUA_REF = [
        ['乾','金','1','西北','头骨肺','父','刚健、果断、领导','专横、固执'],
        ['兑','金','2','西','口舌肺','少女','喜悦、口才、亲和','谄媚、多言'],
        ['离','火','3','南','目心眼','中女','明礼、热情、美感','浮华、虚荣'],
        ['震','木','4','东','足肝筋','长男','积极、进取、行动','急躁、冲动'],
        ['巽','木','5','东南','股胆息','长女','柔韧、细致、通达','犹豫、随流'],
        ['坎','水','6','北','耳肾血','中男','聪慧、深谋、适应','阴险、忧郁'],
        ['艮','土','7','东北','手背节','少男','稳重、坚韧、守信','固执、迟钝'],
        ['坤','土','8','西南','腹肉脾','母','柔顺、包容、耐心','被动、优柔'],
    ];
    const HEADERS = ['卦','五行','序','方位','身体','家庭','性格正面','性格负面'];

    const headerRow = document.getElementById('refHeader');
    HEADERS.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });

    const tbody = document.getElementById('refBody');
    BAGUA_REF.forEach((row, ri) => {
        const tr = document.createElement('tr');
        tr.className = ri % 2 === 0 ? 'ref-even' : 'ref-odd';
        row.forEach((cell, ci) => {
            const td = document.createElement('td');
            td.textContent = cell;
            if (ci === 0) {
                const guaI = BAGUA_NAMES.indexOf(cell) + 1;
                td.style.color = WUXING_COLOR[WUXING[guaI]];
                td.style.fontWeight = 'bold';
            }
            if (ci === 1) {
                td.style.color = WUXING_COLOR[cell];
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function toggleRef() {
    const ref = document.getElementById('refPanel');
    const overlay = document.getElementById('refOverlay');
    if (ref.classList.contains('visible')) {
        ref.classList.remove('visible');
        overlay.classList.remove('visible');
    } else {
        ref.classList.add('visible');
        overlay.classList.add('visible');
    }
}

function closeRef() {
    document.getElementById('refPanel').classList.remove('visible');
    document.getElementById('refOverlay').classList.remove('visible');
}

// ── 启动 ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initApp);
