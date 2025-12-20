// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadMarkdown') {
    const markdownContent = request.content;

    // Get current date for filename
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    // Extract title from markdown content (first line after #)
    // Extract title from markdown content (first line after #) and clean it
    const titleMatch = markdownContent.match(/^#\s*(.+?)\n/);
    let title = titleMatch ? titleMatch[1].trim() : 'Untitled';
    // Remove "Gemini" prefix if it exists (including "Gemini_" and "Gemini ")
    title = title.replace(/^Gemini[_\s]*/i, '');
    // Clean title for filename: remove special characters, keep only alphanumeric, Chinese, and spaces
    title = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s]/g, '').trim();
    // Replace multiple spaces with a single underscore
    title = title.replace(/\s+/g, '_');

    const filename = `GeminiChatRecord-${year}${month}${day}-${hours}${minutes}${seconds}-${title}.md`;

    const blob = new Blob([markdownContent], { type: 'text/markdown' });

    // Function to convert Blob to Data URL
    const blobToDataURL = (blob) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    };

    console.log('尝试将 Blob 转换为 Data URL...');
    blobToDataURL(blob).then(dataUrl => {
      console.log('Blob 成功转换为 Data URL，准备下载文件:', filename);
      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: true // Prompt user to choose download location
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('下载失败:', chrome.runtime.lastError.message);
        } else {
          console.log('下载开始，下载ID:', downloadId);
        }
      });
    }).catch(error => {
      console.error('将 Blob 转换为 Data URL 失败:', error);
    });
  }
});