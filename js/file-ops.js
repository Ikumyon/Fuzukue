import { State } from './state.js';
import { D } from './dom.js';
import { UI } from './ui.js';
import { Search } from './search.js';
import { Editor } from './editor.js'; // 循環依存の可能性に注意ですが、ES Modulesなら遅延評価で動くことが多い

export const FileOps = {
    loadFile(file) {
        if (!file) return;
        if (!file.type.match('text.*') && !file.name.endsWith('.txt')) {
            alert('テキストファイルを選択してください。');
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
            
            // 編集モードなら解除 (Editorモジュールに依存)
            if(State.isEditMode) Editor.toggleMode();
        };
        reader.readAsText(file);
    },

    renderContent(text) {
        D.contentArea.innerHTML = '';
        D.tocList.innerHTML = '';
        State.currentTocMap = [];

        const lines = text.split(/\r\n|\n/);
        const fragment = document.createDocumentFragment();

        lines.forEach((line, index) => {
            const p = document.createElement('p');
            const trimmed = line.trim();
            
            p.dataset.line = index + 1; 
            p.id = `line-${index + 1}`; 

            if (this.isHeading(trimmed)) {
                p.classList.add('line-heading');
                
                let previewText = "";
                for (let k = index + 1; k < lines.length; k++) {
                    const nextLine = lines[k].trim();
                    if (nextLine.length > 0) {
                        previewText = nextLine;
                        break;
                    }
                }

                State.currentTocMap.push({ 
                    id: p.id, 
                    text: trimmed, 
                    preview: previewText, 
                    element: p 
                });
            }
            
            p.textContent = line;
            if(line === '') p.innerHTML = '&nbsp;'; 
            fragment.appendChild(p);
        });

        D.contentArea.appendChild(fragment);
        this.renderToc();
    },

    isHeading(str) {
        if (!str || str.length === 0 || str.length > 60) return false;
        
        if (State.settings.excludePattern) {
            try {
                if (new RegExp(State.settings.excludePattern).test(str)) return false;
            } catch(e) {}
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
                if(target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                if (window.innerWidth < 1024) UI.closeSidebarMobile();
            };
            D.tocList.appendChild(li);
        });
    }
};