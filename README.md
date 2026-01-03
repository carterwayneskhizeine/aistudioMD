# 🚀 AI Studio Chat to Markdown Converter

一个基于Streamlit的Python应用，可以将AI Studio对话记录（JSON格式）批量转换为清晰、结构化的Markdown格式文件。

## ✨ 主要功能

- **批量处理**：支持同时上传多个JSON文件进行批量转换
- **智能转换**：自动提取用户查询和AI回复内容
- **智能标题降级**：
  - 自动检测内容中的标题级别
  - 动态调整降级幅度，避免标题冲突
  - 支持带前导空格的标题处理
  - 保持原有层次结构
- **双重下载方式**：
  - 📥 **单独下载**：每个文件单独下载
  - 📦 **打包下载**：一键下载所有文件的ZIP压缩包
- **实时预览**：转换后可以直接预览Markdown内容
- **格式保留**：
  - 保留代码块格式
  - 保留链接和引用
  - 保留列表和表格结构
- **智能修复**：自动修复不匹配的反引号

## 📦 安装方法

### 前置要求

- Python 3.8 或更高版本
- pip（Python包管理器）

### 安装步骤

1. **克隆或下载项目**
   ```bash
   git clone <repository-url>
   cd aistudioMD
   ```

2. **创建虚拟环境（推荐）**
   ```bash
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # macOS/Linux
   source venv/bin/activate
   ```

3. **安装依赖**
   ```bash
   pip install -r requirements.txt
   ```

4. **运行应用**
   ```bash
   streamlit run app.py
   ```

5. **打开浏览器**
   - 应用将在浏览器中自动打开
   - 默认地址：http://localhost:8501

## 🎯 使用方法

### 获取JSON文件

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 找到需要转换的对话记录
3. 点击分享或导出按钮
4. 选择JSON格式下载到本地

### 基本操作流程

1. **上传文件**
   - 点击"上传JSON文件"按钮
   - 选择一个或多个JSON文件

2. **转换文件**
   - 点击"转换为Markdown"按钮
   - 等待转换完成

3. **预览结果**
   - 展开每个文件查看转换后的Markdown内容
   - 确认内容正确无误

4. **下载文件**
   - **单独下载**：点击每个文件的下载按钮
   - **打包下载**：点击"下载全部文件（ZIP）"按钮

## 📋 输出格式示例

转换后的Markdown文件将包含以下结构：

```markdown
# 对话标题

**Source File:** original_filename.json
**Created:** 20240101_143022

---

# User
用户的问题或查询内容...

# AI Studio
AI Studio的回复内容，包括：
- 文本回复
- 代码块（保持原有格式）
- 链接和引用
- 列表和表格

# User
后续的用户问题...

# AI Studio
对应的回复...
```

## 🔧 技术特性

### JSON数据结构支持

应用支持以下JSON结构格式：

**格式1：chunkedPrompt结构**
```json
{
  "chunkedPrompt": {
    "chunks": [
      {
        "role": "user",
        "text": "用户的问题",
        "isThought": false
      },
      {
        "role": "model",
        "text": "AI的回复",
        "isThought": false
      }
    ]
  }
}
```

**格式2：直接数组结构**
```json
[
  {
    "role": "user",
    "text": "用户的问题",
    "isThought": false
  },
  {
    "role": "model",
    "text": "AI的回复",
    "isThought": false
  }
]
```

### 智能标题降级

- 自动检测内容中的最高标题级别
- 动态计算降级幅度
- 确保标题不会超过6级
- 保持原有层次结构

### 内容处理

- 自动跳过思考过程（`isThought: true`）
- 修复不匹配的反引号
- 清理多余的空行
- 保留原始格式信息

## 🛠️ 项目结构

```
aistudioMD/
├── app.py                # Streamlit应用主文件
├── requirements.txt      # Python依赖列表
├── README.md            # 项目说明文档
└── code/                # Chrome扩展代码（参考）
    └── v1/
        ├── manifest.json
        ├── popup.html
        ├── popup.js
        ├── content.js
        └── ...
```

## 🔧 故障排除

### 常见问题

**Q: 无法解析JSON文件？**
A: 请确保文件是有效的JSON格式，并且包含正确的数据结构。

**Q: 转换后的内容为空？**
A: 检查JSON文件中的`text`字段是否包含有效内容。

**Q: 下载的文件编码有问题？**
A: 应用默认使用UTF-8编码，确保你的文本编辑器也使用UTF-8。

**Q: 批量下载ZIP文件解压失败？**
A: 确保文件名不包含特殊字符，或尝试单个文件下载。

## 📄 许可证

本项目采用 MIT 许可证开源。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 🙏 致谢

本项目灵感来源于 [AistudioChat2Markdown](https://github.com/LarryGuan/AistudioChat2Markdown) Chrome扩展项目。

---

**享受使用 AI Studio Chat to Markdown Converter！** 🎉
