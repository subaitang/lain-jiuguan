
import { GoogleGenAI, Modality } from "@google/genai";
import { ApiSettings, AppSettings, LoreEntry, MapData, Message, PersonaSettings, QuickReplyOption, RPDate, RPStats, SocialPost, WeatherData, WorldEvent } from "../types";

/**
 * 鲁棒的 JSON 提取器：从 AI 返回的杂乱文本中提取合法的 JSON 字符串
 */
export const cleanJsonString = (str: string): string => {
    if (!str) return "{}";
    // 移除潜在的控制字符
    const sanitized = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    try {
        // 寻找第一个 { 或 [
        const startBrace = sanitized.indexOf('{');
        const startBracket = sanitized.indexOf('[');
        
        let startIndex = -1;
        if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
            startIndex = startBrace;
        } else {
            startIndex = startBracket;
        }

        if (startIndex === -1) {
            // 如果没找到括号，尝试移除 Markdown 标记
            return sanitized.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
        }

        // 寻找最后一个对应的括号
        const lastBrace = sanitized.lastIndexOf('}');
        const lastBracket = sanitized.lastIndexOf(']');
        const endIndex = Math.max(lastBrace, lastBracket);

        if (endIndex > startIndex) {
            return sanitized.substring(startIndex, endIndex + 1).trim();
        }

        return sanitized.trim();
    } catch (e) {
        console.error("Critical JSON Clean Error:", e);
        return sanitized.trim();
    }
};

const normalizeBaseUrl = (url: string) => {
    if (!url) return '';
    let normalized = url.endsWith('/') ? url.slice(0, -1) : url;
    return normalized;
};

/**
 * 核心请求处理器：兼容 Google 官方 SDK 和自定义 OpenAI 接口 (SillyTavern, etc.)
 */
export const callModelApi = async (config: ApiSettings, payload: { 
    systemInstruction?: string, 
    contents: any[], 
    temperature?: number,
    topP?: number,
    maxOutputTokens?: number,
    responseMimeType?: string
}) => {
    // 路径 A: Google 官方
    if (config.source === 'google' || !config.source) {
        const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.API_KEY });
        const result = await ai.models.generateContent({
            model: config.modelName || 'gemini-3-flash-preview',
            contents: payload.contents,
            config: {
                systemInstruction: payload.systemInstruction,
                temperature: payload.temperature ?? 0.7,
                topP: payload.topP ?? 0.9,
                maxOutputTokens: payload.maxOutputTokens,
                responseMimeType: payload.responseMimeType as any
            }
        });
        return { text: result.text || "" };
    } 
    
    // 路径 B: 自定义接口 (兼容 OpenAI 格式)
    else {
        const baseUrl = normalizeBaseUrl(config.baseUrl || "http://localhost:5000/v1");
        
        const messages: any[] = [];
        if (payload.systemInstruction) {
            messages.push({ role: 'system', content: payload.systemInstruction });
        }

        payload.contents.forEach(c => {
            const role = c.role === 'model' ? 'assistant' : 'user';
            const content = Array.isArray(c.parts) 
                ? c.parts.map((p: any) => p.text).join('\n')
                : (c.parts?.text || c.parts || "");
            messages.push({ role, content });
        });

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: config.modelName || 'gpt-3.5-turbo',
                messages,
                temperature: payload.temperature ?? 0.7,
                top_p: payload.topP ?? 0.9,
                max_tokens: payload.maxOutputTokens ?? 2048,
                response_format: payload.responseMimeType === 'application/json' ? { type: "json_object" } : undefined
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        return { text: data.choices[0].message.content || "" };
    }
};

export const translateContent = async (text: string, targetLang: string, config: ApiSettings, mode: string): Promise<string> => {
    try {
        const prompt = `Translate the following text into ${targetLang}. 
Constraint: Output ONLY the translation. NO commentary.
Mode: ${mode === 'interpretive' ? 'Interpretive Localization' : 'Literal'}.

Text: "${text}"`;
        
        const response = await callModelApi(config, { 
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            temperature: 0.1 
        });
        return response.text?.trim() || text;
    } catch(e) { 
        console.error("Translation error", e);
        return text; 
    }
};

export const generatePersonaFromInput = async (input: string, config: ApiSettings, signal?: AbortSignal, mode?: string): Promise<PersonaSettings | null> => {
    try {
        const context = mode === 'rp' ? "Roleplay Character" : "Chat Persona";
        const prompt = `You are a JSON generator. Create a detailed ${context} profile based on the keyword/concept: "${input}".
Output must be a single valid JSON object starting with {.
Required Fields: 
- name (string)
- age (string)
- gender (string)
- description (short bio)
- personality (string)
- likes (string)
- dislikes (string)
- writingStyle (e.g. "casual", "formal", "cryptic")
- scenario (current situation)
- exampleDialogue (User: Hello\\nChar: Hi)
- systemPrompt (instructions for the AI model)
- region (location)
- nativeLanguage (e.g. "English")

NO markdown formatting. NO conversational text. Just the JSON string.`;
        
        const response = await callModelApi(config, {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            responseMimeType: 'application/json'
        });
        
        const rawJson = cleanJsonString(response.text);
        const data = JSON.parse(rawJson);
        
        return { 
            ...data, 
            id: `gen-${Date.now()}`, 
            friendsCount: 0, 
            followersCount: 0, 
            visitCount: 0, 
            visitors: [], 
            useRandomOpening: true,
            allowEmoji: true 
        };
    } catch (e) { 
        console.error("Persona Gen Failed", e);
        return null; 
    }
};

export const generateUserStatsFromInput = async (input: string, config: ApiSettings, signal?: AbortSignal, language: string = 'English'): Promise<RPStats | null> => {
    try {
        const prompt = `You are a JSON generator. Generate RPG stats for: "${input}". Language: ${language}.
Output must be a single valid JSON object starting with {.
Required Fields: {name, level, race, gender, class, hp:{current,max}, mp:{current,max}, attributes:{STR,DEX,CON,INT,WIS,CHA}, inventory:[], equipment:[], skills:[], alignment, traits:[], gold, xp, maxXp}.
Numeric values must be integers. NO markdown. NO conversation.`;
        
        const response = await callModelApi(config, {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            responseMimeType: 'application/json'
        });
        const rawJson = cleanJsonString(response.text);
        return JSON.parse(rawJson);
    } catch(e) { 
        console.error("Stats Gen Failed", e);
        return {
            name: "Unknown",
            level: 1,
            hp: { current: 10, max: 10 },
            mp: { current: 10, max: 10 },
            xp: 0,
            maxXp: 100,
            attributes: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
            inventory: [],
            equipment: [],
            skills: [],
            gold: 0,
            class: "Commoner"
        };
    }
};

export const generateRandomUserStats = async (config: ApiSettings, signal?: AbortSignal, worldContext?: string, language: string = 'English'): Promise<RPStats | null> => {
    return generateUserStatsFromInput(`Random level 1 character in ${worldContext || "a digital world"}`, config, signal, language);
};

export const generateRandomPersona = async (config: ApiSettings, signal?: AbortSignal, mode?: string): Promise<PersonaSettings | null> => {
    const archetypes = [
        "A cyberpunk hacker", "A forgotten deity", "A space bounty hunter", "A sentient vending machine",
        "A noir detective", "A time traveler", "A glitch in the system", "A bored student",
        "A fantasy slime", "A rogue AI", "A corporate spy", "A lost astronaut"
    ];
    const seed = archetypes[Math.floor(Math.random() * archetypes.length)];
    const prompt = mode === 'rp' 
        ? `A unique, creative RPG character concept. Surprise me. Example: ${seed}`
        : `A unique, creative chat partner. Surprise me. Example: ${seed}`;
        
    return generatePersonaFromInput(prompt, config, signal, mode);
};

export const generateLainResponse = async (
    history: Message[], settings: AppSettings, lore: LoreEntry[], summaries: string[], signal: AbortSignal,
    dataTable: string, affection: number, mood: string, stress: number, energy: number, contextState: any,
    rpgStats: { user?: RPStats, char?: RPStats }, rpDate?: RPDate, rpContext?: string
): Promise<{ text: string, thought?: string, metadataRaw?: string, systemPromptUsed?: string }> => {
    
    const activePersona = settings.characterLibrary.find(p => p.id === settings.activeTargetId);
    if (!activePersona) return { text: "Protocol Error: Persona node not found." };

    let systemInstruction = `You are ${activePersona.name}.\n[PERSONA]: ${activePersona.description}\n`;
    if (activePersona.systemPrompt) systemInstruction += `[INSTRUCTIONS]: ${activePersona.systemPrompt}\n`;
    
    if (settings.generation.chatMode === 'rp') {
        systemInstruction += `\n[WORLD]: ${rpContext || "Wired Sector"}\n`;
        if (rpDate) systemInstruction += `[TIME]: Day ${rpDate.dayCount}, ${rpDate.timeOfDay}\n`;
        if (rpgStats.user) systemInstruction += `[USER_STATS]: HP ${rpgStats.user.hp.current}/${rpgStats.user.hp.max}\n`;
    }

    const chatHistory = history.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: (m.speakerName ? `${m.speakerName}: ` : "") + m.content }]
    }));

    try {
        const response = await callModelApi(settings.api, {
            systemInstruction,
            contents: chatHistory,
            temperature: settings.generation.temperature,
            topP: settings.generation.topP,
            maxOutputTokens: settings.generation.maxOutputTokens
        });

        const fullText = response.text || "";
        const thoughtMatch = fullText.match(/<THOUGHT>(.*?)<\/THOUGHT>/s);
        const thought = thoughtMatch ? thoughtMatch[1].trim() : undefined;
        let cleanText = fullText.replace(/<THOUGHT>.*?<\/THOUGHT>/gs, '').trim();
        
        return { text: cleanText, thought, metadataRaw: JSON.stringify({ mood, affection, stress, energy }), systemPromptUsed: systemInstruction };
    } catch(e: any) { 
        return { text: `[COMM_ERROR]: ${e.message}` }; 
    }
};

export const initializeRPStats = async (persona: PersonaSettings, settings: AppSettings): Promise<RPStats | null> => {
    const config = (settings.personaConfig && settings.personaConfig.apiKey) ? settings.personaConfig : settings.api;
    const langName = settings.user.language === 'zh' ? 'Chinese' : settings.user.language === 'jp' ? 'Japanese' : 'English';
    return generateUserStatsFromInput(`Stats for ${persona.name}: ${persona.description}`, config, undefined, langName);
};

export const summarizeContent = async (text: string, config: ApiSettings): Promise<string> => {
    const res = await callModelApi(config, { contents: [{ role: 'user', parts: [{ text: `Summarize: ${text}` }] }] });
    return res.text || "";
};

export const generateAutonomousAction = async (history: Message[], settings: AppSettings): Promise<string> => {
    const langName = settings.user.language === 'zh' ? 'Chinese' : settings.user.language === 'jp' ? 'Japanese' : 'English';
    const res = await callModelApi(settings.api, { contents: [{ role: 'user', parts: [{ text: `Next character action? Output in ${langName}.` }] }] });
    return res.text || "";
};

export const updateMemoryTable = async (currentTable: string, recentMessages: Message[], config: ApiSettings): Promise<string> => {
    const chat = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
    const res = await callModelApi(config, { contents: [{ role: 'user', parts: [{ text: `Current Matrix:\n${currentTable}\nUpdate with:\n${chat}` }] }] });
    return res.text || currentTable;
};

export const generateVisualDescription = async (history: Message[], apiKey?: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
    const text = history.slice(-3).map(m => m.content).join(' ');
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Image prompt for: ${text}` });
    return res.text || "cyberpunk";
};

export const generateVeoVideo = async (prompt: string, imageSrc?: string, apiKey?: string): Promise<string | null> => { return null; };

export const generateSocialComment = async (persona: PersonaSettings, comment: string, username: string, settings: AppSettings): Promise<string> => {
    const res = await callModelApi(settings.api, { contents: [{ role: 'user', parts: [{ text: `You are ${persona.name}. Reply to: "${comment}"` }] }] });
    return res.text || "";
};

export const generateSocialFeedRefresh = async (settings: AppSettings): Promise<SocialPost[]> => {
    try {
        const res = await callModelApi(settings.api, { 
            contents: [{ role: 'user', parts: [{ text: "Return 3 social posts as JSON array: [{id, personaId, content, timestamp, likes, likedBy:[]}]" }] }],
            responseMimeType: 'application/json'
        });
        return JSON.parse(cleanJsonString(res.text));
    } catch (e) { return []; }
};

export const generateQuickActions = async (history: Message[], settings: AppSettings, language: string = 'English', userStats?: RPStats, charStats?: RPStats): Promise<QuickReplyOption[]> => {
    try {
        const chatSummary = history.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
        const res = await callModelApi(settings.api, {
            contents: [{ role: 'user', parts: [{ text: `Based on this chat context:\n${chatSummary}\n\nGenerate 4 appropriate RPG actions for the user. 
LANGUAGE: ${language}.
Return JSON array ONLY: [{label, attribute, dc, consequence, category}].
Attribute must be one of: STR, DEX, CON, INT, WIS, CHA.
DC should be 5-25. 
Category: combat, social, exploration, tech, stealth.` }] }],
            responseMimeType: 'application/json'
        });
        return JSON.parse(cleanJsonString(res.text));
    } catch (e) { return []; }
};

export const generateWorldNews = async (history: Message[], settings: AppSettings, rpDate?: RPDate): Promise<WorldEvent | null> => {
    try {
        const langName = settings.user.language === 'zh' ? 'Chinese' : settings.user.language === 'jp' ? 'Japanese' : 'English';
        const res = await callModelApi(settings.api, { 
            contents: [{ role: 'user', parts: [{ text: `Generate a detailed world event for an RPG session. 
LANGUAGE: ${langName}. 
Return JSON object ONLY: {headline, content, type}.
Content should be immersive and descriptive.` }] }],
            responseMimeType: 'application/json'
        });
        const data = JSON.parse(cleanJsonString(res.text));
        return { id: Date.now().toString(), dayCount: rpDate?.dayCount || 1, date: new Date().toLocaleDateString(), ...data };
    } catch (e) { return null; }
};

export const generateOpeningScenarios = async (settings: AppSettings, persona: PersonaSettings, mode: string, language: string = 'English', worldContext?: string): Promise<string[]> => {
    try {
        const res = await callModelApi(settings.api, {
            contents: [{ role: 'user', parts: [{ text: `Generate 3 diverse opening lines for ${persona.name} in ${mode} mode. 
LANGUAGE: ${language}.
CONTEXT: ${worldContext || "A generic digital space"}.
Return JSON array of strings ONLY.` }] }],
            responseMimeType: 'application/json'
        });
        return JSON.parse(cleanJsonString(res.text));
    } catch (e) { return ["...Connected."]; }
};

export const generateCampaignSetting = async (keywords: string, settings: AppSettings): Promise<string> => {
    const langName = settings.user.language === 'zh' ? 'Chinese' : settings.user.language === 'jp' ? 'Japanese' : 'English';
    const res = await callModelApi(settings.api, { contents: [{ role: 'user', parts: [{ text: `Generate a detailed RPG world setting description based on: ${keywords}. LANGUAGE: ${langName}.` }] }] });
    return res.text || "";
};

export const generateMapData = async (context: string, apiKey: string): Promise<MapData | undefined> => {
    // Deprecated: Use worldEngine.ts
    return undefined;
};

export const summarizeMemoryLayer = async (sourceContent: string, targetLevel: 2 | 3, config: ApiSettings): Promise<string> => {
    const res = await callModelApi(config, { contents: [{ role: 'user', parts: [{ text: `Summarize for Layer ${targetLevel}: ${sourceContent}` }] }] });
    return res.text || "";
};

export const generateMusicSuggestion = async (history: Message[], settings: AppSettings, persona: PersonaSettings): Promise<{ title: string, artist: string, reason: string } | null> => {
    try {
        const res = await callModelApi(settings.api, { 
            contents: [{ role: 'user', parts: [{ text: "Suggest song JSON: {title, artist, reason}" }] }],
            responseMimeType: 'application/json'
        });
        return JSON.parse(cleanJsonString(res.text));
    } catch (e) { return null; }
};

export const generateImage = async (prompt: string, apiKey?: string, mode: 'nano' | 'pro' = 'nano', aspectRatio: string = "1:1"): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
    try {
        const result = await ai.models.generateContent({
            model: mode === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: aspectRatio as any, imageSize: "1K" } }
        });
        if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) return null;
        for (const part of result.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
    } catch (e) {
        console.error("Image generation error:", e);
    }
    return null;
};

export const editImage = async (imageSrc: string, prompt: string, apiKey?: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ inlineData: { mimeType: 'image/png', data: imageSrc.split(',')[1] } }, { text: prompt }] }
        });
        if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) return null;
        for (const part of result.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
    } catch(e) {
        console.error("Image editing error:", e);
    }
    return null;
};

export const generateSpeech = async (text: string, apiKey: string, voiceName: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } }
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch(e) { return null; }
};

export const transcribeAudio = async (base64Audio: string, apiKey: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'audio/webm', data: base64Audio.split(',')[1] } }, { text: "Transcribe." }] }]
        });
        return response.text || "";
    } catch(e) { return ""; }
};

export const fetchWeather = async (location: string): Promise<WeatherData | null> => {
    return { location, temp: 24, condition: "Static", icon: 'sun' };
};

export const fetchCustomModels = async (baseUrl: string, apiKey: string): Promise<string[]> => {
    try {
        const response = await fetch(`${normalizeBaseUrl(baseUrl)}/models`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await response.json();
        return data.data?.map((m: any) => m.id) || [];
    } catch (e) { return []; }
};

export const testGoogleConnection = async (apiKey: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'ping' });
    return true;
};
