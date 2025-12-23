import { State } from './state.js';
import { D } from './dom.js';
import { UI } from './ui.js';
import { Search } from './search.js';

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

    const lines = text.split(/\r\n|\n/);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      // --- Markdown Table Logic ---
      if (trimmed.startsWith('|') && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith('|') && nextLine.includes('-')) {
          const tableResult = this.parseTable(lines, i);
          if (tableResult) {
            fragment.appendChild(tableResult.element);
            i = tableResult.endIndex;
            continue;
          }
        }
      }

      // --- Normal Line or Heading ---
      let el;
      const mdHeadingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (mdHeadingMatch) {
        const level = mdHeadingMatch[1].length;
        const content = mdHeadingMatch[2];
        el = document.createElement(`h${level}`);
        el.textContent = content;
        // <br>タグの復元: textContentでエスケープされた &lt;br&gt; を <br> に戻す
        el.innerHTML = el.innerHTML.replace(/&lt;br\s*\/?&gt;/gi, '<br>');
      } else {
        el = document.createElement('p');
        el.textContent = line;
        // <br>タグの復元
        el.innerHTML = el.innerHTML.replace(/&lt;br\s*\/?&gt;/gi, '<br>');

        if (line === '') el.innerHTML = '&nbsp;';
      }

      el.dataset.line = lineNum;
      el.id = `line-${lineNum}`;

      // --- 目次判定 ---
      if (this.isHeading(trimmed)) {
        el.classList.add('line-heading');

        let previewText = "";
        for (let k = i + 1; k < lines.length; k++) {
          const nextLineStr = lines[k].trim();
          if (nextLineStr.length > 0) {
            previewText = nextLineStr;
            break;
          }
        }

        State.currentTocMap.push({
          id: el.id,
          text: trimmed.replace(/^(#+)\s+/, ''),
          preview: previewText,
          element: el
        });
      }

      fragment.appendChild(el);
    }

    D.contentArea.appendChild(fragment);
    this.renderToc();
  },

  parseTable(lines, startIndex) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    
    // Header
    const headerLine = lines[startIndex].trim();
    const headerCols = headerLine.split('|').filter(s => s !== '');
    const trHead = document.createElement('tr');
    
    headerCols.forEach(colText => {
      const th = document.createElement('th');
      th.textContent = colText.trim();
      // テーブルヘッダー内の <br> 復元
      th.innerHTML = th.innerHTML.replace(/&lt;br\s*\/?&gt;/gi, '<br>');
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    let currentIndex = startIndex + 2;

    while (currentIndex < lines.length) {
      const line = lines[currentIndex].trim();
      if (!line.startsWith('|')) break;

      const tr = document.createElement('tr');
      const cols = line.split('|');
      const validCols = [];
      for(let j=0; j<cols.length; j++) {
        if (j === 0 && cols[j] === '') continue;
        if (j === cols.length - 1 && cols[j] === '') continue;
        validCols.push(cols[j]);
      }

      validCols.forEach(colText => {
        const td = document.createElement('td');
        td.textContent = colText.trim();
        // テーブルセル内の <br> 復元
        td.innerHTML = td.innerHTML.replace(/&lt;br\s*\/?&gt;/gi, '<br>');
        tr.appendChild(td);
      });
      tbody.appendChild(tr);

      currentIndex++;
    }

    table.appendChild(tbody);
    table.id = `line-${startIndex + 1}`;
    table.dataset.line = startIndex + 1;

    return {
      element: table,
      endIndex: currentIndex - 1
    };
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