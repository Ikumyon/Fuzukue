// --- DOM Elements Cache ---
// モジュール読み込み時に実行されるため、defer属性と同様にDOM構築後にアクセス可能である必要があります。
// type="module" はデフォルトで defer 相当の挙動をします。

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
    downloadBtn: document.getElementById('download-btn'),
    readerContainer: document.getElementById('reader-container'),
    dropOverlay: document.getElementById('drop-overlay'),

    // Panels & Modals
    settingsPanel: document.getElementById('settings-panel'),
    tocSettingsModal: document.getElementById('toc-settings-modal'),
    jumpLineModal: document.getElementById('jump-line-modal'),
    searchBar: document.getElementById('search-bar'),

    // Inputs inside panels
    modeToggle: document.getElementById('mode-toggle'),
    themeToggle: document.getElementById('theme-toggle'),
    fontSelect: document.getElementById('font-select'),
    sizeRange: document.getElementById('size-range'),
    spacingRange: document.getElementById('spacing-range'),
    lineRange: document.getElementById('line-range'),

    // Search controls
    searchInput: document.getElementById('search-input'),
    regexToggle: document.getElementById('regex-toggle'),
    searchPrev: document.getElementById('search-prev'),
    searchNext: document.getElementById('search-next'),
    searchClose: document.getElementById('search-close'),
    searchCount: document.getElementById('search-count'),

    // TOC Settings controls
    ruleListContainer: document.getElementById('rule-list-container'),
    addRuleBtn: document.getElementById('add-rule-btn'),
    ruleExclude: document.getElementById('rule-exclude'),
    tocSettingsSave: document.getElementById('toc-settings-save'),
    tocSettingsClose: document.getElementById('toc-settings-close'),
    
    // Jump Line controls
    jumpLineInput: document.getElementById('jump-line-input'),
    jumpLineExec: document.getElementById('jump-line-exec'),
    jumpLineClose: document.getElementById('jump-line-close'),
    maxLineDisplay: document.getElementById('max-line-display'),
};