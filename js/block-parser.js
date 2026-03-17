export const BlockParser = {
  /**
   * Markdownテキストを通常ブロックとswitchブロックに分割し、
   * switchブロック内部はさらに視点ごとに構造化する。
   * @param {string} text 
   * @returns {Array<{type: 'normal'|'switch', content?: string, variants?: Array<{name: string, text: string}>}>}
   */
  parse(text) {
    const lines = text.split(/\r\n|\n/);
    const blocks = [];
    let currentLines = [];
    let inSwitch = false;
    let switchLines = [];
    let currentLineOffset = 0;
    let switchStartOffset = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed === ':::switch') {
            if (inSwitch) {
                blocks.push(this.parseSwitchBlock(switchLines, switchStartOffset));
                switchLines = [];
            } else {
                if (currentLines.length > 0) {
                    blocks.push({ type: 'normal', content: currentLines.join('\n'), lineOffset: currentLineOffset });
                    currentLines = [];
                }
                inSwitch = true;
                switchStartOffset = i;
            }
            continue;
        }

        if (trimmed === ':::' && inSwitch) {
            blocks.push(this.parseSwitchBlock(switchLines, switchStartOffset));
            switchLines = [];
            inSwitch = false;
            currentLineOffset = i + 1;
            continue;
        }

        if (inSwitch) {
            switchLines.push(line);
        } else {
            if (currentLines.length === 0) {
                currentLineOffset = i;
            }
            currentLines.push(line);
        }
    }

    if (inSwitch && switchLines.length > 0) {
        blocks.push(this.parseSwitchBlock(switchLines, switchStartOffset));
    } else if (currentLines.length > 0) {
        blocks.push({ type: 'normal', content: currentLines.join('\n'), lineOffset: currentLineOffset });
    }

    return blocks;
  },

  /**
   * switchブロック内部を視点(@視点名)ごとに分割する
   * @param {string[]} lines 
   * @param {number} lineOffset :::switchの行番号
   * @returns {{type: 'switch', variants: Array<{name: string, text: string, lineOffset: number}>, lineOffset: number}}
   */
  parseSwitchBlock(lines, lineOffset) {
    const variants = [];
    let currentName = "default";
    let currentContent = [];
    let relativeLineOffset = 1; // :::switch の次から

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith('@')) {
            if (currentContent.length > 0 || variants.length > 0) {
                variants.push({
                    name: currentName,
                    text: currentContent.join('\n').trim(),
                    lineOffset: lineOffset + relativeLineOffset
                });
                currentContent = [];
            }
            currentName = trimmed.substring(1).trim();
            relativeLineOffset = i + 2; // @視点名 の次
            continue;
        }
        currentContent.push(line);
    }

    if (currentContent.length > 0 || variants.length > 0) {
        variants.push({
            name: currentName,
            text: currentContent.join('\n').trim(),
            lineOffset: lineOffset + relativeLineOffset
        });
    }

    return { type: 'switch', variants, lineOffset };
  }
};
