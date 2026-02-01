
import { callModelApi, cleanJsonString } from './geminiService';
import { ApiSettings, Message, RPStats } from '../types';

interface StateUpdateResult {
    reasoning: string;
    deltas: Partial<RPStats>;
    suggestedEvents?: string[];
}

/**
 * Enhanced State Engine
 * Analyzes chat history to deduce game state changes (HP, Inventory, Location, etc.)
 * Uses Chain-of-Thought reasoning before outputting JSON.
 */
export const calculateStatusUpdate = async (
    history: Message[],
    currentStats: RPStats,
    config: ApiSettings,
    language: string = 'English',
    worldContext?: string
): Promise<StateUpdateResult | null> => {
    try {
        const recentChat = history.slice(-5).map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n');
        const statsContext = JSON.stringify({
            hp: currentStats.hp,
            mp: currentStats.mp,
            gold: currentStats.gold,
            inventory: currentStats.inventory,
            quests: currentStats.quests || [],
            location: worldContext || "Unknown",
            status: currentStats.statusEffects || []
        }, null, 2);

        const prompt = `You are the Game State Engine (Logic Core).
Your task is to analyze the recent Roleplay/Chat interaction and determine if any game variables need to be updated.

[CURRENT STATE]
${statsContext}

[RECENT INTERACTION]
${recentChat}

[INSTRUCTIONS]
1. Analyze the interaction for physical damage, item usage, loot acquisition, gold transaction, or location changes.
2. Check for NEW quests started or EXISTING quests updated (completed/failed/objectives).
3. Think step-by-step about WHY a change occurred (Chain of Thought).
4. Output a JSON object containing your reasoning and the variable updates.

[OUTPUT FORMAT]
Response must be a SINGLE valid JSON object:
{
  "reasoning": "User accepted the village elder's request...",
  "deltas": {
    "hp": { "current": 15, "max": 20 },
    "gold": 90,
    "inventory": ["Sword", "Shield"], // Return FULL inventory list if changed
    "statusEffects": ["Energized"],
    "quests": [
       { "id": "q1", "title": "Rat Problem", "description": "Kill 5 rats", "status": "active", "objectives": [{ "id": "o1", "text": "Kill rats", "completed": false }] }
    ] // Return FULL quest list if changed
  },
  "suggestedEvents": ["Nearby explosion heard"] // Optional environmental cues
}

Constraints:
- Language: ${language}
- If no changes are needed, "deltas" should be empty or omitting fields.
- "reasoning" is MANDATORY.
- Output ONLY JSON.
`;

        const res = await callModelApi(config, {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            responseMimeType: 'application/json',
            temperature: 0.2 // Low temperature for logic
        });

        const raw = cleanJsonString(res.text);
        const parsed = JSON.parse(raw);

        return {
            reasoning: parsed.reasoning || "No reasoning provided.",
            deltas: parsed.deltas || {},
            suggestedEvents: parsed.suggestedEvents || []
        };

    } catch (e) {
        console.error("State Update Failed", e);
        return {
            reasoning: "Error in State Engine: " + (e as any).message,
            deltas: {},
            suggestedEvents: []
        };
    }
};
