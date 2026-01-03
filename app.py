import streamlit as st
import json
import re
from datetime import datetime
import zipfile
from io import BytesIO
import base64


def fix_unpaired_backticks(text):
    """Fix unpaired backticks"""
    triple_backtick_matches = re.findall(r"```", text)
    triple_backtick_count = len(triple_backtick_matches)
    if triple_backtick_count % 2 != 0:
        text = text.strip() + "\n```"
    return text


def downgrade_headers(text):
    """Intelligently downgrade headers to avoid conflicts with document structure"""
    # Detect the highest header level in content (including headers with leading spaces)
    header_matches = re.findall(r"^\s*(#{1,6})\s+", text, re.MULTILINE)
    if not header_matches:
        return text

    # Find the highest level (minimum number of #)
    min_level = min(len(match) for match in header_matches)

    # Calculate safe downgrade amount
    safe_start_level = 2
    downgrade_amount = safe_start_level - min_level

    # If original header level is already low, reduce downgrade amount
    final_downgrade_amount = max(0, min(downgrade_amount, 6 - min_level))

    # Apply intelligent downgrade
    def replace_header(match):
        leading_spaces = match.group(1)
        hashes = match.group(2)
        trailing_spaces = match.group(3)
        current_level = len(hashes)
        new_level = min(current_level + final_downgrade_amount, 6)
        return leading_spaces + "#" * new_level + trailing_spaces

    return re.sub(r"^(\s*)(#{1,6})(\s+)", replace_header, text, flags=re.MULTILINE)


def cleanup_multiple_empty_lines(text):
    """Clean up multiple consecutive empty lines"""
    return re.sub(r"\n\s*\n\s*\n+", "\n\n", text)


def convert_json_to_markdown(data, filename):
    """Convert JSON data to Markdown format"""
    markdown = ""

    # Generate timestamp
    date = datetime.now()
    timestamp = date.strftime("%Y%m%d_%H%M%S")

    # Extract title (if any)
    title = filename.replace(".json", "").replace("-", " ").replace("_", " ")
    title = " ".join(word.capitalize() for word in title.split())

    # Add title section
    markdown += f"# {title}\n\n"
    markdown += f"**Source File:** {filename}\n"
    markdown += f"**Created:** {timestamp}\n\n"
    markdown += "---\n\n"

    # Process conversation content
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
            # Fix unpaired backticks
            text = fix_unpaired_backticks(text)
            # Downgrade headers
            text = downgrade_headers(text)

            markdown += f"# {speaker}\n\n{text}\n\n"

    # Clean up multiple consecutive empty lines
    markdown = cleanup_multiple_empty_lines(markdown)

    return markdown, timestamp


def process_uploaded_files(uploaded_files):
    """Process uploaded file list, return Markdown content and filename list"""
    results = []

    for uploaded_file in uploaded_files:
        try:
            content = uploaded_file.read()
            
            # Handle files without extension, automatically add .json extension
            file_name = uploaded_file.name
            if not file_name.endswith('.json'):
                file_name += '.json'
            
            data = json.loads(content.decode("utf-8"))

            markdown, timestamp = convert_json_to_markdown(data, file_name)

            # Generate output filename
            output_filename = f"AistudioChatRecord-{timestamp}-{file_name.replace('.json', '')}.md"

            results.append(
                {
                    "markdown": markdown,
                    "filename": output_filename,
                    "original_filename": uploaded_file.name,
                }
            )

        except json.JSONDecodeError:
            st.error(f"Unable to parse file {uploaded_file.name}, please ensure it is a valid JSON format")
        except Exception as e:
            st.error(f"Error processing file {uploaded_file.name}: {str(e)}")

    return results


def create_zip(results):
    """Create ZIP containing all Markdown files"""
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

    # File uploader
    uploaded_files = st.file_uploader(
        "Upload files",
        accept_multiple_files=True,
        help="Select one or more files exported from AI Studio (without extension)",
    )

    if uploaded_files:
        st.info(f"Selected {len(uploaded_files)} files")

        # Process button
        if st.button("🔄 Convert to Markdown", type="primary"):
            with st.spinner("Converting files..."):
                results = process_uploaded_files(uploaded_files)

            if results:
                st.success(f"✅ Successfully converted {len(results)} files!")

                # Show conversion results preview
                st.subheader("Conversion Results")
                for idx, result in enumerate(results):
                    with st.expander(f"📄 {result['filename']}"):
                        st.markdown(f"**Original File:** {result['original_filename']}")
                        st.markdown("---")
                        st.markdown(result["markdown"])

                # Download options
                st.subheader("Download Options")

                col1, col2 = st.columns(2)

                with col1:
                    # Individual download
                    st.markdown("#### 📥 Individual Download")
                    for idx, result in enumerate(results):
                        st.download_button(
                            label=f"Download {result['filename']}",
                            data=result["markdown"],
                            file_name=result["filename"],
                            mime="text/markdown",
                            key=f"download_{idx}",
                        )

                with col2:
                    # Batch download
                    st.markdown("#### 📦 Batch Download")
                    zip_buffer = create_zip(results)
                    st.download_button(
                        label="📥 Download All Files (ZIP)",
                        data=zip_buffer.getvalue(),
                        file_name=f"AistudioChatRecords-{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip",
                        mime="application/zip",
                        key="batch_download",
                    )
            else:
                st.warning("⚠️ No files successfully converted, please check if the file format is correct")

    st.markdown("---")

    # Show download instructions
    st.markdown("Chat records are downloaded from the Google AI Studio folder in drive.google.com:")
    st.markdown("1. Go to drive.google.com")
    st.markdown("2. Navigate to the 'Google AI Studio' folder")
    st.markdown("3. Download the chat record files you need")

    # Show image
    try:
        st.image("download.png", caption="Download Instructions", use_container_width=True)
    except:
        st.info("Download instructions image not found")


if __name__ == "__main__":
    main()