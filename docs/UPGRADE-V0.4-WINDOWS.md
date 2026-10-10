# 升级 GlobalLaunch AI v0.3 → v0.4（Windows）

此版本**保留 v0.3 的 DeepSeek API 代码和 .env 配置方式**，不用重新创建 DeepSeek 密钥。

## 推荐方式：并行解压，复制私密配置

1. 确保 v0.3 已可以生成 `AI DRAFT READY` 报告。
2. 在 v0.3 的 PowerShell 终端按 `Ctrl+C`，停止旧服务（避免端口 3000 占用）。
3. 在 v0.3 文件夹找到 `.env`。**不要截图、上传或把内容发给其他人。**
4. 将新的 `GlobalLaunch-AI-DeepSeek-v0.4.zip` 解压到**新的文件夹**，进入其中的 `globallaunch-ai`。
5. 使用文件资源管理器把旧文件夹里的 `.env` **复制**到新文件夹的 `globallaunch-ai` 根目录（与 `package.json` 同级）。
6. 新文件夹地址栏输入 `powershell` 并回车，执行：

```powershell
Test-Path .\package.json
Test-Path .\.env
npm.cmd start
```

前两条均应显示 `True`。使用 `npm.cmd start` 可以避免某些 PowerShell 电脑默认禁止执行 `npm.ps1` 的报错。

7. 浏览器打开 http://127.0.0.1:3000 ，输入 Luma Botanics 测试简报，点击生成。
8. 如果显示 `AI DRAFT READY`，说明新版已成功通过 DeepSeek 实时生成。`API CONFIGURED` 仅代表找到了密钥，不能证明请求成功。
9. 选择「决策总览」「预算与执行」「风险审查」检查卡片和图表。
10. 点击 **↗ 导出PDF** → 浏览器打印页面中「目标打印机 / Destination」选择 **Save as PDF / 另存为 PDF** → 保存。

## 替换旧版的可选方式

如果必须在原文件夹替换，先复制 `.env` 到安全位置作为备份，移除旧文件夹代码后将新版内容解压回原路径，再放回 `.env`。不要误删 `.env`。**不要把 `.env` 放进公开 ZIP 或 GitHub。**

## 一般问题

- `ENOENT package.json`: PowerShell 不在 `globallaunch-ai` 目录。检查 `Get-Location` 和 `Test-Path .\package.json`。
- `npm.ps1 cannot be loaded`: 改用 `npm.cmd start`。
- `EADDRINUSE`: 旧服务器还在运行；在旧终端按 `Ctrl+C`，再启动新版。
- `DEMO MODE`: 新文件夹没有读取到 DeepSeek 密钥，确认 `.env` 放置位置和 `AI_PROVIDER=deepseek`。
- 生成失败 / 401 / 429: 检查 DeepSeek 密钥、余额和 API 限额；不要发送密钥给他人。
- PDF 没有自动下载：这是浏览器原生 PDF 方案，必须在打印对话框选择「Save as PDF」。
- PDF 没有颜色：打印选项启用「背景图形 / Background graphics」，Chrome/Edge 通常会保留图形颜色。

## 导出范围与限制

- 打印版自动渲染**完整六章**：战略、文案、预算与时间线、KPI与实验、风险、证据；不依赖当前所选标签页。
- 用 Chrome/Edge 浏览器原生 PDF 导出，不依赖第三方字体/CDN/付费 PDF 服务；支持中文。
- 根据字数长度，A4 报告可能出现章节续页。建议正式提交前检查每一页。
- 产品依旧是 AI 生成的策略草稿，不具备实时权威市场数据或自动法律合规认证。
