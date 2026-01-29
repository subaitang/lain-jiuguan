import { callModelApi, cleanJsonString } from './geminiService';  
import { ApiSettings, RPStats } from '../types';  
  
export const updateCharacterStats = async (currentStats: RPStats, action: string, context: string, config: ApiSettings): Promise<RPStats> => {  
    try {  
        const prompt = `Update character stats based on action.  
Character: ${JSON.stringify(currentStats)}  
Action: ${action}  
Context: ${context}  
Return JSON ONLY with updated stats. Keep structure identical.`;  
        const res = await callModelApi(config, {  
            contents: [{ role: 'user', parts: [{ text: prompt }] }],  
            responseMimeType: 'application/json'  
        });  
        return JSON.parse(cleanJsonString(res.text));  
    } catch (e) {  
        console.error("Variable Update Failed", e);  
        return currentStats;  
    }  
  
};  
  
export const generateItemDetails = async (item: string, context: string, config: ApiSettings): Promise<{ name: string, type: string, rarity: string, description: string, effects: string[] }> => {  
    try {  
        const prompt = `Analyze item: "${item}". Context: ${context}.  
Return JSON ONLY: {name, type (Weapon/Armor/Consumable/Key), rarity (Common/Rare/Epic/Legendary), description (flavor text), effects (array of strings)}.`;  
        const res = await callModelApi(config, {  
            contents: [{ role: 'user', parts: [{ text: prompt }] }],  
            responseMimeType: 'application/json'  
        });  
        return JSON.parse(cleanJsonString(res.text));  
    } catch (e) {  
        return { name: item, type: "Unknown", rarity: "Common", description: "No data available.", effects: [] };  
    }  
