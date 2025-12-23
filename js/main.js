import { State } from './state.js';
import { D } from './dom.js';
import { UI } from './ui.js';
import { FileOps } from './file-ops.js';
import { Editor } from './editor.js';
import { Search } from './search.js';
import { Settings } from './settings.js';

const App = {
  init() {
    this.loadSettings();
    this.bindEvents();
  },

  loadSettings() {
    const saved = localStorage.getItem('webReaderSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        State.settings = { ...State.settings, ...parsed };
      } catch (e) { console.error(e); }
    }
    UI.applyFont(State.settings.font);
  },

  bindEvents() {
    // Drag & Drop
    document.addEventListener('dragover', (e) => {
      e.preventDefault(); e.stopPropagation();
      D.body.classList.add('drag-over');
    });

    document.addEventListener('dragleave', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        D.body.classList.remove('drag-over');
      }
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault(); e.stopPropagation();
      D.body.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) FileOps.loadFile(e.dataTransfer.files[0]);
    });

    // Main Controls
    D.fileInput.addEventListener('change', (e) => FileOps.loadFile(e.target.files[0]));
    D.hamburgerBtn.addEventListener('click', UI.toggleSidebar);
    D.sidebarOverlay.addEventListener('click', UI.closeSidebarMobile);

    D.settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      UI.toggleSettingsPanel(e);
    });

    D.downloadBtn.addEventListener('click', () => Editor.downloadFile());

    // ★クリック外し：設定パネル & 検索ドロワー
    document.addEventListener('click', (e) => {
      // settings
      if (!D.settingsPanel.contains(e.target) && e.target !== D.settingsBtn) {
        D.settingsPanel.classList.add('hidden');
      }
      // search drawer
      if (D.searchBar.classList.contains('active')) {
        const inSearch = D.searchWrap.contains(e.target);
        if (!inSearch) Search.close();
      }
    });

    // Edit & Jump
    D.editToggleBtn.addEventListener('click', () => Editor.toggleMode());
    D.jumpLineBtn.addEventListener('click', () => Editor.openJumpModal());
    D.jumpLineClose.addEventListener('click', () => D.jumpLineModal.classList.add('hidden'));
    D.jumpLineExec.addEventListener('click', () => Editor.jumpToLine());
    D.jumpLineInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') Editor.jumpToLine(); });

    // Search Controls
    D.searchToggleBtn.addEventListener('click', () => Search.toggle());
    D.searchClose.addEventListener('click', () => Search.close());

    D.regexToggle.addEventListener('click', () => {
      State.isRegexMode = !State.isRegexMode;
      D.regexToggle.classList.toggle('active', State.isRegexMode);
      if (D.searchInput.value) Search.perform();
    });

    D.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); Search.perform(); }
      if (e.key === 'Escape') Search.close();
    });

    D.searchNext.addEventListener('click', () => {
      if (State.searchMatches.length === 0) Search.perform();
      else Search.navigate(1);
    });

    D.searchPrev.addEventListener('click', () => {
      if (State.searchMatches.length === 0) Search.perform();
      else Search.navigate(-1);
    });

    // Settings Panel
    D.modeToggle.addEventListener('click', () => {
      const isVertical = D.readerContainer.classList.toggle('vertical');
      D.modeToggle.textContent = isVertical ? '横書きにする' : '縦書きにする';
    });

    D.themeToggle.addEventListener('click', () => document.body.classList.toggle('dark-mode'));

    D.fontSelect.addEventListener('change', (e) => {
      UI.applyFont(e.target.value);
      State.settings.font = e.target.value;
      localStorage.setItem('webReaderSettings', JSON.stringify(State.settings));
    });

    D.sizeRange.addEventListener('input', (e) => D.root.style.setProperty('--font-size', e.target.value + 'px'));
    D.spacingRange.addEventListener('input', (e) => D.root.style.setProperty('--letter-spacing', e.target.value + 'em'));
    D.lineRange.addEventListener('input', (e) => D.root.style.setProperty('--line-height', e.target.value));

    // TOC Settings
    D.tocSettingsBtn.addEventListener('click', () => {
      Settings.renderUI();
      D.tocSettingsModal.classList.remove('hidden');
    });

    D.tocSettingsClose.addEventListener('click', () => D.tocSettingsModal.classList.add('hidden'));

    D.addRuleBtn.addEventListener('click', () => {
      const row = Settings.createRuleRow("", true);
      D.ruleListContainer.appendChild(row);
      row.querySelector('input[type="text"]').focus();
    });

    D.tocSettingsSave.addEventListener('click', () => {
      Settings.saveFromUI();
      D.tocSettingsModal.classList.add('hidden');
    });

    // ESC 全体：モーダル閉じる/検索閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      Search.close();
      D.tocSettingsModal.classList.add('hidden');
      D.jumpLineModal.classList.add('hidden');
      D.settingsPanel.classList.add('hidden');
    });
  }
};

App.init();
