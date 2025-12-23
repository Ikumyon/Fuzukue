import { State } from './state.js';
import { D } from './dom.js';
import { Search } from './search.js';
import { FileOps } from './file-ops.js';

export const Editor = {
    toggleMode() {
        State.isEditMode = !State.isEditMode;
        D.body.classList.toggle('editing', State.isEditMode);
        D.editToggleBtn.classList.toggle('active-mode', State.isEditMode);

        if (State.isEditMode) {
            // 編集モードに入る時、一時的に縦書きクラスを除去（任意）
            // D.readerContainer.classList.remove('vertical'); 
            
            D.editTextarea.value = State.currentTextCache;
            Search.close();
            D.editTextarea.focus();
        } else {
            this.saveChanges();
        }
    },

    saveChanges() {
        const newText = D.editTextarea.value;
        State.currentTextCache = newText;
        // FileOpsを通じて再度HTML（pタグ群）としてレンダリング
        FileOps.renderContent(newText);
    },

    downloadFile() {
        const content = D.editTextarea.value;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const originalName = D.titleDisplay.textContent || 'document.txt';
        a.download = originalName.replace(/\.txt$/, '') + '_edited.txt';
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
    }
};