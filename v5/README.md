# 数独教练 v5 Beta

这是一次架构重构，不再在单个 HTML 内持续打补丁。

## 模块
- `js/core.js`：棋盘、候选、撤销、状态
- `js/solver.js`：提示/解题逻辑
- `js/scanner.js`：图片、棋盘定位、透视、OCR
- `js/trainer.js`：Wing 专项训练内容
- `js/app.js`：UI 与模块连接
- `css/app.css`：iPhone 优先界面

## 本 Beta 的重点
1. 扫描流程改为：选图 → 自动找棋盘 → 人工确认 → 拉正预览 → OCR → 校对 → 导入。
2. OCR 不再和棋盘定位混在一起。
3. W-Wing / XY-Wing 专练改为分步骤教学。
4. Solver 与候选状态独立，候选删除可持久保存。

## 部署
建议单独建立 `v5/` 测试目录，不覆盖 v4：
`https://ouwu-yang.github.io/sudoku-coach/v5/`

## 当前自动回归
- JavaScript 模块语法：5/5 通过
- 固定专家题解题回归：10/10 完整解到底
- v5 Beta 目前重点是架构与流程验证；扫描器还需要继续扩大真实拍照样本。
