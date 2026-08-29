# 数独教练 PWA

这是可直接部署到 GitHub Pages 的静态 PWA 版本。

## GitHub Pages
1. 新建公开仓库，例如 `sudoku-coach`
2. 将本目录全部文件上传到仓库根目录
3. Settings → Pages
4. Source 选择 `Deploy from a branch`
5. Branch 选择 `main` / `(root)`
6. 保存并等待 GitHub Pages 生成网址

## iPhone
Safari 打开 Pages 地址 → 分享 → 添加到主屏幕 → 作为网页 App 打开。

## 离线说明
主程序、图标和教学功能可被 PWA 缓存后离线使用。
照片 OCR 当前仍会在线加载 Tesseract.js 组件，因此 OCR 首次使用或缓存失效时需要网络。
