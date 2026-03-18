import { State } from './state.js';
import { D } from './dom.js';

export const Search = {
  toggle() {
    if (!D.searchBar) return;
    // ★ドロワー：active で width が 0 → 伸びる（ボタンは固定）
    const isActive = D.searchBar.classList.toggle('active');
    D.searchToggleBtn?.classList.toggle('active', isActive);

    if (isActive) {
      // 置換UIの表示切り替え（編集モード時のみ）
      const hasReplace = State.isEditMode;
      D.replaceWrap.classList.toggle('hidden', !hasReplace);
      D.searchBar.classList.toggle('has-replace', hasReplace);

      // 設定パネルと競合しないように
      D.settingsModal?.classList.add('hidden');
      D.searchBar.classList.remove('hidden');
      setTimeout(() => D.searchInput.focus(), 0);
    } else {
      this.close();
    }
  },

  close() {
    if (!D.searchBar) return;
    D.searchBar.classList.remove('active');
    D.searchBar.classList.remove('has-replace');
    D.searchToggleBtn?.classList.remove('active');
    D.searchBar.classList.remove('hidden');
    D.replaceWrap?.classList.add('hidden');
    this.clearHighlights();
    D.searchInput.value = "";
    D.replaceInput.value = "";
  },

  perform() {
    this.clearHighlights();
    const query = D.searchInput.value;
    if (!query) return;

    if (State.isEditMode) {
      this.performInTextarea(query);
    } else {
      this.performInReader(query);
    }
  },

  performInReader(query) {
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

  performInTextarea(query) {
    const text = D.editTextarea.value;
    let regex;
    try {
      regex = State.isRegexMode
        ? new RegExp(query, 'g')
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    } catch (e) {
      alert("正規表現エラー: " + e.message);
      return;
    }

    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[0].length === 0) {
        regex.lastIndex++;
        continue;
      }
      matches.push({ index: match.index, length: match[0].length });
    }

    State.searchMatches = matches;
    if (matches.length > 0) {
      State.currentMatchIndex = 0;
      this.highlightCurrent();
    } else {
      D.searchCount.textContent = "0/0";
      State.currentMatchIndex = -1;
    }
  },

  clearHighlights() {
    if (!State.isEditMode && State.searchMatches.length > 0) {
      State.searchMatches.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(span.textContent), span);
          parent.normalize();
        }
      });
    }
    State.searchMatches = [];
    D.searchCount.textContent = "0/0";
    State.currentMatchIndex = -1;
  },

  navigate(direction) {
    if (State.searchMatches.length === 0) return;

    if (!State.isEditMode) {
      const current = State.searchMatches[State.currentMatchIndex];
      if (current) current.classList.remove('current');
    }

    State.currentMatchIndex += direction;
    if (State.currentMatchIndex >= State.searchMatches.length) State.currentMatchIndex = 0;
    if (State.currentMatchIndex < 0) State.currentMatchIndex = State.searchMatches.length - 1;

    this.highlightCurrent();
  },

  highlightCurrent() {
    D.searchCount.textContent = `${State.currentMatchIndex + 1}/${State.searchMatches.length}`;
    const match = State.searchMatches[State.currentMatchIndex];
    if (!match) return;

    if (State.isEditMode) {
      // エディタ内でのハイライト = 選択状態
      D.editTextarea.focus();
      D.editTextarea.setSelectionRange(match.index, match.index + match.length);
      
      // テキストエリアのスクロール位置を調整（簡易的）
      const lines = D.editTextarea.value.substring(0, match.index).split('\n');
      const lineHeight = parseInt(getComputedStyle(D.editTextarea).lineHeight);
      D.editTextarea.scrollTop = (lines.length - 1) * lineHeight - (D.editTextarea.clientHeight / 2);
    } else {
      const el = match; // spans
      el.classList.add('current');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  replace() {
    if (!State.isEditMode || State.currentMatchIndex === -1) return;
    const match = State.searchMatches[State.currentMatchIndex];
    const replacement = D.replaceInput.value;
    const text = D.editTextarea.value;

    const newText = text.substring(0, match.index) + replacement + text.substring(match.index + match.length);
    D.editTextarea.value = newText;
    
    // 再検索して状態を更新
    this.perform();
    // 次の候補へ（現在のインデックスが維持されていればそれが「次」になる）
    if (State.searchMatches.length > 0) {
      if (State.currentMatchIndex >= State.searchMatches.length) State.currentMatchIndex = 0;
      this.highlightCurrent();
    }
    
    // ステータス更新などをトリガー
    D.editTextarea.dispatchEvent(new Event('input'));
  },

  replaceAll() {
    if (!State.isEditMode) return;
    const query = D.searchInput.value;
    const replacement = D.replaceInput.value;
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

    const text = D.editTextarea.value;
    const newText = text.replace(regex, replacement);
    D.editTextarea.value = newText;

    this.perform();
    D.editTextarea.dispatchEvent(new Event('input'));
  }
};
