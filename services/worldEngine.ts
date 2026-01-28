import { ApiSettings, AppSettings, MapData, RPDate, WorldEvent } from '../types';
import { callModelApi, cleanJsonString } from './geminiService';
  
export const generateMapData = async (context: string, config: ApiSettings): Promise<MapData | undefined> => {  
    try {  
        const prompt = `Generate a tactical map layout for: "${context}".  
Grid Size: 10x10.  
Return a valid JSON object with:  
- "tiles": Array of objects { x, y, type, description }.  
  Types: 'wall', 'floor', 'hazard', 'point_of_interest'.  
- "biome": String (e.g. "Cyberpunk Slums").  
- "difficulty": Number (1-10).  
  
Ensure every grid cell (0,0 to 9,9) has a tile.  
Output JSON ONLY. No markdown.`;  
  
        const res = await callModelApi(config, {  
            contents: [{ role: 'user', parts: [{ text: prompt }] }],  
            responseMimeType: 'application/json'  
        });  
        const raw = cleanJsonString(res.text);  
        const data = JSON.parse(raw);  
  
        return {  
            width: 10,  
            height: 10,  
            tiles: data.tiles,  
            biome: data.biome || "Unknown Sector",  
            difficulty: data.difficulty || 1  
        };  
    } catch (e) {  
        console.error("Map Gen Failed", e);  
        const grid = Array(10).fill(0).map(() => Array(10).fill(0).map(() => Math.random() > 0.8 ? '#' : '.'));  
        return { grid, width: 10, height: 10, biome: "Glitch Sector (Offline)" };  
    }  
};  
  
export const generateWorldNews = async (history: any[], settings: AppSettings, rpDate?: RPDate): Promise<WorldEvent | null> => {  
    try {  
        const langName = settings.user.language === 'zh' ? 'Chinese' : settings.user.language === 'jp' ? 'Japanese' : 'English';  
        const apiKey = settings.mapApi?.apiKey || settings.api.apiKey;  
        const res = await callModelApi({ ...settings.api, apiKey }, {  
            contents: [{ role: 'user', parts: [{ text: `Generate a world event. LANGUAGE: ${langName}. Return JSON: {headline, content, type}.` }] }],  
            responseMimeType: 'application/json'  
        });  
        const data = JSON.parse(cleanJsonString(res.text));  
        return { id: Date.now().toString(), dayCount: rpDate?.dayCount || 1, date: new Date().toLocaleDateString(), ...data };  
    } catch (e) { return null; }  
}; 
  
export const generateCampaignSetting = async (keywords: string, settings: AppSettings): Promise<string> => {  
    const langName = settings.user.language === 'zh' ? 'Chinese' : settings.user.language === 'jp' ? 'Japanese' : 'English';  
    const apiKey = settings.mapApi?.apiKey || settings.api.apiKey;  
    const res = await callModelApi({ ...settings.api, apiKey }, { contents: [{ role: 'user', parts: [{ text: `Generate a detailed RPG world setting description based on: ${keywords}. LANGUAGE: ${langName}.` }] }] });  
    return res.text || "";  
}; 
