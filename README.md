# 梅花易数 PWA

梅花易数 iOS 适配版 — PWA Web 应用，可添加到 iPhone 主屏幕，全屏运行，离线可用。

## 本地测试

```bash
cd plumPWA
python -m http.server 8080
```

浏览器打开 `http://localhost:8080` 即可预览。

## 部署到 GitHub Pages（免费）

### 1. 创建 GitHub 仓库

在 GitHub 上创建新仓库，例如 `plumPWA`。

### 2. 推送代码

```bash
cd plumPWA
git init
git add -A
git commit -m "梅花易数 PWA 初始版本"
git remote add origin https://github.com/<你的用户名>/plumPWA.git
git branch -M main
git push -u origin main
```

### 3. 启用 Pages

1. 进入仓库 → **Settings** → **Pages**
2. **Source** 选择 `Deploy from a branch`
3. **Branch** 选择 `main`，目录选 `/ (root)`
4. 点击 **Save**
5. 等待 1-2 分钟，获得 URL：`https://<你的用户名>.github.io/plumPWA/`

### 4. 在 iPhone 上安装

1. Safari 打开 `https://<你的用户名>.github.io/plumPWA/`
2. 首次加载会自动缓存所有文件（可离线使用）
3. 点击底部 **分享按钮**（↑）→ **「添加到主屏幕」**
4. 确认名称 → 完成
5. 主屏幕上会出现梅花易数图标，点击即可全屏运行

## 技术栈

- 纯 HTML + CSS + JavaScript，零框架依赖
- Canvas 绘制六爻卦象
- Service Worker 离线缓存
- iOS safe-area 适配（刘海屏/灵动岛）
