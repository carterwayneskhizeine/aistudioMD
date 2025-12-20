const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/aistudio-chat-demo');
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

let markdown = '';

// Helper to fix backticks (borrowed from content.js logic)
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

if (data.chunkedPrompt && data.chunkedPrompt.chunks) {
    data.chunkedPrompt.chunks.forEach(chunk => {
        let role = '';
        if (chunk.role === 'user') {
            role = 'User';
        } else if (chunk.role === 'model') {
            role = 'AI Studio';
        }

        if (chunk.isThought) {
            return; // Skipping thoughts for clean output as per usual requirement
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

console.log(markdown);
