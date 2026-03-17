import { D } from './dom.js';

export const UI = {
  toggleSidebar() {
    D.sidebar.classList.toggle('open');
    if (window.innerWidth < 1024) {
      if (D.sidebar.classList.contains('open')) D.sidebarOverlay.classList.add('visible');
      else D.sidebarOverlay.classList.remove('visible');
    } else {
      D.sidebar.classList.toggle('closed');
    }
  },

  closeSidebarMobile() {
    D.sidebar.classList.remove('open');
    D.sidebarOverlay.classList.remove('visible');
  },

  toggleSettingsPanel(e) {
    e.stopPropagation();
    D.settingsPanel.classList.toggle('hidden');
    if (!D.settingsPanel.classList.contains('hidden')) {
      // 設定を開いたら検索は閉じる側へ（見た目/操作の競合防止）
      D.searchBar.classList.add('hidden');
      D.searchBar.classList.remove('active');
    }
  },

  applyFont(fontKey) {
    let fontFamily = '"Yu Mincho", "Hiragino Mincho ProN", serif';
    switch (fontKey) {
      case 'gothic': fontFamily = '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'; break;
      case 'maru': fontFamily = '"HGMaruGothicMPRO", "Rounded Mplus 1c", "Hiragino Maru Gothic ProN", sans-serif'; break;
    }
    D.root.style.setProperty('--font-family', fontFamily);
    if (D.fontSelect) D.fontSelect.value = fontKey;
  },

  applyVerticalMode(isVertical) {
    D.readerContainer.classList.toggle('vertical', isVertical);
    if (D.modeToggle) {
      D.modeToggle.textContent = isVertical ? '横書きにする' : '縦書きにする';
    }
  },

  applyDarkMode(isDarkMode) {
    document.body.classList.toggle('dark-mode', isDarkMode);
  },

  showLoadingOverlay(message = "処理中...") {
    this.hideLoadingOverlay();
    const overlay = document.createElement('div');
    overlay.id = 'ai-loading-overlay';
    overlay.className = 'modal-wrapper';
    overlay.style.zIndex = '3000';
    overlay.innerHTML = `
      <div class="modal-box ai-progress-box" style="width: 320px; padding: 30px; text-align: center;">
        <i class="fa-solid fa-robot fa-bounce" style="font-size: 2.5rem; margin-bottom: 20px; color: var(--accent-color);"></i>
        <div id="ai-progress-msg" style="font-weight: bold; margin-bottom: 15px;">${message}</div>
        <div class="ai-progress-bar-container" style="width: 100%; height: 6px; background: rgba(0,0,0,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 10px;">
          <div id="ai-progress-bar" style="width: 0%; height: 100%; background: var(--accent-color); transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },
 
  updateLoadingProgress(percent, message) {
    const bar = document.getElementById('ai-progress-bar');
    const msg = document.getElementById('ai-progress-msg');
    if (bar) bar.style.width = percent + '%';
    if (msg && message) msg.textContent = message;
  },
 
  hideLoadingOverlay() {
    const overlay = document.getElementById('ai-loading-overlay');
    if (overlay) overlay.remove();
  }
};
