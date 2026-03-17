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
    const content = State.currentTextCache || D.editTextarea.value;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    let originalName = D.titleDisplay.textContent;
    if (!originalName || originalName === '未読み込み') {
      originalName = 'document.txt';
    }

    const lastDot = originalName.lastIndexOf('.');
    if (lastDot !== -1) {
      const base = originalName.substring(0, lastDot);
      const ext = originalName.substring(lastDot);
      a.download = `${base}_edited${ext}`;
    } else {
      a.download = `${originalName}_edited.txt`;
    }
    
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
    // すでに開始位置が選択されている状態で同じ行をクリックしたら解除
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

    // 履歴からリスト項目を作成
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
        // 削除ボタンのクリック処理
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
            console.error("Failed to save settings after deletion", err);
          }

          item.remove();
          if (State.settings.aiPersonaHistory.length === 0) {
            dropdownList.innerHTML = '<div class="persona-dropdown-empty">履歴がありません</div>';
          }
          return;
        }

        // 項目選択処理
        const item = e.target.closest('.persona-dropdown-item');
        if (item) {
          personaInput.value = item.getAttribute('data-value');
          dropdownList.classList.add('hidden');
        }
      };

      // 外側クリックで閉じる
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

    // 正確な範囲抽出：選択された最初の要素の開始行から、最後の要素の終了行まで
    const startLine = Math.min(State.aiSelectionRange.start, State.aiSelectionRange.end);
    const endLine = Math.max(State.aiSelectionRange.start, State.aiSelectionRange.end);

    // 実際に選択された要素を取得し、その中での最小開始行と最大終了行を特定する
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

    // Check for switch blocks inside range
    if (selectedElements.some(el => el.closest('.switch-block'))) {
      alert("選択範囲内に既に switch ブロックが含まれています。");
      return;
    }

    const lines = (State.currentTextCache || "").split(/\r\n|\n/);
    const selectedText = lines.slice(finalStartLine - 1, finalEndLine).join('\n');

    // 履歴の更新
    if (!State.settings.aiPersonaHistory) State.settings.aiPersonaHistory = [];
    if (!State.settings.aiPersonaHistory.includes(persona)) {
      State.settings.aiPersonaHistory.unshift(persona);
      if (State.settings.aiPersonaHistory.length > 10) State.settings.aiPersonaHistory.pop();

      // 設定を永続化
      try {
        const { saveSettingsToStorage } = await import('./settings.js');
        saveSettingsToStorage();
      } catch (e) {
        console.error("Settings could not be saved", e);
      }
    }

    // 生成後にモードを解除せず、選択範囲のみリセットして継続
    State.aiSelectionRange = { start: null, end: null };
    this.refreshAiSelectionUI();
    // フローティングバーの表示内容を更新（履歴を反映させるため再描画）
    this.showAiFloatBar();

    UI.showLoadingOverlay("AIに接続しています...");
    UI.updateLoadingProgress(10, `プロンプト「${persona}」を送信中...`);

    try {
      const { AiService } = await import('./ai.js');
      UI.updateLoadingProgress(30, "AIが内容を構成中...");

      // シミュレーション的なプログレス
      const progressTimer = setInterval(() => {
        const currentBar = document.getElementById('ai-progress-bar');
        if (currentBar) {
          const currentWidth = parseInt(currentBar.style.width || "0");
          if (currentWidth < 90) {
            UI.updateLoadingProgress(currentWidth + 5, currentWidth > 60 ? "文章を清書しています..." : "AIが執筆しています...");
          }
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
      console.error(e);
    } finally {
      setTimeout(() => UI.hideLoadingOverlay(), 500);
    }
  },

  openRegenModal(block, activeName = '') {
    // 既存のモーダルがあれば消す
    const existing = document.getElementById('ai-regen-modal');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'ai-regen-modal';
    wrapper.className = 'modal-wrapper';

    // 履歴からリスト項目を作成
    const historyList = (State.settings.aiPersonaHistory || [])
      .map(name => `
        <div class="persona-dropdown-item" data-value="${name}">
          <span class="persona-item-text">${name}</span>
          <button class="persona-item-delete" title="削除"><i class="fa-solid fa-trash"></i></button>
        </div>
      `)
      .join('');

    // ソースのデフォルトは現在の視点
    const sourceOptions = block.variants.map(v => `<option value="${v.name}" ${v.name === activeName ? 'selected' : ''}>${v.name}</option>`).join('');
    const modelOptions = (State.settings.aiModels || []).map(m => {
      const displayName = m.label || m.name || "名称未設定";
      return `<option value="${m.id}" ${m.active ? 'selected' : ''}>${m.provider}: ${displayName}</option>`;
    }).join('');

    wrapper.innerHTML = `
      <div class="modal-box giant-modal" style="height: auto; max-width: 500px;">
        <div class="modal-header">
          <h3>別視点の再生成 / 追加</h3>
          <button class="icon-btn" onclick="document.getElementById('ai-regen-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="regen-form">
          <div class="regen-field">
            <label>元の視点 (ソース):</label>
            <select id="regen-source-select">${sourceOptions}</select>
          </div>
          <div class="regen-field">
            <label>ターゲットの視点名:</label>
            <div class="persona-input-wrapper">
              <input type="text" id="regen-persona-input" placeholder="例: 読者の視点, 編集者の視点" value="${activeName || '相手の視点'}">
              <button id="regen-persona-dropdown-btn" class="persona-dropdown-btn" title="履歴を表示">▼</button>
              <div id="regen-persona-dropdown-list" class="persona-dropdown-list hidden modal-dropdown">
                ${historyList || '<div class="persona-dropdown-empty">履歴がありません</div>'}
              </div>
            </div>
          </div>
          <div class="regen-field">
            <label>使用するモデル:</label>
            <select id="regen-model-select">${modelOptions}</select>
          </div>
          <div class="regen-field">
            <label>追加の指示 (方針):</label>
            <textarea id="regen-instruction-input" placeholder="例: もっと短く、箇条書きで、など"></textarea>
          </div>
          <div class="regen-actions">
            <button class="secondary" onclick="document.getElementById('ai-regen-modal').remove()">キャンセル</button>
            <button id="regen-exec-btn">生成実行</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    const personaInputElem = document.getElementById('regen-persona-input');
    const dropdownBtn = document.getElementById('regen-persona-dropdown-btn');
    const dropdownList = document.getElementById('regen-persona-dropdown-list');

    if (dropdownBtn && dropdownList && personaInputElem) {
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

          if (!State.settings.aiPersonaHistory) State.settings.aiPersonaHistory = [];
          State.settings.aiPersonaHistory = State.settings.aiPersonaHistory.filter(h => h !== val);

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
          personaInputElem.value = item.getAttribute('data-value');
          dropdownList.classList.add('hidden');
        }
      };

      // モーダル外部や他所をクリックした際も閉じる
      const onGlobalClick = (e) => {
        if (!wrapper.contains(e.target)) {
          dropdownList.classList.add('hidden');
          document.removeEventListener('click', onGlobalClick);
        }
      };
      document.addEventListener('click', onGlobalClick);
    }

    document.getElementById('regen-exec-btn').onclick = () => {
      const sourceName = document.getElementById('regen-source-select').value;
      const targetPersona = document.getElementById('regen-persona-input').value.trim() || (activeName || "相手の視点");
      const modelId = document.getElementById('regen-model-select').value;
      const instruction = document.getElementById('regen-instruction-input').value.trim();

      const sourceVariant = block.variants.find(v => v.name === sourceName);
      if (!sourceVariant) return;

      this.regeneratePerspective(block, {
        sourceText: sourceVariant.text,
        originalName: activeName,
        targetPersona,
        modelId,
        instruction
      });
      wrapper.remove();
    };
  },

  async regeneratePerspective(block, config) {
    const { sourceText, originalName, targetPersona, modelId, instruction } = config;
    const activeModel = State.settings.aiModels.find(m => m.id === modelId) || State.settings.aiModels.find(m => m.active);
    if (!activeModel) {
      alert("選択されたモデルが見つかりません。");
      return;
    }

    UI.showLoadingOverlay("AIに接続しています...");
    UI.updateLoadingProgress(20, `${targetPersona} として再構成中...`);

    try {
      const { AiService } = await import('./ai.js');
      const { BlockParser } = await import('./block-parser.js');
      const result = await AiService.generate(activeModel, sourceText, targetPersona, instruction);
      
      const parsedBlocks = BlockParser.parse(result);
      const switchBlock = parsedBlocks.find(b => b.type === 'switch');
      
      if (!switchBlock || !switchBlock.variants) {
        throw new Error("AIからの応答を正しく解析できませんでした。");
      }

      const targetVariant = switchBlock.variants.find(v => v.name === targetPersona);
      if (!targetVariant) {
        throw new Error(`AIからの応答に視点「${targetPersona}」が見つかりませんでした。`);
      }

      const aiContent = targetVariant.text.trim();

      const newVariants = [...block.variants];
      const targetIdx = newVariants.findIndex(v => v.name === targetPersona);
      const originalIdx = originalName ? newVariants.findIndex(v => v.name === originalName) : -1;

      if (targetIdx !== -1) {
        // 同名の視点があれば上書き
        newVariants[targetIdx] = { ...newVariants[targetIdx], text: aiContent };
      } else if (originalIdx !== -1) {
        // 同名はなく、元の視点名が指定されていれば「名前の変更」として扱う
        newVariants[originalIdx] = { ...newVariants[originalIdx], name: targetPersona, text: aiContent };
      } else {
        // どちらでもなければ新規追加
        newVariants.push({ name: targetPersona, text: aiContent, lineOffset: 0 });
      }

      // 最終的な Markdown ブロックを構築
      let newBlockText = `:::switch\n`;
      newVariants.forEach(v => {
        newBlockText += `@${v.name}\n${v.text}\n\n`;
      });
      newBlockText = newBlockText.trim() + `\n:::`;

      // 元のテキストの置換
      const lines = (State.currentTextCache || "").split(/\r\n|\n/);
      // block.lineOffset は :::switch の行
      // 終了行を特定する必要がある。BlockParser.parse を流用するか、手動で判定
      let endLine = block.lineOffset;
      for (let i = block.lineOffset; i < lines.length; i++) {
        if (lines[i].trim() === ':::') {
          endLine = i;
          break;
        }
      }

      const newAllLines = [
        ...lines.slice(0, block.lineOffset),
        newBlockText,
        ...lines.slice(endLine + 1)
      ];

      State.currentTextCache = newAllLines.join('\n');
      FileOps.renderContent(State.currentTextCache);

      // 成功したら履歴に追加
      if (!State.settings.aiPersonaHistory.includes(targetPersona)) {
        State.settings.aiPersonaHistory.unshift(targetPersona);
        if (State.settings.aiPersonaHistory.length > 10) State.settings.aiPersonaHistory.pop();
        const { saveSettingsToStorage } = await import('./settings.js');
        saveSettingsToStorage();
      }

    } catch (e) {
      alert("再生成エラー: " + e.message);
      console.error(e);
    } finally {
      UI.hideLoadingOverlay();
    }
  }
};
