// -*- coding: utf-8 -*-
// 六十四卦数据与起卦算法

const BAGUA_NAMES = ['乾','兑','离','震','巽','坎','艮','坤'];  // 1-8

// 八卦三爻（从下到上）：1=阳 0=阴
const TRIGRAM_LINES = [
    [1,1,1],  // 1 乾 ☰
    [1,1,0],  // 2 兑 ☱
    [1,0,1],  // 3 离 ☲
    [1,0,0],  // 4 震 ☳
    [0,1,1],  // 5 巽 ☴
    [0,1,0],  // 6 坎 ☵
    [0,0,1],  // 7 艮 ☶
    [0,0,0],  // 8 坤 ☷
];

// 六十四卦 (上卦,下卦) → 卦名
const HEXAGRAM_NAMES = {};
const hexData = [
    [1,1,'乾为天'],[1,2,'天泽履'],[1,3,'天火同人'],[1,4,'天雷无妄'],
    [1,5,'天风姤'],[1,6,'天水讼'],[1,7,'天山遁'],[1,8,'天地否'],
    [2,1,'泽天夬'],[2,2,'兑为泽'],[2,3,'泽火革'],[2,4,'泽雷随'],
    [2,5,'泽风大过'],[2,6,'泽水困'],[2,7,'泽山咸'],[2,8,'泽地萃'],
    [3,1,'火天大有'],[3,2,'火泽睽'],[3,3,'离为火'],[3,4,'火雷噬嗑'],
    [3,5,'火风鼎'],[3,6,'火水未济'],[3,7,'火山旅'],[3,8,'火地晋'],
    [4,1,'雷天大壮'],[4,2,'雷泽归妹'],[4,3,'雷火丰'],[4,4,'震为雷'],
    [4,5,'雷风恒'],[4,6,'雷水解'],[4,7,'雷山小过'],[4,8,'雷地豫'],
    [5,1,'风天小畜'],[5,2,'风泽中孚'],[5,3,'风火家人'],[5,4,'风雷益'],
    [5,5,'巽为风'],[5,6,'风水涣'],[5,7,'风山渐'],[5,8,'风地观'],
    [6,1,'水天需'],[6,2,'水泽节'],[6,3,'水火既济'],[6,4,'水雷屯'],
    [6,5,'水风井'],[6,6,'坎为水'],[6,7,'水山蹇'],[6,8,'水地比'],
    [7,1,'山天大畜'],[7,2,'山泽损'],[7,3,'山火贲'],[7,4,'山雷颐'],
    [7,5,'山风蛊'],[7,6,'山水蒙'],[7,7,'艮为山'],[7,8,'山地剥'],
    [8,1,'地天泰'],[8,2,'地泽临'],[8,3,'地火明夷'],[8,4,'地雷复'],
    [8,5,'地风升'],[8,6,'地水师'],[8,7,'地山谦'],[8,8,'坤为地'],
];
hexData.forEach(([u, l, n]) => { HEXAGRAM_NAMES[`${u},${l}`] = n; });

// ── 工具函数 ────────────────────────────────────────────────
function _mod8(n) { const r = n % 8; return r !== 0 ? r : 8; }
function _mod6(n) { const r = n % 6; return r !== 0 ? r : 6; }

function _trigramLines(idx) {
    return TRIGRAM_LINES[idx - 1];
}

function _combineLines(lowerIdx, upperIdx) {
    const lo = _trigramLines(lowerIdx);
    const hi = _trigramLines(upperIdx);
    return [...lo, ...hi];  // [爻1...爻6] 从下到上
}

function _linesToTrigram(lines3) {
    for (let i = 0; i < TRIGRAM_LINES.length; i++) {
        const tl = TRIGRAM_LINES[i];
        if (tl[0] === lines3[0] && tl[1] === lines3[1] && tl[2] === lines3[2]) {
            return i + 1;
        }
    }
    return 1;
}

// ── 构建卦象结果 ──────────────────────────────────────────
function buildResult(upper, lower, move, label = '', detail = '') {
    const lines = _combineLines(lower, upper);
    const mutualLower = _linesToTrigram(lines.slice(1, 4));
    const mutualUpper = _linesToTrigram(lines.slice(2, 5));

    const ch = [...lines];
    ch[move - 1] = 1 - ch[move - 1];
    const changeLines = ch;

    return {
        upper, lower, move,
        lines,
        mutualUpper, mutualLower,
        changeUpper: _linesToTrigram(changeLines.slice(3)),
        changeLower: _linesToTrigram(changeLines.slice(0, 3)),
        changeLines,
        label, detail,
    };
}

function calcHexagram(yearN, monthN, dayN, hourN, label = '', detail = '') {
    const s3 = yearN + monthN + dayN;
    const s4 = s3 + hourN;
    return buildResult(_mod8(s3), _mod8(s4), _mod6(s4), label, detail);
}

function hexName(upper, lower) {
    return HEXAGRAM_NAMES[`${upper},${lower}`] || `卦(${upper},${lower})`;
}
