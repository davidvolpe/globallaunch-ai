# GlobalLaunch AI v0.5 | Windows 升级指南

此版本优化了首页及侧边栏的信息结构，保留 v0.4.1 的 DeepSeek API、可视化报告、Markdown 与 PDF 导出功能。

## 从当前正常运行的 v0.4.1 升级

1. 在旧项目运行的 PowerShell 窗口按 **Ctrl + C** 停止服务器。
2. 把 `GlobalLaunch-AI-DeepSeek-v0.5.zip` 解压到一个**全新文件夹**（不要覆盖旧项目）。
3. 把旧版项目根目录的 `.env` **复制**到新版 `globallaunch-ai` 目录（与 `package.json` 和 `server.mjs` 同级）。这样保留已配置好的 API 密钥。
4. 在新版 `globallaunch-ai` 文件夹的地址栏输入 `powershell` 回车。
5. 运行 `npm.cmd start`，在浏览器打开 `http://127.0.0.1:3000`。
6. 如果页面仍显示旧版，使用 Ctrl + Shift + R 强制刷新。页脚应显示 `v0.5`。

**不要把 `.env`、DeepSeek API Key、下载的私密数据上传到 GitHub。** 这个压缩包不包含任何真实密钥。

## 新版操作

- **营销工作台**：回到输入/结果区域。
- **查看生成报告**：成功生成后可点，自动跳转到完整报告。
- **新建营销简报**：清除当前结果（会先弹确认框）；建议先导出 PDF 或 MD。
- **方法与证据**：了解假设、合规与人工验证边界。
- **使用指南**：显示步骤与 API 说明。
- **☰**：桌面可收起左侧导航栏；手机点击顶部 ☰ 展开导航。
- 生成后自动显示精简的简报摘要，点击 **编辑简报** 可重新展开输入表单并修改后重新生成。
- **导出 PDF**：浏览器打印窗口选择「另存为 PDF」或「Microsoft Print to PDF」，关闭页眉和页脚，打开背景图形，纸张 A4。

## 验证

- `npm.cmd test` 应显示 **24 tests / 24 passed**。
- 页面顶部显示 `API CONFIGURED` 只是确认已配置密钥；实际生成报告出现 `AI DRAFT READY` 才表示真实模型已成功返回。
- 若没有 API Key，网站仍可用本地演示模式展示产品流程，但须如实标注 Demo。

## 常见问题

- `ENOENT package.json`：PowerShell 未进入含 `package.json` 的项目目录。
- `npm.ps1 cannot be loaded`：在 PowerShell 使用 `npm.cmd start`。
- 页面仍显示旧版：确认旧服务器已 Ctrl + C 停止，且是在**新版目录**启动服务，再强制刷新。
- API 调用失败：先检查 `.env` 是否放在项目根目录，检查官方平台余额及错误提示，不要公开 API Key。
