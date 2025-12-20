// content.js

// Function to convert HTML element to Markdown
function htmlToMarkdown(element) {
  if (!element) return '';

  const clonedElement = element.cloneNode(true);

  // First, extract and preserve code blocks
  const codeBlocks = clonedElement.querySelectorAll('pre, code');
  const codeBlockData = [];
  codeBlocks.forEach((block, index) => {
    const placeholder = `__CODE_BLOCK_${index}__`;
    let markdown = '';
    if (block.tagName === 'PRE') {
      // Check if pre contains a code element
      const codeElement = block.querySelector('code');
      const codeText = codeElement ? codeElement.innerText : block.innerText;
      markdown = `\n\`\`\`\n${codeText}\n\`\`\`\n`;
    } else if (block.tagName === 'CODE') {
      markdown = `\`${block.innerText}\``;
    }
    codeBlockData.push(markdown);
    block.replaceWith(document.createTextNode(placeholder));
  });

  // Convert other HTML elements to Markdown
  let markdown = convertElementToMarkdown(clonedElement);

  // Restore code blocks
  codeBlockData.forEach((codeMarkdown, index) => {
    const placeholder = `__CODE_BLOCK_${index}__`;
    markdown = markdown.replace(placeholder, codeMarkdown);
  });

  // Clean up and fix backtick issues
  markdown = fixBacktickIssues(markdown);

  return markdown.trim();
}

// Function to convert HTML element to Markdown recursively
function convertElementToMarkdown(element) {
  let result = '';

  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      const className = node.getAttribute('class') || '';
      const text = node.textContent;

      // Skip elements with accessibility/hidden classes
      if (className.includes('cdk-visually-hidden')) {
        continue;
      }

      switch (tagName) {
        case 'h1':
          result += `\n# ${text}\n`;
          break;
        case 'h2':
          result += `\n## ${text}\n`;
          break;
        case 'h3':
          result += `\n### ${text}\n`;
          break;
        case 'h4':
          result += `\n#### ${text}\n`;
          break;
        case 'h5':
          result += `\n##### ${text}\n`;
          break;
        case 'h6':
          result += `\n###### ${text}\n`;
          break;
        case 'p':
          result += `\n${convertElementToMarkdown(node)}\n`;
          break;
        case 'br':
          result += '\n';
          break;
        case 'strong':
        case 'b':
          result += `**${text}**`;
          break;
        case 'em':
        case 'i':
          result += `*${text}*`;
          break;
        case 'ul':
          result += convertListToMarkdown(node, false);
          break;
        case 'ol':
          result += convertListToMarkdown(node, true);
          break;
        case 'li':
          // This will be handled by the list converter
          result += convertElementToMarkdown(node);
          break;
        case 'a':
          const href = node.getAttribute('href');
          const className = node.getAttribute('class') || '';
          // Skip links related to image upload functionality (like Google Lens)
          if (className.includes('lens-icon-container')) {
            // Completely skip lens-related links and their content
            break;
          }
          if (href) {
            result += `[${text}](${href})`;
          } else {
            result += text;
          }
          break;
        case 'img':
          const src = node.getAttribute('src');
          const alt = node.getAttribute('alt') || '';
          const dataTestId = node.getAttribute('data-test-id');
          // Only process images with 'uploaded-img' in data-test-id attribute
          if (src && dataTestId && dataTestId.includes('uploaded-img')) {
            result += `![${alt}](${src})`;
          }
          break;
        case 'table':
          result += convertTableToMarkdown(node);
          break;
        case 'blockquote':
          const lines = text.split('\n');
          result += '\n' + lines.map(line => `> ${line}`).join('\n') + '\n';
          break;
        default:
          result += convertElementToMarkdown(node);
          break;
      }
    }
  }

  return result;
}

// Function to convert list to Markdown
function convertListToMarkdown(listElement, isOrdered) {
  let result = '\n';
  const items = listElement.querySelectorAll('li');

  items.forEach((item, index) => {
    const prefix = isOrdered ? `${index + 1}. ` : '- ';
    const itemText = convertElementToMarkdown(item).trim();
    result += `${prefix}${itemText}\n`;
  });

  return result + '\n';
}

// Function to convert table to Markdown
function convertTableToMarkdown(tableElement) {
  let result = '\n';
  const rows = tableElement.querySelectorAll('tr');

  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td, th');
    const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());
    result += `| ${cellTexts.join(' | ')} |\n`;

    // Add header separator for the first row
    if (rowIndex === 0) {
      const separator = cellTexts.map(() => '---').join(' | ');
      result += `| ${separator} |\n`;
    }
  });

  return result + '\n';
}

// Function to fix backtick issues in text (excluding code blocks)
function fixBacktickIssues(text) {
  // Split text by code blocks to avoid processing backticks inside them
  const codeBlockRegex = /(```[\s\S]*?```|`[^`]*`)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    // Add code block
    parts.push({ type: 'code', content: match[0] });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  // Process only text parts to fix unpaired backticks
  return parts.map(part => {
    if (part.type === 'text') {
      return fixUnpairedBackticks(part.content);
    }
    return part.content;
  }).join('');
}

// Function to fix unpaired backticks in text
function fixUnpairedBackticks(text) {
  // Count triple backticks
  const tripleBacktickMatches = text.match(/```/g);
  const tripleBacktickCount = tripleBacktickMatches ? tripleBacktickMatches.length : 0;

  // If odd number of triple backticks, add a closing one at the end
  if (tripleBacktickCount % 2 !== 0) {
    text = text.trim() + '\n```';
  }

  return text;
}

// Function to extract chat data
function extractChatData() {
  const chatTurns = document.querySelectorAll('share-turn-viewer');
  const chatData = [];

  chatTurns.forEach(turn => {
    const userQuery = turn.querySelector('user-query');
    const responseContainer = turn.querySelector('response-container');

    if (userQuery) {
      // First try to find user-query-content (for queries with files)
      let userContentElement = userQuery.querySelector('user-query-content');
      // If not found, fall back to .query-text (for text-only queries)
      if (!userContentElement) {
        userContentElement = userQuery.querySelector('.query-text');
      }
      if (userContentElement) {
        const markdownText = htmlToMarkdown(userContentElement);
        chatData.push({ speaker: 'User', text: markdownText });
      }
    }

    if (responseContainer) {
      // First try to find message-content element (for responses with docs or artifacts)
      const messageContent = responseContainer.querySelector('message-content[data-test-id="immersive-artifact-content"]');
      if (messageContent) {
        const markdownText = htmlToMarkdown(messageContent);
        chatData.push({ speaker: 'AI Studio', text: markdownText });
      } else {
        // Fallback to regular markdown panel
        const responsePanel = responseContainer.querySelector('.markdown.markdown-main-panel');
        if (responsePanel) {
          const markdownText = htmlToMarkdown(responsePanel);
          chatData.push({ speaker: 'AI Studio', text: markdownText });
        }
      }
    }
  });

  return chatData;
}

// Function to downgrade markdown headers to avoid conflicts with document structure
function downgradeHeaders(text) {
  // 智能降级：根据内容中的最高标题级别动态调整降级幅度

  // 1. 检测内容中的最高标题级别（包括前面有空格的标题）
  const headerMatches = text.match(/^\s*(#{1,6})\s+/gm);
  if (!headerMatches) {
    return text; // 没有标题，直接返回
  }

  // 找到最高级别（最少的#数量）
  const minLevel = Math.min(...headerMatches.map(match => {
    const hashes = match.match(/^\s*(#{1,6})/)[1];
    return hashes.length;
  }));

  // 2. 计算安全的降级幅度
  // 确保最高级别的标题降级后不会超过6级
  // 同时为文档结构预留空间（# User, # AI Studio 占用1级）
  const safeStartLevel = 2; // 从2级开始，为文档结构预留1级
  const downgradeAmount = safeStartLevel - minLevel;

  // 3. 如果原内容标题级别已经很低，则减少降级幅度
  const finalDowngradeAmount = Math.max(0, Math.min(downgradeAmount, 6 - minLevel));

  // 4. 应用智能降级（处理前面有空格的标题）
  return text.replace(/^(\s*)(#{1,6})(\s+)/gm, (match, leadingSpaces, hashes, trailingSpaces) => {
    const currentLevel = hashes.length;
    const newLevel = Math.min(currentLevel + finalDowngradeAmount, 6);
    return leadingSpaces + '#'.repeat(newLevel) + trailingSpaces;
  });
}

// Function to clean up multiple consecutive empty lines
function cleanupMultipleEmptyLines(text) {
  // Replace multiple consecutive empty lines with a single empty line
  return text.replace(/\n\s*\n\s*\n+/g, '\n\n');
}

// Function to convert chat data to Markdown
function convertToMarkdown(chatData) {
  let markdown = '';

  // Extract title and creation time from the page
  // Extract title from document.title and clean it for filename usage
  let title = document.title.replace(/\s*-\s*AI Studio$/i, '').trim(); // Remove " - AI Studio" suffix
  // Remove "Gemini" or "AI Studio" prefix if it exists
  title = title.replace(/^(Gemini|AI Studio)[_\s-]*/i, '').trim();
  if (!title) {
    title = 'AI Studio Chat Record';
  }
  // Clean title for filename: remove special characters, keep only alphanumeric, Chinese, and spaces
  title = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s]/g, '').trim();
  // Remove any remaining prefix at the beginning after cleaning
  title = title.replace(/^(Gemini|AI Studio)\s*/i, '').trim();
  // Replace multiple spaces with a single underscore
  title = title.replace(/\s+/g, '_');

  const publishTimeElement = document.querySelector('.publish-time-text');
  const publishTime = publishTimeElement ? publishTimeElement.innerText.replace('发布时间：', '') : 'Unknown Date';

  const sourceUrl = window.location.href;

  markdown += `# ${title}\n\n`;
  markdown += `**Source:** [${sourceUrl}](${sourceUrl})\n`;
  markdown += `**Created:** ${publishTime}\n\n`;
  markdown += `---\n\n`;

  chatData.forEach(item => {
    let processedText = item.text;

    // Fix unpaired backticks for each conversation turn
    processedText = fixUnpairedBackticks(processedText);

    // Downgrade headers in content to avoid conflicts with document structure
    processedText = downgradeHeaders(processedText);

    if (item.speaker === 'User') {
      markdown += `# User\n${processedText}\n\n`;
    } else if (item.speaker === 'AI Studio') {
      markdown += `# AI Studio\n${processedText}\n\n`;
    }
  });

  // Clean up multiple consecutive empty lines
  markdown = cleanupMultipleEmptyLines(markdown);

  return markdown;
}

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getMarkdown') {
    const chatData = extractChatData();
    const markdownContent = convertToMarkdown(chatData);
    sendResponse({ markdownContent: markdownContent });
  }
});