# Chrome 插件开发任务拆解与技术方案 - V1

## 1. 概述

本文档旨在将“Gemini 对话转 Markdown Chrome 插件”的需求进行详细的任务拆解，并提供初步的技术设计方案，作为后续开发工作的指导。

## 2. 任务拆解

根据产品需求文档 (PRD)，将开发任务拆解为以下几个主要模块：

### 2.1 插件基础架构

- **任务 2.1.1**: 创建 Chrome 插件项目结构。
- **任务 2.1.2**: 配置 `manifest.json` 文件，定义插件权限、入口文件等。
- **任务 2.1.3**: 实现插件图标点击事件，弹出插件主界面。

### 2.2 对话内容抓取 (Content Scraping)

- **策略**：
  - 鉴于 `gemini.html` 文件过大，且直接读取困难，我们将采用 Chrome 扩展的 Content Script 机制，在浏览器环境中直接访问和分析 DOM。
  - **定位对话元素**：
    - **已确认结构**：通过分析 `gemini-body.html`，确认对话内容被包裹在 `<share-turn-viewer>` 标签中。
    - **用户查询**：用户查询内容位于 `<share-turn-viewer>` 内部的 `<user-query>` 标签内。
    - **Gemini 回复**：Gemini 的回复内容位于 `<share-turn-viewer>` 内部的 `<response-container>` 标签内。
    - **内容提取**：实际的文本内容通常在 `<user-query-content>` 或 `<response-container-content>` 内部的 `<div class="markdown markdown-main-panel">` 或 `<div class="query-text">` 等标签中。
  - **动态内容处理**：
    - 使用 `MutationObserver` 监听 DOM 变化，确保在页面动态加载更多对话内容时，能够及时捕获并处理。
    - 针对滚动加载或延迟加载的内容，可能需要模拟滚动或等待特定事件触发。
- **技术选型**：
  - **DOM API**：直接使用 JavaScript 的 DOM API 进行元素选择、遍历和内容提取。
  - **CSS 选择器**：利用 `document.querySelector` 和 `document.querySelectorAll` 进行高效的元素定位。

### 2.3 HTML 到 Markdown 转换模块

- **任务 2.3.1**: 引入并配置 `turndown` 库。
- **任务 2.3.2**: 实现 HTML 到 Markdown 的转换逻辑，处理 Gemini 特有的格式。
  - **技术方案**：
    - `turndown` 库可以处理大部分 HTML 到 Markdown 的转换。
    - 需要针对 Gemini 的特定 HTML 结构（如 `<message-content>` 内部的 `markdown` 类）进行定制化规则，确保正确识别和转换对话文本。
    - 确保保留粗体、斜体、列表、代码块等格式。
- **任务 2.3.3**: 过滤掉非对话内容（如 UI 元素、广告等）。
  - **技术方案**：
    - 在抓取阶段就尽可能精确地定位对话内容，减少后续过滤的负担。
    - 对于难以避免的 UI 元素，可以通过 CSS 选择器进行排除，或者在 `turndown` 转换规则中定义过滤。

### 2.4 Markdown 输出与保存模块

- **任务 2.4.1**: 按照指定格式组织 Markdown 内容。
  - **技术方案**：
    - 根据 PRD 中定义的 Markdown 输出格式，拼接标题、元数据（原始地址、创建时间）、用户和 Gemini 的对话内容。
    - 确保每个对话轮次（`<share-turn-viewer>`）的顺序正确。
- **任务 2.4.2**: 实现将 Markdown 内容保存为文件（例如，通过下载）。
  - **技术方案**：
    - 利用 `chrome.downloads` API 或创建 Blob URL 并模拟点击下载链接的方式实现文件下载。
- **任务 2.4.3**: 确保输出的 Markdown 文件名包含日期和标题。
  - **技术方案**：
    - 从页面中提取标题和创建日期，并将其格式化为文件名的一部分。

### 2.5 用户界面 (UI) 设计与交互

- **任务 2.5.1**: 设计插件的弹出界面 (Popup UI)。
- **任务 2.5.2**: 实现用户点击按钮触发转换和下载功能。

### 2.6 错误处理与用户反馈

- **任务 2.6.1**: 实现错误捕获和友好的错误提示。
- **任务 2.6.2**: 提供转换进度和结果反馈。

## 3. 技术选型 (Technical Selections)

- **核心语言**：JavaScript
- **前端框架**：无（或轻量级，如 Vanilla JS + Web Components）
- **HTML 到 Markdown 转换库**：`turndown` (或类似库)
- **构建工具**：Webpack / Rollup (用于打包 Chrome 扩展)

## 4. 待定事项与风险 (Pending Matters & Risks)

- **Gemini 页面结构变化**：Google 可能会更新 Gemini 分享页面的 HTML 结构，导致当前选择器失效。需要定期检查和维护。
- **动态内容识别准确性**：确保 `MutationObserver` 能够准确捕获所有动态加载的对话内容，避免遗漏。
- **HTML 到 Markdown 转换的准确性**：复杂或非标准的 HTML 结构可能导致 `turndown` 转换不完全或出现格式问题，需要进行充分测试和定制化规则。
- **性能问题**：对于非常长的对话记录，DOM 操作和 Markdown 转换可能会导致性能问题，需要考虑优化策略。

## 5. 验收标准 (Acceptance Criteria)

- 插件能够成功安装并运行。
- 能够准确抓取 Gemini 分享页面中的所有对话内容（用户和 Gemini 的发言）。
- 能够将抓取到的 HTML 内容准确转换为 Markdown 格式，并保留原始格式（粗体、斜体、列表、代码块等）。
- 转换后的 Markdown 文件符合预期的输出格式。
- 能够正确提取并包含原始地址和创建时间信息。
- 插件界面友好，操作简便。
- 能够处理页面动态加载的内容。
- 能够过滤掉非对话的 UI 元素。
- 错误处理机制完善，提供清晰的用户反馈。

## 5. 后续步骤

1.- **深入分析 Gemini 分享页面 DOM**: 在浏览器开发者工具中手动检查 Gemini 分享页面的 DOM 结构，以准确识别对话内容的容器和相关属性。这是当前最关键的步骤，将直接影响后续的抓取和转换逻辑。
2. **原型开发**: 针对对话内容抓取和 HTML 到 Markdown 转换的核心功能进行原型开发和验证。
3. **测试**: 针对不同类型的 Gemini 对话（文本、代码、列表、图片等）进行充分测试，确保转换效果符合预期。

---

**文档版本**：V1
**创建日期**：2024年5月15日