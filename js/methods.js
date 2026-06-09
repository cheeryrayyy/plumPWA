// -*- coding: utf-8 -*-
// 五种起卦方法 + 实时模式

// ── 时间起卦 ──────────────────────────────────────────────
class TimeMethod {
    constructor() {
        this.name = '时间起卦';
        this.icon = '⏰';
        this._result = null;
        this._mode = '阳历';
    }

    activate() {}
    deactivate() {}

    compute() { return this._result; }

    buildPanel(container) {
        container.innerHTML = '';

        // 模式选择
        const modeRow = document.createElement('div');
        modeRow.className = 'method-mode-row';
        ['阳历','阴历','地支'].forEach(m => {
            const btn = document.createElement('button');
            btn.textContent = m;
            btn.className = 'mode-btn' + (m === this._mode ? ' active' : '');
            btn.addEventListener('click', () => {
                this._mode = m;
                this.buildPanel(container);
            });
            modeRow.appendChild(btn);
        });
        container.appendChild(modeRow);

        // 输入行
        const inputRow = document.createElement('div');
        inputRow.className = 'method-input-row';

        const now = new Date();

        if (this._mode === '阳历') {
            this._buildSelect(inputRow, '年', range(1900, 2100), now.getFullYear());
            this._buildSelect(inputRow, '月', range(1, 12), now.getMonth() + 1);
            this._buildSelect(inputRow, '日', range(1, 31), now.getDate());
            this._buildSelect(inputRow, '时辰', HOUR_NAMES, HOUR_NAMES[Math.floor(now.getHours() / 2) % 12]);
        } else if (this._mode === '阴历') {
            const lunarNow = solarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate());
            this._buildSelect(inputRow, '年', range(1900, 2100), lunarNow.year);
            this._buildSelect(inputRow, '月', LUNAR_MONTH_NAMES, LUNAR_MONTH_NAMES[lunarNow.month - 1]);
            this._buildSelect(inputRow, '日', LUNAR_DAY_NAMES, LUNAR_DAY_NAMES[lunarNow.day - 1]);
            this._buildSelect(inputRow, '时辰', HOUR_NAMES, HOUR_NAMES[Math.floor(now.getHours() / 2) % 12]);
        } else {
            this._buildSelect(inputRow, '年支', BRANCHES, BRANCHES[((now.getFullYear() - 4) % 12 + 12) % 12]);
            this._buildSelect(inputRow, '月', LUNAR_MONTH_NAMES, LUNAR_MONTH_NAMES[0]);
            this._buildSelect(inputRow, '日', LUNAR_DAY_NAMES, LUNAR_DAY_NAMES[0]);
            this._buildSelect(inputRow, '时支', BRANCHES.map(b => `${b}时`), `${BRANCHES[Math.floor(now.getHours() / 2) % 12]}时`);
        }
        container.appendChild(inputRow);

        // 起卦按钮
        const castBtn = document.createElement('button');
        castBtn.textContent = '起  卦';
        castBtn.className = 'cast-btn';
        castBtn.style.accentColor = THEME.METHOD_COLORS['时间起卦'];
        castBtn.addEventListener('click', () => this._doCast(container));
        container.appendChild(castBtn);
    }

    _buildSelect(parent, label, values, defaultVal) {
        const lbl = document.createElement('label');
        lbl.textContent = label;
        lbl.className = 'method-label';
        parent.appendChild(lbl);

        const sel = document.createElement('select');
        sel.className = 'method-select';
        values.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v; opt.textContent = v;
            if (String(v) === String(defaultVal)) opt.selected = true;
            sel.appendChild(opt);
        });
        parent.appendChild(sel);
        return sel;
    }

    _doCast(container) {
        const selects = container.querySelectorAll('select');
        const vals = Array.from(selects).map(s => s.value);

        try {
            let yn, mn, dn, hn, label, detail;
            const mode = this._mode;

            if (mode === '阳历') {
                const y = parseInt(vals[0]), m = parseInt(vals[1]), d = parseInt(vals[2]);
                const hName = vals[3];
                const hIdx = HOUR_NAMES.indexOf(hName);
                const hb = BRANCHES[hIdx];
                const lunar = solarToLunar(y, m, d);
                yn = BRANCH_NUM[BRANCHES[((y - 4) % 12 + 12) % 12]];
                mn = lunar.month; dn = lunar.day;
                hn = BRANCH_NUM[hb];
                label = `阳历 ${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}  ${hb}时`;
                detail = `农历${LUNAR_MONTH_NAMES[lunar.month-1]}${LUNAR_DAY_NAMES[lunar.day-1]}`;
            } else if (mode === '阴历') {
                const ly = parseInt(vals[0]);
                const lm = LUNAR_MONTH_NAMES.indexOf(vals[1]) + 1;
                const ld = LUNAR_DAY_NAMES.indexOf(vals[2]) + 1;
                const hName = vals[3];
                const hIdx = HOUR_NAMES.indexOf(hName);
                const hb = BRANCHES[hIdx];
                yn = BRANCH_NUM[BRANCHES[((ly - 4) % 12 + 12) % 12]];
                mn = lm; dn = ld; hn = BRANCH_NUM[hb];
                label = `农历${ly}年 ${LUNAR_MONTH_NAMES[lm-1]} ${LUNAR_DAY_NAMES[ld-1]}  ${hb}时`;
                detail = '';
            } else {
                const yb = vals[0];
                const lm = LUNAR_MONTH_NAMES.indexOf(vals[1]) + 1;
                const ld = LUNAR_DAY_NAMES.indexOf(vals[2]) + 1;
                const hb = vals[3].replace('时','');
                yn = BRANCH_NUM[yb];
                mn = lm; dn = ld; hn = BRANCH_NUM[hb];
                label = `${yb}年  ${LUNAR_MONTH_NAMES[lm-1]}  ${LUNAR_DAY_NAMES[ld-1]}  ${hb}时`;
                detail = '（地支起卦）';
            }

            this._result = calcHexagram(yn, mn, dn, hn, label, detail);
            if (this._castCb) this._castCb();
        } catch (e) {
            console.error('[TimeMethod] 起卦错误:', e);
        }
    }

    setCastCallback(cb) { this._castCb = cb; }
}

// ── 笔画起卦 ──────────────────────────────────────────────
class StrokesMethod {
    constructor() {
        this.name = '笔画起卦';
        this.icon = '✏️';
        this._result = null;
        this._castCb = null;
        const nowH = new Date().getHours();
        this._shichen = HOUR_NAMES[Math.floor(nowH / 2) % 12];
    }

    activate() {}
    deactivate() {}
    compute() { return this._result; }

    buildPanel(container) {
        container.innerHTML = '';
        const tip = document.createElement('div');
        tip.className = 'method-tip';
        tip.textContent = '输入汉字（不少于2个），按回车起卦';
        container.appendChild(tip);

        const inputRow = document.createElement('div');
        inputRow.className = 'method-input-row';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'method-text-input';
        input.placeholder = '输入汉字...';
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') this._doCast(input.value);
        });
        inputRow.appendChild(input);

        const shichenSel = document.createElement('select');
        shichenSel.className = 'method-select';
        HOUR_NAMES.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h; opt.textContent = h;
            if (h === this._shichen) opt.selected = true;
            shichenSel.appendChild(opt);
        });
        shichenSel.addEventListener('change', () => { this._shichen = shichenSel.value; });
        inputRow.appendChild(shichenSel);

        container.appendChild(inputRow);

        const castBtn = document.createElement('button');
        castBtn.textContent = '起  卦';
        castBtn.className = 'cast-btn';
        castBtn.addEventListener('click', () => this._doCast(input.value));
        container.appendChild(castBtn);

        // Focus input after render
        setTimeout(() => input.focus(), 200);
    }

    _doCast(text) {
        text = text.trim();
        const han = [...text].filter(c => isChinese(c));
        if (han.length < 2) return;

        const strokes = countStrokes(han.join(''));
        if (strokes.length < 2) return;

        const n = strokes.length;
        const mid = n % 2 === 0 ? Math.floor(n / 2) : Math.floor((n - 1) / 2);
        const first = strokes.slice(0, mid);
        const second = strokes.slice(mid);
        const total = strokes.reduce((a, b) => a + b, 0);

        const hIdx = HOUR_NAMES.indexOf(this._shichen);
        const hb = BRANCHES[hIdx];
        const hn = BRANCH_NUM[hb];

        const upper = _mod8(first.reduce((a, b) => a + b, 0));
        const lower = _mod8(second.reduce((a, b) => a + b, 0));
        const move = _mod6(total + hn);

        const label = `「${text}」  总笔画 ${total}  ${hb}时`;
        const detail = `上卦笔画 ${first.reduce((a,b)=>a+b,0)} ÷ 8 余 ${upper}    下卦笔画 ${second.reduce((a,b)=>a+b,0)} ÷ 8 余 ${lower}    （总 ${total} + 时辰数 ${hn}）÷ 6 余 ${move}（动爻）`;

        this._result = buildResult(upper, lower, move, label, detail);
        if (this._castCb) this._castCb();
    }

    setCastCallback(cb) { this._castCb = cb; }
}

// ── 闻声起卦 ──────────────────────────────────────────────
class SoundMethod {
    constructor() {
        this.name = '闻声起卦';
        this.icon = '🔔';
        this._result = null;
        this._castCb = null;
        this._upper = 1;
        this._lower = 1;
        const nowH = new Date().getHours();
        this._shichen = HOUR_NAMES[Math.floor(nowH / 2) % 12];
    }

    activate() {}
    deactivate() {}
    compute() { return this._result; }

    buildPanel(container) {
        container.innerHTML = '';
        const row = document.createElement('div');
        row.className = 'method-sound-row';

        const trigChoices = BAGUA_NAMES.map((n, i) => `${n}（${WUXING[i+1]}）`);

        // 上卦
        row.appendChild(this._makeTag('上卦'));
        const upperSel = this._makeSelect(trigChoices, trigChoices[0]);
        upperSel.addEventListener('change', () => {
            this._upper = trigChoices.indexOf(upperSel.value) + 1;
            this._updateBadge(upperBadge, this._upper);
        });
        row.appendChild(upperSel);
        const upperBadge = document.createElement('span');
        upperBadge.className = 'wuxing-badge';
        this._updateBadge(upperBadge, 1);
        row.appendChild(upperBadge);

        // 下卦
        row.appendChild(this._makeTag('下卦'));
        const lowerSel = this._makeSelect(trigChoices, trigChoices[0]);
        lowerSel.addEventListener('change', () => {
            this._lower = trigChoices.indexOf(lowerSel.value) + 1;
            this._updateBadge(lowerBadge, this._lower);
        });
        row.appendChild(lowerSel);
        const lowerBadge = document.createElement('span');
        lowerBadge.className = 'wuxing-badge';
        this._updateBadge(lowerBadge, 1);
        row.appendChild(lowerBadge);

        // 时辰
        row.appendChild(this._makeTag('时辰'));
        const shichenSel = this._makeSelect(HOUR_NAMES, this._shichen);
        shichenSel.addEventListener('change', () => { this._shichen = shichenSel.value; });
        row.appendChild(shichenSel);

        container.appendChild(row);

        const castBtn = document.createElement('button');
        castBtn.textContent = '起  卦';
        castBtn.className = 'cast-btn';
        castBtn.addEventListener('click', () => this._doCast());
        container.appendChild(castBtn);
    }

    _makeTag(text) {
        const s = document.createElement('span');
        s.textContent = text;
        s.className = 'method-tag';
        return s;
    }

    _makeSelect(values, defaultVal) {
        const sel = document.createElement('select');
        sel.className = 'method-select';
        values.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v; opt.textContent = v;
            if (v === defaultVal) opt.selected = true;
            sel.appendChild(opt);
        });
        return sel;
    }

    _updateBadge(el, idx) {
        const wx = WUXING[idx];
        el.textContent = wx;
        el.style.background = WUXING_COLOR[wx];
    }

    _doCast() {
        const hIdx = HOUR_NAMES.indexOf(this._shichen);
        const hb = BRANCHES[hIdx];
        const hn = BRANCH_NUM[hb];
        const move = _mod6(this._upper + this._lower + hn);

        const uw = WUXING[this._upper], lw = WUXING[this._lower];
        const label = `上卦：${BAGUA_NAMES[this._upper-1]}（${uw}）  下卦：${BAGUA_NAMES[this._lower-1]}（${lw}）  ${hb}时`;
        const detail = `上卦数 ${this._upper} + 下卦数 ${this._lower} + 时辰数 ${hn} = ${this._upper+this._lower+hn} ÷ 6 余 ${move}（动爻）`;

        this._result = buildResult(this._upper, this._lower, move, label, detail);
        if (this._castCb) this._castCb();
    }

    setCastCallback(cb) { this._castCb = cb; }
}

// ── 行为起卦 ──────────────────────────────────────────────
class BehaviorMethod {
    constructor() {
        this.name = '行为起卦';
        this.icon = '🚶';
        this._result = null;
        this._castCb = null;
        this._upper = 1;
        this._lower = 1;
        const nowH = new Date().getHours();
        this._shichen = HOUR_NAMES[Math.floor(nowH / 2) % 12];
    }

    activate() {}
    deactivate() {}
    compute() { return this._result; }

    buildPanel(container) {
        // 与闻声起卦面板相同
        const sm = new SoundMethod();
        sm._upper = this._upper; sm._lower = this._lower;
        sm._shichen = this._shichen;
        sm._castCb = () => {
            this._upper = sm._upper; this._lower = sm._lower;
            this._shichen = sm._shichen;
            this._result = sm._result;
            if (this._castCb) this._castCb();
        };
        sm.setCastCallback(() => {
            this._upper = sm._upper; this._lower = sm._lower;
            this._shichen = sm._shichen;
            this._result = sm._result;
            if (this._castCb) this._castCb();
        });
        sm.name = '行为起卦';
        sm.buildPanel(container);
    }

    setCastCallback(cb) { this._castCb = cb; }
}

// ── 物数起卦 ──────────────────────────────────────────────
class ObjectMethod {
    constructor() {
        this.name = '物数起卦';
        this.icon = '🔢';
        this._result = null;
        this._castCb = null;
        const nowH = new Date().getHours();
        this._shichen = HOUR_NAMES[Math.floor(nowH / 2) % 12];
    }

    activate() {}
    deactivate() {}
    compute() { return this._result; }

    buildPanel(container) {
        container.innerHTML = '';
        const tip = document.createElement('div');
        tip.className = 'method-tip';
        tip.textContent = '输入所见物品的数量，按回车起卦';
        container.appendChild(tip);

        const inputRow = document.createElement('div');
        inputRow.className = 'method-input-row';

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'method-text-input';
        input.placeholder = '如: 3';
        input.min = '1';
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') this._doCast(input.value);
        });
        inputRow.appendChild(input);

        const shichenSel = document.createElement('select');
        shichenSel.className = 'method-select';
        HOUR_NAMES.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h; opt.textContent = h;
            if (h === this._shichen) opt.selected = true;
            shichenSel.appendChild(opt);
        });
        shichenSel.addEventListener('change', () => { this._shichen = shichenSel.value; });
        inputRow.appendChild(shichenSel);

        container.appendChild(inputRow);

        const castBtn = document.createElement('button');
        castBtn.textContent = '起  卦';
        castBtn.className = 'cast-btn';
        castBtn.addEventListener('click', () => this._doCast(input.value));
        container.appendChild(castBtn);

        setTimeout(() => input.focus(), 200);
    }

    _doCast(val) {
        const count = parseInt(val);
        if (isNaN(count) || count <= 0) return;

        const hIdx = HOUR_NAMES.indexOf(this._shichen);
        const hb = BRANCHES[hIdx];
        const hn = BRANCH_NUM[hb];

        const upper = _mod8(count);
        const lower = _mod8(hn);
        const move = _mod6(count + hn);

        const label = `物数 ${count}  ${hb}时`;
        const detail = `物数 ${count} ÷ 8 余 ${upper}（上卦）    时辰数 ${hn} ÷ 8 余 ${lower}（下卦）    （${count} + ${hn}）÷ 6 余 ${move}（动爻）`;

        this._result = buildResult(upper, lower, move, label, detail);
        if (this._castCb) this._castCb();
    }

    setCastCallback(cb) { this._castCb = cb; }
}

// ── 工具 ────────────────────────────────────────────────
function range(start, end) {
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(String(i));
    return arr;
}
