import { State } from './state.js';
import { D } from './dom.js';
import { UI } from './ui.js';
import { FileOps } from './file-ops.js';
import { Editor } from './editor.js';
import { Search } from './search.js';
import { Settings, saveSettingsToStorage } from './settings.js';

const App = {
  init() {
    this.loadSettings();
    this.bindEvents();
    Settings.init();
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
    UI.applyVerticalMode(State.settings.isVertical);
    UI.applyDarkMode(State.settings.isDarkMode);
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
      Settings.openModal('tab-display');
    });

    D.aiBtn.addEventListener('click', () => {
      Editor.toggleAiSelectionMode();
    });

    D.downloadBtn.addEventListener('click', () => Editor.openDownloadModal());

    // ★クリック外し：検索ドロワー
    document.addEventListener('click', (e) => {
      // search drawer
      if (D.searchBar?.classList.contains('active')) {
        const inSearch = D.searchBar.contains(e.target);
        const inWrap = D.searchWrap?.contains(e.target);
        // リボンボタン経由でのクリックも除外する必要がある
        const isRibbonSearch = D.rbnSearch && D.rbnSearch.contains(e.target);
        const isToggleBtn = D.searchToggleBtn && D.searchToggleBtn.contains(e.target);
        if (!inSearch && !inWrap && !isRibbonSearch && !isToggleBtn) Search.close();
      }
    });

    // Edit & Jump
    D.editToggleBtn.addEventListener('click', () => Editor.toggleMode());
    D.jumpLineBtn.addEventListener('click', () => Editor.openJumpModal());
    D.jumpLineClose.addEventListener('click', () => D.jumpLineModal.classList.add('hidden'));
    D.jumpLineExec.addEventListener('click', () => Editor.jumpToLine());
    D.jumpLineInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') Editor.jumpToLine(); });

    // Search Controls
    D.searchToggleBtn?.addEventListener('click', () => Search.toggle());
    D.searchClose?.addEventListener('click', () => Search.close());

    D.regexToggle?.addEventListener('click', () => {
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

    D.replaceBtn.addEventListener('click', () => Search.replace());
    D.replaceAllBtn.addEventListener('click', () => Search.replaceAll());
    D.replaceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); Search.replace(); }
    });

    // Settings Modal Content
    D.writingModeSegment.addEventListener('change', (e) => {
      State.settings.isVertical = e.target.value === 'vertical';
      UI.applyVerticalMode(State.settings.isVertical);
      saveSettingsToStorage();
    });

    D.themeSegment.addEventListener('change', (e) => {
      State.settings.isDarkMode = e.target.value === 'dark';
      UI.applyDarkMode(State.settings.isDarkMode);
      saveSettingsToStorage();
    });

    D.fontSelect.addEventListener('change', (e) => {
      UI.applyFont(e.target.value);
      State.settings.font = e.target.value;
      saveSettingsToStorage();
    });

    D.sizeRange.addEventListener('input', (e) => D.root.style.setProperty('--font-size', e.target.value + 'px'));
    D.spacingRange.addEventListener('input', (e) => D.root.style.setProperty('--letter-spacing', e.target.value + 'em'));
    D.lineRange.addEventListener('input', (e) => D.root.style.setProperty('--line-height', e.target.value));

    // Modal Actions
    D.settingsClose.addEventListener('click', () => Settings.closeModal());
    D.settingsCloseTop.addEventListener('click', () => Settings.closeModal());
    D.settingsSave.addEventListener('click', () => {
      Settings.saveFromUI();
      Settings.closeModal();
    });

    // Download Modal Actions
    D.downloadConfirmBtn.addEventListener('click', () => Editor.confirmDownload());
    D.downloadCancelBtn.addEventListener('click', () => D.downloadModal.classList.add('hidden'));
    D.downloadFilenameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') Editor.confirmDownload();
    });

    // TOC Tab specific
    D.tocSettingsBtn.addEventListener('click', () => {
      Settings.openModal('tab-toc');
    });

    D.addRuleBtn.addEventListener('click', () => {
      const row = Settings.createRuleRow("", true);
      D.ruleListContainer.appendChild(row);
      row.querySelector('input[type="text"]').focus();
    });

    D.tocResetBtn.addEventListener('click', () => {
      Settings.resetDefaults();
    });

    // AI Tab specific
    D.addAiModelBtn.addEventListener('click', () => {
      const row = Settings.createAiModelRow({ active: false });
      D.aiModelListContainer.appendChild(row);
      row.querySelector('input[type="text"]').focus();
    });

    // リボンUI タブ切り替え
    D.ribbonTabs.forEach(tab => {
      tab.addEventListener('click', () => Editor.switchRibbonTab(tab.dataset.tab));
    });

    // リボンUI ボタン（ホーム）
    D.rbnBold.addEventListener('click', () => Editor.insertMarkdown('bold'));
    D.rbnItalic.addEventListener('click', () => Editor.insertMarkdown('italic'));
    D.rbnStrike.addEventListener('click', () => Editor.insertMarkdown('strike'));
    D.rbnH1.addEventListener('click', () => Editor.insertMarkdown('h1'));
    D.rbnH2.addEventListener('click', () => Editor.insertMarkdown('h2'));
    D.rbnH3.addEventListener('click', () => Editor.insertMarkdown('h3'));
    D.rbnList.addEventListener('click', () => Editor.insertMarkdown('list'));
    D.rbnQuote.addEventListener('click', () => Editor.insertMarkdown('quote'));
    D.rbnSearch.addEventListener('click', () => Search.toggle());

    // リボンUI ボタン（挿入）
    D.rbnLink.addEventListener('click', () => Editor.insertMarkdown('link'));
    D.rbnImage.addEventListener('click', () => Editor.insertMarkdown('image'));
    D.rbnTable.addEventListener('click', () => Editor.insertMarkdown('table'));
    D.rbnAiSwitch.addEventListener('click', () => Editor.insertMarkdown('ai-switch'));
    D.rbnHr.addEventListener('click', () => Editor.insertMarkdown('hr'));

    // リボンUI ボタン（表示）
    D.rbnViewEdit.addEventListener('click', () => Editor.setViewMode('edit'));
    D.rbnViewPreview.onclick = () => Editor.setViewMode('preview');
    D.rbnDownload.onclick = () => Editor.openDownloadModal();
    D.rbnSaveClose.onclick = () => Editor.toggleMode(); // 終了

    // エディタ入力監視（文字数カウント・プレビュー更新準備）
    D.editTextarea.addEventListener('input', () => {
      Editor.updateStatusBar();
      if (D.body.classList.contains('preview-display')) {
        Editor.refreshPreview();
      }
    });

    // ESC 全体：モーダル閉じる/検索閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        Search.close();
        Settings.closeModal();
        D.jumpLineModal.classList.add('hidden');
        D.downloadModal.classList.add('hidden');
      }
      // Ctrl+E で編集/プレビュー切り替え
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        if (State.isEditMode) {
          const next = D.body.classList.contains('preview-display') ? 'edit' : 'preview';
          Editor.setViewMode(next);
        } else {
          Editor.toggleMode(); // 編集モード開始
        }
      }
      // Ctrl+F で検索ドロワー
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        if (!D.searchBar.classList.contains('active')) Search.toggle();
        else D.searchInput.focus();
      }
      // Ctrl+B, Ctrl+I 等のショートカットは Editor.initShortcuts で一括管理も可能だが、
      // ここで簡単にハンドルする
      if (State.isEditMode && e.ctrlKey) {
        if (e.key === 'b') { e.preventDefault(); Editor.insertMarkdown('bold'); }
        if (e.key === 'i') { e.preventDefault(); Editor.insertMarkdown('italic'); }
      }
    });
  }
};

App.init();
