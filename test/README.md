# 数独教练 iOS PWA v3

这是重新设计的 iPhone 优先版本。

## 更新方式
将本目录文件上传/覆盖到 GitHub 仓库根目录：
- index.html
- manifest.webmanifest
- service-worker.js
- icons/

GitHub Pages 会自动重新部署。

## 重点
- 底部 5 个标签页：做题 / 拍照 / 提示 / 专练 / 设置
- 做题棋盘置于第一屏
- 所有 OCR 代码按需加载，OCR 失败不会导致其他按钮失效
- 支持自动候选、候选笔记、撤销、冲突检查
- 分层提示基础引擎
- W-Wing / XY-Wing / X-Wing 专练
