export const AiService = {
  async generate(modelConfig, text, persona = "相手の視点", instruction = "") {
    const { provider, name, key, thinking } = modelConfig;
    let prompt = `フォーマットは崩さず、内容のみを返してください。\n`;
    if (instruction) {
      prompt += `${instruction}\n`;
    }
    prompt += `以下の${persona}\n${text}`;
    
    console.log(`--- AI Sending Prompt (${provider}) ---\n` + prompt + "\n-------------------------");

    switch (provider) {
      case 'gemini':
        return await this.callGemini(name, key, prompt, text, persona, thinking);
      case 'openai':
        return await this.callOpenAI(name, key, prompt, text, persona, thinking);
      case 'claude':
        return await this.callClaude(name, key, prompt, text, persona, thinking);
      default:
        throw new Error("未知のプロバイダです。");
    }
  },

  async callGemini(modelName, key, prompt, originalText, persona, thinking) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);
    const data = await response.json();
    
    let resultText = "";
    let thinkingText = "";
    
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.text) resultText += part.text;
      if (part.thought) thinkingText += part.thought;
    }

    return this.wrapInSwitch(originalText, resultText, persona, thinkingText);
  },

  async callOpenAI(modelName, key, prompt, originalText, persona, thinking) {
    const url = `https://api.openai.com/v1/chat/completions`;
    const body = {
      model: modelName,
      messages: [{ role: 'user', content: prompt }]
    };
    
    if (thinking && (modelName.startsWith('o1') || modelName.startsWith('o3'))) {
      body.reasoning_effort = "medium";
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);
    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || "";
    // OpenAIのAPI現状、推論プロセスのみを取得する直接的なフィールドはないため(o1の内部処理)
    // 応答そのものを返す
    return this.wrapInSwitch(originalText, resultText, persona);
  },

  async callClaude(modelName, key, prompt, originalText, persona, thinking) {
    const url = `https://api.anthropic.com/v1/messages`;
    const body = {
      model: modelName,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    };

    if (thinking) {
      body.thinking = {
        type: "enabled",
        budget_tokens: 2048
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'dangerously-allow-browser': 'true'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API Error: ${errorData.error?.message || response.statusText}`);
    }
    const data = await response.json();
    
    let resultText = "";
    let thinkingText = "";
    
    if (data.content) {
      data.content.forEach(block => {
        if (block.type === 'text') resultText += block.text;
        if (block.type === 'thinking') thinkingText += block.thinking;
      });
    }

    return this.wrapInSwitch(originalText, resultText, persona, thinkingText);
  },

  wrapInSwitch(originalText, aiText, persona, thinkingText = "") {
    let formattedAi = aiText.trim();
    if (formattedAi.startsWith('@')) {
      const firstNewline = formattedAi.indexOf('\n');
      if (firstNewline !== -1) {
        formattedAi = formattedAi.substring(firstNewline + 1).trim();
      }
    }
 
    let output = `:::switch\n@元の視点\n${originalText.trim()}\n\n`;
    if (thinkingText) {
      output += `@思考\n${thinkingText.trim()}\n\n`;
    }
    output += `@${persona}\n${formattedAi}\n:::`;
    
    return output;
  }
};
