import { State } from './state.js';
import { D } from './dom.js';
import { UI } from './ui.js';
import { Search } from './search.js';
import { FileOps } from './file-ops.js';

export const Editor = {
  toggleMode() {
    State.isEditMode = !State.isEditMode;
    D.body.classList.toggle('editing', State.isEditMode);
    D.editToggleBtn.classList.toggle('active-mode', State.isEditMode);
    
    // リボンとステータスバーの表示切り替え
    D.ribbonContainer.classList.toggle('hidden', !State.isEditMode);
    D.editorStatusBar.classList.toggle('hidden', !State.isEditMode);

    if (State.isEditMode) {
      D.editTextarea.value = State.currentTextCache;
      Search.close();
      this.setViewMode('edit');
      this.updateStatusBar();
      D.editTextarea.focus();
    } else {
      this.saveChanges();
    }
  },

  saveChanges() {
    const newText = D.editTextarea.value;
    State.currentTextCache = newText;
    FileOps.renderContent(newText);
    D.saveStatus.textContent = "保存済み";
  },

  // リボンUI：タブ切り替え
  switchRibbonTab(tabId) {
    D.ribbonTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    D.ribbonPanels.forEach(p => p.classList.toggle('active', p.id === tabId));
  },

  // 表示モード切り替え（編集 / プレビュー）
  setViewMode(mode) {
    const isPreview = mode === 'preview';
    D.body.classList.toggle('preview-display', isPreview);
    D.rbnViewEdit.classList.toggle('active', !isPreview);
    D.rbnViewPreview.classList.toggle('active', isPreview);

    if (isPreview) {
      this.refreshPreview();
    } else {
      D.editTextarea.focus();
    }
  },

  refreshPreview() {
    const text = D.editTextarea.value;
    FileOps.renderContent(text);
  },

  // ステータスバー更新
  updateStatusBar() {
    const text = D.editTextarea.value;
    const charCount = text.length;
    const lineCount = text.split(/\r\n|\n/).length;

    D.charCount.textContent = `${charCount} 文字`;
    D.lineCount.textContent = `${lineCount} 行`;
    D.saveStatus.textContent = "変更あり";
    D.saveStatus.className = "changed";
  },

  insertMarkdown(type) {
    const textarea = D.editTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let before = "";
    let after = "";
    let cursorOffset = 0;

    switch (type) {
      case 'bold': before = "**"; after = "**"; break;
      case 'italic': before = "_"; after = "_"; break;
      case 'strike': before = "~~"; after = "~~"; break;
      case 'h1': before = "# "; break;
      case 'h2': before = "## "; break;
      case 'h3': before = "### "; break;
      case 'list': before = "- "; break;
      case 'quote': before = "> "; break;
      case 'link': before = "["; after = "](url)"; cursorOffset = -5; break;
      case 'image': before = "!["; after = "](url)"; cursorOffset = -5; break;
      case 'table': 
        before = "\n| 列1 | 列2 |\n| --- | --- |\n|  |  |\n";
        break;
      case 'hr': before = "\n---\n"; break;
      case 'ai-switch':
        before = "\n:::switch\n@元の視点\n";
        after = "\n\n@別の視点\n...\n:::";
        break;
    }

    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    textarea.value = newText;
    State.currentTextCache = newText;

    // カーソル位置の調整
    const newPos = start + before.length + selected.length + after.length + cursorOffset;
    textarea.focus();
    textarea.setSelectionRange(newPos, newPos);
    
    this.updateStatusBar();
    if (D.body.classList.contains('preview-display')) this.refreshPreview();
  },

  // --- ダウンロード機能 ---
  openDownloadModal() {
    let originalName = D.titleDisplay.textContent;
    if (!originalName || originalName === '未読み込み') {
      originalName = 'document.txt';
    }

    const lastDot = originalName.lastIndexOf('.');
    let base = originalName;
    let ext = '.txt';

    if (lastDot !== -1) {
      base = originalName.substring(0, lastDot);
      ext = originalName.substring(lastDot);
    }

    // デフォルトのファイル名を設定 (base + _edited)
    D.downloadFilenameInput.value = `${base}_edited`;
    
    // 拡張子の情報を反映 (もし現在のファイルが .md なら .md を選択状態にするなど)
    if (ext === '.md') {
      document.getElementById('ext-md').checked = true;
    } else {
      document.getElementById('ext-txt').checked = true;
    }

    D.downloadModal.classList.remove('hidden');
    setTimeout(() => D.downloadFilenameInput.focus(), 0);
  },

  confirmDownload() {
    const filename = D.downloadFilenameInput.value.trim() || 'document';
    const ext = document.querySelector('input[name="download-ext"]:checked').value;
    
    this.downloadFile(filename, ext);
    D.downloadModal.classList.add('hidden');
  },

  downloadFile(filename, ext) {
    const content = State.currentTextCache || D.editTextarea.value;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.download = `${filename}${ext}`;
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
      if (D.body.classList.contains('preview-display')) this.setViewMode('edit');
      const lines = D.editTextarea.value.split(/\r\n|\n/);
      let pos = 0;
      for (let i = 0; i < Math.max(0, line - 1); i++) pos += lines[i].length + 1;
      D.editTextarea.focus();
      D.editTextarea.setSelectionRange(pos, pos);
    } else {
      const target = document.getElementById(`line-${line}`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    D.jumpLineModal.classList.add('hidden');
  },

  toggleAiSelectionMode() {
    if (State.isEditMode) {
      alert("AI別視点生成は閲覧モードで行ってください。");
      return;
    }
    State.isAiSelectionMode = !State.isAiSelectionMode;
    D.body.classList.toggle('ai-selection-mode', State.isAiSelectionMode);

    if (State.isAiSelectionMode) {
      State.aiSelectionRange = { start: null, end: null };
      this.refreshAiSelectionUI();
      this.showAiFloatBar();
      this.bindAiSelectionEvents();
    } else {
      this.removeAiFloatBar();
      this.unbindAiSelectionEvents();
      this.clearAllSelections();
    }
  },

  bindAiSelectionEvents() {
    this._aiClickHandler = (e) => {
      const target = e.target.closest('[data-line]');
      if (target && !target.closest('.switch-block')) {
        const lineNum = parseInt(target.getAttribute('data-line'), 10);
        if (lineNum) this.handleParagraphSelection(lineNum);
      }
    };
    D.contentArea.addEventListener('click', this._aiClickHandler);
  },

  unbindAiSelectionEvents() {
    if (this._aiClickHandler) {
      D.contentArea.removeEventListener('click', this._aiClickHandler);
    }
  },

  handleParagraphSelection(lineNum) {
    if (State.aiSelectionRange.start === lineNum) {
      State.aiSelectionRange.start = null;
      State.aiSelectionRange.end = null;
    } else if (State.aiSelectionRange.start === null) {
      State.aiSelectionRange.start = lineNum;
      State.aiSelectionRange.end = lineNum;
    } else {
      State.aiSelectionRange.end = lineNum;
    }
    this.refreshAiSelectionUI();
  },

  refreshAiSelectionUI() {
    const start = Math.min(State.aiSelectionRange.start || 0, State.aiSelectionRange.end || 0);
    const end = Math.max(State.aiSelectionRange.start || 0, State.aiSelectionRange.end || 0);

    const targets = D.contentArea.querySelectorAll('[data-line]');
    let count = 0;
    targets.forEach(el => {
      const line = parseInt(el.getAttribute('data-line'), 10);
      const isSelected = State.aiSelectionRange.start !== null && line >= start && line <= end;
      el.classList.toggle('ai-selected', isSelected);
      if (isSelected) count++;
    });

    const info = document.querySelector('.ai-bar-info');
    if (info) info.textContent = State.aiSelectionRange.start === null ? "対象を選択してください" : `${count} 項目を選択中`;
  },

  showAiFloatBar() {
    this.removeAiFloatBar();
    const bar = document.createElement('div');
    bar.id = 'ai-float-bar';

    const historyList = (State.settings.aiPersonaHistory || [])
      .map(name => `
        <div class="persona-dropdown-item" data-value="${name}">
          <span class="persona-item-text">${name}</span>
          <button class="persona-item-delete" title="削除"><i class="fa-solid fa-trash"></i></button>
        </div>
      `)
      .join('');

    const modelOptions = (State.settings.aiModels || []).map(m => {
      const displayName = m.label || m.name || "名称未設定";
      return `<option value="${m.id}" ${m.active ? 'selected' : ''}>${displayName}</option>`;
    }).join('');

    bar.innerHTML = `
      <div class="ai-bar-info">対象を選択してください</div>
      <div class="ai-bar-persona">
        <label>視点:</label>
        <div class="persona-input-wrapper">
          <input type="text" id="ai-persona-input" placeholder="相手の視点" value="相手の視点">
          <button id="ai-persona-dropdown-btn" class="persona-dropdown-btn" title="履歴を表示">▼</button>
          <div id="persona-dropdown-list" class="persona-dropdown-list hidden">
            ${historyList || '<div class="persona-dropdown-empty">履歴がありません</div>'}
          </div>
        </div>
      </div>
      <div class="ai-bar-model">
        <select id="ai-model-select">${modelOptions}</select>
      </div>
      <div class="ai-bar-instruction">
        <input type="text" id="ai-instruction-input" placeholder="追加指示 (オプション)">
      </div>
      <div class="ai-bar-actions">
        <button id="ai-gen-btn">生成実行</button>
        <button id="ai-clear-btn" class="secondary">選択解除</button>
        <button id="ai-cancel-btn" class="secondary">キャンセル</button>
      </div>
    `;
    document.body.appendChild(bar);

    const personaInput = document.getElementById('ai-persona-input');
    const dropdownBtn = document.getElementById('ai-persona-dropdown-btn');
    const dropdownList = document.getElementById('persona-dropdown-list');

    if (dropdownBtn && dropdownList && personaInput) {
      dropdownBtn.onclick = (e) => {
        e.stopPropagation();
        dropdownList.classList.toggle('hidden');
      };

      dropdownList.onclick = async (e) => {
        const deleteBtn = e.target.closest('.persona-item-delete');
        if (deleteBtn) {
          e.stopPropagation();
          const item = deleteBtn.closest('.persona-dropdown-item');
          const val = item.getAttribute('data-value');
          State.settings.aiPersonaHistory = (State.settings.aiPersonaHistory || []).filter(h => h !== val);
          try {
            const { saveSettingsToStorage } = await import('./settings.js');
            saveSettingsToStorage();
          } catch (err) {
            console.error("Failed to save settings", err);
          }
          item.remove();
          if (State.settings.aiPersonaHistory.length === 0) {
            dropdownList.innerHTML = '<div class="persona-dropdown-empty">履歴がありません</div>';
          }
          return;
        }

        const item = e.target.closest('.persona-dropdown-item');
        if (item) {
          personaInput.value = item.getAttribute('data-value');
          dropdownList.classList.add('hidden');
        }
      };

      const closeDropdown = (e) => {
        if (!bar.contains(e.target)) {
          dropdownList.classList.add('hidden');
        }
      };
      document.addEventListener('click', closeDropdown);
    }

    document.getElementById('ai-gen-btn').onclick = () => this.generateAiPerspective();
    document.getElementById('ai-clear-btn').onclick = () => {
      State.aiSelectionRange = { start: null, end: null };
      this.refreshAiSelectionUI();
    };
    document.getElementById('ai-cancel-btn').onclick = () => this.toggleAiSelectionMode();
  },

  removeAiFloatBar() {
    const bar = document.getElementById('ai-float-bar');
    if (bar) bar.remove();
  },

  clearAllSelections() {
    D.contentArea.querySelectorAll('.ai-selected').forEach(p => p.classList.remove('ai-selected'));
  },

  async generateAiPerspective() {
    if (State.aiSelectionRange.start === null) {
      alert("段落が選択されていません。");
      return;
    }

    const personaInput = document.getElementById('ai-persona-input');
    const modelSelect = document.getElementById('ai-model-select');
    const instrInput = document.getElementById('ai-instruction-input');

    const persona = personaInput ? (personaInput.value.trim() || "相手の視点") : "相手の視点";
    const selectedModelId = modelSelect ? modelSelect.value : (State.settings.aiModels.find(m => m.active)?.id);
    const instruction = instrInput ? instrInput.value.trim() : "";

    const activeModel = State.settings.aiModels.find(m => m.id === selectedModelId) || State.settings.aiModels.find(m => m.active);
    if (!activeModel) {
      alert("AI設定から使用するモデルを選択してください。");
      return;
    }

    const startLine = Math.min(State.aiSelectionRange.start, State.aiSelectionRange.end);
    const endLine = Math.max(State.aiSelectionRange.start, State.aiSelectionRange.end);

    const selectedElements = Array.from(D.contentArea.querySelectorAll('[data-line]'))
      .filter(el => {
        const ln = parseInt(el.getAttribute('data-line'), 10);
        return ln >= startLine && ln <= endLine;
      });

    if (selectedElements.length === 0) {
      alert("選択範囲が正しく取得できませんでした。");
      return;
    }

    const finalStartLine = Math.min(...selectedElements.map(el => parseInt(el.getAttribute('data-line'), 10)));
    const finalEndLine = Math.max(...selectedElements.map(el => parseInt(el.getAttribute('data-line-end'), 10)));

    if (selectedElements.some(el => el.closest('.switch-block'))) {
      alert("選択範囲内に既に switch ブロックが含まれています。");
      return;
    }

    const lines = (State.currentTextCache || "").split(/\r\n|\n/);
    const selectedText = lines.slice(finalStartLine - 1, finalEndLine).join('\n');

    if (!State.settings.aiPersonaHistory) State.settings.aiPersonaHistory = [];
    if (!State.settings.aiPersonaHistory.includes(persona)) {
      State.settings.aiPersonaHistory.unshift(persona);
      if (State.settings.aiPersonaHistory.length > 10) State.settings.aiPersonaHistory.pop();
      try {
        const { saveSettingsToStorage } = await import('./settings.js');
        saveSettingsToStorage();
      } catch (e) {
        console.error("Settings could not be saved", e);
      }
    }

    State.aiSelectionRange = { start: null, end: null };
    this.refreshAiSelectionUI();
    this.showAiFloatBar();

    UI.showLoadingOverlay("AIに接続しています...");
    UI.updateLoadingProgress(10, `プロンプト「${persona}」を送信中...`);

    try {
      const { AiService } = await import('./ai.js');
      UI.updateLoadingProgress(30, "AIが内容を構成中...");
      const progressTimer = setInterval(() => {
        const currentBar = document.getElementById('ai-progress-bar');
        if (currentBar && parseInt(currentBar.style.width || "0") < 90) {
          UI.updateLoadingProgress(parseInt(currentBar.style.width) + 5, "AIが執筆しています...");
        }
      }, 800);

      const result = await AiService.generate(activeModel, selectedText, persona, instruction);
      clearInterval(progressTimer);
      UI.updateLoadingProgress(100, "書き込み中...");

      const newLines = [
        ...lines.slice(0, finalStartLine - 1),
        result,
        ...lines.slice(finalEndLine)
      ];
      State.currentTextCache = newLines.join('\n');
      FileOps.renderContent(State.currentTextCache);
    } catch (e) {
      alert("AI生成エラー: " + e.message);
    } finally {
      setTimeout(() => UI.hideLoadingOverlay(), 500);
    }
  },

  openRegenModal(block, activeName = '') {
    const existing = document.getElementById('ai-regen-modal');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'ai-regen-modal';
    wrapper.className = 'modal-wrapper';

    const historyList = (State.settings.aiPersonaHistory || [])
      .map(name => `<div class="persona-dropdown-item" data-value="${name}"><span class="persona-item-text">${name}</span><button class="persona-item-delete" title="削除"><i class="fa-solid fa-trash"></i></button></div>`)
      .join('');

    const sourceOptions = block.variants.map(v => `<option value="${v.name}" ${v.name === activeName ? 'selected' : ''}>${v.name}</option>`).join('');
    const modelOptions = (State.settings.aiModels || []).map(m => `<option value="${m.id}" ${m.active ? 'selected' : ''}>${m.provider}: ${m.label || m.name}</option>`).join('');

    wrapper.innerHTML = `
      <div class="modal-box giant-modal" style="height: auto; max-width: 500px;">
        <div class="modal-header"><h3>別視点の再生成 / 追加</h3><button class="icon-btn" onclick="document.getElementById('ai-regen-modal').remove()"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="regen-form">
          <div class="regen-field"><label>元の視点 (ソース):</label><select id="regen-source-select">${sourceOptions}</select></div>
          <div class="regen-field"><label>ターゲットの視点名:</label><div class="persona-input-wrapper">
              <input type="text" id="regen-persona-input" value="${activeName || '相手の視点'}"><button id="regen-persona-dropdown-btn" class="persona-dropdown-btn">▼</button>
              <div id="regen-persona-dropdown-list" class="persona-dropdown-list hidden modal-dropdown">${historyList || '<div class="persona-dropdown-empty">履歴がありません</div>'}</div>
          </div></div>
          <div class="regen-field"><label>使用するモデル:</label><select id="regen-model-select">${modelOptions}</select></div>
          <div class="regen-field"><label>追加の指示:</label><textarea id="regen-instruction-input"></textarea></div>
          <div class="regen-actions"><button class="secondary" onclick="document.getElementById('ai-regen-modal').remove()">キャンセル</button><button id="regen-exec-btn">生成実行</button></div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper);

    const personaInputElem = document.getElementById('regen-persona-input');
    const dropdownBtn = document.getElementById('regen-persona-dropdown-btn');
    const dropdownList = document.getElementById('regen-persona-dropdown-list');

    if (dropdownBtn && dropdownList && personaInputElem) {
      dropdownBtn.onclick = (e) => { e.stopPropagation(); dropdownList.classList.toggle('hidden'); };
      dropdownList.onclick = async (e) => {
        const deleteBtn = e.target.closest('.persona-item-delete');
        if (deleteBtn) {
          e.stopPropagation();
          const item = deleteBtn.closest('.persona-dropdown-item');
          const val = item.getAttribute('data-value');
          State.settings.aiPersonaHistory = (State.settings.aiPersonaHistory || []).filter(h => h !== val);
          const { saveSettingsToStorage } = await import('./settings.js');
          saveSettingsToStorage();
          item.remove();
          return;
        }
        const item = e.target.closest('.persona-dropdown-item');
        if (item) { personaInputElem.value = item.getAttribute('data-value'); dropdownList.classList.add('hidden'); }
      };
    }

    document.getElementById('regen-exec-btn').onclick = () => {
      const sourceVariant = block.variants.find(v => v.name === document.getElementById('regen-source-select').value);
      if (!sourceVariant) return;
      this.regeneratePerspective(block, {
        sourceText: sourceVariant.text,
        originalName: activeName,
        targetPersona: document.getElementById('regen-persona-input').value.trim(),
        modelId: document.getElementById('regen-model-select').value,
        instruction: document.getElementById('regen-instruction-input').value.trim()
      });
      wrapper.remove();
    };
  },

  async regeneratePerspective(block, config) {
    const { sourceText, originalName, targetPersona, modelId, instruction } = config;
    const activeModel = State.settings.aiModels.find(m => m.id === modelId) || State.settings.aiModels.find(m => m.active);
    if (!activeModel) return;

    UI.showLoadingOverlay("AIに接続しています...");
    try {
      const { AiService } = await import('./ai.js');
      const { BlockParser } = await import('./block-parser.js');
      const result = await AiService.generate(activeModel, sourceText, targetPersona, instruction);
      const parsedBlocks = BlockParser.parse(result);
      const switchBlock = parsedBlocks.find(b => b.type === 'switch');
      if (!switchBlock) throw new Error("AI結果解析不能");

      const targetVariant = switchBlock.variants.find(v => v.name === targetPersona);
      if (!targetVariant) throw new Error("視点未検出");

      const aiContent = targetVariant.text.trim();
      const newVariants = [...block.variants];
      const targetIdx = newVariants.findIndex(v => v.name === targetPersona);
      const originalIdx = originalName ? newVariants.findIndex(v => v.name === originalName) : -1;

      if (targetIdx !== -1) newVariants[targetIdx] = { ...newVariants[targetIdx], text: aiContent };
      else if (originalIdx !== -1) newVariants[originalIdx] = { ...newVariants[originalIdx], name: targetPersona, text: aiContent };
      else newVariants.push({ name: targetPersona, text: aiContent, lineOffset: 0 });

      let newBlockText = `:::switch\n` + newVariants.map(v => `@${v.name}\n${v.text}`).join('\n\n') + `\n:::`;
      const lines = (State.currentTextCache || "").split(/\r\n|\n/);
      let endLine = block.lineOffset;
      for (let i = block.lineOffset; i < lines.length; i++) if (lines[i].trim() === ':::') { endLine = i; break; }

      State.currentTextCache = [...lines.slice(0, block.lineOffset), newBlockText, ...lines.slice(endLine + 1)].join('\n');
      FileOps.renderContent(State.currentTextCache);
    } catch (e) {
      alert("エラー: " + e.message);
    } finally {
      UI.hideLoadingOverlay();
    }
  }
};
