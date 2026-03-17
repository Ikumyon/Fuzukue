import { State } from './state.js';
import { D } from './dom.js';
import { FileOps } from './file-ops.js';
import { UI } from './ui.js';

export function saveSettingsToStorage() {
  localStorage.setItem('webReaderSettings', JSON.stringify(State.settings));
}

export const Settings = {
  init() {
    this.bindTabEvents();
  },

  bindTabEvents() {
    D.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
  },

  switchTab(tabId) {
    D.tabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
    D.tabContents.forEach(c => c.classList.toggle('hidden', c.id !== tabId));
  },

  openModal(tabId = 'tab-display') {
    this.renderUI();
    this.switchTab(tabId);
    D.settingsModal.classList.remove('hidden');
  },

  closeModal() {
    D.settingsModal.classList.add('hidden');
  },

  renderUI() {
    // TOC Rules
    D.ruleListContainer.innerHTML = '';
    State.settings.matchRules.forEach(rule => {
      D.ruleListContainer.appendChild(this.createRuleRow(rule.pattern, rule.enabled));
    });
    D.ruleExclude.value = State.settings.excludePattern;

    // AI Models
    D.aiModelListContainer.innerHTML = '';
    State.settings.aiModels.forEach(model => {
      D.aiModelListContainer.appendChild(this.createAiModelRow(model));
    });

    // Segment Controls
    const modeId = State.settings.isVertical ? 'mode-vertical' : 'mode-horizontal';
    document.getElementById(modeId).checked = true;

    const themeId = State.settings.isDarkMode ? 'theme-dark' : 'theme-light';
    document.getElementById(themeId).checked = true;
  },

  createRuleRow(pattern, enabled) {
    const div = document.createElement('div');
    div.className = 'rule-row';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = enabled;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = pattern;

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.onclick = () => div.remove();

    div.append(chk, input, delBtn);
    return div;
  },

  createAiModelRow(modelData) {
    const div = document.createElement('div');
    div.className = 'rule-row ai-model-row';
    div.dataset.id = modelData.id || Date.now() + Math.random();

    // 左端: ラジオボタン
    const activeChk = document.createElement('input');
    activeChk.type = 'radio';
    activeChk.name = 'active-ai-model';
    activeChk.checked = modelData.active;
    activeChk.title = '現在のモデルとして適用';
    activeChk.className = 'ai-radio';

    // 中央: 二段組みコンテナ
    const content = document.createElement('div');
    content.className = 'ai-row-content';

    // 1段目: プロバイダ, 表示名
    const row1 = document.createElement('div');
    row1.className = 'ai-row-inner';

    const providerSelect = document.createElement('select');
    providerSelect.innerHTML = `
      <option value="gemini">Gemini</option>
      <option value="openai">ChatGPT</option>
      <option value="claude">Claude</option>
    `;
    providerSelect.value = modelData.provider || 'gemini';

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.className = 'ai-label-input';
    labelInput.placeholder = '表示名 (例: Claude 3.7 最高)';
    labelInput.value = modelData.label || '';

    row1.append(providerSelect, labelInput);

    // 2段目: モデル名, APIキー, Thinking
    const row2 = document.createElement('div');
    row2.className = 'ai-row-inner';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'ai-name-input';
    nameInput.placeholder = 'モデル名 (例: claude-3-7-sonnet-20250219)';
    nameInput.value = modelData.name || '';

    const keyWrapper = document.createElement('div');
    keyWrapper.className = 'key-wrapper';
    const keyInput = document.createElement('input');
    keyInput.type = 'password';
    keyInput.className = 'ai-key-input';
    keyInput.placeholder = 'APIキー';
    keyInput.value = modelData.key || '';
    const viewBtn = document.createElement('button');
    viewBtn.className = 'icon-btn tiny toggle-password-btn';
    viewBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    viewBtn.onclick = (e) => {
      e.preventDefault();
      const isPass = keyInput.type === 'password';
      keyInput.type = isPass ? 'text' : 'password';
      viewBtn.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    };
    keyWrapper.append(keyInput, viewBtn);

    const thinkingLabel = document.createElement('label');
    thinkingLabel.className = 'ai-thinking-label';
    thinkingLabel.title = 'Thinking (推論) を有効にする';
    const thinkingChk = document.createElement('input');
    thinkingChk.type = 'checkbox';
    thinkingChk.className = 'ai-thinking-chk';
    thinkingChk.checked = !!modelData.thinking;
    thinkingLabel.append(thinkingChk, ' Thinking');

    row2.append(nameInput, keyWrapper, thinkingLabel);

    content.append(row1, row2);

    // 右端: 削除ボタン
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.onclick = () => div.remove();

    div.append(activeChk, content, delBtn);
    return div;
  },

  saveFromUI() {
    // TOC Rules
    const rows = D.ruleListContainer.querySelectorAll('.rule-row');
    const newRules = [];
    rows.forEach(row => {
      const chk = row.querySelector('input[type="checkbox"]');
      const input = row.querySelector('input[type="text"]');
      if (input.value.trim()) newRules.push({ enabled: chk.checked, pattern: input.value });
    });
    State.settings.matchRules = newRules;
    State.settings.excludePattern = D.ruleExclude.value.trim();

    // AI Models
    const aiRows = D.aiModelListContainer.querySelectorAll('.ai-model-row');
    const newAiModels = [];
    aiRows.forEach(row => {
      const active = row.querySelector('.ai-radio').checked;
      const provider = row.querySelector('select').value;
      const label = row.querySelector('.ai-label-input').value.trim();
      const name = row.querySelector('.ai-name-input').value.trim();
      const key = row.querySelector('.ai-key-input').value.trim();
      const thinking = row.querySelector('.ai-thinking-chk').checked;
      if (name) {
        newAiModels.push({
          id: row.dataset.id,
          active,
          provider,
          label,
          name,
          key,
          thinking
        });
      }
    });
    State.settings.aiModels = newAiModels;

    // Font/Theme are reactive via main.js but let's ensure they are in State
    // (Actually Main handles them via listeners and updates State)

    saveSettingsToStorage();
    if (State.currentTextCache) FileOps.renderContent(State.currentTextCache);
  },

  resetDefaults() {
    if (!confirm("目次抽出ルールを初期値に戻しますか？")) return;
    
    State.settings.matchRules = [
      { enabled: true, pattern: "^##\\s+.+" },
      { enabled: true, pattern: "^[#■●★◆▼➢].*" },
      { enabled: true, pattern: "^(第[0-9０-９一二三四五六七八九十百]+[章話部節篇]|Chapter|Episode|Prologue|Epilogue).*" }
    ];
    State.settings.excludePattern = "";
    
    this.renderUI();
  }
};
