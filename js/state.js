// --- State Management ---
export const State = {
  currentTocMap: [],
  currentTextCache: "",
  isRegexMode: false,
  searchMatches: [],
  currentMatchIndex: -1,
  isEditMode: false,
  isAiSelectionMode: false,
  aiSelectionRange: { start: null, end: null },

  settings: {
    matchRules: [
      { enabled: true, pattern: "^##\\s+.+" },
      { enabled: true, pattern: "^[#■●★◆▼➢].*" },
      { enabled: true, pattern: "^(第[0-9０-９一二三四五六七八九十百]+[章話部節篇]|Chapter|Episode|Prologue|Epilogue).*" }
    ],
    excludePattern: "",
    isVertical: false,
    isDarkMode: false,
    font: "mincho",
    aiModels: [], // { id, provider, label, name, key, active, thinking }
    aiPersonaHistory: [] // 過去に使用した視点名の履歴
  }
};
