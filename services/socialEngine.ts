import { callModelApi, cleanJsonString } from './geminiService';  
import { AppSettings, SocialPost, PersonaSettings } from '../types';  
  
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
