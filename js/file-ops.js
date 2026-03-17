import { State } from './state.js';
import { D } from './dom.js';
import { UI } from './ui.js';
import { Search } from './search.js';
import { BlockParser } from './block-parser.js';

export const FileOps = {
  loadFile(file) {
    if (!file) return;
    if (!file.type.match('text.*') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      alert('テキストファイル(.txt, .md)を選択してください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;

      D.titleDisplay.textContent = file.name;
      State.currentTextCache = text;
      this.renderContent(text);

      if (window.innerWidth < 1024 && State.currentTocMap.length > 0) {
        D.sidebar.classList.add('open');
        D.sidebarOverlay.classList.add('visible');
      } else if (window.innerWidth >= 1024) {
        D.sidebar.classList.remove('closed');
      }

      Search.close();

      if (State.isEditMode) {
        D.editToggleBtn.click();
      }
    };

    reader.readAsText(file);
  },

  renderContent(text) {
    D.contentArea.innerHTML = '';
    D.tocList.innerHTML = '';
    State.currentTocMap = [];

    if (typeof window.markdownit === 'undefined') {
      console.error("markdown-it is not loaded");
      D.contentArea.textContent = text;
      return;
    }

    const blocks = BlockParser.parse(text);

    blocks.forEach((block) => {
      if (block.type === 'normal') {
        const html = this.renderMarkdown(block.content, block.lineOffset);
        const div = document.createElement('div');
        div.innerHTML = html;
        while (div.firstChild) {
          D.contentArea.appendChild(div.firstChild);
        }
      } else if (block.type === 'switch') {
        const switchDiv = document.createElement('div');
        switchDiv.className = 'switch-block';
        
        const tabsDiv = document.createElement('div');
        tabsDiv.className = 'switch-tabs';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'switch-content';

        let activeIdx = 0;

        // 切り替え共通処理
        const updateSwitchUI = (idx) => {
          activeIdx = idx;
          const v = block.variants[idx];
          
          // アクティブタブの更新
          tabsDiv.querySelectorAll('.switch-tab').forEach((t, i) => {
            t.classList.toggle('active', i === idx);
          });
          
          // コンテンツの描画
          contentDiv.innerHTML = this.renderMarkdown(v.text, v.lineOffset);
          
          // 空行の補完
          const contentPs = contentDiv.querySelectorAll('p');
          contentPs.forEach(p => {
            if (p.innerHTML.trim() === '') p.innerHTML = '&nbsp;';
          });

          // 目次の更新
          this.buildToc();
        };

        block.variants.forEach((v, vIdx) => {
          const tab = document.createElement('div');
          tab.className = 'switch-tab' + (vIdx === 0 ? ' active' : '');
          tab.textContent = v.name;
          
          tab.addEventListener('click', (e) => {
            e.stopPropagation(); // コンテンツ領域へのクリック伝播を防止
            updateSwitchUI(vIdx);
          });

          tabsDiv.appendChild(tab);
        });

        // 再生成ボタンの追加
        const regenBtn = document.createElement('button');
        regenBtn.className = 'switch-regen-btn';
        regenBtn.title = '別視点を追加';
        regenBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
        regenBtn.onclick = (e) => {
          e.stopPropagation();
          if (!State.isAiSelectionMode) return;
          const activeTab = tabsDiv.querySelector('.switch-tab.active');
          const activeName = activeTab ? activeTab.textContent : '';
          import('./editor.js').then(m => m.Editor.openRegenModal(block, activeName));
        };
        tabsDiv.appendChild(regenBtn);

        switchDiv.appendChild(tabsDiv);

        // コンテンツ領域クリックで順送り
        contentDiv.addEventListener('click', () => {
          const nextIdx = (activeIdx + 1) % block.variants.length;
          updateSwitchUI(nextIdx);
        });

        // 初期表示の設定
        if (block.variants.length > 0) {
          updateSwitchUI(0);
        }
        
        switchDiv.appendChild(contentDiv);
        D.contentArea.appendChild(switchDiv);
      }
    });

    const allPs = D.contentArea.querySelectorAll('p');
    allPs.forEach(p => {
      if (p.innerHTML.trim() === '') {
        p.innerHTML = '&nbsp;';
      }
    });

    this.buildToc();
  },

  /**
   * Markdownをレンダリングする内部共通メソッド
   * @param {string} content 
   * @param {number} lineOffset 
   * @returns {string}
   */
  renderMarkdown(content, lineOffset) {
    const md = window.markdownit({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true
    });

    // 行番号インジェクター
    md.core.ruler.push('inject_line_numbers', function (state) {
      state.tokens.forEach(token => {
        if (token.map && token.type !== 'inline') {
          const lineNum = token.map[0] + 1 + lineOffset;
          const lineEnd = token.map[1] + lineOffset;
          token.attrSet('id', 'line-' + lineNum);
          token.attrSet('data-line', lineNum);
          token.attrSet('data-line-end', lineEnd);
        }
      });
    });

    // 画像サイズ
    md.core.ruler.after('inline', 'parse_image_size', function (state) {
      state.tokens.forEach(token => {
        if (token.type === 'inline' && token.children) {
          token.children.forEach(child => {
            if (child.type === 'image') {
              const titleMatch = child.attrIndex('title');
              if (titleMatch >= 0) {
                const titleStr = child.attrs[titleMatch][1];
                let width = "", height = "";
                titleStr.split(/\s+/).forEach(p => {
                  const kv = p.split('=');
                  if (kv.length === 2) {
                    if (kv[0] === 'w' && (kv[1] === 'auto' || /^\d+$/.test(kv[1]))) width = kv[1] === 'auto' ? 'auto' : kv[1] + 'px';
                    else if (kv[0] === 'h' && (kv[1] === 'auto' || /^\d+$/.test(kv[1]))) height = kv[1] === 'auto' ? 'auto' : kv[1] + 'px';
                  }
                });
                if (width || height) {
                  let styleStr = "";
                  if (width) styleStr += `width: ${width}; `;
                  if (height) styleStr += `height: ${height}; `;
                  child.attrPush(['style', styleStr.trim()]);
                  child.attrs.splice(titleMatch, 1);
                }
              }
            }
          });
        }
      });
    });

    // 表拡張
    md.core.ruler.after('parse_image_size', 'table_extension', function (state) {
      const tokens = state.tokens;
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type !== 'table_open') continue;
        let tableStart = i, tableEnd = i;
        while (tableEnd < tokens.length && tokens[tableEnd].type !== 'table_close') tableEnd++;
        const tableTokens = tokens.slice(tableStart, tableEnd + 1);
        const grid = [];
        let currentRow = null, inThead = false;
        tableTokens.forEach((t) => {
          if (t.type === 'thead_open') inThead = true;
          else if (t.type === 'thead_close') inThead = false;
          else if (t.type === 'tr_open') { currentRow = []; grid.push({ isHeader: inThead, cells: currentRow }); }
          else if (t.type === 'inline' && currentRow !== null) {
            const prevToken = tableTokens[tableTokens.indexOf(t) - 1];
            currentRow.push({
              content: state.md.renderer.render([t], state.md.options, state.env),
              raw: t.content.trim(),
              tag: prevToken ? prevToken.tag : 'td',
              rowspan: 1, colspan: 1, hidden: false
            });
          }
        });
        for (let r = 0; r < grid.length; r++) {
          const row = grid[r].cells;
          for (let c = 0; c < row.length; c++) {
            const cell = row[c];
            if (cell.hidden) continue;
            if (cell.raw === '>') {
              let target = null;
              for (let prevC = c - 1; prevC >= 0; prevC--) if (!row[prevC].hidden) { target = row[prevC]; break; }
              if (target) { target.colspan += cell.colspan; cell.hidden = true; }
            } else if (cell.raw === '^') {
              let target = null;
              for (let prevR = r - 1; prevR >= 0; prevR--) {
                const prevRow = grid[prevR].cells;
                if (prevRow[c] && !prevRow[c].hidden) { target = prevRow[c]; break; }
              }
              if (target) { target.rowspan += cell.rowspan; cell.hidden = true; }
            }
          }
        }
        let html = '<table>';
        let openedThead = false, openedTbody = false;
        grid.forEach((rowObj) => {
          if (rowObj.isHeader && !openedThead) { html += '<thead>'; openedThead = true; }
          else if (!rowObj.isHeader && openedThead && !openedTbody) { html += '</thead><tbody>'; openedTbody = true; }
          else if (!rowObj.isHeader && !openedThead && !openedTbody) { html += '<tbody>'; openedTbody = true; }
          html += '<tr>';
          rowObj.cells.forEach(cell => {
            if (cell.hidden) return;
            const attrs = [];
            if (cell.colspan > 1) attrs.push(`colspan="${cell.colspan}"`);
            if (cell.rowspan > 1) attrs.push(`rowspan="${cell.rowspan}"`);
            html += `<${cell.tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>${cell.content}</${cell.tag}>`;
          });
          html += '</tr>';
        });
        if (openedTbody) html += '</tbody>'; else if (openedThead) html += '</thead>';
        html += '</table>';
        const newToken = new state.Token('html_block', '', 0);
        newToken.content = html;
        state.tokens.splice(tableStart, tableEnd - tableStart + 1, newToken);
        i = tableStart;
      }
    });

    return md.render(content);
  },

  buildToc() {
    const rawText = State.currentTextCache || "";
    const lines = rawText.split(/\r\n|\n/);
    State.currentTocMap = [];
    
    // contentArea直下の要素だけでなく、セクション内の要素も含めて走査
    const nodes = Array.from(D.contentArea.querySelectorAll('h1, h2, h3, h4, h5, h6, .line-heading, p'));
    
    nodes.forEach((el, index) => {
      let textForCheck = el.textContent.trim();
      const lineAttr = el.getAttribute('data-line');

      if (lineAttr) {
        const lineNum = parseInt(lineAttr, 10);
        const rawLine = lines[lineNum - 1];
        if (rawLine) {
          textForCheck = rawLine.trim();
        }
      }

      const isRuleMatched = this.isHeading(textForCheck);
      
      if (isRuleMatched && textForCheck.length > 0) {
        el.classList.add('line-heading');
        
        // プレビューテキストの取得
        let previewText = "";
        let sibling = el.nextElementSibling;
        while (sibling) {
          const siblingText = sibling.textContent.trim();
          if (siblingText.length > 0) {
            previewText = siblingText.substring(0, 60);
            break;
          }
          sibling = sibling.nextElementSibling;
        }

        if (!el.id) {
          el.id = 'heading-' + index;
        }

        State.currentTocMap.push({
          id: el.id,
          text: textForCheck.replace(/^(#+)\s+/, ''),
          preview: previewText,
          element: el
        });
      }
    });

    this.renderToc();
  },

  isHeading(str) {
    if (!str || str.length === 0 || str.length > 60) return false;

    if (State.settings.excludePattern) {
      try {
        if (new RegExp(State.settings.excludePattern).test(str)) return false;
      } catch (e) {}
    }

    for (const rule of State.settings.matchRules) {
      if (!rule.enabled || !rule.pattern) continue;
      try {
        if (new RegExp(rule.pattern).test(str)) return true;
      } catch (e) { console.warn("Invalid Regex:", rule.pattern); }
    }
    return false;
  },

  renderToc() {
    D.tocCount.textContent = `${State.currentTocMap.length}件`;
    D.tocList.innerHTML = '';
    
    if (State.currentTocMap.length === 0) {
      D.tocList.innerHTML = '<li class="empty-toc">見出しが見つかりませんでした</li>';
      return;
    }

    State.currentTocMap.forEach(item => {
      const li = document.createElement('li');
      li.title = item.text;

      const titleDiv = document.createElement('div');
      titleDiv.className = 'toc-title';
      titleDiv.textContent = item.text;
      li.appendChild(titleDiv);

      if (item.preview) {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'toc-preview';
        previewDiv.textContent = item.preview;
        li.appendChild(previewDiv);
      }

      li.onclick = () => {
        const target = document.getElementById(item.id);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.innerWidth < 1024) UI.closeSidebarMobile();
      };

      D.tocList.appendChild(li);
    });
  }
};