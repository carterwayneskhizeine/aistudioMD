# 🚀 Gemini Chat to Markdown Converter

一个强大的Chrome扩展程序，可以将Gemini共享对话记录转换为清晰、结构化的Markdown格式文件。

## ✨ 主要功能

- **智能内容提取**：从Gemini共享页面精确提取用户查询和AI回复
  - 支持常规对话内容提取
  - 支持特殊文档内容提取（`message-content` 元素）
- **双重输出方式**：
  - 📥 **下载功能**：生成Markdown文件并保存到本地
  - 📋 **复制功能**：直接复制Markdown内容到剪贴板
- **智能文件命名**：基于对话标题和时间戳自动生成文件名
- **智能标题降级**：
  - 自动检测内容中的标题级别
  - 动态调整降级幅度，避免标题冲突
  - 支持带前导空格的标题处理
  - 保持原有层次结构
- **国际化支持**：
  - 🇨🇳 中文界面
  - 🇺🇸 English interface
  - 根据浏览器语言自动切换
- **内容优化**：
  - 自动过滤辅助性文本（如"在新窗口中打开"）
  - 保留代码块、图片和链接的完整格式
  - 去除冗余的"Gemini"前缀
- **现代化UI**：美观的渐变设计，带图标的按钮和状态提示

## 📦 安装方法

### 方式一：开发者模式安装（推荐）

1. **下载扩展程序**
   ```bash
   git clone https://github.com/your-username/GeminiChat2Markdown.git
   # 或直接下载ZIP文件并解压
   ```

2. **打开Chrome扩展管理页面**
   - 在地址栏输入 `chrome://extensions/` 并回车
   - 或点击Chrome菜单 → 更多工具 → 扩展程序

3. **启用开发者模式**
   - 在扩展程序页面右上角，打开"开发者模式"开关

4. **加载扩展程序**
   - 点击"加载已解压的扩展程序"按钮
   - 选择项目中的 `code/v1` 文件夹
   - 点击"选择文件夹"

5. **安装完成**
   - "Gemini Chat to Markdown Converter"扩展程序将出现在扩展列表中
   - 扩展图标会显示在Chrome工具栏中

## 🎯 使用方法

### 基本操作流程

1. **访问Gemini共享页面**
   - 在任意gemini的对话中，点击分享按钮，生成分享链接
   - 复制分享链接，并在新标签页打开分享链接
   - URL格式通常为：`https://gemini.google.com/share/...`

2. **启动扩展程序**
   - 点击Chrome工具栏中的扩展图标
   - 弹出窗口将显示两个操作按钮

3. **选择操作方式**
   
   **📥 下载为文件**
   - 点击"下载 Markdown"按钮
   - 系统将自动提取对话内容并生成Markdown文件
   - 选择保存位置完成下载
   
   **📋 复制到剪贴板**
   - 点击"复制 Markdown"按钮
   - Markdown内容将直接复制到剪贴板
   - 可以粘贴到任何文本编辑器中

### 文件命名规则

生成的文件名格式：`GeminiChatRecord-YYYYMMDD_HHMMSS-对话标题.md`

示例：`GeminiChatRecord-20241201_143022-Python编程技巧.md`

## 📋 输出格式示例

转换后的Markdown文件将包含以下结构：

```markdown
# 对话标题

## 用户
用户的问题或查询内容...

## Gemini
Gemini的回复内容，包括：
- 文本回复
- 代码块（保持原有格式）
- 链接和引用
- 列表和表格

## 用户
后续的用户问题...

## Gemini
对应的Gemini回复...
```

## 🔧 故障排除

### 常见问题

**Q: 扩展图标不显示怎么办？**
A: 请确保已正确加载扩展程序，并在 `chrome://extensions/` 页面重新加载扩展。

**Q: 无法提取对话内容？**
A: 
- 确保当前页面是Gemini共享页面
- 检查页面是否完全加载完成
- 尝试刷新页面后重新操作

**Q: 下载的文件为空？**
A: 可能是页面结构发生变化，请检查控制台是否有错误信息。

**Q: 复制功能不工作？**
A: 请确保浏览器允许扩展程序访问剪贴板权限。

## 🛠️ 开发说明

### 项目结构
```
code/v1/
├── manifest.json          # 扩展程序配置文件
├── popup.html            # 弹出窗口界面
├── popup.js              # 弹出窗口逻辑
├── content.js            # 内容脚本（页面注入）
├── background.js         # 后台脚本
├── _locales/             # 国际化语言包
│   ├── en/
│   │   └── messages.json # 英文语言包
│   └── zh_CN/
│       └── messages.json # 中文语言包
└── images/               # 图标文件
    ├── icon16.png
    ├── icon48.png
    ├── icon128.png
    └── icon.svg
```

### 技术实现

- **内容脚本**：注入到Gemini页面，提取对话数据
  - 智能标题降级算法
  - 多元素选择器支持
- **后台脚本**：处理文件下载和消息传递
- **弹出界面**：提供用户交互界面
  - 国际化文本动态加载
  - 响应式设计
- **权限管理**：最小化权限原则，仅请求必要权限
- **国际化系统**：基于Chrome i18n API实现多语言支持

### 自定义开发

如需修改提取逻辑，主要关注 `content.js` 中的选择器：
- `share-turn-viewer`：对话轮次容器
- `user-query`：用户查询内容
- `response-container`：AI回复容器
- `message-content[data-test-id="immersive-artifact-content"]`：特殊文档内容

**智能标题降级配置**：
- `safeStartLevel`：安全起始级别（默认4级）
- `downgradeHeaders()`：标题降级函数
- 支持1-6级标题的智能处理

**国际化配置**：
- 语言包位置：`_locales/{locale}/messages.json`
- 支持的语言：中文(zh_CN)、英文(en)
- 添加新语言：创建对应语言包文件夹

## 📄 许可证

本项目采用 MIT 许可证开源。详情请参阅 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

---

**享受使用 Gemini Chat to Markdown Converter！** 🎉