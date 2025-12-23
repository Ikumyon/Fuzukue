import { State } from './state.js';
import { D } from './dom.js';
import { FileOps } from './file-ops.js';

// 設定の永続化ヘルパー (Settings内で完結させる)
function saveSettingsToStorage() {
    localStorage.setItem('webReaderSettings', JSON.stringify(State.settings));
}

export const Settings = {
    renderUI() {
        D.ruleListContainer.innerHTML = '';
        State.settings.matchRules.forEach(rule => {
            D.ruleListContainer.appendChild(this.createRuleRow(rule.pattern, rule.enabled));
        });
        D.ruleExclude.value = State.settings.excludePattern;
    },

    createRuleRow(pattern, enabled) {
        const div = document.createElement('div');
        div.className = 'rule-row';
        const chk = document.createElement('input');
        chk.type = 'checkbox'; chk.checked = enabled;
        const input = document.createElement('input');
        input.type = 'text'; input.value = pattern;
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        delBtn.onclick = () => div.remove();
        div.append(chk, input, delBtn);
        return div;
    },

    saveFromUI() {
        const rows = D.ruleListContainer.querySelectorAll('.rule-row');
        const newRules = [];
        rows.forEach(row => {
            const chk = row.querySelector('input[type="checkbox"]');
            const input = row.querySelector('input[type="text"]');
            if (input.value.trim()) newRules.push({ enabled: chk.checked, pattern: input.value });
        });
        State.settings.matchRules = newRules;
        State.settings.excludePattern = D.ruleExclude.value.trim();
        
        saveSettingsToStorage();
        if (State.currentTextCache) FileOps.renderContent(State.currentTextCache);
    }
};