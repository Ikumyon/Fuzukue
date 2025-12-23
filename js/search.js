import { State } from './state.js';
import { D } from './dom.js';

export const Search = {
    toggle() {
        D.searchBar.classList.remove('hidden');
        D.settingsPanel.classList.add('hidden');
        D.searchInput.focus();
    },
    
    close() {
        D.searchBar.classList.add('hidden');
        this.clearHighlights();
        D.searchInput.value = "";
    },

    perform() {
        this.clearHighlights();
        const query = D.searchInput.value;
        if (!query) return;

        let regex;
        try {
            regex = State.isRegexMode ? new RegExp(query, 'g') : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        } catch (e) {
            alert("正規表現エラー: " + e.message);
            return;
        }

        const paragraphs = D.contentArea.querySelectorAll('p');
        
        paragraphs.forEach(p => {
            const text = p.textContent;
            if (text.match(regex)) {
                const newHTML = text.replace(regex, match => `<span class="search-match">${match}</span>`);
                p.innerHTML = newHTML;
            }
        });

        const spans = D.contentArea.querySelectorAll('span.search-match');
        State.searchMatches = Array.from(spans);
        
        if (State.searchMatches.length > 0) {
            State.currentMatchIndex = 0;
            this.highlightCurrent();
        } else {
            D.searchCount.textContent = "0件";
        }
    },

    clearHighlights() {
        if (State.searchMatches.length > 0) {
            State.searchMatches.forEach(span => {
                const parent = span.parentNode;
                if (parent) {
                    // テキストノードに戻す
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
        if (State.searchMatches[State.currentMatchIndex]) {
            State.searchMatches[State.currentMatchIndex].classList.remove('current');
        }
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
            D.searchCount.textContent = `${State.currentMatchIndex + 1} / ${State.searchMatches.length}`;
        }
    }
};