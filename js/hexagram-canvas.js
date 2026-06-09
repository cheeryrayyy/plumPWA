// -*- coding: utf-8 -*-
// 卦象 Canvas 绘制 & 主题常量

// ── 主题颜色 ─────────────────────────────────────────────
const THEME = {
    BG:          '#1a1a1a',
    FG:          '#d4a017',
    FG_BODY:     '#e8dfc8',
    FG_DIM:      '#9e9880',
    FG_LIVE:     '#2ecc88',
    ACCENT:      '#e06040',
    YAO_MOVING:  '#ff4500',
    SEP:         '#3a3a3a',
    PANEL_BG:    '#222222',

    HEX_COLORS:  ['#d4a017', '#2ecc88', '#8866dd'],  // 本卦/互卦/变卦

    METHOD_COLORS: {
        '实时':  '#2ecc88',
        '时间起卦': '#5aaee8',
        '笔画起卦': '#e8734a',
        '闻声起卦': '#c0a0d0',
        '行为起卦': '#e06040',
        '物数起卦': '#40c9a2',
    },
};

// ── 五行 ────────────────────────────────────────────────
const WUXING = {1:'金', 2:'金', 3:'火', 4:'木', 5:'木', 6:'水', 7:'土', 8:'土'};
const WUXING_COLOR = {'金':'#d4c46a', '木':'#5dbb6a', '水':'#5aaee8', '火':'#e8734a', '土':'#c09830'};

// ── 绘制六爻 ────────────────────────────────────────────
function drawHexagram(canvas, result, col) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const CX = W / 2;
    const hexColor = THEME.HEX_COLORS[col];

    ctx.clearRect(0, 0, W, H);

    let upIdx, loIdx, lns, move, title;
    if (col === 0) {
        upIdx = result.upper; loIdx = result.lower;
        lns = result.lines; move = result.move; title = '本卦';
    } else if (col === 1) {
        upIdx = result.mutualUpper; loIdx = result.mutualLower;
        lns = [result.lines[1], result.lines[2], result.lines[3],
               result.lines[2], result.lines[3], result.lines[4]];
        move = null; title = '互卦';
    } else {
        upIdx = result.changeUpper; loIdx = result.changeLower;
        lns = result.changeLines; move = result.move; title = '变卦';
    }

    const LINE_H = 20;
    const GAP_Y = 6;
    const totalH = 6 * LINE_H + 5 * GAP_Y;
    const y0 = (H - totalH) / 2 + LINE_H / 2;
    const lineW = 70;

    for (let i = 0; i < 6; i++) {
        const y = y0 + (5 - i) * (LINE_H + GAP_Y);
        const yang = lns[i] === 1;
        const isMoving = move !== null && (i + 1) === move;

        let color, lw, llen;
        if (isMoving) {
            color = THEME.YAO_MOVING; lw = 5; llen = lineW + 12;
        } else {
            color = hexColor; lw = 3.5; llen = lineW;
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (yang) {
            ctx.moveTo(CX - llen / 2, y);
            ctx.lineTo(CX + llen / 2, y);
        } else {
            const gap = llen / 5;
            const mid = llen / 2;
            ctx.moveTo(CX - mid, y);
            ctx.lineTo(CX - gap, y);
            ctx.moveTo(CX + gap, y);
            ctx.lineTo(CX + mid, y);
        }
        ctx.stroke();
    }

    return { title, upIdx, loIdx, move, hexColor, name: hexName(upIdx, loIdx) };
}

// ── 体用分析 ────────────────────────────────────────────
function getTiYong(result, col) {
    if (result.move == null) return null;
    const move = result.move;

    let benYong, benTi, bianYong, bianTi;
    if (move <= 3) {
        benYong = result.lower; benTi = result.upper;
        bianYong = result.changeLower; bianTi = result.changeUpper;
    } else {
        benYong = result.upper; benTi = result.lower;
        bianYong = result.changeUpper; bianTi = result.changeLower;
    }

    return { move, benYong, benTi, bianYong, bianTi };
}

function tiYongHTML(result) {
    const ty = getTiYong(result);
    if (!ty) return '';
    const parts = [];
    parts.push(`<span style="color:${THEME.ACCENT}">动爻：第${ty.move}爻</span>`);
    parts.push(' 本卦：');
    parts.push(`<span style="color:${WUXING_COLOR[WUXING[ty.benYong]]}">用${BAGUA_NAMES[ty.benYong-1]}${WUXING[ty.benYong]}</span>`);
    parts.push('，');
    parts.push(`<span style="color:${WUXING_COLOR[WUXING[ty.benTi]]}">体${BAGUA_NAMES[ty.benTi-1]}${WUXING[ty.benTi]}</span>`);
    parts.push(' ');
    parts.push(' 变卦：');
    parts.push(`<span style="color:${WUXING_COLOR[WUXING[ty.bianYong]]}">用${BAGUA_NAMES[ty.bianYong-1]}${WUXING[ty.bianYong]}</span>`);
    parts.push('，');
    parts.push(`<span style="color:${WUXING_COLOR[WUXING[ty.bianTi]]}">体${BAGUA_NAMES[ty.bianTi-1]}${WUXING[ty.bianTi]}</span>`);
    return parts.join('');
}
