import streamlit as st
import json
import re
from datetime import datetime
import zipfile
from io import BytesIO
import base64


def fix_unpaired_backticks(text):
    """修复不匹配的反引号"""
    triple_backtick_matches = re.findall(r"```", text)
    triple_backtick_count = len(triple_backtick_matches)
    if triple_backtick_count % 2 != 0:
        text = text.strip() + "\n```"
    return text


def downgrade_headers(text):
    """智能降级标题以避免与文档结构冲突"""
    # 检测内容中的最高标题级别（包括前面有空格的标题）
    header_matches = re.findall(r"^\s*(#{1,6})\s+", text, re.MULTILINE)
    if not header_matches:
        return text

    # 找到最高级别（最少的#数量）
    min_level = min(len(match) for match in header_matches)

    # 计算安全的降级幅度
    safe_start_level = 2
    downgrade_amount = safe_start_level - min_level

    # 如果原内容标题级别已经很低，则减少降级幅度
    final_downgrade_amount = max(0, min(downgrade_amount, 6 - min_level))

    # 应用智能降级
    def replace_header(match):
        leading_spaces = match.group(1)
        hashes = match.group(2)
        trailing_spaces = match.group(3)
        current_level = len(hashes)
        new_level = min(current_level + final_downgrade_amount, 6)
        return leading_spaces + "#" * new_level + trailing_spaces

    return re.sub(r"^(\s*)(#{1,6})(\s+)", replace_header, text, flags=re.MULTILINE)


def cleanup_multiple_empty_lines(text):
    """清理多个连续空行"""
    return re.sub(r"\n\s*\n\s*\n+", "\n\n", text)


def convert_json_to_markdown(data, filename):
    """将JSON数据转换为Markdown格式"""
    markdown = ""

    # 生成时间戳
    date = datetime.now()
    timestamp = date.strftime("%Y%m%d_%H%M%S")

    # 提取标题（如果有的话）
    title = filename.replace(".json", "").replace("-", " ").replace("_", " ")
    title = " ".join(word.capitalize() for word in title.split())

    # 添加标题部分
    markdown += f"# {title}\n\n"
    markdown += f"**Source File:** {filename}\n"
    markdown += f"**Created:** {timestamp}\n\n"
    markdown += "---\n\n"

    # 处理对话内容
    if isinstance(data, dict) and "chunkedPrompt" in data:
        chunks = data["chunkedPrompt"].get("chunks", [])
    elif isinstance(data, list):
        chunks = data
    else:
        chunks = []

    for chunk in chunks:
        if not isinstance(chunk, dict):
            continue

        role = chunk.get("role", "")
        if chunk.get("isThought", False):
            continue

        if role == "user":
            speaker = "User"
        elif role == "model":
            speaker = "AI Studio"
        else:
            continue

        text = chunk.get("text", "")
        if text:
            # 修复不匹配的反引号
            text = fix_unpaired_backticks(text)
            # 降级标题
            text = downgrade_headers(text)

            markdown += f"# {speaker}\n\n{text}\n\n"

    # 清理多个连续空行
    markdown = cleanup_multiple_empty_lines(markdown)

    return markdown, timestamp


def process_uploaded_files(uploaded_files):
    """处理上传的文件列表，返回Markdown内容和文件名列表"""
    results = []

    for uploaded_file in uploaded_files:
        try:
            content = uploaded_file.read()
            
            # 处理无后缀文件，自动添加.json后缀
            file_name = uploaded_file.name
            if not file_name.endswith('.json'):
                file_name += '.json'
            
            data = json.loads(content.decode("utf-8"))

            markdown, timestamp = convert_json_to_markdown(data, file_name)

            # 生成输出文件名
            output_filename = f"AistudioChatRecord-{timestamp}-{file_name.replace('.json', '')}.md"

            results.append(
                {
                    "markdown": markdown,
                    "filename": output_filename,
                    "original_filename": uploaded_file.name,
                }
            )

        except json.JSONDecodeError:
            st.error(f"无法解析文件 {uploaded_file.name}，请确保它是有效的JSON格式")
        except Exception as e:
            st.error(f"处理文件 {uploaded_file.name} 时出错: {str(e)}")

    return results


def create_zip(results):
    """创建包含所有Markdown文件的ZIP"""
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for result in results:
            zip_file.writestr(result["filename"], result["markdown"])
    zip_buffer.seek(0)
    return zip_buffer


def main():
    st.set_page_config(
        page_title="AI Studio Chat to Markdown Converter", page_icon="📄", layout="wide"
    )

    st.title("AI Studio Chat to Markdown Converter")

    # 文件上传
    uploaded_files = st.file_uploader(
        "上传文件",
        accept_multiple_files=True,
        help="选择一个或多个AI Studio导出的无后缀文件",
    )

    if uploaded_files:
        st.info(f"已选择 {len(uploaded_files)} 个文件")

        # 处理按钮
        if st.button("🔄 转换为Markdown", type="primary"):
            with st.spinner("正在转换文件..."):
                results = process_uploaded_files(uploaded_files)

            if results:
                st.success(f"✅ 成功转换 {len(results)} 个文件！")

                # 显示转换结果预览
                st.subheader("转换结果")
                for idx, result in enumerate(results):
                    with st.expander(f"📄 {result['filename']}"):
                        st.markdown(f"**原始文件:** {result['original_filename']}")
                        st.markdown("---")
                        st.markdown(result["markdown"])

                # 下载选项
                st.subheader("下载选项")

                col1, col2 = st.columns(2)

                with col1:
                    # 单独下载
                    st.markdown("#### 📥 单独下载")
                    for idx, result in enumerate(results):
                        st.download_button(
                            label=f"下载 {result['filename']}",
                            data=result["markdown"],
                            file_name=result["filename"],
                            mime="text/markdown",
                            key=f"download_{idx}",
                        )

                with col2:
                    # 批量打包下载
                    st.markdown("#### 📦 批量打包下载")
                    if st.button("📥 下载全部文件（ZIP）"):
                        zip_buffer = create_zip(results)
                        st.download_button(
                            label="下载所有文件",
                            data=zip_buffer,
                            file_name=f"AistudioChatRecords-{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip",
                            mime="application/zip",
                        )
            else:
                st.warning("⚠️ 没有成功转换的文件，请检查文件格式是否正确")



if __name__ == "__main__":
    main()
