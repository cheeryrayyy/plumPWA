// -*- coding: utf-8 -*-
// 干支推算 — 年柱/月柱/日柱/时柱 & 农历转换

// ── 天干地支 ─────────────────────────────────────────────────
const STEMS  = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const BRANCH_NUM = Object.fromEntries(BRANCHES.map((b, i) => [b, i + 1]));

// ── 农历名称 ─────────────────────────────────────────────────
const LUNAR_MONTH_NAMES = ['正月','二月','三月','四月','五月','六月',
                           '七月','八月','九月','十月','十一月','腊月'];
const LUNAR_DAY_NAMES = [
    '初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十',
];
const HOUR_NAMES = BRANCHES.map(b => `${b}时`);

// ── 干支推算 ─────────────────────────────────────────────────
function _gz(si, bi) {
    return STEMS[si % 10] + BRANCHES[bi % 12];
}

function yearGz(year) {
    const yi = (year - 4) % 10;
    const bi = (year - 4) % 12;
    return _gz(yi < 0 ? yi + 10 : yi, bi < 0 ? bi + 12 : bi);
}

function monthGz(year, lmonth) {
    // 五虎遁年起月法
    const yi = (year - 4) % 10;
    const base = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0][yi < 0 ? yi + 10 : yi];
    const si = (base + (lmonth - 1)) % 10;
    const bi = (2 + (lmonth - 1)) % 12;  // 寅月起
    return _gz(si, bi);
}

// 参考日: 2000-01-07 = 甲子日
const _REF_DATE = new Date(2000, 0, 7);  // month is 0-indexed
const _REF_DAY_STEM = 0;   // 甲
const _REF_DAY_BRANCH = 0; // 子

function dayGz(date) {
    const diff = Math.floor((date - _REF_DATE) / (1000 * 60 * 60 * 24));
    const si = ((_REF_DAY_STEM + diff) % 10 + 10) % 10;
    const bi = ((_REF_DAY_BRANCH + diff) % 12 + 12) % 12;
    return _gz(si, bi);
}

function hourGz(dayGzStr, hour) {
    // 五鼠遁日起时法，hour 为 0-23
    const di = STEMS.indexOf(dayGzStr[0]);
    const base = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8][di];
    let bi;
    if (hour === 23) {
        bi = 0;
    } else {
        bi = Math.floor((hour + 1) / 2) % 12;
    }
    const si = (base + bi) % 10;
    return _gz(si, bi);
}

function hourBranch(hour) {
    if (hour === 23) return '子';
    return BRANCHES[Math.floor((hour + 1) / 2) % 12];
}

// ── 农历转换（移植自 lunardate 库）─────────────────────────────
const _START_DATE = new Date(1900, 0, 31);  // 1900-01-31 = 农历1900正月初一

// 农历年数据编码 (1900-2099)
const YEAR_INFOS = [19416,19168,42352,21717,53856,55632,91476,22176,39632,21970,19168,42422,42192,53840,119381,46400,54944,44450,38320,84343,18800,42160,46261,27216,27968,109396,11104,38256,21234,18800,25958,54432,59984,28309,23248,11104,100067,37600,116951,51536,54432,120998,46416,22176,107956,9680,37584,53938,43344,46423,27808,46416,86869,19872,42448,83315,21168,43432,59728,27296,44710,43856,19296,43748,42352,21088,62051,55632,23383,22176,38608,19925,19152,42192,54484,53840,54616,46400,46496,103846,38320,18864,43380,42160,45690,27216,27968,44870,43872,38256,19189,18800,25776,29859,59984,27480,23232,43872,38613,37600,51552,55636,54432,55888,30034,22176,43959,9680,37584,51893,43344,46240,47780,44368,21977,19360,42416,86390,21168,43312,31060,27296,44368,23378,19296,42726,42208,53856,60005,54576,23200,30371,38608,19195,19152,42192,118966,53840,54560,56645,46496,22224,21938,18864,42359,42160,43600,111189,27936,44448,84835,37744,18936,18800,25776,92326,59984,27296,108228,43744,37600,53987,51552,54615,54432,55888,23893,22176,42704,21972,21200,43448,43344,46240,46758,44368,21920,43940,42416,21168,45683,26928,29495,27296,44368,84821,19296,42352,21732,53600,59752,54560,55968,92838,22224,19168,43476,41680,53584,62034];

// _yearDays 预计算（缓存）
let _yearDays = null;
function _getYearDays() {
    if (_yearDays) return _yearDays;
    _yearDays = YEAR_INFOS.map(info => {
        let res = 29 * 12;
        const leap = (info % 16) !== 0;
        if (leap) res += 29;
        let v = Math.floor(info / 16);
        for (let i = 0; i < 12 + (leap ? 1 : 0); i++) {
            if (v % 2 === 1) res += 1;
            v = Math.floor(v / 2);
        }
        return res;
    });
    return _yearDays;
}

function solarToLunar(year, month, day) {
    // 返回 { year, month, day, isLeap }
    // 使用 UTC 计算避免时区偏差
    const utcDate = Date.UTC(year, month - 1, day);
    const utcStart = Date.UTC(1900, 0, 31);
    let offset = Math.floor((utcDate - utcStart) / (1000 * 60 * 60 * 24));

    const yearDays = _getYearDays();
    let lunarYear = 1900;
    for (let i = 0; i < yearDays.length; i++) {
        if (offset < yearDays[i]) break;
        offset -= yearDays[i];
        lunarYear = 1900 + i + 1;
    }

    const yearIdx = lunarYear - 1900;
    const yearInfo = YEAR_INFOS[yearIdx];

    // 枚举月份
    const months = [];
    for (let m = 1; m <= 12; m++) {
        months.push({ month: m, isLeap: false });
    }
    const leapMonth = yearInfo % 16;
    if (leapMonth > 0 && leapMonth <= 12) {
        months.splice(leapMonth, 0, { month: leapMonth, isLeap: true });
    }

    let lunarMonth, lunarDay, isLeap;
    for (const m of months) {
        let days;
        if (m.isLeap) {
            days = ((yearInfo >> 16) % 2) + 29;
        } else {
            days = ((yearInfo >> (16 - m.month)) % 2) + 29;
        }
        if (offset < days) {
            lunarMonth = m.month;
            lunarDay = offset + 1;
            isLeap = m.isLeap;
            break;
        }
        offset -= days;
    }

    return { year: lunarYear, month: lunarMonth, day: lunarDay, isLeap };
}

// ── 四柱输出 ─────────────────────────────────────────────────
function getFourPillars(date) {
    const solar = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const lunar = solarToLunar(solar.getFullYear(), solar.getMonth() + 1, solar.getDate());

    const yg = yearGz(lunar.year);
    const mg = monthGz(lunar.year, lunar.month);
    const dg = dayGz(solar);
    const hour = date.getHours();
    const hg = hourGz(dg, hour);
    const hb = hourBranch(hour);

    return {
        yearGz: yg, monthGz: mg, dayGz: dg, hourGz: hg,
        hourBranch: hb,
        lunarYear: lunar.year, lunarMonth: lunar.month, lunarDay: lunar.day,
        isLeap: lunar.isLeap,
        solar: solar,
    };
}
