// Initialize i18n and version
function initializeI18n() {
  document.getElementById('downloadText').textContent = chrome.i18n.getMessage('downloadButton');
  document.getElementById('copyText').textContent = chrome.i18n.getMessage('copyButton');

  const manifest = chrome.runtime.getManifest();
  document.getElementById('version').textContent = manifest.version;
}

document.addEventListener('DOMContentLoaded', initializeI18n);

// State to store imported content
let importedMarkdown = null;
let importedFilename = null;

// Helper to fix backticks
function fixUnpairedBackticks(text) {
  const tripleBacktickMatches = text.match(/```/g);
  const tripleBacktickCount = tripleBacktickMatches ? tripleBacktickMatches.length : 0;
  if (tripleBacktickCount % 2 !== 0) {
    text = text.trim() + '\n```';
  }
  return text;
}

// Helper to downgrade headers (borrowed from content.js)
function downgradeHeaders(text) {
  // Smart downgrade: dynamically adjust downgrade amount based on highest header level in content

  // 1. Detect highest header level in content (including headers with leading spaces)
  const headerMatches = text.match(/^\s*(#{1,6})\s+/gm);
  if (!headerMatches) {
    return text; // No headers, return as is
  }

  // Find minimum level (fewest #s)
  const minLevel = Math.min(...headerMatches.map(match => {
    const hashes = match.match(/^\s*(#{1,6})/)[1];
    return hashes.length;
  }));

  // 2. Calculate safe downgrade amount
  // Ensure highest level header downgrades to at most level 6
  // Reserve level 1 for speaker (## User -> # User)
  // So content should start at level 2.
  const safeStartLevel = 2;
  const downgradeAmount = safeStartLevel - minLevel;

  // 3. If original content headers are already low, reduce downgrade amount
  const finalDowngradeAmount = Math.max(0, Math.min(downgradeAmount, 6 - minLevel));

  // 4. Apply smart downgrade
  return text.replace(/^(\s*)(#{1,6})(\s+)/gm, (match, leadingSpaces, hashes, trailingSpaces) => {
    const currentLevel = hashes.length;
    const newLevel = Math.min(currentLevel + finalDowngradeAmount, 6);
    return leadingSpaces + '#'.repeat(newLevel) + trailingSpaces;
  });
}

// Handle File Import
document.getElementById('fileInput').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      let markdown = '';

      // Generate filename from current date if not available in data
      const date = new Date();
      const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      importedFilename = `AistudioChatRecord-${timestamp}.md`;

      // Add Title
      markdown += `# AI Studio Chat Record\n\n`;
      markdown += `**Created:** ${timestamp}\n\n`;
      markdown += `---\n\n`;

      if (data.chunkedPrompt && data.chunkedPrompt.chunks) {
        data.chunkedPrompt.chunks.forEach(chunk => {
          let role = '';
          if (chunk.role === 'user') {
            role = 'User';
          } else if (chunk.role === 'model') {
            role = 'AI Studio';
          }

          if (chunk.isThought) {
            return; // Skip thoughts
          }

          if (role) {
            markdown += `# ${role}\n\n`;
            let text = chunk.text || '';
            text = fixUnpairedBackticks(text);
            text = downgradeHeaders(text);
            markdown += `${text}\n\n`;
          }
        });
      }

      importedMarkdown = markdown;

      const statusEl = document.getElementById('status');
      statusEl.textContent = `File loaded: ${file.name}`;
      statusEl.className = 'status-success show';

    } catch (error) {
      console.error('Error parsing JSON:', error);
      const statusEl = document.getElementById('status');
      statusEl.textContent = 'Error parsing JSON file';
      statusEl.className = 'status-error show';
    }
  };
  reader.readAsText(file);
});

// Download Function
document.getElementById('downloadButton').addEventListener('click', () => {
  if (importedMarkdown) {
    // Use imported content
    const blob = new Blob([importedMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: importedFilename,
      saveAs: true
    });
    const statusEl = document.getElementById('status');
    statusEl.textContent = chrome.i18n.getMessage('downloadSuccess');
    statusEl.className = 'status-success show';
  } else {
    // Fallback to Page Extraction
    handlePageExtraction('download');
  }
});

// Copy Function
document.getElementById('copyButton').addEventListener('click', () => {
  if (importedMarkdown) {
    // Use imported content
    navigator.clipboard.writeText(importedMarkdown).then(() => {
      const statusEl = document.getElementById('status');
      statusEl.textContent = chrome.i18n.getMessage('copySuccess');
      statusEl.className = 'status-success show';
    }).catch(err => {
      console.error('Copy failed:', err);
      const statusEl = document.getElementById('status');
      statusEl.textContent = 'Copy failed';
      statusEl.className = 'status-error show';
    });
  } else {
    // Fallback to Page Extraction
    handlePageExtraction('copy');
  }
});

// Logic for extracting from page (Legacy/Fallback)
function handlePageExtraction(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    // Check for both Gemini and AI Studio URLs
    if (activeTab.url.startsWith('https://gemini.google.com/share/') || activeTab.url.startsWith('https://aistudio.google.com/')) {
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content.js']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        chrome.tabs.sendMessage(activeTab.id, { action: 'getMarkdown' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
          }

          if (response && response.markdownContent) {
            if (action === 'download') {
              // Send to background for download (or handle here if possible, but background is better for downloads API)
              // Actually, we can use chrome.downloads directly in popup if permission is there
              const blob = new Blob([response.markdownContent], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              // Generate filename (simple fallback)
              const date = new Date();
              const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
              const filename = `AistudioChatRecord-${timestamp}.md`;

              chrome.downloads.download({
                url: url,
                filename: filename,
                saveAs: true
              });

              const statusEl = document.getElementById('status');
              statusEl.textContent = chrome.i18n.getMessage('downloadSuccess');
              statusEl.className = 'status-success show';
            } else if (action === 'copy') {
              navigator.clipboard.writeText(response.markdownContent).then(() => {
                const statusEl = document.getElementById('status');
                statusEl.textContent = chrome.i18n.getMessage('copySuccess');
                statusEl.className = 'status-success show';
              });
            }
          } else {
            const statusEl = document.getElementById('status');
            statusEl.textContent = chrome.i18n.getMessage('extractionFailed');
            statusEl.className = 'status-error show';
          }
        });
      });
    } else {
      const statusEl = document.getElementById('status');
      statusEl.textContent = chrome.i18n.getMessage('openAIStudioShare'); // We might want to update this message key too
      statusEl.className = 'status-info show';
    }
  });
}