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
            D.searchBar.classList.add('hidden');
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
    }
};