// -*- coding: utf-8 -*-
// 汉字笔画数查询（从 strokes.json 加载）

let _strokeMap = null;
let _loadPromise = null;

function loadStrokes() {
    if (_loadPromise) return _loadPromise;
    _loadPromise = fetch('data/strokes.json')
        .then(r => r.json())
        .then(data => { _strokeMap = data; })
        .catch(err => { console.error('Failed to load strokes:', err); });
    return _loadPromise;
}

function isChinese(c) {
    return c >= '一' && c <= '鿿'
        || c >= '㐀' && c <= '䶿'   // CJK Extension A
        || c >= '豈' && c <= '﫿';  // CJK Compatibility
}

function countStrokes(text) {
    if (!_strokeMap) return [];
    const result = [];
    for (const ch of text) {
        if (isChinese(ch)) {
            const n = _strokeMap[ch];
            if (n !== undefined) result.push(n);
        }
    }
    return result;
}
