
import { ChatSession, Message } from '../types';

const STORAGE_KEY = 'wired_sessions';
const CURRENT_ID_KEY = 'wired_current_id';

export const sessionService = {
    getAll: (): Record<string, ChatSession> => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            const parsed = data ? JSON.parse(data) : {};
            
            // Migration for legacy messages
            Object.values(parsed).forEach((s: any) => {
                if (!s.rpMessages) s.rpMessages = [];
                if (!s.msgMessages) s.msgMessages = [];
                
                // If legacy 'messages' exists but 'rpMessages' is empty, move them (assuming RP default)
                if (s.messages && s.messages.length > 0 && s.rpMessages.length === 0) {
                    s.rpMessages = [...s.messages];
                }
                if (!s.npcRegistry) s.npcRegistry = {};
            });
            
            return parsed;
        } catch (e) {
            console.error("Failed to load sessions", e);
            return {};
        }
    },
    
    get: (id: string): ChatSession | undefined => {
        const sessions = sessionService.getAll();
        return sessions[id];
    },

    getByPersona: (targetId: string): ChatSession[] => {
        const sessions = sessionService.getAll();
        return Object.values(sessions)
            .filter(s => s.targetId === targetId)
            .sort((a, b) => b.lastModified - a.lastModified);
    },

    save: (session: ChatSession) => {
        const sessions = sessionService.getAll();
        sessions[session.id] = { ...session, lastModified: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    },

    importSession: (sessionData: any): ChatSession => {
        // Validate basic structure
        if (!sessionData.id) {
            throw new Error("Invalid session file format");
        }
        
        // Ensure compatibility with new fields
        const session: ChatSession = {
            id: sessionData.id || Date.now().toString(),
            targetId: sessionData.targetId || sessionData.personaId || 'default-lain',
            type: sessionData.type || 'persona',
            title: sessionData.title || 'Imported Session',
            
            // Handle isolation
            messages: [], // Legacy placeholder
            rpMessages: Array.isArray(sessionData.rpMessages) ? sessionData.rpMessages : (Array.isArray(sessionData.messages) ? sessionData.messages : []),
            msgMessages: Array.isArray(sessionData.msgMessages) ? sessionData.msgMessages : [],
            
            summaries: Array.isArray(sessionData.summaries) ? sessionData.summaries : [],
            dataTable: sessionData.dataTable || "",
            affection: typeof sessionData.affection === 'number' ? sessionData.affection : 0,
            stress: typeof sessionData.stress === 'number' ? sessionData.stress : 20, // Default 20
            energy: typeof sessionData.energy === 'number' ? sessionData.energy : 80, // Default 80
            currentMood: sessionData.currentMood || "Neutral",
            npcRegistry: sessionData.npcRegistry || {},
            lastModified: Date.now()
        };

        sessionService.save(session);
        return session;
    },

    delete: (id: string) => {
        const sessions = sessionService.getAll();
        delete sessions[id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    },

    deleteAll: () => {
        localStorage.setItem(STORAGE_KEY, '{}');
        localStorage.removeItem(CURRENT_ID_KEY);
    },

    create: (targetId: string, title: string = 'New Session'): ChatSession => {
        const id = Date.now().toString();
        const newSession: ChatSession = {
            id,
            targetId,
            type: 'persona',
            title,
            messages: [],
            rpMessages: [],
            msgMessages: [],
            summaries: [],
            dataTable: "",
            affection: 0,
            stress: 20, // Initial stress (calm)
            energy: 80, // Initial energy (high)
            currentMood: "Neutral",
            npcRegistry: {},
            lastModified: Date.now()
        };
        sessionService.save(newSession);
        return newSession;
    },

    setCurrentId: (id: string) => localStorage.setItem(CURRENT_ID_KEY, id),
    getCurrentId: () => localStorage.getItem(CURRENT_ID_KEY)
};