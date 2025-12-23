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
  },

  openJumpModal() {
    const maxLines = (State.currentTextCache || "").split(/\r\n|\n/).length;
    D.maxLineDisplay.textContent = String(maxLines || 0);
    D.jumpLineInput.value = "";
    D.jumpLineModal.classList.remove('hidden');
    setTimeout(() => D.jumpLineInput.focus(), 0);
  },

  jumpToLine() {
    const maxLines = (State.currentTextCache || "").split(/\r\n|\n/).length;
    let line = parseInt(D.jumpLineInput.value, 10);
    if (!Number.isFinite(line) || line < 1) line = 1;
    if (maxLines > 0 && line > maxLines) line = maxLines;

    if (State.isEditMode) {
      // 編集中：該当行の先頭へカーソル移動
      const lines = D.editTextarea.value.split(/\r\n|\n/);
      let pos = 0;
      for (let i = 0; i < Math.max(0, line - 1); i++) pos += lines[i].length + 1;
      D.editTextarea.focus();
      D.editTextarea.setSelectionRange(pos, pos);
    } else {
      // 閲覧：p#line-n へスクロール
      const target = document.getElementById(`line-${line}`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    D.jumpLineModal.classList.add('hidden');
  }
};
