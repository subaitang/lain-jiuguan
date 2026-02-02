
import { ApiSettings, LoreEntry, Message } from "../types";
import { callModelApi, cleanJsonString } from "./geminiService";

/**
 * Memory Engine
 * Handles long-term memory compression, summarization, and retrieval.
 */

const MAX_RECENT_MESSAGES = 20; // Keep last 20 messages raw
const CHUNK_SIZE = 10; // Summarize every 10 messages

export const summarizeChunk = async (
    messages: Message[], 
    config: ApiSettings
): Promise<string> => {
    try {
        const text = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        const prompt = `Summarize the following conversation chunk into a concise paragraph. Capture key events, decisions, and facts. \n\n${text}`;
        
        const res = await callModelApi(config, {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            temperature: 0.3
        });
        
        return res.text || "";
    } catch (e) {
        console.error("Summarization failed", e);
        return "";
    }
};

export const compressHistory = async (
    fullHistory: Message[],
    existingSummaries: string[],
    config: ApiSettings
): Promise<{ recentMessages: Message[], newSummaries: string[] }> => {
    
    // If history is short, do nothing
    if (fullHistory.length <= MAX_RECENT_MESSAGES) {
        return { recentMessages: fullHistory, newSummaries: existingSummaries };
    }

    const messagesToKeep = fullHistory.slice(-MAX_RECENT_MESSAGES);
    const messagesToSummarize = fullHistory.slice(0, -MAX_RECENT_MESSAGES);

    // If we have messages to summarize
    if (messagesToSummarize.length > 0) {
        // Simple strategy: Summarize all pending messages in one go if small, or chunk if huge
        // For now, let's just summarize the 'messagesToSummarize' block
        // In a real robust system, we would incremental summary.
        
        // Check if we have *new* messages to summarize that aren't already covered by existing summaries?
        // Actually, the caller usually passes the *full* array.
        // We assume 'existingSummaries' covers everything *before* 'fullHistory'.
        // Wait, the standard pattern is: History grows -> We truncate head -> We append summary.
        // So 'fullHistory' passed here might already be truncated?
        // Let's assume 'fullHistory' is the *current active buffer*.
        
        // Better Strategy for this App:
        // We only summarize if the buffer is too big.
        // We take the oldest N messages, summarize them, add to summaries, and return the rest.
        
        const chunk = messagesToSummarize; 
        const summary = await summarizeChunk(chunk, config);
        
        if (summary) {
            return {
                recentMessages: messagesToKeep,
                newSummaries: [...existingSummaries, `[Prior Events]: ${summary}`]
            };
        }
    }

    return { recentMessages: fullHistory, newSummaries: existingSummaries };
};

export const assemblePrompt = (
    systemPrompt: string,
    summaries: string[],
    recentMessages: Message[],
    lore: LoreEntry[]
): string => {
    // Inject Lore
    const relevantLore = lore.filter(l => l.active).map(l => `[Lore - ${l.keywords}]: ${l.content}`).join('\n');
    
    // Inject Summaries
    const memoryContext = summaries.join('\n\n');

    return `${systemPrompt}

[CORE MEMORY]
${relevantLore}

[PREVIOUSLY]
${memoryContext}

[CURRENT CHAT]
`;
};
