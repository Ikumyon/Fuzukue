// --- State Management ---
export const State = {
    currentTocMap: [],
    currentTextCache: "",
    isRegexMode: false,
    searchMatches: [],
    currentMatchIndex: -1,
    isEditMode: false,
    
    // デフォルト設定
    settings: {
        matchRules: [
            { enabled: true, pattern: "^[#■●★◆▼➢].*" },
            { enabled: true, pattern: "^(第[0-9０-９一二三四五六七八九十百]+[章話部節篇]|Chapter|Episode|Prologue|Epilogue).*" },
            { enabled: true, pattern: "^[【\\[].+[】\\]]$" }
        ],
        excludePattern: "",
        font: "mincho"
    }
};