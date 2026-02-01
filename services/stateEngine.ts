import { callModelApi, cleanJsonString } from './geminiService';  
import { ApiSettings, Message, RPStats } from '../types';  
  
export const calculateStatusUpdate = async (  
    history: Message[],  
    currentStats: RPStats,  
    config: ApiSettings,  
    language: string = 'English'  
): Promise<Partial<RPStats> | null> => {  
    try {  
        const recentChat = history.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');  
        const statsContext = JSON.stringify({  
            hp: currentStats.hp,  
            mp: currentStats.mp,  
            xp: currentStats.xp,  
            gold: currentStats.gold  
        });  
  
        const prompt = `Analyze the recent RPG chat and determine the impact on the player's status.  
Current Stats: ${statsContext}  
Chat:  
${recentChat}  
  
Return JSON ONLY with DELTAS (changes) or new absolute values.  
Fields: { hp: {current}, mp: {current}, xp: number, gold: number, statusEffects: string[] }  
Language: ${language}.  
If no change, return empty object.`;  
  
        const res = await callModelApi(config, {  
            contents: [{ role: 'user', parts: [{ text: prompt }] }],  
            responseMimeType: 'application/json'  
        });  
  
        const raw = cleanJsonString(res.text);  
        return JSON.parse(raw);  
    } catch (e) {  
        console.error("State Update Failed", e);  
        return null;  
    }  
