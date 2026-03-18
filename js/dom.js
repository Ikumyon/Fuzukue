// --- DOM Elements Cache ---
export const D = {
  body: document.body,
  root: document.documentElement,

  // Header
  hamburgerBtn: document.getElementById('hamburger-btn'),
  titleDisplay: document.getElementById('title-display'),
  editToggleBtn: document.getElementById('edit-toggle-btn'),
  downloadBtn: document.getElementById('download-btn'),
  jumpLineBtn: document.getElementById('jump-line-btn'),
  searchToggleBtn: document.getElementById('search-toggle-btn'),
  fileInput: document.getElementById('file-input'),
  settingsBtn: document.getElementById('settings-btn'),

  // Sidebar
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  tocList: document.getElementById('toc-list'),
  tocCount: document.getElementById('toc-count'),
  tocSettingsBtn: document.getElementById('toc-settings-btn'),

  // Main Content
  contentArea: document.getElementById('content-area'),
  editTextarea: document.getElementById('edit-textarea'),
  readerContainer: document.getElementById('reader-container'),
  dropOverlay: document.getElementById('drop-overlay'),

  // Panels & Modals
  settingsModal: document.getElementById('settings-modal'),
  settingsCloseTop: document.getElementById('settings-close-top'),
  settingsClose: document.getElementById('settings-close'),
  settingsSave: document.getElementById('settings-save'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  jumpLineModal: document.getElementById('jump-line-modal'),
  searchBar: document.getElementById('search-bar'),
  searchWrap: document.getElementById('search-wrap'),
  replaceWrap: document.getElementById('replace-wrap'),
  replaceInput: document.getElementById('replace-input'),
  replaceBtn: document.getElementById('replace-btn'),
  replaceAllBtn: document.getElementById('replace-all-btn'),

  // Inputs inside panels
  writingModeSegment: document.getElementById('writing-mode-segment'),
  themeSegment: document.getElementById('theme-segment'),
  fontSelect: document.getElementById('font-select'),
  sizeRange: document.getElementById('size-range'),
  spacingRange: document.getElementById('spacing-range'),
  lineRange: document.getElementById('line-height-range'),

  // Search controls
  searchInput: document.getElementById('search-input'),
  regexToggle: document.getElementById('regex-toggle'),
  searchPrev: document.getElementById('search-prev'),
  searchNext: document.getElementById('search-next'),
  searchClose: document.getElementById('search-close'),
  searchCount: document.getElementById('search-count'),

  // High-level main area containers
  editorMainArea: document.getElementById('editor-main-area'),

  // Ribbon UI
  ribbonContainer: document.getElementById('ribbon-container'),
  ribbonTabs: document.querySelectorAll('.ribbon-tab'),
  ribbonPanels: document.querySelectorAll('.ribbon-panel'),

  // Ribbon Buttons - Home
  rbnBold: document.getElementById('rbn-bold'),
  rbnItalic: document.getElementById('rbn-italic'),
  rbnStrike: document.getElementById('rbn-strike'),
  rbnH1: document.getElementById('rbn-h1'),
  rbnH2: document.getElementById('rbn-h2'),
  rbnH3: document.getElementById('rbn-h3'),
  rbnList: document.getElementById('rbn-list'),
  rbnQuote: document.getElementById('rbn-quote'),
  rbnSearch: document.getElementById('rbn-search'),

  // Ribbon Buttons - Insert
  rbnLink: document.getElementById('rbn-link'),
  rbnImage: document.getElementById('rbn-image'),
  rbnTable: document.getElementById('rbn-table'),
  rbnAiSwitch: document.getElementById('rbn-switch'),
  rbnHr: document.getElementById('rbn-hr'),

  // Ribbon Buttons - View
  rbnViewEdit: document.getElementById('rbn-view-edit'),
  rbnViewPreview: document.getElementById('rbn-view-preview'),
  rbnDownload: document.getElementById('rbn-download'),
  rbnSaveClose: document.getElementById('rbn-save-close'),

  // Status Bar
  editorStatusBar: document.getElementById('editor-status-bar'),
  charCount: document.getElementById('char-count'),
  lineCount: document.getElementById('line-count'),
  saveStatus: document.getElementById('save-status'),

  // TOC Settings controls (now in tabs)
  ruleListContainer: document.getElementById('rule-list-container'),
  addRuleBtn: document.getElementById('add-rule-btn'),
  tocResetBtn: document.getElementById('toc-reset-btn'),
  ruleExclude: document.getElementById('rule-exclude'),

  // AI Settings controls
  addAiModelBtn: document.getElementById('add-ai-model-btn'),
  aiModelListContainer: document.getElementById('ai-model-list-container'),
  aiBtn: document.getElementById('ai-btn'),

  // Jump Line controls
  jumpLineInput: document.getElementById('jump-line-input'),
  jumpLineExec: document.getElementById('jump-line-exec'),
  jumpLineClose: document.getElementById('jump-line-close'),
  maxLineDisplay: document.getElementById('max-line-display'),
  
  // Download Modal
  downloadModal: document.getElementById('download-modal'),
  downloadFilenameInput: document.getElementById('download-filename-input'),
  downloadExtSegment: document.getElementById('download-ext-segment'),
  downloadConfirmBtn: document.getElementById('download-confirm-btn'),
  downloadCancelBtn: document.getElementById('download-cancel-btn'),
};
