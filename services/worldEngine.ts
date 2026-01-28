import { callModelApi, cleanJsonString } from './geminiService';  
import { MapData, AppSettings, WorldEvent, RPDate, ApiSettings } from '../types';  
  
export const generateMapData = async (context: string, config: ApiSettings): Promise<MapData | undefined> => {  
    try {  
        const prompt = `Generate a tactical grid map for: "${context}". Return valid JSON ONLY.  
Structure: {  
  "width": 10, "height": 10, "biome": "string",  
  "grid": [["#",".","."...], ...], // 10x10 Grid. Symbols: # (Wall), . (Floor), ~ (Water), + (Door), E (Enemy), $ (Loot)  
  "legend": {"#": "Wall", ".": "Floor", "~": "Water", "+": "Door", "E": "Enemy", "$": "Loot"},  
  "nodes": [  
    {"x": number, "y": number, "type": "poi" | "loot" | "enemy", "description": "string", "icon": "string"}  
  ]  
}  
Ensure the map is navigable. Add 3-5 interesting nodes.`;  
  
        const res = await callModelApi(config, {  
            contents: [{ role: 'user', parts: [{ text: prompt }] }],  
            responseMimeType: 'application/json'  
        });  
        const data = JSON.parse(cleanJsonString(res.text));  
        return { width: 10, height: 10, ...data };  
    } catch (e) {  
        console.error("Map Gen Failed", e);  
        return undefined;  
    }  
};  
  
export const generateWorldNews = async (history: any[], settings: AppSettings, rpDate?: RPDate): Promise<WorldEvent | null> => {  
    try {  
        const langName = settings.user.language === 'zh' ? 'Chinese' : settings.user.language === 'jp' ? 'Japanese' : 'English';  
        const res = await callModelApi(settings.api, {  
            contents: [{ role: 'user', parts: [{ text: `Generate a world event. LANGUAGE: ${langName}. Return JSON: {headline, content, type}.` }] }],  
            responseMimeType: 'application/json'  
        });  
        const data = JSON.parse(cleanJsonString(res.text));  
        return { id: Date.now().toString(), dayCount: rpDate?.dayCount || 1, date: new Date().toLocaleDateString(), ...data };  
    } catch (e) { return null; }  
};  
  
export const generateCampaignSetting = async (keywords: string, settings: AppSettings): Promise<string> => {  
    const langName = settings.user.language === 'zh' ? 'Chinese' : settings.user.language === 'jp' ? 'Japanese' : 'English';  
    const res = await callModelApi(settings.api, { contents: [{ role: 'user', parts: [{ text: `Generate a detailed RPG world setting description based on: ${keywords}. LANGUAGE: ${langName}.` }] }] });  
    return res.text || "";  
}; 
