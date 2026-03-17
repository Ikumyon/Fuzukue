import { State } from './state.js';
import { D } from './dom.js';

export const Search = {
  toggle() {
    // ★ドロワー：active で width が 0 → 伸びる（ボタンは固定）
    const isActive = D.searchBar.classList.toggle('active');
    D.searchToggleBtn.classList.toggle('active', isActive);

    if (isActive) {
      // 設定パネルと競合しないように
      D.settingsPanel.classList.add('hidden');
      D.searchBar.classList.remove('hidden');
      setTimeout(() => D.searchInput.focus(), 0);
    } else {
      this.close();
    }
  },

  close() {
    D.searchBar.classList.remove('active');
    D.searchToggleBtn.classList.remove('active');
    D.searchBar.classList.remove('hidden');
    this.clearHighlights();
    D.searchInput.value = "";
  },

  perform() {
    this.clearHighlights();
    const query = D.searchInput.value;
    if (!query) return;

    let regex;
    try {
      regex = State.isRegexMode
        ? new RegExp(query, 'g')
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    } catch (e) {
      alert("正規表現エラー: " + e.message);
      return;
    }

    const highlightTextNodes = (node) => {
      if (node.nodeType === 3) {
        let match;
        while ((match = regex.exec(node.nodeValue)) !== null) {
          // 空文字マッチによる無限ループ防止
          if (match[0].length === 0) {
            regex.lastIndex++;
            continue;
          }

          const span = document.createElement('span');
          span.className = 'search-match';
          span.textContent = match[0];
          
          const after = node.splitText(match.index);
          after.nodeValue = after.nodeValue.substring(match[0].length);
          node.parentNode.insertBefore(span, after);
          
          regex.lastIndex = 0;
          node = after;
        }
      } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && !node.classList.contains('search-match')) {
        Array.from(node.childNodes).forEach(child => highlightTextNodes(child));
      }
    };

    highlightTextNodes(D.contentArea);

    const spans = D.contentArea.querySelectorAll('span.search-match');
    State.searchMatches = Array.from(spans);

    if (State.searchMatches.length > 0) {
      State.currentMatchIndex = 0;
      this.highlightCurrent();
    } else {
      D.searchCount.textContent = "0/0";
      State.currentMatchIndex = -1;
    }
  },

  clearHighlights() {
    if (State.searchMatches.length > 0) {
      State.searchMatches.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(span.textContent), span);
          parent.normalize();
        }
      });
      State.searchMatches = [];
    }
    D.searchCount.textContent = "0/0";
    State.currentMatchIndex = -1;
  },

  navigate(direction) {
    if (State.searchMatches.length === 0) return;

    const current = State.searchMatches[State.currentMatchIndex];
    if (current) current.classList.remove('current');

    State.currentMatchIndex += direction;
    if (State.currentMatchIndex >= State.searchMatches.length) State.currentMatchIndex = 0;
    if (State.currentMatchIndex < 0) State.currentMatchIndex = State.searchMatches.length - 1;

    this.highlightCurrent();
  },

  highlightCurrent() {
    const el = State.searchMatches[State.currentMatchIndex];
    if (el) {
      el.classList.add('current');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      D.searchCount.textContent = `${State.currentMatchIndex + 1}/${State.searchMatches.length}`;
    }
  }
};
