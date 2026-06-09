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
const YEAR_INFOS = [19416,19168,42352,21717,53856,55632,91476,22176,39632,21970,19168,42422,42192,53840,119381,46400,54944,44450,38320,84343,18800,42160,46261,27216,27968,109396,11104,38256,21234,18800,25958,54432,59984,28309,23248,11104,10004,37776,50656,28262,23200,21232,66176,37600,55920,56657,27440,18176,71736,23056,40784,24882,21600,24400,100052,21152,24496,10514,56096,44592,87846,23376,22208,44454,26592,5136,22704,29776,32112,39195,21776,22064,43664,22800,75504,32016,21984,54416,58760,23296,21792,50960,54673,27920,32416,87590,22224,29296,54576,88,19168,42426,43408,53872,57588,36496,28240,28256,10626,43776,25952,61232,25904,30400,55088,49992,22288,23280,52560,57776,28432,31376,52992,18320,60928,29248,10017,42272,24880,44080,16688,24272,50896,56144,34576,26848,42768,56144,27904,29456,61216,25968,44560,37648,9192,30448,55185,22144,17968,55568,48176,22576,22800,43568,63696,23632,26992,22296,42784,23984,53136,29200,100032,21632,49776,56593,22096,43552,89376,21520,16976,64,34112,58368,31056,21120,22344,40928,36448,30528,43760,23248,48144,30784,36416,100145,29504,54688,56650,18960,40208,35216,22096,62928,5280,20928,54669,44224,25936,47824,20000,35680,49776,58793,30528,27216,34576,26992,37296,54576,19792,43104,54856,33216,22784,50960,56657,52272,26992,100017,39728,48448,65344,25952,46928,56032,42512,19232,22304,45232,17136,27344,49842,27344,49616,19792,47904,15896,35632,57680,54321,23344,21776,43888,25616,53760,29472,100016,22800,56080,21758,5168,19504,49424,26440,21248,49776,48446,42576,26992,54000,17744,17184,47888,36608,20720,15248,100112,21728,14416,64336,22768,38240,54692,4432,25872,51504,53168,29968,38208,10512,20080,38256,59744,47474,21344,17200,48976,23360,57360,46673,29440,35680,19712,64304,14144,50448,57536,26720,10512,40592,40992,43760,61792,5408,22768,21256,32256,20016,49472,61504,46976,28944,28960,9009,21760,50704,48480,42512,19232,25952,52528,47920,4944,21776,25952,12000,59728,46976,54576,33776,12576,20240,49408,45984,33872,16672,19680,57520,46832,53984,48464,37296,17216,58640,28080,20064,51200,100088,42592,53520,15663,3328,37984,25600,32544,44368,50640,42016,25984,18752,13280,15664,16672,38688,46928,22560,10528,12272,10528,0];

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
    const solarDate = new Date(year, month - 1, day);
    let offset = Math.floor((solarDate - _START_DATE) / (1000 * 60 * 60 * 24));

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
