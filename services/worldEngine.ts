import { callModelApi, cleanJsonString } from './geminiService';  
import { MapData, AppSettings, WorldEvent, RPDate } from '../types';  
  
export const generateMapData = async (context: string, apiKey: string): Promise<MapData | undefined> => {  
    try {  
        const res = await callModelApi({ apiKey, source: 'google' }, {  
            contents: [{ role: 'user', parts: [{ text: `Generate a 10x10 ASCII grid map for: "${context}". Use '#' for walls, '.' for floor, '~' for water, 'E' for enemy, '$' for loot. Return JSON ONLY: {grid: string[][], biome: string}.` }] }],  
            responseMimeType: 'application/json'  
        });  
        const data = JSON.parse(cleanJsonString(res.text));  
        return { width: 10, height: 10, ...data };  
    } catch (e) {  
        console.error("Map Gen Failed", e);  
        const grid = Array(10).fill(0).map(() => Array(10).fill(0).map(() => Math.random() > 0.8 ? '#' : '.'));  
        return { grid, width: 10, height: 10, biome: "Glitch Sector" };  
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
