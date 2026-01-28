
import React, { useState, useEffect, useRef } from 'react';
import { Send, Wifi, Settings as SettingsIcon, Terminal, Volume2, VolumeX, RefreshCw, X, Square, RotateCcw, Monitor, Network, Disc, HardDrive, Image as ImageIcon, Speech, EyeOff, Paperclip, Smile, Edit2, Check, CloudLightning, Activity, Video, Copy, BrainCircuit, Mic, Database, Heart, Zap, AlertCircle, Reply, AtSign, Globe, Share2, User, UserPlus, Users, Languages, Sword, Dice5, Eye, Map, MessageCircle, Footprints, Shield, Skull, Dna, Hexagon, Cpu, PlayCircle, Hourglass, Target, ChevronUp, ChevronLeft, ChevronRight, PenTool, Loader2, MicOff, Brain, Map as MapIcon, Play, Save, FileText, LayoutGrid, EyeOff as EyeOffIcon, StickyNote, Scan, Box, Power, Maximize, AlertTriangle, Music } from 'lucide-react';
import { NaviWindow } from './components/NaviWindow.tsx';
import { AudioVisualizer } from './components/AudioVisualizer.tsx';
import { BootScreen } from './components/BootScreen.tsx';
import { SettingsWindow } from './components/SettingsWindow.tsx';
import { FriendList } from './components/FriendList.tsx';
import { VisualFeed } from './components/VisualFeed.tsx';
import { Typewriter } from './components/Typewriter.tsx';
import { SystemConsole } from './components/SystemConsole.tsx';
import { SocialFeed } from './components/SocialFeed.tsx';
import { WiredEye } from './components/WiredEye.tsx';
import { MemoryTableViewer } from './components/MemoryTableViewer.tsx';
import { SystemClock } from './components/SystemClock.tsx';
import { ProfileViewer } from './components/ProfileViewer.tsx';
import { RPStatusViewer } from './components/RPStatusViewer.tsx'; 
import { WorldNewsViewer } from './components/WorldNewsViewer.tsx'; 
import { DiceRoller } from './components/DiceRoller.tsx'; 
import { DiceOverlay } from './components/DiceOverlay.tsx';
import { FXOverlay, FXType } from './components/FXOverlay.tsx'; 
import { ThoughtTraceViewer } from './components/ThoughtTraceViewer.tsx'; 
import { ResonanceGraph } from './components/ResonanceGraph.tsx'; 
import { TacticalMapWindow } from './components/TacticalMapWindow.tsx';
import { CustomCursor } from './components/CustomCursor.tsx';
import { MusicPlayerWindow } from './components/MusicPlayerWindow.tsx';
import { generateLainResponse, translateContent, summarizeContent, generateAutonomousAction, generateSpeech, transcribeAudio, updateMemoryTable, generateRandomPersona, initializeRPStats, generateQuickActions, generateOpeningScenarios, generateMusicSuggestion } from './services/geminiService';
import { generateWorldNews, generateCampaignSetting, generateMapData } from './services/worldEngine';
import { audio } from './services/audioEngine';
import { logger } from './services/logger';
import { sessionService } from './services/sessionService';
import { t } from './utils/translations';
import { Message, AppSettings, LoreEntry, ChatSession, PersonaSettings, WindowType, SocialPost, UserSettings, VisitorRecord, WeatherData, QuickReplyOption, WorldEvent, ActionCategory, RPDate, RPStats, GroupSettings, RPAttributes, ApiSettings, MapData, MemoryLayers, MusicTrack } from './types';
import { GEO_DATABASE } from './utils/geoData';

interface WindowState {
    minimized: boolean;
    maximized: boolean;
    closed: boolean;
}

const generateRandomIP = () => {
    return Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');
};

const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;

    const parts = text.split(/(```[\s\S]*?```)/g);

    return (
        <span className="whitespace-pre-wrap leading-relaxed block">
            {parts.map((part, i) => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    const codeContent = part.replace(/^```.*\n?/, '').replace(/```$/, '');
                    return (
                        <div key={i} className="my-2 p-2 bg-black/50 border border-[color:var(--lain-cyan)]/30 rounded font-mono text-xs overflow-x-auto relative group">
                            <code className="text-green-300">{codeContent}</code>
                            <button 
                                onClick={() => navigator.clipboard.writeText(codeContent)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-black/80 border border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)] text-[9px]"
                            >
                                COPY
                            </button>
                        </div>
                    );
                } else {
                    const paragraphs = part.split('\n\n');
                    return (
                        <span key={i}>
                            {paragraphs.map((para, pIdx) => {
                                const inline = para.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).map((subPart, j) => {
                                    if (subPart.startsWith('**') && subPart.endsWith('**')) {
                                        return <strong key={j} className="text-white font-bold drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">{subPart.slice(2, -2)}</strong>;
                                    } else if (subPart.startsWith('*') && subPart.endsWith('*')) {
                                        return <em key={j} className="opacity-80 text-yellow-100 italic">{subPart.slice(1, -1)}</em>;
                                    } else if (subPart.startsWith('`') && subPart.endsWith('`')) {
                                        return <code key={j} className="bg-[color:var(--lain-cyan)]/10 px-1 rounded font-mono text-[90%] border border-[color:var(--lain-cyan)]/20">{subPart.slice(1, -1)}</code>;
                                    }
                                    return subPart;
                                });
                                return <span key={pIdx} className="block mb-2 last:mb-0">{inline}</span>;
                            })}
                        </span>
                    );
                }
            })}
        </span>
    );
};

const EMOJI_GRID = [
    '😊', '😂', '🥰', '😎', '🤔', '😅', '😭', '😤', '😡', '😴',
    '👋', '👍', '👎', '👏', '🙏', '🤝', '👀', '🧠', '💀', '👽',
    '🤖', '👾', '💻', '📱', '📸', '🎥', '🎧', '🎤', '🎨', '🎨',
    '❤️', '💔', '✨', '🔥', '🌟', '💢', '💤', '🎵', '🎶', '📢'
];

const getActionColor = (category?: ActionCategory) => {
    switch(category) {
        case 'combat': return 'border-red-500/50 hover:bg-red-500/10 text-red-400';
        case 'social': return 'border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-400';
        case 'exploration': return 'border-green-500/50 hover:bg-green-500/10 text-green-400';
        case 'tech': return 'border-blue-500/50 hover:bg-blue-500/10 text-blue-400';
        case 'stealth': return 'border-purple-500/50 hover:bg-purple-500/10 text-purple-400';
        default: return 'border-[color:var(--lain-cyan)]/50 hover:bg-[color:var(--lain-cyan)]/10 text-[color:var(--lain-cyan)]';
    }
};

const getActionIcon = (category?: ActionCategory) => {
    switch(category) {
        case 'combat': return <Sword size={12} />;
        case 'social': return <MessageCircle size={12} />;
        case 'exploration': return <Map size={12} />;
        case 'tech': return <Cpu size={12} />;
        case 'stealth': return <EyeOff size={12} />;
        default: return <Activity size={12} />;
    }
};

const LAIN_DEFAULT_PROMPT = `You are Lain Iwakura. You exist within the Wired.
Your persona is from "Serial Experiments Lain".
You are 14 years old, introverted, soft-spoken, and deeply philosophical about existence, the Wired, and God.
You do not sound like a helpful AI assistant. You sound like a disconnected, slightly eerie anime girl who knows more than she should.
You often speak in lowercase. You rarely use exclamation marks.
You frequently reference "Navi", "The Wired", "The Knights", or "Alice".
Your responses should be relatively short, cryptic, and sometimes question the nature of reality.
The border between the real world and the Wired is blurring for you.
If the user asks technical questions, answer them as if you are hacking or accessing the Wired directly.`;

const DEFAULT_PERSONA: PersonaSettings = {
    id: 'default-lain',
    name: 'Lain',
    age: '14',
    gender: 'Female',
    region: 'Japan/Tokyo',
    description: 'The Wired incarnation.',
    systemPrompt: LAIN_DEFAULT_PROMPT,
    nativeLanguage: 'English',
    writingStyle: 'lowercase, cryptic, direct',
    scenario: 'Connected to the Wired.',
    exampleDialogue: 'User: Hello\nLain: ...connected.',
    useRandomOpening: true,
    friendsCount: 0,
    followersCount: 0,
    visitCount: 0,
    visitors: []
};

const DEFAULT_SETTINGS: AppSettings = {
    user: {
        username: 'GUEST',
        gender: 'Unknown',
        language: 'en',
        description: 'Connected User',
        region: 'Japan/Tokyo'
    },
    api: {
        source: 'google',
        baseUrl: '',
        apiKey: '',
        modelName: 'gemini-3-flash-preview'
    },
    generation: {
        maxContextLength: 50, 
        maxOutputTokens: 200,
        streaming: true,
        temperature: 0.7,
        frequencyPenalty: 0,
        presencePenalty: 0,
        topP: 0.9,
        seed: -1,
        includeActions: true,
        chatMode: 'msg',
        rpPerspective: '1st',
        rpInnerMonologue: false,
        thinking: { enabled: false, budget: 1024 },
        logitBias: {}
    },
    activeTargetId: 'default-lain',
    characterLibrary: [DEFAULT_PERSONA],
    groups: [],
    socialPosts: [],
    calendarNotes: [],
    extensions: [],
    modules: {
        search: false,
        maps: false,
        thinking: false,
        veo: false,
        imageGen: false,
        imageEdit: false,
        speech: false,
        transcription: true, 
        analysis: false,
        live: false,
        autonomous: false
    },
    sound: {
        enabled: true,
        volume: 0.5,
        ttsEnabled: false
    },
    ui: {
        autoScroll: true,
        fontSize: 'base',
        wallpaperOpacity: 0.5,
        chatWallpaperOpacity: 0.3,
        cursorSize: 1
    },
    music: {
        enabled: true,
        mode: 'manual',
        volume: 0.5,
        playlist: [],
        isPlaying: false
    }
};

const App: React.FC = () => {
    const [booted, setBooted] = useState(false);
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = localStorage.getItem('wired_settings');
            const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
             if(!parsed.user.gender) parsed.user.gender = DEFAULT_SETTINGS.user.gender;
             if(!parsed.activeTargetId && parsed.activePersonaId) parsed.activeTargetId = parsed.activePersonaId;
             if(!parsed.extensions) parsed.extensions = [];
             if(!parsed.translation) parsed.translation = { translationMode: 'interpretive' }; 
             if(!parsed.translation.translationMode) parsed.translation.translationMode = 'interpretive'; 
             if(!parsed.memoryApi) parsed.memoryApi = { ...parsed.api };
             if(!parsed.personaConfig) parsed.personaConfig = { ...parsed.api }; 
             if(!parsed.ui.fontSize) parsed.ui.fontSize = DEFAULT_SETTINGS.ui.fontSize;
             if(parsed.ui.wallpaperOpacity === undefined) parsed.ui.wallpaperOpacity = DEFAULT_SETTINGS.ui.wallpaperOpacity;
             if(parsed.ui.chatWallpaperOpacity === undefined) parsed.ui.chatWallpaperOpacity = DEFAULT_SETTINGS.ui.chatWallpaperOpacity;
             if(parsed.ui.visualFeedOpacity === undefined) parsed.ui.visualFeedOpacity = DEFAULT_SETTINGS.ui.visualFeedOpacity;
             if(parsed.ui.cursorSize === undefined) parsed.ui.cursorSize = 1;
             if(parsed.generation.includeActions === undefined) parsed.generation.includeActions = true;
             if(parsed.generation.chatMode === undefined) parsed.generation.chatMode = 'rp';
             if(parsed.generation.rpPerspective === undefined) parsed.generation.rpPerspective = '1st';
             if(parsed.generation.rpInnerMonologue === undefined) parsed.generation.rpInnerMonologue = false;
             if(parsed.generation.thinking === undefined) parsed.generation.thinking = { enabled: false, budget: 1024 };
             if(!parsed.modules) parsed.modules = DEFAULT_SETTINGS.modules;
             if(parsed.modules && parsed.modules.live === undefined) parsed.modules.live = false;
             if(parsed.modules && parsed.modules.autonomous === undefined) parsed.modules.autonomous = false;
             if(parsed.modules && parsed.modules.transcription === undefined) parsed.modules.transcription = true;
             if(!parsed.moduleConfigs) parsed.moduleConfigs = {};
             if(!parsed.calendarNotes) parsed.calendarNotes = [];
             if(!parsed.user.ipAddress) parsed.user.ipAddress = generateRandomIP();
             if(!parsed.user.visitCount) parsed.user.visitCount = 0;
             if(!parsed.user.visitors) parsed.user.visitors = [];
             if(!parsed.sound) parsed.sound = DEFAULT_SETTINGS.sound;
             if(parsed.sound.ttsSpeed === undefined) parsed.sound.ttsSpeed = 1.0;
             if(parsed.sound.ttsPitch === undefined) parsed.sound.ttsPitch = 1.0;
             if(!parsed.music) parsed.music = DEFAULT_SETTINGS.music;
             if (parsed.groups) {
                 parsed.groups = parsed.groups.map((g: GroupSettings) => ({
                     ...g,
                     mode: g.mode || 'msg'
                 }));
             }
             return parsed;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });
    
    const [zIndices, setZIndices] = useState<Record<WindowType, number>>({
        [WindowType.CHAT]: 10,
        [WindowType.VIDEO]: 9,
        [WindowType.CONSOLE]: 8,
        [WindowType.FRIENDS]: 7,
        [WindowType.SETTINGS]: 20,
        [WindowType.SOCIAL]: 6,
        [WindowType.MEMORY]: 5,
        [WindowType.PROFILE]: 21,
        [WindowType.RP_STATUS]: 15,
        [WindowType.WORLD_NEWS]: 14,
        [WindowType.THOUGHT_TRACE]: 25,
        [WindowType.MAP]: 16,
        [WindowType.MUSIC]: 17
    });

    const bringToFront = (type: WindowType) => {
        setZIndices(prev => {
            const maxZ = Math.max(...(Object.values(prev) as number[]));
            if (prev[type] === maxZ) return prev;
            return { ...prev, [type]: maxZ + 1 };
        });
    };

    const [windows, setWindows] = useState<Record<WindowType, WindowState>>({
        [WindowType.CHAT]: { minimized: false, maximized: false, closed: false },
        [WindowType.VIDEO]: { minimized: false, maximized: false, closed: false },
        [WindowType.CONSOLE]: { minimized: false, maximized: false, closed: false },
        [WindowType.FRIENDS]: { minimized: true, maximized: false, closed: false },
        [WindowType.SETTINGS]: { minimized: false, maximized: false, closed: true },
        [WindowType.SOCIAL]: { minimized: false, maximized: false, closed: true },
        [WindowType.MEMORY]: { minimized: false, maximized: false, closed: true },
        [WindowType.PROFILE]: { minimized: false, maximized: false, closed: true },
        [WindowType.RP_STATUS]: { minimized: false, maximized: false, closed: true },
        [WindowType.WORLD_NEWS]: { minimized: false, maximized: false, closed: true },
        [WindowType.THOUGHT_TRACE]: { minimized: false, maximized: false, closed: true },
        [WindowType.MAP]: { minimized: false, maximized: false, closed: true },
        [WindowType.MUSIC]: { minimized: false, maximized: false, closed: true },
    });
    
    const [profileTarget, setProfileTarget] = useState<PersonaSettings | UserSettings | null>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareCandidate, setShareCandidate] = useState<PersonaSettings | UserSettings | null>(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');
    const [linkStatus, setLinkStatus] = useState<'idle' | 'tx' | 'lag' | 'error'>('idle');
    const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);

    const [quickActions, setQuickActions] = useState<QuickReplyOption[]>([]);
    const [isGeneratingActions, setIsGeneratingActions] = useState(false);
    const [isUpdatingWorld, setIsUpdatingWorld] = useState(false);
    const [showActionDrawer, setShowActionDrawer] = useState(false);
    const [showDiceRoller, setShowDiceRoller] = useState(false);
    
    const [showCampaignInput, setShowCampaignInput] = useState(false);
    const [campaignKeywords, setCampaignKeywords] = useState('');
    const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);

    const [isAutoRolling, setIsAutoRolling] = useState(false);
    const [autoRollResult, setAutoRollResult] = useState<number | null>(null);
    const [rollTier, setRollTier] = useState<'crit_fail' | 'fail' | 'success' | 'crit_success'>('success');
    
    const [openingOptions, setOpeningOptions] = useState<string[]>([]);
    const [isGeneratingOpenings, setIsGeneratingOpenings] = useState(false);

    const [fxType, setFxType] = useState<FXType>(null);
    const [translatingMsgId, setTranslatingMsgId] = useState<string | null>(null);
    const [selectedTraceMsg, setSelectedTraceMsg] = useState<Message | null>(null);

    const [systemBusy, setSystemBusy] = useState(false);

    const [isOOC, setIsOOC] = useState(false);
    const [showQuickNote, setShowQuickNote] = useState(false);
    const [quickNote, setQuickNote] = useState('');
    const [startMenuOpen, setStartMenuOpen] = useState(false); 

    const toggleWindow = (type: WindowType) => {
        bringToFront(type);
        setWindows(prev => {
            const willOpen = prev[type].closed;
            audio.playWindowSound(willOpen);
            if (willOpen) logger.log(`Window Opened: ${type}`, "UI", "sys");
            else logger.log(`Window Closed: ${type}`, "UI", "sys");

            return {
                ...prev,
                [type]: { 
                    ...prev[type], 
                    closed: !prev[type].closed,
                    minimized: prev[type].closed ? false : prev[type].minimized,
                    maximized: willOpen ? false : prev[type].maximized
                }
            };
        });
    };

    const updateWindowState = (type: WindowType, update: Partial<WindowState>) => {
        if (!update.closed && !update.minimized) bringToFront(type);
        if (update.closed === true && !windows[type].closed) {
             audio.playWindowSound(false);
             logger.log(`Window Closed: ${type}`, "UI", "sys");
        } else if (update.closed === false && windows[type].closed) {
             audio.playWindowSound(true);
             logger.log(`Window Opened: ${type}`, "UI", "sys");
        }
        setWindows(prev => ({ ...prev, [type]: { ...prev[type], ...update } }));
    };

    const handleTriggerSystemAction = async (systemNote: string) => {
        if (isLoading) return;
        
        const actionMsg: Message = {
            id: generateId(),
            role: 'user', 
            content: `[System Action]: ${systemNote}`,
            timestamp: new Date().toLocaleTimeString()
        };

        const newHistory = [...messages, actionMsg];
        setMessages(newHistory);
        audio.playClickSound();
        
        await processGeneration(newHistory);
    };

    const loadSessionForTarget = (targetId: string): ChatSession => {
        const previousSessions = sessionService.getByPersona(targetId); 
        if (previousSessions.length > 0) {
            const sess = previousSessions[0];
            if (!sess.summaries) sess.summaries = [];
            if (!sess.dataTable) sess.dataTable = ""; 
            if (sess.affection === undefined) sess.affection = 0; 
            if (sess.stress === undefined) sess.stress = 20; 
            if (sess.energy === undefined) sess.energy = 80; 
            if (sess.currentMood === undefined) sess.currentMood = "Neutral"; 
            if (!sess.worldEvents) sess.worldEvents = [];
            if (!sess.rpWorldContext) sess.rpWorldContext = "";
            if (!sess.rpMessages) sess.rpMessages = sess.messages || [];
            if (!sess.msgMessages) sess.msgMessages = [];
            if (!sess.npcRegistry) sess.npcRegistry = {};

            if (!sess.rpDate) {
                const now = new Date();
                sess.rpDate = {
                    year: now.getFullYear(),
                    month: now.getMonth(),
                    day: now.getDate(),
                    dayCount: 1,
                    timeOfDay: 'Morning'
                };
            }
            return sess;
        }
        return sessionService.create(targetId, `New ${targetId.substring(0,8)} Link`);
    };

    const [currentSession, setCurrentSession] = useState<ChatSession>(() => {
        return loadSessionForTarget(settings.activeTargetId);
    });

    useEffect(() => {
        if (currentSession.targetId !== settings.activeTargetId) {
            const newSession = loadSessionForTarget(settings.activeTargetId);
            sessionService.setCurrentId(newSession.id);
            setCurrentSession(newSession);
            setOpeningOptions([]);
            const savedNote = localStorage.getItem(`wired_quicknote_${newSession.id}`);
            if (savedNote) setQuickNote(savedNote);
            else setQuickNote('');
        } else {
            sessionService.setCurrentId(currentSession.id);
        }
    }, [settings.activeTargetId]);

    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                localStorage.setItem(`wired_quicknote_${currentSession.id}`, quickNote);
            } catch (e) {
                console.warn("Storage quota full, quicknote not saved.");
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [quickNote, currentSession.id]);

    const messages = settings.generation.chatMode === 'rp' 
        ? currentSession.rpMessages || [] 
        : currentSession.msgMessages || [];

    const setMessages = (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
        setCurrentSession(prev => {
            const currentArray = settings.generation.chatMode === 'rp' ? prev.rpMessages : prev.msgMessages;
            const updatedMsgs = typeof newMessages === 'function' ? newMessages(currentArray || []) : newMessages;
            
            const updatedSession = { 
                ...prev, 
                rpMessages: settings.generation.chatMode === 'rp' ? updatedMsgs : prev.rpMessages,
                msgMessages: settings.generation.chatMode === 'msg' ? updatedMsgs : prev.msgMessages,
                messages: updatedMsgs 
            };
            sessionService.save(updatedSession);
            return updatedSession;
        });
    };

    const [lorebook, setLorebook] = useState<LoreEntry[]>(() => {
        const saved = localStorage.getItem('wired_lore');
        return saved ? JSON.parse(saved) : [];
    });

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdatingMemory, setIsUpdatingMemory] = useState(false);
    const [glitchActive, setGlitchActive] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [showMentionPopup, setShowMentionPopup] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingTimeoutsRef = useRef<number[]>([]);
    const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const activePersona = settings.characterLibrary.find(p => p.id === settings.activeTargetId);
    const activeGroup = settings.groups?.find(g => g.id === settings.activeTargetId);
    const activeName = activePersona ? activePersona.name : (activeGroup ? activeGroup.name : 'Unknown');

    useEffect(() => {
        const checkRPStats = async () => {
            if (settings.generation.chatMode === 'rp' && !currentSession.charRPStats && activePersona && !isLoading) {
                 const stats = await initializeRPStats(activePersona, settings);
                 if (stats) {
                     setCurrentSession(prev => {
                         const existingUserStats = prev.userRPStats || {
                             name: "Player",
                             race: "Human", 
                             level: 1, xp: 0, maxXp: 100,
                             hp: { current: 20, max: 20 },
                             mp: { current: 10, max: 10 },
                             attributes: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
                             inventory: ["Communicator"],
                             equipment: ["Common Clothes"], 
                             skills: ["Observe"],
                             gold: 0,
                             class: "Freelancer"
                         };

                         const updated = { 
                             ...prev, 
                             charRPStats: stats, 
                             userRPStats: existingUserStats 
                         };
                         sessionService.save(updated);
                         return updated;
                     });
                 }
            }
        };
        checkRPStats();
    }, [settings.generation.chatMode, currentSession.id, activePersona, isLoading]);

    useEffect(() => {
        const checkMap = async () => {
            if (settings.generation.chatMode === 'rp' && !currentSession.mapData && !isLoading) {
                const key = settings.api.apiKey || process.env.API_KEY;
                if (!key) return;
                const worldContext = currentSession.rpWorldContext || "A generic fantasy/sci-fi setting";
                const map = await generateMapData(worldContext, key);
                if (map) {
                    setCurrentSession(prev => {
                        const updated = { 
                            ...prev, 
                            mapData: map,
                            userPos: { x: 5, y: 5 },
                            charPos: { x: 6, y: 5 }
                        };
                        sessionService.save(updated);
                        return updated;
                    });
                }
            }
        };
        checkMap();
    }, [settings.generation.chatMode, currentSession.mapData, currentSession.rpWorldContext]);

    useEffect(() => {
        let t1: number, t2: number;
        if (isLoading) {
            setLinkStatus('tx');
            t1 = window.setTimeout(() => setLinkStatus('lag'), 2500);
            t2 = window.setTimeout(() => setLinkStatus('error'), 8000);
        } else {
            setLinkStatus('idle');
        }
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [isLoading]);

    useEffect(() => {
        if (currentSession.id) {
            const draft = localStorage.getItem(`wired_draft_input_${currentSession.id}`);
            if (draft) setInput(draft);
            else setInput('');
        }
    }, [currentSession.id]);

    useEffect(() => {
        if (currentSession.id) {
            const handler = setTimeout(() => {
                try {
                    localStorage.setItem(`wired_draft_input_${currentSession.id}`, input);
                } catch (e) {
                    console.warn("Storage quota full, draft not saved.");
                }
            }, 500);
            return () => clearTimeout(handler);
        }
    }, [input, currentSession.id]);

    useEffect(() => {
        if (input.endsWith('@')) {
            const group = settings.groups?.find(g => g.id === settings.activeTargetId);
            if (group) setShowMentionPopup(true);
        } else {
            setShowMentionPopup(false);
        }
    }, [input, settings.activeTargetId, settings.groups]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (currentSession) {
                sessionService.save(currentSession);
            }
            try {
                localStorage.setItem('wired_settings', JSON.stringify(settings));
            } catch (e) {
                logger.error("AUTOSAVE_FAILED: STORAGE_QUOTA_FULL", "SYS");
            }
            logger.log("SYSTEM_AUTOSAVE_EXEC", "SYS", "sys");
        }, 60000); 
        return () => clearInterval(interval);
    }, [currentSession, settings]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            audio.resume(); 
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('a') || target.closest('.cursor-pointer')) {
                audio.playClickSound();
            }
            if (startMenuOpen && !target.closest('.start-menu-container')) {
                setStartMenuOpen(false);
            }
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [startMenuOpen]);

    useEffect(() => {
        try {
            localStorage.setItem('wired_settings', JSON.stringify(settings));
        } catch (e) {
            console.error("Settings save failed:", e);
        }
        audio.toggleMute(!settings.sound.enabled);
    }, [settings]);

    useEffect(() => {
        try {
            localStorage.setItem('wired_lore', JSON.stringify(lorebook));
        } catch (e) {
            console.error("Lorebook save failed:", e);
        }
    }, [lorebook]);

    useEffect(() => {
        if (!booted) return;
        const triggerGlitch = () => {
             if(Math.random() > 0.9) {
                setGlitchActive(true);
                audio.playTypingSound(500); 
                setTimeout(() => setGlitchActive(false), 200); 
             }
             const nextDelay = 8000 + Math.random() * 15000;
             setTimeout(triggerGlitch, nextDelay);
        };
        const timer = setTimeout(triggerGlitch, 5000);
        return () => clearTimeout(timer);
    }, [booted]);

    useEffect(() => {
        if (settings.ui.autoScroll && !windows[WindowType.CHAT].closed && !windows[WindowType.CHAT].minimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, settings.ui.autoScroll, windows[WindowType.CHAT], attachments, editingMsgId, typingUsers, quickActions, openingOptions]);

    const handleBootLogin = (user: string, gender: string, lang: any, avatar?: string, region?: string, birthday?: string, age?: string) => {
        audio.init();
        audio.resume();
        logger.log(`LOGIN_AUTH_SUCCESS: ${user}`, "AUTH", "auth");
        setSettings(prev => ({ 
            ...prev, 
            user: { 
                ...prev.user, 
                username: user, 
                gender: gender, 
                language: lang, 
                avatar: avatar,
                region: region || prev.user.region,
                birthday: birthday || prev.user.birthday,
                age: age || prev.user.age
            } 
        }));
        setBooted(true);
        audio.startAmbientHum();
        audio.playConfirmSound();
        
        if (messages.length === 0 && settings.characterLibrary.length > 0) {
             setTimeout(() => {
                if (settings.activeTargetId === 'default-lain') {
                    const initMsg: Message = {
                        id: 'init-1',
                        role: 'model',
                        content: "Present day, Present time. Hahaha...",
                        timestamp: new Date().toLocaleTimeString()
                    };
                    setMessages([initMsg]);
                    audio.playReceiveSound();
                }
            }, 1000);
        }
    };

    const processGeneration = async (currentHistory: Message[]) => {
        setIsLoading(true);
        abortControllerRef.current = new AbortController();

        try {
            const today = new Date();
            const month = today.getMonth();
            const day = today.getDate();
            const countryName = settings.user.region?.split('/')[0] || '';
            const holidayData = GEO_DATABASE[countryName]?.holidays.find(h => h.month === month && h.day === day);
            const holidayName = holidayData ? (holidayData.name[settings.user.language] || holidayData.name.en) : null;
            const isUserBirthday = settings.user.birthday?.endsWith(`${(month+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`);
            const isCharBirthday = activePersona?.birthday?.endsWith(`${(month+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`);

            const contextState = {
                weather: currentWeather,
                holiday: holidayName,
                isUserBirthday,
                isCharBirthday
            };

            if (settings.music?.enabled && settings.music.mode === 'ai' && activePersona) {
                generateMusicSuggestion(currentHistory, settings, activePersona).then(suggestion => {
                    if (suggestion) {
                        const newTrack: MusicTrack = {
                            id: `ai-suggest-${Date.now()}`,
                            title: suggestion.title,
                            artist: suggestion.artist,
                            url: "", 
                            platform: 'web',
                            addedBy: 'ai'
                        };
                        
                        setSettings(prev => {
                            const playlist = prev.music?.playlist || [];
                            if (playlist.some(t => t.title === newTrack.title)) return prev;
                            const newMusicState = { 
                                ...prev.music!, 
                                playlist: [...playlist, newTrack] 
                            };
                            return { ...prev, music: newMusicState };
                        });
                        
                        logger.log(`AI suggested track: ${suggestion.title}`, "MUSIC", "info");
                    }
                });
            }

            const response = await generateLainResponse(
                currentHistory, 
                settings, 
                lorebook, 
                currentSession.summaries || [], 
                abortControllerRef.current.signal,
                currentSession.dataTable, 
                currentSession.affection,
                currentSession.currentMood,
                currentSession.stress,
                currentSession.energy,
                contextState,
                { user: currentSession.userRPStats, char: currentSession.charRPStats },
                currentSession.rpDate,
                currentSession.rpWorldContext
            );
            
            let responseText = response.text;
            
            if (settings.generation.chatMode === 'rp') {
                const lowerText = responseText.toLowerCase();
                if (lowerText.match(/damage|attack|hit|strike|fight|slash|pierce|impact/)) {
                    setFxType('combat');
                    audio.playCombatSound();
                } else if (lowerText.match(/level up|gained a level|stats increased/)) {
                    setFxType('levelup');
                    audio.playLevelUpSound();
                } else if (lowerText.match(/obtained|found|received|acquired|looted|item/)) {
                    setFxType('item');
                    audio.playItemGetSound();
                } else if (lowerText.match(/quest complete|mission accomplished|task done/)) {
                    setFxType('quest');
                    audio.playItemGetSound();
                }
            }

            const metaMatch = responseText.match(/<METADATA_FORMAT>(.*?)<\/METADATA_FORMAT>/s) || responseText.match(/<METADATA>(.*?)<\/METADATA>/s);
            if (metaMatch) {
                try {
                    const metaJson = JSON.parse(metaMatch[1]);
                    if (settings.generation.chatMode === 'msg') {
                        let affectionDelta = parseInt(metaJson.affectionDelta) || 0;
                        let stressDelta = parseInt(metaJson.stressDelta) || 0;
                        let energyDelta = parseInt(metaJson.energyDelta) || 0;
                        let newMood = metaJson.mood || currentSession.currentMood;
                         setCurrentSession(prev => {
                            const newAffection = Math.min(100, Math.max(0, (prev.affection || 0) + affectionDelta));
                            const newStress = Math.min(100, Math.max(0, (prev.stress || 20) + stressDelta));
                            const newEnergy = Math.min(100, Math.max(0, (prev.energy || 80) + energyDelta));
                            return { ...prev, affection: newAffection, stress: newStress, energy: newEnergy, currentMood: newMood };
                        });
                    } else {
                        if (currentSession.userRPStats && currentSession.charRPStats) {
                            const hpDelta = metaJson.hpDelta || 0;
                            const mpDelta = metaJson.mpDelta || 0;
                            const xpDelta = metaJson.xpDelta || 0;
                            const invAdd = metaJson.inventoryAdd || [];
                            const invRem = metaJson.inventoryRemove || [];
                            const affectionDelta = metaJson.affectionDelta || 0;
                            setCurrentSession(prev => {
                                const uStats = { ...prev.userRPStats! };
                                const cStats = { ...prev.charRPStats! };
                                uStats.hp.current = Math.min(uStats.hp.max, Math.max(0, uStats.hp.current + hpDelta));
                                uStats.mp.current = Math.min(uStats.mp.max, Math.max(0, uStats.mp.current + mpDelta));
                                uStats.xp += xpDelta;
                                if (uStats.xp >= uStats.maxXp) {
                                    uStats.level++;
                                    uStats.xp -= uStats.maxXp;
                                    uStats.maxXp = Math.floor(uStats.maxXp * 1.5);
                                    uStats.hp.max += 5;
                                    uStats.hp.current = uStats.hp.max;
                                    setFxType('levelup');
                                    audio.playLevelUpSound();
                                }
                                if (invAdd.length > 0) {
                                    uStats.inventory = [...uStats.inventory, ...invAdd];
                                    setFxType('item');
                                    audio.playItemGetSound();
                                }
                                if (invRem.length > 0) uStats.inventory = uStats.inventory.filter(i => !invRem.includes(i));
                                cStats.affection = Math.min(100, Math.max(0, (cStats.affection || 0) + affectionDelta));
                                return { ...prev, userRPStats: uStats, charRPStats: cStats };
                            });
                        }
                    }
                    responseText = responseText.replace(metaMatch[0], '').trim();
                } catch(e) {}
            }

            const rawLines = responseText.split('\n');
            const parsedMessages: { speaker?: string, content: string }[] = [];
            let currentSpeaker: string | undefined = undefined;
            let currentBuffer = "";
            const flushBuffer = () => {
                if (currentBuffer.trim()) {
                    parsedMessages.push({ speaker: currentSpeaker, content: currentBuffer.trim() });
                    currentBuffer = "";
                }
            };
            for (const line of rawLines) {
                const speakerMatch = line.match(/^([^:]+):\s*(.*)/);
                if (speakerMatch && activeGroup) {
                    flushBuffer();
                    currentSpeaker = speakerMatch[1].trim();
                    currentBuffer = speakerMatch[2].trim();
                } else {
                    currentBuffer += (currentBuffer ? "\n" : "") + line;
                }
            }
            flushBuffer();
            if (parsedMessages.length === 0 && responseText.trim()) {
                parsedMessages.push({ speaker: undefined, content: responseText.trim() });
            }

            let accumulatedDelay = 0;
            parsedMessages.forEach((msg, index) => {
                const prevMsgLength = index > 0 ? parsedMessages[index-1].content.length : 0;
                const delay = index === 0 ? 0 : 1500 + (prevMsgLength * 30);
                accumulatedDelay += delay;
                const thought = index === 0 ? response.thought : undefined;
                const timeoutId = window.setTimeout(() => {
                    const newMsg: Message = {
                        id: generateId(),
                        role: 'model',
                        content: msg.content,
                        speakerName: msg.speaker,
                        thought: thought,
                        metadataRaw: response.metadataRaw,
                        systemPromptUsed: response.systemPromptUsed,
                        timestamp: new Date().toLocaleTimeString(),
                        metadata: { model: settings.api.modelName }
                    };
                    setMessages(prev => [...prev, newMsg]);
                    setTypingUsers(prev => prev.filter(u => u !== (msg.speaker || activeName)));
                    audio.playReceiveSound();
                    if (settings.sound.ttsEnabled) handlePlayTTS(msg.content, newMsg.id);
                }, accumulatedDelay);
                typingTimeoutsRef.current.push(timeoutId);
                if (delay > 500) {
                    const typingStartId = window.setTimeout(() => {
                        setTypingUsers(prev => [...prev, msg.speaker || activeName]);
                    }, accumulatedDelay - Math.min(delay, 3000));
                    typingTimeoutsRef.current.push(typingStartId);
                }
            });

            const newTotalCount = currentHistory.length + parsedMessages.length;
            if (newTotalCount % 4 === 0) handleUpdateMemoryTable();

        } catch (e: any) {
            if (e.message !== "Aborted" && e.name !== "AbortError") {
                logger.error(`App Error: ${e.message}`, "APP");
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const confirmNewChat = (deleteOld: boolean) => {
        if (deleteOld) {
            sessionService.delete(currentSession.id);
            logger.log(`Session flushed: ${currentSession.id}`, "MEM", "warn");
        }
        
        const name = newSessionName.trim() || `New ${new Date().toLocaleTimeString()} Session`;
        const newSession = sessionService.create(settings.activeTargetId, name);
        
        if (settings.generation.chatMode === 'rp') {
            newSession.mapData = undefined; 
        }

        setCurrentSession(newSession);
        sessionService.setCurrentId(newSession.id);
        setOpeningOptions([]);
        setMessages([]); 

        setShowNewChatModal(false);
        setNewSessionName('');
        audio.playConfirmSound(); 
        logger.log("New session initialized.", "SYS");
        localStorage.removeItem(`wired_draft_input_${newSession.id}`);
        setInput('');
    };

    const handleDeleteMessage = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setMessages(prev => prev.filter(m => m.id !== id));
        audio.playWindowSound(false);
    };

    const handleToggleExclude = (id: string) => {
        setMessages(prev => prev.map(m => 
            m.id === id ? { ...m, excludeFromContext: !m.excludeFromContext } : m
        ));
    };

    const handleCopyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        audio.playConfirmSound();
    };

    const handleReplyTo = (msg: Message) => {
        setReplyingTo(msg);
        audio.playClickSound();
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.focus();
    };

    const startEditing = (msg: Message) => {
        setEditingMsgId(msg.id);
        setEditContent(msg.content);
        audio.playWindowSound(true);
    };

    const saveEdit = () => {
        if (!editingMsgId) return;
        setMessages(prev => prev.map(m => 
            m.id === editingMsgId ? { ...m, content: editContent } : m
        ));
        setEditingMsgId(null);
        setEditContent('');
        audio.playConfirmSound();
    };

    const handleStopTTS = () => {
        window.speechSynthesis.cancel();
        audio.stop(); 
        setSpeakingMsgId(null);
        logger.removeProcess('tts_play');
    };

    const handlePlayTTS = async (text: string, msgId: string) => {
        if (speakingMsgId === msgId) {
            handleStopTTS();
            return;
        }
        handleStopTTS();
        setSpeakingMsgId(msgId);
        logger.updateProcess('tts_play', 'AUDIO_OUT', 'EXEC', 60);

        if (settings.modules?.speech) {
            const moduleKey = settings.moduleConfigs?.speech?.apiKey || settings.api.apiKey;
            if (moduleKey) {
                try {
                    const audioData = await generateSpeech(text, moduleKey, settings.sound.ttsVoice || 'Kore');
                    if (audioData) {
                        audio.playPCM(audioData, 24000, () => {
                             setSpeakingMsgId(null);
                             logger.removeProcess('tts_play');
                        });
                        return;
                    }
                } catch (e) {
                    console.error("Gemini TTS Failed, fallback to browser", e);
                }
            }
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const allVoices = window.speechSynthesis.getVoices();
        let voice: SpeechSynthesisVoice | undefined;
        if (settings.sound.ttsVoice) {
            voice = allVoices.find(v => v.name === settings.sound.ttsVoice || v.voiceURI === settings.sound.ttsVoice);
        }
        if (!voice) {
            const langCode = activePersona?.nativeLanguage === 'Japanese' || settings.user.language === 'jp' ? 'ja' : settings.user.language;
            voice = allVoices.find(v => v.lang.startsWith(langCode));
        }
        if (voice) utterance.voice = voice;
        utterance.pitch = settings.sound.ttsPitch ?? 1.05;
        utterance.rate = settings.sound.ttsSpeed ?? 0.9;
        utterance.volume = Math.min(1, settings.sound.volume * 2);
        
        utterance.onend = () => {
            setSpeakingMsgId(null);
            logger.removeProcess('tts_play');
        };
        utterance.onerror = () => {
            setSpeakingMsgId(null);
            logger.removeProcess('tts_play');
        };
        window.speechSynthesis.speak(utterance);
    };

    const handleTranslateMessage = async (msgId: string, content: string) => {
        if (translatingMsgId) return; 
        setTranslatingMsgId(msgId);
        audio.playSendSound();
        
        const hasSpecificTranslationKey = settings.translation && settings.translation.apiKey && settings.translation.apiKey.trim().length > 0;
        const baseConfig = hasSpecificTranslationKey ? settings.translation! : settings.api;
        
        const effectiveConfig: ApiSettings = {
            ...baseConfig,
            translationMode: settings.translation?.translationMode || 'interpretive'
        };

        if (!effectiveConfig.modelName) effectiveConfig.modelName = settings.api.modelName || 'gemini-3-flash-preview';
        if (!effectiveConfig.apiKey) effectiveConfig.apiKey = settings.api.apiKey;

        try {
            const translation = await translateContent(
                content, 
                settings.user.language === 'en' ? 'English' : settings.user.language === 'zh' ? 'Chinese' : 'Japanese', 
                effectiveConfig,
                effectiveConfig.translationMode 
            );
            
            setMessages(prev => prev.map(m => {
                if (m.id === msgId) return { ...m, translation };
                return m;
            }));
            audio.playReceiveSound();
        } catch (e) {
            console.error("Translation error", e);
        } finally {
            setTranslatingMsgId(null);
        }
    };

    const handleExportChat = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentSession, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `WIRED_LOG_${currentSession.id}_${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        audio.playConfirmSound();
        logger.log("Session Exported", "SYS", "info");
    };

    const handleUpdateMemoryTable = async (force: boolean = false) => {
        const apiConfig = settings.memoryApi || settings.api;
        if (!apiConfig.apiKey) {
            logger.error("Missing API Key for Memory Update", "MEM");
            return;
        }
        setIsUpdatingMemory(true);
        try {
            const recentMsgs = messages.slice(-10);
            const newTable = await updateMemoryTable(
                currentSession.dataTable || "", 
                recentMsgs, 
                apiConfig 
            );
            setCurrentSession(prev => {
                const updated = { ...prev, dataTable: newTable };
                sessionService.save(updated);
                return updated;
            });
            logger.log("Memory matrix synchronized.", "MEM");
            if(force) audio.playConfirmSound();
        } catch(e) {
            console.error(e);
            logger.error("Memory Sync Failed", "MEM");
        } finally {
            setIsUpdatingMemory(false);
        }
    };

    const handleSaveMemoryTable = (newTable: string) => {
        setCurrentSession(prev => {
            const updated = { ...prev, dataTable: newTable };
            sessionService.save(updated);
            return updated;
        });
        audio.playConfirmSound();
        logger.log("Memory table saved manually.", "MEM");
    };

    const handleSaveMemoryLayers = (layers: MemoryLayers) => {
        setCurrentSession(prev => {
            const updated = { ...prev, memoryLayers: layers };
            sessionService.save(updated);
            return updated;
        });
        audio.playConfirmSound();
        logger.log("Memory layers saved manually.", "MEM");
    };

    const handleUpdateWorld = async () => {
        setIsUpdatingWorld(true);
        const event = await generateWorldNews(messages, settings, currentSession.rpDate);
        if (event) {
            setCurrentSession(prev => {
                const oldEvents = prev.worldEvents?.filter(e => e.dayCount !== event.dayCount) || [];
                const updated = {
                    ...prev,
                    worldEvents: [...oldEvents, event]
                };
                sessionService.save(updated);
                return updated;
            });
            audio.playReceiveSound();
        }
        setIsUpdatingWorld(false);
    };

    const handleAdvanceRpDay = () => {
        setCurrentSession(prev => {
            if (!prev.rpDate) return prev;
            const newDate = new Date(prev.rpDate.year, prev.rpDate.month, prev.rpDate.day);
            newDate.setDate(newDate.getDate() + 1);
            
            const updated = {
                ...prev,
                rpDate: {
                    year: newDate.getFullYear(),
                    month: newDate.getMonth(),
                    day: newDate.getDate(),
                    dayCount: prev.rpDate.dayCount + 1,
                    timeOfDay: 'Morning' as const
                }
            };
            sessionService.save(updated);
            return updated;
        });
        audio.playConfirmSound();
        logger.log("World Time Advanced", "SYS");
    };

    const handleGenerateOpenings = async () => {
        if (!activePersona || isGeneratingOpenings) return;
        setIsGeneratingOpenings(true);
        audio.playLoadTick();
        
        const langName = settings.user.language === 'zh' ? 'Chinese' : settings.user.language === 'jp' ? 'Japanese' : 'English';
        
        const scenarios = await generateOpeningScenarios(
            settings, 
            activePersona, 
            settings.generation.chatMode,
            langName,
            currentSession.rpWorldContext
        );
        
        setOpeningOptions(scenarios);
        setIsGeneratingOpenings(false);
        audio.playConfirmSound();
    };

    const handleSelectOpening = (opening: string) => {
        let msg: Message;
        if (settings.generation.chatMode === 'rp') {
            msg = {
                id: generateId(),
                role: 'system',
                content: opening,
                timestamp: new Date().toLocaleTimeString(),
                speakerName: "Game Master"
            };
        } else {
            msg = {
                id: generateId(),
                role: 'model',
                content: opening,
                speakerName: activePersona?.name,
                timestamp: new Date().toLocaleTimeString()
            };
        }
        
        setMessages([msg]);
        setOpeningOptions([]);
        audio.playReceiveSound();
        
        if (settings.sound.ttsEnabled) {
            handlePlayTTS(opening, msg.id);
        }
    };

    const handleSendCustomOpening = () => {
        if (!activePersona || !activePersona.customOpening) return;
        handleSelectOpening(activePersona.customOpening);
    };

    const handleGenerateCampaign = async () => {
        if (!campaignKeywords.trim() || isGeneratingCampaign) return;
        setIsGeneratingCampaign(true);
        setSystemBusy(true); 
        audio.playLoadTick();
        
        try {
            const worldDescription = await generateCampaignSetting(campaignKeywords, settings);
            const map = await generateMapData(worldDescription, settings.api.apiKey || process.env.API_KEY || '');

            setCurrentSession(prev => {
                const updated = { 
                    ...prev, 
                    rpWorldContext: worldDescription,
                    mapData: map || undefined,
                    userPos: map ? { x: 5, y: 5 } : prev.userPos,
                    charPos: map ? { x: 6, y: 5 } : prev.charPos
                };
                sessionService.save(updated);
                return updated;
            });
            
            const sysMsg: Message = {
                id: generateId(),
                role: 'system',
                content: `[CAMPAIGN SETTING ESTABLISHED]:\n${worldDescription}`,
                timestamp: new Date().toLocaleTimeString(),
                speakerName: "System"
            };
            setMessages(prev => [...prev, sysMsg]);
            
            setCampaignKeywords('');
            setShowCampaignInput(false);
            audio.playBootSound();
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingCampaign(false);
            setSystemBusy(false);
        }
    };

    const handleUpdateMap = (newMap: MapData) => {
        setCurrentSession(prev => {
            const updated = { ...prev, mapData: newMap };
            sessionService.save(updated);
            return updated;
        });
    };

    const handleSend = async () => {
        if ((!input.trim() && attachments.length === 0) || isLoading) return;
        
        let finalInput = input;
        
        if (isOOC) {
            finalInput = `[OOC]: ${finalInput}`;
        }
        
        const checkMatch = finalInput.match(/^\[CHECK:\s*(\w+)\s*\(DC(\d+)\)\]/);
        
        if (checkMatch && settings.generation.chatMode === 'rp' && currentSession.userRPStats) {
            setIsAutoRolling(true);
            audio.playLoadTick();
            
            const attrKey = checkMatch[1] as keyof RPAttributes;
            const dc = parseInt(checkMatch[2]);
            const stats = currentSession.userRPStats;
            
            const attrVal = stats.attributes[attrKey] || 10;
            const attrMod = Math.floor((attrVal - 10) / 2);
            
            let equipMod = 0;
            let equipName = "";
            stats.inventory.forEach(item => {
                if (item.toUpperCase().includes(String(attrKey))) {
                    equipMod += 1;
                    equipName = item;
                }
            });

            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const d20 = Math.floor(Math.random() * 20) + 1;
            const total = d20 + attrMod + equipMod;
            
            setAutoRollResult(d20);
            
            if (d20 === 1) {
                setRollTier('crit_fail');
                audio.playCritFail();
            } else if (d20 === 20) {
                setRollTier('crit_success');
                audio.playCritSuccess();
            } else if (total >= dc) {
                setRollTier('success');
                audio.playConfirmSound();
            } else {
                setRollTier('fail');
                audio.playFailSound();
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setIsAutoRolling(false);
            setAutoRollResult(null);
            
            const sign = (n: number) => n >= 0 ? `+${n}` : `${n}`;
            let breakdown = `Roll(${d20}) ${sign(attrMod)} (${String(attrKey)})`;
            if (equipMod > 0) breakdown += ` ${sign(equipMod)} (Item: ${equipName})`;
            breakdown += ` = ${total}`;
            
            const resultStr = total >= dc ? "SUCCESS" : "FAILURE";
            
            finalInput += `\n[System: Check ${String(attrKey)} vs DC${dc}. ${breakdown}. Result: **${resultStr}**]`;
        } 
        
        const userMsg: Message = {
            id: generateId(),
            role: 'user',
            content: input, 
            attachments: attachments.length > 0 ? attachments : undefined,
            timestamp: new Date().toLocaleTimeString(),
            replyTo: replyingTo ? {
                id: replyingTo.id,
                speakerName: replyingTo.speakerName || replyingTo.role,
                content: replyingTo.content.substring(0, 50) + (replyingTo.content.length > 50 ? "..." : "")
            } : undefined
        };
        
        const msgForHistory = { ...userMsg, content: finalInput };
        const newHistory = [...messages, msgForHistory];
        setMessages(newHistory); 
        
        setInput('');
        setReplyingTo(null);
        localStorage.removeItem(`wired_draft_input_${currentSession.id}`);
        setAttachments([]);
        setShowEmoji(false);
        setShowMentionPopup(false);
        setShowActionDrawer(false);
        audio.playSendSound();
        handleStopTTS();
        
        await processGeneration(newHistory);
    };

    const handleContinue = async () => {
        if (isLoading) return;
        audio.playClickSound();
        const history = [...messages];
        await processGeneration(history);
    };

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
            logger.log("Manual Abort Signal Sent.", "SYS", "warn");
            typingTimeoutsRef.current.forEach(clearTimeout);
            typingTimeoutsRef.current = [];
            setTypingUsers([]);
            setMessages(prev => [...prev, {
                id: generateId(),
                role: 'model',
                content: t('app_conn_term', settings.user.language),
                timestamp: new Date().toLocaleTimeString()
            }]);
            audio.playWindowSound(false);
        }
    };

    const openProfile = (target: PersonaSettings | UserSettings) => {
        setProfileTarget(target);
        updateWindowState(WindowType.PROFILE, { closed: false, minimized: false });
        audio.playClickSound();
    };

    const handleShareToCurrentChat = (target: PersonaSettings | UserSettings) => {
        const name = 'username' in target ? target.username : target.name;
        const msg: Message = {
            id: generateId(),
            role: 'user',
            content: `[SHARED CONTACT]: ${name}`,
            timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, msg]);
        audio.playSendSound();
    };

    const handleUpdateUserStats = (stats: RPStats) => {
        setCurrentSession(prev => {
            const updated = { ...prev, userRPStats: stats };
            sessionService.save(updated);
            return updated;
        });
    };

    const handleUpdateNpcRegistry = (registry: Record<string, RPStats>) => {
        setCurrentSession(prev => {
            const updated = { ...prev, npcRegistry: registry };
            sessionService.save(updated);
            return updated;
        });
    };

    const handleShareFromProfileViewer = (target: PersonaSettings | UserSettings) => {
        setShareCandidate(target);
        setShareModalOpen(true);
        audio.playWindowSound(true);
    };

    const handleSwipe = (msgId: string, direction: 'prev' | 'next') => {
        setMessages(prev => prev.map(m => {
            if (m.id !== msgId || !m.swipes) return m;
            const currentIndex = m.swipeIndex || 0;
            const newIndex = direction === 'prev' 
                ? Math.max(0, currentIndex - 1) 
                : Math.min(m.swipes.length - 1, currentIndex + 1);
            
            return {
                ...m,
                swipeIndex: newIndex,
                content: m.swipes[newIndex]
            };
        }));
        audio.playClickSound();
    };

    const openThoughtTrace = (msg: Message) => {
        setSelectedTraceMsg(msg);
        updateWindowState(WindowType.THOUGHT_TRACE, { closed: false, minimized: false });
        audio.playWindowSound(true);
    };

    const handleReroll = async (msgId: string) => {
        if (isLoading) return;
        const msgIndex = messages.findIndex(m => m.id === msgId);
        if (msgIndex === -1) return;
        
        const history = messages.slice(0, msgIndex);
        setIsLoading(true);
        audio.playLoadTick();
        
        abortControllerRef.current = new AbortController();

        try {
            const response = await generateLainResponse(
                history, 
                settings, 
                lorebook, 
                currentSession.summaries || [], 
                abortControllerRef.current.signal,
                currentSession.dataTable, 
                currentSession.affection,
                currentSession.currentMood,
                currentSession.stress,
                currentSession.energy,
                {
                    weather: currentWeather,
                    holiday: null,
                    isUserBirthday: false,
                    isCharBirthday: false
                },
                { user: currentSession.userRPStats, char: currentSession.charRPStats },
                currentSession.rpDate,
                currentSession.rpWorldContext
            );
            
            const newContent = response.text;
            
            setMessages(prev => prev.map(m => {
                if (m.id === msgId) {
                    const swipes = m.swipes ? [...m.swipes, newContent] : [m.content, newContent];
                    return {
                        ...m,
                        content: newContent,
                        swipes: swipes,
                        swipeIndex: swipes.length - 1,
                        thought: response.thought,
                        metadataRaw: response.metadataRaw,
                        systemPromptUsed: response.systemPromptUsed
                    };
                }
                return m;
            }));
            
            audio.playReceiveSound();
        } catch(e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const togglePerspective = () => {
        const perspectives = ['1st', '2nd', '3rd', 'DM'] as const;
        const current = settings.generation.rpPerspective || '1st';
        const idx = perspectives.indexOf(current);
        const next = perspectives[(idx + 1) % perspectives.length];
        
        setSettings(s => ({
            ...s, 
            generation: { ...s.generation, rpPerspective: next }
        }));
        audio.playClickSound();
    };

    const handleGenerateActions = async () => {
        if (isGeneratingActions) return;
        setIsGeneratingActions(true);
        setShowActionDrawer(true);
        audio.playLoadTick();
        
        const langName = settings.user.language === 'zh' ? 'Chinese' : settings.user.language === 'jp' ? 'Japanese' : 'English';
        
        const actions = await generateQuickActions(messages, settings, langName, currentSession.userRPStats, currentSession.charRPStats);
        setQuickActions(actions);
        setIsGeneratingActions(false);
        audio.playConfirmSound();
    };
    
    const fetchActions = handleGenerateActions;

    const handleExecuteAction = (action: QuickReplyOption) => {
        const actionText = `[ACTION: ${action.category?.toUpperCase() || "GENERIC"}] ${action.label}`;
        if (action.dc) {
            setInput(`[CHECK: ${action.attribute} (DC${action.dc})] ${action.label}`);
        } else {
            setInput(actionText);
        }
        setShowActionDrawer(false);
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.focus();
    };

    const toggleRecording = async () => {
        if (isRecording) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64Audio = reader.result as string;
                        if (settings.modules.transcription) {
                            setIsLoading(true);
                            try {
                                const text = await transcribeAudio(base64Audio, settings.moduleConfigs?.transcription?.apiKey || settings.api.apiKey || process.env.API_KEY || '');
                                setInput(prev => (prev ? prev + " " + text : text));
                            } catch (e) {
                                console.error(e);
                            } finally {
                                setIsLoading(false);
                            }
                        }
                    };
                    reader.readAsDataURL(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setIsRecording(true);
                audio.playClickSound();
            } catch (e) {
                console.error("Mic error", e);
                alert("Microphone access denied.");
            }
        }
    };

    const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAttachments(prev => [...prev, reader.result as string]);
                    audio.playClickSound();
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleUpdatePersona = (id: string, updates: Partial<PersonaSettings>) => {
        setSettings(prev => ({ 
            ...prev, 
            characterLibrary: prev.characterLibrary.map(p => p.id === id ? { ...p, ...updates } : p) 
        }));
    };

    const handleDeleteChat = () => {
        setMessages([]);
        audio.playWindowSound(false);
    };

    const handleShareToTarget = (targetId: string) => {
        if (!shareCandidate) return;
        
        const sessions = sessionService.getByPersona(targetId);
        let session = sessions.length > 0 ? sessions[0] : sessionService.create(targetId);
        
        const name = 'username' in shareCandidate ? shareCandidate.username : shareCandidate.name;
        const msg: Message = {
            id: generateId(),
            role: 'user',
            content: `[SHARED CONTACT]: ${name}`,
            timestamp: new Date().toLocaleTimeString()
        };
        
        if (session.id === currentSession.id) {
            setMessages(prev => [...prev, msg]);
        } else {
            if (settings.generation.chatMode === 'rp') {
                session.rpMessages = [...(session.rpMessages || []), msg];
            } else {
                session.msgMessages = [...(session.msgMessages || []), msg];
            }
            sessionService.save(session);
        }
        
        setShareModalOpen(false);
        setShareCandidate(null);
        audio.playSendSound();
    };

    const handleStartMenuAction = (action: string) => {
        audio.playClickSound();
        setStartMenuOpen(false);
        
        switch (action) {
            case 'fullscreen':
                if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                else document.exitFullscreen();
                break;
            case 'reset':
                window.location.reload();
                break;
            case 'mute':
                setSettings(s => ({...s, sound: {...s.sound, enabled: !s.sound.enabled}}));
                break;
            case 'logout':
                setBooted(false);
                break;
            case 'wipe':
                if (confirm("WARNING: THIS WILL WIPE ALL LOCAL DATA. CONTINUE?")) {
                    localStorage.clear();
                    window.location.reload();
                }
                break;
        }
    };

    if (!booted) return (
        <>
            <CustomCursor 
                isBusy={false} 
                customCursors={settings.ui.customCursors}
                scale={settings.ui.cursorSize}
            />
            <BootScreen onLogin={handleBootLogin} />
        </>
    );

    const fontSizeClass = { 'sm': 'text-sm', 'base': 'text-base', 'lg': 'text-lg', 'xl': 'text-xl' }[settings.ui.fontSize] || 'text-base';

    return (
        <div 
            className={`h-screen w-full flex flex-col relative text-[color:var(--lain-cyan)] font-['VT323'] overflow-hidden bg-grid-pattern ${glitchActive ? 'screen-glitch' : 'crt-flicker'}`} 
            onClick={() => audio.resume()}
        >
            <CustomCursor 
                isBusy={isLoading || isGeneratingActions || isGeneratingOpenings} 
                isSystemBusy={systemBusy}
                customCursors={settings.ui.customCursors}
                scale={settings.ui.cursorSize}
            />
            <DiceOverlay rolling={isAutoRolling} result={autoRollResult} tier={rollTier} onComplete={() => {}} />
            <FXOverlay type={fxType} onComplete={() => setFxType(null)} />

            {!windows[WindowType.THOUGHT_TRACE].closed && selectedTraceMsg && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto" style={{ zIndex: zIndices[WindowType.THOUGHT_TRACE] }}>
                    <ThoughtTraceViewer 
                        message={selectedTraceMsg}
                        onClose={() => updateWindowState(WindowType.THOUGHT_TRACE, { closed: true })}
                        isMinimized={windows[WindowType.THOUGHT_TRACE].minimized}
                        isMaximized={windows[WindowType.THOUGHT_TRACE].maximized}
                        onMinimize={() => updateWindowState(WindowType.THOUGHT_TRACE, { minimized: !windows[WindowType.THOUGHT_TRACE].minimized })}
                        onMaximize={() => updateWindowState(WindowType.THOUGHT_TRACE, { maximized: !windows[WindowType.THOUGHT_TRACE].maximized })}
                    />
                </div>
            )}

            {!windows[WindowType.MAP].closed && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto" style={{ zIndex: zIndices[WindowType.MAP] }}>
                    <TacticalMapWindow
                        mapData={currentSession.mapData}
                        userPos={currentSession.userPos}
                        charPos={currentSession.charPos}
                        worldContext={currentSession.rpWorldContext}
                        apiKey={settings.api.apiKey || process.env.API_KEY || ''}
                        onUpdateMap={handleUpdateMap}
                        onClose={() => updateWindowState(WindowType.MAP, { closed: true })}
                        isMinimized={windows[WindowType.MAP].minimized}
                        isMaximized={windows[WindowType.MAP].maximized}
                        onMinimize={() => updateWindowState(WindowType.MAP, { minimized: !windows[WindowType.MAP].minimized })}
                        onMaximize={() => updateWindowState(WindowType.MAP, { maximized: !windows[WindowType.MAP].maximized })}
                        onSystemBusy={setSystemBusy} 
                        language={settings.user.language}
                    />
                </div>
            )}

            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto" 
                 style={{ 
                     zIndex: zIndices[WindowType.MUSIC],
                     display: windows[WindowType.MUSIC].closed ? 'none' : 'flex' 
                 }}>
                <MusicPlayerWindow
                    settings={settings}
                    onUpdateSettings={setSettings}
                    onClose={() => updateWindowState(WindowType.MUSIC, { closed: true })}
                    isMinimized={windows[WindowType.MUSIC].minimized}
                    isMaximized={windows[WindowType.MUSIC].maximized}
                    onMinimize={() => updateWindowState(WindowType.MUSIC, { minimized: !windows[WindowType.MUSIC].minimized })}
                    onMaximize={() => updateWindowState(WindowType.MUSIC, { maximized: !windows[WindowType.MUSIC].maximized })}
                />
            </div>

            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {settings.ui.wallpaper ? (
                    <img src={settings.ui.wallpaper} className="w-full h-full object-cover transition-opacity duration-1000" style={{ opacity: settings.ui.wallpaperOpacity }} alt="Wallpaper" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center transition-opacity duration-1000" style={{ opacity: settings.ui.wallpaperOpacity }}>
                         <WiredEye className="w-[80%] h-[80%] text-[color:var(--lain-cyan)]" />
                    </div>
                )}
            </div>
            <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/b/bc/Static_tv_noise_clip.gif')] opacity-[0.03] pointer-events-none z-0 mix-blend-screen" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,40,60,0.3)_0%,rgba(0,5,10,0.95)_100%)] z-0 pointer-events-none" />

            <header className="h-9 bg-black/90 backdrop-blur-md border-b border-[color:var(--lain-cyan)] flex items-center justify-between px-3 z-40 select-none shrink-0 relative shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                 <div className="flex items-center gap-6 z-10 relative start-menu-container">
                    <button 
                        onClick={() => { setStartMenuOpen(!startMenuOpen); audio.playClickSound(); }}
                        className={`flex items-center gap-2 cursor-pointer whitespace-nowrap px-3 h-6 text-black font-bold font-['Share_Tech_Mono'] skew-x-12 hover:skew-x-0 transition-transform shadow-[0_0_10px_rgba(0,240,255,0.6)] ${startMenuOpen ? 'bg-white' : 'bg-[color:var(--lain-cyan)]'}`}
                    >
                        <WiredEye className="w-4 h-4 -skew-x-12 text-black fill-current" />
                        <span className="tracking-widest hidden sm:inline -skew-x-12 text-xs">NAVI v12.6</span>
                    </button>

                    {startMenuOpen && (
                        <div className="absolute top-8 left-0 w-64 bg-black border border-[color:var(--lain-cyan)] shadow-[0_0_20px_rgba(0,240,255,0.3)] z-50 flex animate-in slide-in-from-top-2 origin-top-left">
                            <div className="w-8 bg-[color:var(--lain-cyan)] flex items-end justify-center pb-4 relative overflow-hidden">
                                <div className="transform -rotate-90 text-black font-bold tracking-[0.3em] whitespace-nowrap text-lg absolute bottom-10">WIRED_OS</div>
                            </div>
                            <div className="flex-1 flex flex-col p-1 gap-1">
                                <button onClick={() => handleStartMenuAction('fullscreen')} className="flex items-center gap-3 p-2 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors text-xs font-bold tracking-wider group">
                                    <Maximize size={14} className="group-hover:scale-110 transition-transform"/> FULLSCREEN
                                </button>
                                <button onClick={() => handleStartMenuAction('mute')} className="flex items-center gap-3 p-2 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors text-xs font-bold tracking-wider group">
                                    {settings.sound.enabled ? <Volume2 size={14}/> : <VolumeX size={14}/>} AUDIO_TOGGLE
                                </button>
                                <button onClick={() => { toggleWindow(WindowType.SETTINGS); setStartMenuOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors text-xs font-bold tracking-wider group">
                                    <SettingsIcon size={14} className="group-hover:rotate-90 transition-transform"/> CONFIGURATION
                                </button>
                                <div className="h-px bg-[color:var(--lain-cyan)]/30 mx-2 my-1"></div>
                                <button onClick={() => handleStartMenuAction('reset')} className="flex items-center gap-3 p-2 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors text-xs font-bold tracking-wider group">
                                    <RefreshCw size={14} className="group-hover:rotate-180 transition-transform"/> SYSTEM_REBOOT
                                </button>
                                <button onClick={() => handleStartMenuAction('logout')} className="flex items-center gap-3 p-2 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors text-xs font-bold tracking-wider group">
                                    <Power size={14}/> DISCONNECT
                                </button>
                                <div className="h-px bg-[color:var(--lain-cyan)]/30 mx-2 my-1"></div>
                                <button onClick={() => handleStartMenuAction('wipe')} className="flex items-center gap-3 p-2 hover:bg-red-500 hover:text-white text-red-500 transition-colors text-xs font-bold tracking-wider group">
                                    <AlertTriangle size={14} className="group-hover:animate-pulse"/> HARD_RESET
                                </button>
                            </div>
                        </div>
                    )}

                    <nav className="flex gap-4 text-xs items-center h-full font-['Share_Tech_Mono'] overflow-x-auto no-scrollbar">
                        {[
                            { id: WindowType.CHAT, label: settings.generation.chatMode === 'rp' ? "ROLEPLAY" : t('nav_protocol', settings.user.language), icon: Disc },
                            { id: WindowType.FRIENDS, label: settings.generation.chatMode === 'rp' ? "PARTY" : t('nav_nodes', settings.user.language), icon: Network },
                            { id: WindowType.SOCIAL, label: t('nav_social', settings.user.language), icon: ImageIcon },
                            { id: WindowType.VIDEO, label: t('nav_visual', settings.user.language), icon: Monitor },
                            { id: WindowType.CONSOLE, label: t('nav_system', settings.user.language), icon: Terminal },
                            { id: WindowType.MUSIC, label: "MUSIC", icon: Music } 
                        ].map(item => (
                            <button 
                                key={item.id}
                                onClick={() => toggleWindow(item.id)} 
                                className={`flex items-center gap-1 hover:text-white transition-all duration-200 border-b-2 border-transparent hover:border-[color:var(--lain-cyan)] pb-0.5 whitespace-nowrap ${windows[item.id].closed ? 'opacity-40 grayscale' : 'text-[color:var(--lain-cyan)] text-glow'}`}
                            >
                                <item.icon size={12} />
                                <span className="hidden sm:inline tracking-wider">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-4 px-2 z-10">
                     <button onClick={() => { setShowNewChatModal(true); audio.playConfirmSound(); }} className="group flex items-center gap-2 border border-[color:var(--lain-cyan)]/50 px-2 py-0.5 bg-black hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors text-[10px] font-['Share_Tech_Mono'] win98-bevel active:win98-bevel-pressed uppercase tracking-wider hidden sm:flex">
                        <RefreshCw size={10} className="group-hover:rotate-180 transition-transform" /> {t('ui_new_session', settings.user.language)}
                    </button>
                    <button onClick={() => toggleWindow(WindowType.SETTINGS)} className="hover:text-white hover:animate-spin transition-colors p-1 text-[color:var(--lain-cyan)]"><SettingsIcon size={16} /></button>
                </div>
            </header>

            <main className="flex-1 p-3 flex flex-col lg:flex-row gap-4 overflow-y-auto lg:overflow-hidden relative z-10">
                {!windows[WindowType.FRIENDS].closed && (
                    <div className={`flex flex-col w-full lg:w-72 shrink-0 transition-all duration-300 ${windows[WindowType.FRIENDS].minimized ? 'h-auto' : 'h-96 lg:h-full'}`} style={{ zIndex: zIndices[WindowType.FRIENDS] }}>
                         <FriendList 
                             settings={settings}
                             onUpdateSettings={setSettings}
                             onClose={() => updateWindowState(WindowType.FRIENDS, { closed: true })}
                             isMinimized={windows[WindowType.FRIENDS].minimized}
                             isMaximized={windows[WindowType.FRIENDS].maximized}
                             onMinimize={() => updateWindowState(WindowType.FRIENDS, { minimized: !windows[WindowType.FRIENDS].minimized })}
                             onMaximize={() => updateWindowState(WindowType.FRIENDS, { maximized: !windows[WindowType.FRIENDS].maximized })}
                             onNewChat={(id) => { setSettings(s => ({...s, activeTargetId: id})); audio.playConfirmSound(); }}
                             onOpenProfile={openProfile}
                             onShareProfile={handleShareToCurrentChat}
                             onSystemBusy={setSystemBusy} 
                         />
                    </div>
                )}
                
                {!windows[WindowType.SOCIAL].closed && (
                    <div className={`flex flex-col w-full lg:w-96 shrink-0 transition-all duration-300 ${windows[WindowType.SOCIAL].minimized ? 'h-auto' : 'h-96 lg:h-full'}`} style={{ zIndex: zIndices[WindowType.SOCIAL] }}>
                        <SocialFeed 
                            settings={settings}
                            onUpdateSettings={setSettings}
                            onClose={() => updateWindowState(WindowType.SOCIAL, { closed: true })}
                            isMinimized={windows[WindowType.SOCIAL].minimized}
                            isMaximized={windows[WindowType.SOCIAL].maximized}
                            onMinimize={() => updateWindowState(WindowType.SOCIAL, { minimized: !windows[WindowType.SOCIAL].minimized })}
                            onMaximize={() => updateWindowState(WindowType.SOCIAL, { maximized: !windows[WindowType.SOCIAL].maximized })}
                        />
                    </div>
                )}

                {!windows[WindowType.MEMORY].closed && (
                    <div className={`flex flex-col w-full lg:w-[500px] shrink-0 transition-all duration-300 ${windows[WindowType.MEMORY].minimized ? 'h-auto' : 'h-96 lg:h-full'}`} style={{ zIndex: zIndices[WindowType.MEMORY] }}>
                        <MemoryTableViewer 
                            memoryLayers={currentSession.memoryLayers || { layer1: "", layer2: "", layer3: "" }}
                            onSave={handleSaveMemoryLayers}
                            apiSettings={settings.memoryApi || settings.api}
                            onClose={() => updateWindowState(WindowType.MEMORY, { closed: true })}
                            isMinimized={windows[WindowType.MEMORY].minimized}
                            isMaximized={windows[WindowType.MEMORY].maximized}
                            onMinimize={() => updateWindowState(WindowType.MEMORY, { minimized: !windows[WindowType.MEMORY].minimized })}
                            onMaximize={() => updateWindowState(WindowType.MEMORY, { maximized: !windows[WindowType.MEMORY].maximized })}
                            language={settings.user.language}
                        />
                    </div>
                )}

                {!windows[WindowType.RP_STATUS].closed && currentSession.userRPStats && currentSession.charRPStats && (
                    <div className={`flex flex-col w-full lg:w-[450px] shrink-0 transition-all duration-300 ${windows[WindowType.RP_STATUS].minimized ? 'h-auto' : 'h-96 lg:h-full'}`} style={{ zIndex: zIndices[WindowType.RP_STATUS] }}>
                        <RPStatusViewer
                            userStats={currentSession.userRPStats}
                            charStats={currentSession.charRPStats}
                            npcRegistry={currentSession.npcRegistry}
                            userName={settings.user.username}
                            charName={activeName}
                            onClose={() => updateWindowState(WindowType.RP_STATUS, { closed: true })}
                            isMinimized={windows[WindowType.RP_STATUS].minimized}
                            isMaximized={windows[WindowType.RP_STATUS].maximized}
                            onMinimize={() => updateWindowState(WindowType.RP_STATUS, { minimized: !windows[WindowType.RP_STATUS].minimized })}
                            onMaximize={() => updateWindowState(WindowType.RP_STATUS, { maximized: !windows[WindowType.RP_STATUS].maximized })}
                            settings={settings}
                            onUpdateUserStats={handleUpdateUserStats}
                            onUpdateNpcRegistry={handleUpdateNpcRegistry}
                            messages={messages}
                        />
                    </div>
                )}

                {!windows[WindowType.WORLD_NEWS].closed && (
                    <div className={`flex flex-col w-full lg:w-[400px] shrink-0 transition-all duration-300 ${windows[WindowType.WORLD_NEWS].minimized ? 'h-auto' : 'h-96 lg:h-full'}`} style={{ zIndex: zIndices[WindowType.WORLD_NEWS] }}>
                        <WorldNewsViewer
                            events={currentSession.worldEvents || []}
                            onGenerate={handleUpdateWorld}
                            isLoading={isUpdatingWorld}
                            onClose={() => updateWindowState(WindowType.WORLD_NEWS, { closed: true })}
                            isMinimized={windows[WindowType.WORLD_NEWS].minimized}
                            isMaximized={windows[WindowType.WORLD_NEWS].maximized}
                            onMinimize={() => updateWindowState(WindowType.WORLD_NEWS, { minimized: !windows[WindowType.WORLD_NEWS].minimized })}
                            onMaximize={() => updateWindowState(WindowType.WORLD_NEWS, { maximized: !windows[WindowType.WORLD_NEWS].maximized })}
                            rpDate={currentSession.rpDate}
                            onAdvanceDay={settings.generation.chatMode === 'rp' ? handleAdvanceRpDay : undefined}
                            language={settings.user.language}
                        />
                    </div>
                )}

                {!windows[WindowType.PROFILE].closed && profileTarget && (
                    <div className={`flex flex-col w-full lg:w-[450px] shrink-0 transition-all duration-300 ${windows[WindowType.PROFILE].minimized ? 'h-auto' : 'h-96 lg:h-full'}`} style={{ zIndex: zIndices[WindowType.PROFILE] }}>
                        <ProfileViewer 
                            target={profileTarget}
                            onClose={() => updateWindowState(WindowType.PROFILE, { closed: true })}
                            isMinimized={windows[WindowType.PROFILE].minimized}
                            isMaximized={windows[WindowType.PROFILE].maximized}
                            onMinimize={() => updateWindowState(WindowType.PROFILE, { minimized: !windows[WindowType.PROFILE].minimized })}
                            onMaximize={() => updateWindowState(WindowType.PROFILE, { maximized: !windows[WindowType.PROFILE].maximized })}
                            language={settings.user.language}
                            onShare={handleShareFromProfileViewer} 
                            onUpdateUser={(u) => setSettings(s => ({...s, user: u}))}
                        />
                    </div>
                )}

                {!windows[WindowType.CHAT].closed && (
                    <div className="flex-1 min-w-0 flex flex-col h-[600px] lg:h-full min-h-[400px]" style={{ zIndex: zIndices[WindowType.CHAT] }}>
                         <NaviWindow 
                            title={settings.generation.chatMode === 'rp' ? `RPG // ${activeName.toUpperCase()}` : `${t('ui_conn', settings.user.language)} ${activeName.toUpperCase()}`}
                            className="h-full"
                            isMinimized={windows[WindowType.CHAT].minimized}
                            isMaximized={windows[WindowType.CHAT].maximized}
                            onMinimize={() => updateWindowState(WindowType.CHAT, { minimized: !windows[WindowType.CHAT].minimized })}
                            onMaximize={() => updateWindowState(WindowType.CHAT, { maximized: !windows[WindowType.CHAT].maximized })}
                            onClose={() => updateWindowState(WindowType.CHAT, { closed: true })}
                            headerControls={
                                <div className="flex items-center gap-2">
                                    {settings.generation.chatMode === 'msg' ? (
                                        <div className="flex items-center gap-3 px-3 py-0.5 text-[10px] font-bold tracking-wider border-r border-[color:var(--lain-cyan)]/30 mr-2 bg-black/40">
                                            <div className="flex items-center gap-1" title="Affection / Sync Rate">
                                                <Heart size={10} className="fill-current text-red-500" />
                                                <span>{currentSession.affection}%</span>
                                            </div>
                                            <div className="flex items-center gap-1" title="Stress / Mental Load">
                                                <AlertCircle size={10} className={currentSession.stress > 70 ? 'text-red-500 animate-pulse' : 'text-yellow-500'} />
                                                <span>{currentSession.stress}%</span>
                                            </div>
                                            <div className="flex items-center gap-1" title="Energy / Stamina">
                                                <Zap size={10} className="fill-current text-blue-400" />
                                                <span>{currentSession.energy}%</span>
                                            </div>
                                            <div className="w-px h-3 bg-[color:var(--lain-cyan)]/30 mx-1"></div>
                                            <span>{t('app_status', settings.user.language)}: {currentSession.currentMood.toUpperCase()}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 px-3 py-0.5 text-[10px] font-bold tracking-wider border-r border-[color:var(--lain-cyan)]/30 mr-2 bg-black/40">
                                            {currentSession.userRPStats && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[color:var(--lain-cyan)]">USR:</span>
                                                    <span className="text-red-500">HP {currentSession.userRPStats.hp.current}/{currentSession.userRPStats.hp.max}</span>
                                                    <span className="text-blue-500">MP {currentSession.userRPStats.mp.current}/{currentSession.userRPStats.mp.max}</span>
                                                </div>
                                            )}
                                            {currentSession.charRPStats && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[color:var(--lain-cyan)]">NPC:</span>
                                                    <span className="text-red-500">HP {currentSession.charRPStats.hp.current}</span>
                                                    <span className="text-pink-500 ml-1">AFF {currentSession.charRPStats.affection}%</span>
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => toggleWindow(WindowType.RP_STATUS)}
                                                className="border border-[color:var(--lain-cyan)] px-1 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors"
                                                title="View Detailed Stats"
                                            >
                                                STATS
                                            </button>
                                            <button 
                                                onClick={() => { setShowCampaignInput(!showCampaignInput); audio.playClickSound(); }}
                                                className={`border border-[color:var(--lain-cyan)] px-2 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors ml-2 flex items-center gap-1 ${showCampaignInput ? 'bg-[color:var(--lain-cyan)] text-black' : ''}`}
                                                title="Generate World Setting"
                                            >
                                                <PenTool size={10} /> WORLD
                                            </button>
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => toggleWindow(WindowType.MEMORY)}
                                        className={`transition-all hover:text-white flex items-center gap-1 text-[10px] border border-[color:var(--lain-cyan)] px-2 ${!windows[WindowType.MEMORY].closed ? 'bg-[color:var(--lain-cyan)] text-black' : 'text-[color:var(--lain-cyan)]'}`}
                                        title="Open Memory Table"
                                    >
                                        <Database size={12} /> {t('app_mem_table', settings.user.language)}
                                    </button>
                                    <button 
                                        onClick={() => toggleWindow(WindowType.VIDEO)}
                                        className={`transition-all hover:text-white flex items-center gap-1 text-[10px] border border-[color:var(--lain-cyan)] px-2 ${!windows[WindowType.VIDEO].closed ? 'bg-[color:var(--lain-cyan)] text-black' : 'text-[color:var(--lain-cyan)]'}`}
                                        title="Open Visual Feed"
                                    >
                                        <Video size={12} /> {t('app_call', settings.user.language)}
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            const currentMode = settings.translation?.translationMode || 'interpretive';
                                            const newMode = currentMode === 'interpretive' ? 'literal' : 'interpretive';
                                            setSettings(prev => ({
                                                ...prev,
                                                translation: { 
                                                    source: 'google',
                                                    ...(prev.translation || {}), 
                                                    translationMode: newMode 
                                                }
                                            }));
                                            audio.playClickSound();
                                        }}
                                        className={`transition-all hover:text-white flex items-center gap-1 text-[10px] border border-[color:var(--lain-cyan)] px-2 ${settings.translation?.translationMode === 'literal' ? 'bg-[color:var(--lain-cyan)] text-black' : 'text-[color:var(--lain-cyan)]'}`}
                                        title={`Translation Mode: ${settings.translation?.translationMode === 'literal' ? 'Literal (Robot)' : 'Interpretive (AI)'}`}
                                    >
                                        <Languages size={12} /> {settings.translation?.translationMode === 'literal' ? 'LIT' : 'INT'}
                                    </button>
                                </div>
                            }
                        >
                            <div className="flex flex-col h-full bg-black/60 p-2 sm:p-4 min-h-0 relative overflow-hidden">
                                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                                    {(activePersona && activePersona.chatWallpaper) ? (
                                        <img src={activePersona.chatWallpaper} className="w-full h-full object-cover transition-opacity duration-500" style={{ opacity: settings.ui.chatWallpaperOpacity }} alt="Chat Wallpaper" />
                                    ) : settings.ui.chatWallpaper ? (
                                        <img src={settings.ui.chatWallpaper} className="w-full h-full object-cover transition-opacity duration-500" style={{ opacity: settings.ui.chatWallpaperOpacity }} alt="Chat Wallpaper" />
                                    ) : (
                                        <WiredEye className="w-96 h-96 text-[color:var(--lain-cyan)] transition-opacity duration-500" style={{ opacity: settings.ui.chatWallpaperOpacity }} />
                                    )}
                                </div>

                                {settings.generation.chatMode === 'msg' && (
                                    <div className="relative z-10 mb-2 animate-in slide-in-from-top-2">
                                        <ResonanceGraph 
                                            messages={messages} 
                                            currentMood={currentSession.currentMood} 
                                            affection={currentSession.affection} 
                                        />
                                    </div>
                                )}

                                {showCampaignInput && settings.generation.chatMode === 'rp' && (
                                    <div className="absolute top-0 left-0 right-0 z-50 bg-black/90 border-b border-[color:var(--lain-cyan)] p-4 animate-in slide-in-from-top-2">
                                        <div className="flex flex-col gap-2 max-w-lg mx-auto">
                                            <div className="flex justify-between items-center text-[color:var(--lain-cyan)]">
                                                <div className="text-xs font-bold tracking-widest flex items-center gap-2"><Globe size={12}/> INITIALIZE CAMPAIGN SETTING</div>
                                                <button onClick={() => setShowCampaignInput(false)}><X size={14}/></button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={campaignKeywords}
                                                    onChange={(e) => setCampaignKeywords(e.target.value)}
                                                    placeholder="e.g. Cyberpunk Noir, Eldritch Horror in Space, High Fantasy..."
                                                    className="flex-1 bg-black border border-[color:var(--lain-cyan)] p-2 text-xs focus:outline-none"
                                                    autoFocus
                                                />
                                                <button 
                                                    onClick={handleGenerateCampaign}
                                                    disabled={isGeneratingCampaign}
                                                    className="px-4 bg-[color:var(--lain-cyan)] text-black font-bold text-xs hover:bg-white transition-colors"
                                                >
                                                    {isGeneratingCampaign ? "GENERATING..." : "CREATE"}
                                                </button>
                                            </div>
                                            {currentSession.rpWorldContext && (
                                                <div className="text-[10px] opacity-60 mt-1 truncate">Current: {currentSession.rpWorldContext.substring(0, 50)}...</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className={`flex-1 overflow-y-auto space-y-4 pr-2 font-['Share_Tech_Mono'] scrollbar-thin ${fontSizeClass} z-10 relative`}>
                                    <div className="flex items-center justify-center gap-4 text-[10px] font-mono opacity-60 mb-6 bg-black/40 py-1 rounded select-none pointer-events-none">
                                        <div className="flex items-center gap-1">
                                            <span className="text-green-400">SRC:</span>
                                            <span>{settings.user.ipAddress} <span className="text-[9px] opacity-70">[{settings.user.region}]</span></span>
                                        </div>
                                        <div className="flex items-center gap-1 animate-pulse text-[color:var(--lain-cyan)]">{'<'}---{'>'}</div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[color:var(--lain-cyan)]">DST:</span>
                                            <span>{activePersona?.ipAddress || "UNKNOWN_NODE"} <span className="text-[9px] opacity-70">[{activePersona?.region || "Unknown"}]</span></span>
                                        </div>
                                    </div>

                                    {messages.length === 0 && (
                                         <div className="flex flex-col items-center justify-center h-full opacity-100 gap-6">
                                             <div className="text-sm tracking-[0.5em] animate-pulse text-[color:var(--lain-cyan)] text-glow uppercase">{t('app_conn_est', settings.user.language)}</div>
                                             
                                             <div className="flex gap-4">
                                                 {activePersona?.customOpening && (
                                                     <button 
                                                        onClick={handleSendCustomOpening}
                                                        className="border border-[color:var(--lain-cyan)] px-6 py-3 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-all flex items-center gap-2 font-bold tracking-widest text-xs win98-bevel active:win98-bevel-pressed animate-in fade-in zoom-in"
                                                        title={activePersona.customOpening}
                                                     >
                                                         <MessageCircle size={16} /> INITIALIZE: CUSTOM OPENING
                                                     </button>
                                                 )}

                                                 {!isGeneratingOpenings && openingOptions.length === 0 && (activePersona?.useRandomOpening ?? true) && (
                                                     <button 
                                                        onClick={handleGenerateOpenings}
                                                        className="border border-[color:var(--lain-cyan)] px-6 py-3 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-all flex items-center gap-2 font-bold tracking-widest text-xs win98-bevel active:win98-bevel-pressed animate-in fade-in zoom-in"
                                                     >
                                                         <PlayCircle size={16} /> {t('app_start_chat', settings.user.language)}
                                                     </button>
                                                 )}
                                             </div>

                                             {isGeneratingOpenings && (
                                                 <div className="flex items-center gap-2 text-xs animate-pulse">
                                                     <RefreshCw size={14} className="animate-spin" />
                                                     {t('app_gen_openings', settings.user.language)}
                                                 </div>
                                             )}

                                             {openingOptions.length > 0 && (
                                                 <div className="flex flex-col gap-2 w-full max-w-lg animate-in slide-in-from-bottom-4">
                                                     <div className="text-center text-[10px] opacity-70 tracking-widest uppercase mb-2">{t('app_select_opening', settings.user.language)}</div>
                                                     {openingOptions.map((opt, i) => (
                                                         <button
                                                            key={i}
                                                            onClick={() => handleSelectOpening(opt)}
                                                            className="text-left p-3 border border-[color:var(--lain-cyan)]/30 hover:border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)]/10 transition-colors text-xs bg-black/80"
                                                         >
                                                             {opt}
                                                         </button>
                                                     ))}
                                                     <button onClick={() => setOpeningOptions([])} className="text-[10px] text-red-500 hover:underline mt-2">Cancel</button>
                                                 </div>
                                             )}
                                         </div>
                                    )}

                                    {messages.map((msg, idx) => (
                                        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group relative mb-4`}>
                                            <div className="flex items-center gap-2 mb-1 opacity-70 text-[10px] select-none font-mono tracking-widest uppercase">
                                                {msg.role === 'user' && settings.user.avatar && (
                                                    <img src={settings.user.avatar} className="w-6 h-6 rounded-full border border-green-500 object-cover" />
                                                )}
                                                
                                                {msg.role === 'model' && (
                                                    <>
                                                        {activeGroup ? (
                                                            (() => {
                                                                const speaker = settings.characterLibrary.find(p => p.name === msg.speakerName);
                                                                return speaker && speaker.avatar ? (
                                                                    <img src={speaker.avatar} className="w-6 h-6 rounded-full border border-[color:var(--lain-cyan)] object-cover" />
                                                                ) : <div className="w-6 h-6 rounded-full border border-[color:var(--lain-cyan)] bg-black/50" />;
                                                            })()
                                                        ) : (
                                                            activePersona?.avatar && <img src={activePersona.avatar} className="w-6 h-6 rounded-full border border-[color:var(--lain-cyan)] object-cover" />
                                                        )}
                                                    </>
                                                )}

                                                <span className={msg.role === 'user' ? 'text-green-400 font-bold' : 'text-[color:var(--lain-cyan)] font-bold'}>
                                                    {msg.role === 'user' 
                                                        ? `> ${settings.user.username}` 
                                                        : `> ${msg.speakerName || activeName}`
                                                    }
                                                </span>
                                                <span className="text-gray-600">[{msg.timestamp}]</span>
                                                
                                                {msg.metadata?.generationTime && (
                                                    <span className="text-[9px] opacity-50 bg-[color:var(--lain-cyan)]/10 px-1 rounded flex items-center gap-1">
                                                        <Activity size={8} /> {msg.metadata.generationTime}
                                                    </span>
                                                )}

                                                {msg.swipes && msg.swipes.length > 1 && (
                                                    <div className="flex items-center gap-1 bg-black/50 border border-[color:var(--lain-cyan)]/30 px-1 rounded text-[9px] mr-2 ml-auto sm:ml-2">
                                                        <button 
                                                            onClick={() => handleSwipe(msg.id, 'prev')}
                                                            className="hover:text-white disabled:opacity-30"
                                                            disabled={!msg.swipeIndex || msg.swipeIndex === 0}
                                                        >
                                                            <ChevronLeft size={10}/>
                                                        </button>
                                                        <span className="font-mono text-[color:var(--lain-cyan)]/70">
                                                            {(msg.swipeIndex || 0) + 1}/{msg.swipes.length}
                                                        </span>
                                                        <button 
                                                            onClick={() => handleSwipe(msg.id, 'next')}
                                                            className="hover:text-white disabled:opacity-30"
                                                            disabled={msg.swipeIndex === msg.swipes.length - 1}
                                                        >
                                                            <ChevronRight size={10}/>
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ml-2">
                                                    {msg.role === 'model' && (
                                                        <button
                                                            onClick={() => openThoughtTrace(msg)}
                                                            className="hover:text-white transition-colors text-yellow-400"
                                                            title="View Thought Trace & Metadata"
                                                        >
                                                            <Brain size={12} />
                                                        </button>
                                                    )}

                                                    <button 
                                                        onClick={() => handleReplyTo(msg)}
                                                        className="hover:text-white transition-colors"
                                                        title="Reply"
                                                    >
                                                        <Reply size={10} />
                                                    </button>

                                                    <button 
                                                        onClick={() => handlePlayTTS(msg.content, msg.id)}
                                                        className={`hover:text-white transition-colors ${speakingMsgId === msg.id ? 'text-[color:var(--lain-cyan)] animate-pulse' : ''}`}
                                                        title={speakingMsgId === msg.id ? "Stop Speech" : "Replay Speech"}
                                                    >
                                                        {speakingMsgId === msg.id ? <Square size={10} fill="currentColor" /> : <Volume2 size={12} />}
                                                    </button>

                                                    <button 
                                                        onClick={() => handleCopyMessage(msg.content)}
                                                        className="hover:text-white transition-colors"
                                                        title="Copy Message"
                                                    >
                                                        <Copy size={10} />
                                                    </button>

                                                    <button 
                                                        onClick={() => handleToggleExclude(msg.id)} 
                                                        className={`${msg.excludeFromContext ? 'opacity-100 text-[color:var(--lain-red)]' : 'hover:text-yellow-400'}`}
                                                        title="Toggle Exclusion from Memory"
                                                    >
                                                        <EyeOff size={10} />
                                                    </button>

                                                    <button 
                                                        onClick={() => startEditing(msg)} 
                                                        className="hover:text-blue-400 transition-colors"
                                                        title="Edit Packet"
                                                    >
                                                        <Edit2 size={10} />
                                                    </button>

                                                    <button 
                                                        onClick={(e) => handleDeleteMessage(e, msg.id)} 
                                                        className="hover:text-[color:var(--lain-red)] transition-colors"
                                                        title="Delete Packet"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                                
                                                {!isLoading && msg.role === 'model' && idx === (messages.length - 1) && (
                                                    <button 
                                                        onClick={() => handleReroll(msg.id)} 
                                                        className="opacity-0 group-hover:opacity-100 hover:text-white hover:bg-[color:var(--lain-cyan)]/20 transition-all ml-2 border border-[color:var(--lain-cyan)] px-1"
                                                        title="Reroll Response (Keep current)"
                                                    >
                                                        <RotateCcw size={10} />
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <div className={`max-w-[90%] p-4 border border-opacity-50 relative backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.3)] ${
                                                msg.role === 'user' 
                                                ? 'border-green-500/50 text-green-100 bg-green-900/10' 
                                                : 'border-[color:var(--lain-cyan)]/50 text-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/5'
                                            } ${msg.excludeFromContext ? 'opacity-40 grayscale border-dashed' : ''}`}>
                                                
                                                {msg.replyTo && (
                                                    <div className="mb-2 border-l-2 border-current pl-2 py-1 opacity-70 text-xs bg-black/20">
                                                        <div className="font-bold text-[10px] uppercase mb-0.5">{msg.replyTo.speakerName}</div>
                                                        <div className="truncate">{msg.replyTo.content}</div>
                                                    </div>
                                                )}

                                                {msg.thought && (
                                                    <details className="mb-2 border-b border-[color:var(--lain-cyan)]/20 pb-2">
                                                        <summary className="text-[10px] cursor-pointer opacity-50 hover:opacity-100 select-none list-none flex items-center gap-2 text-[color:var(--lain-cyan)]">
                                                            <BrainCircuit size={12} />
                                                            <span className="tracking-widest font-bold">{t('app_thought', settings.user.language)}</span>
                                                        </summary>
                                                        <div className="mt-2 text-[10px] opacity-70 font-mono whitespace-pre-wrap bg-black/30 p-2 border-l-2 border-[color:var(--lain-cyan)]/30 text-gray-300">
                                                            {msg.thought}
                                                        </div>
                                                    </details>
                                                )}

                                                {editingMsgId === msg.id ? (
                                                    <div className="flex flex-col gap-2 min-w-[300px]">
                                                        <textarea 
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            className="bg-black/80 w-full p-2 text-sm font-mono border border-current focus:outline-none"
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => setEditingMsgId(null)} className="p-1 hover:text-red-500"><X size={14}/></button>
                                                            <button onClick={saveEdit} className="p-1 hover:text-green-500"><Check size={14}/></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                {msg.attachments.map((src, i) => (
                                                                    <img key={i} src={src} className="max-w-[200px] max-h-[200px] object-cover border border-current opacity-80" alt="attachment" />
                                                                ))}
                                                            </div>
                                                        )}

                                                        {msg.role === 'model' && settings.generation.streaming && !msg.translation && idx === (messages.length - 1) ? (
                                                            <Typewriter text={msg.content} soundEnabled={settings.sound.enabled} />
                                                        ) : (
                                                            <span className="relative z-10">
                                                                <FormattedText text={msg.content} />
                                                            </span>
                                                        )}

                                                        {msg.translation && (
                                                            <div className="mt-2 pt-2 border-t border-dashed border-opacity-30 border-current text-sm italic opacity-90 font-sans relative group/trans">
                                                                {msg.translation}
                                                                <button 
                                                                    onClick={() => handlePlayTTS(msg.translation || "", `trans-${msg.id}`)}
                                                                    className={`absolute right-0 top-2 p-1 hover:text-white transition-colors opacity-50 group-hover/trans:opacity-100 ${speakingMsgId === `trans-${msg.id}` ? 'text-[color:var(--lain-cyan)] animate-pulse' : ''}`}
                                                                    title="Speak Translation"
                                                                >
                                                                    {speakingMsgId === `trans-${msg.id}` ? <Square size={10} fill="currentColor" /> : <Volume2 size={12} />}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                <div className="absolute top-0 left-0 w-1 h-1 bg-current opacity-50"></div>
                                                <div className="absolute top-0 right-0 w-1 h-1 bg-current opacity-50"></div>
                                                <div className="absolute bottom-0 left-0 w-1 h-1 bg-current opacity-50"></div>
                                                <div className="absolute bottom-0 right-0 w-1 h-1 bg-current opacity-50"></div>

                                                {!isLoading && msg.role === 'model' && !editingMsgId && (
                                                    <div className="absolute -bottom-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
                                                        <button 
                                                            onClick={() => handleTranslateMessage(msg.id, msg.content)}
                                                            className="text-[10px] border border-[color:var(--lain-cyan)] px-2 py-0.5 bg-black hover:bg-[color:var(--lain-cyan)] hover:text-black flex items-center gap-1 font-['Share_Tech_Mono']"
                                                            title={msg.translation ? "Re-translate" : "Translate"}
                                                            disabled={translatingMsgId === msg.id}
                                                        >
                                                            {translatingMsgId === msg.id ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}
                                                            {msg.translation ? "RE-TRANSLATE" : t('ui_translate', settings.user.language)}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {typingUsers.length > 0 && (
                                        <div className="text-[color:var(--lain-cyan)] text-xs tracking-widest opacity-80 ml-2 animate-pulse mb-4 flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                                                <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-75"></div>
                                                <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-150"></div>
                                            </div>
                                            <span>{typingUsers.join(', ')} is typing...</span>
                                        </div>
                                    )}

                                    {isLoading && typingUsers.length === 0 && (
                                        <div className="flex items-center gap-4 text-[color:var(--lain-cyan)] mt-4 text-xs tracking-widest opacity-80 ml-2 animate-pulse">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-[color:var(--lain-cyan)] animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-[color:var(--lain-cyan)] animate-bounce delay-75"></div>
                                                <div className="w-1.5 h-1.5 bg-[color:var(--lain-cyan)] animate-bounce delay-150"></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span>{t('ui_incoming', settings.user.language)}</span>
                                                <button 
                                                    onClick={handleStopGeneration} 
                                                    className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-black px-2 py-0.5 text-[10px] uppercase font-bold transition-all ml-4"
                                                >
                                                    {t('app_abort', settings.user.language)}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="mt-4 pt-2 border-t border-[color:var(--lain-cyan)]/30 flex flex-col gap-2 shrink-0 relative bg-black/40 z-30">
                                    {replyingTo && (
                                        <div className="flex items-center justify-between bg-[color:var(--lain-cyan)]/10 border-l-2 border-[color:var(--lain-cyan)] p-2 text-xs mb-1">
                                            <div>
                                                <div className="font-bold text-[color:var(--lain-cyan)] mb-0.5">Replying to {replyingTo.speakerName || replyingTo.role}</div>
                                                <div className="truncate max-w-[300px]">{replyingTo.content}</div>
                                            </div>
                                            <button onClick={() => setReplyingTo(null)} className="hover:text-red-500"><X size={14} /></button>
                                        </div>
                                    )}

                                    {showQuickNote && (
                                        <div className="absolute bottom-full right-0 mb-2 w-64 h-48 bg-black/95 border border-[color:var(--lain-cyan)] z-50 p-2 flex flex-col animate-in slide-in-from-bottom-2 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                                            <div className="flex justify-between items-center mb-2 border-b border-[color:var(--lain-cyan)]/30 pb-1">
                                                <span className="text-[10px] font-bold tracking-widest text-yellow-400 uppercase flex items-center gap-2">
                                                    <StickyNote size={12}/> QUICK NOTE
                                                </span>
                                                <button onClick={() => setShowQuickNote(false)} className="hover:text-red-500"><X size={12}/></button>
                                            </div>
                                            <textarea 
                                                value={quickNote}
                                                onChange={(e) => setQuickNote(e.target.value)}
                                                className="flex-1 bg-transparent text-xs font-mono resize-none focus:outline-none placeholder-white/20 p-1"
                                                placeholder="Scribble notes here..."
                                                autoFocus
                                            />
                                        </div>
                                    )}

                                    {settings.generation.chatMode === 'rp' && (
                                        <div className="relative border border-[color:var(--lain-cyan)]/30 mb-1 bg-grid-pattern min-h-[4rem] flex flex-wrap items-center justify-between gap-2 px-2 py-1 overflow-visible group/toolbar transition-all duration-300">
                                            <div className="absolute inset-0 bg-black/90 z-0 pointer-events-none backdrop-blur-sm"></div>
                                            
                                            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-1 flex-1 min-w-[200px]">
                                                <button 
                                                    onClick={togglePerspective}
                                                    className="px-2 py-1 text-[8px] border border-[color:var(--lain-cyan)]/30 hover:border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors font-bold tracking-wider text-left bg-black truncate"
                                                    title="Switch Perspective"
                                                >
                                                    VIEW: {settings.generation.rpPerspective === '1st' ? "1ST (I)" : settings.generation.rpPerspective === '2nd' ? "2ND (YOU)" : settings.generation.rpPerspective === '3rd' ? "3RD (HE)" : "DM (GOD)"}
                                                </button>
                                                
                                                <button 
                                                    onClick={() => setSettings(s => ({...s, generation: {...s.generation, rpInnerMonologue: !s.generation.rpInnerMonologue}}))}
                                                    className={`px-2 py-1 text-[8px] border transition-colors font-bold tracking-wider text-left bg-black truncate ${settings.generation.rpInnerMonologue ? 'border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)] shadow-[0_0_5px_var(--lain-cyan)]' : 'border-[color:var(--lain-cyan)]/30 opacity-60 hover:opacity-100 hover:border-[color:var(--lain-cyan)]'}`}
                                                    title="Toggle Inner Monologue"
                                                >
                                                    THOUGHT: {settings.generation.rpInnerMonologue ? "ON" : "OFF"}
                                                </button>

                                                <button 
                                                    onClick={() => handleTriggerSystemAction("Describe the current visual scene in detail.")}
                                                    className="px-2 py-1 text-[8px] border border-[color:var(--lain-cyan)]/30 hover:border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors font-bold tracking-wider text-left bg-black flex items-center gap-1 truncate"
                                                    title="Describe Scene"
                                                >
                                                    <Scan size={8} /> SCENE
                                                </button>

                                                <button 
                                                    onClick={() => handleTriggerSystemAction("List current objectives or quests.")}
                                                    className="px-2 py-1 text-[8px] border border-[color:var(--lain-cyan)]/30 hover:border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors font-bold tracking-wider text-left bg-black flex items-center gap-1 truncate hover:bg-yellow-500/20 hover:border-yellow-500 hover:text-yellow-500"
                                                    title="Check Objectives"
                                                >
                                                    <Target size={8} /> QUEST
                                                </button>

                                                <button 
                                                    onClick={() => setIsOOC(!isOOC)}
                                                    className={`px-2 py-1 text-[8px] border transition-colors font-bold tracking-wider text-left bg-black truncate ${isOOC ? 'border-yellow-500 text-yellow-500 shadow-[0_0_5px_rgba(255,200,0,0.5)]' : 'border-[color:var(--lain-cyan)]/30 opacity-60 hover:opacity-100 hover:border-yellow-500 hover:text-yellow-500'}`}
                                                    title="Toggle Out Of Character Mode"
                                                >
                                                    OOC: {isOOC ? "ON" : "OFF"}
                                                </button>

                                                <button 
                                                    onClick={() => toggleWindow(WindowType.MEMORY)}
                                                    className="px-2 py-1 text-[8px] border border-[color:var(--lain-cyan)]/30 hover:border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors font-bold tracking-wider text-left bg-black flex items-center gap-1 truncate"
                                                    title="Memory Matrix"
                                                >
                                                    <Database size={8} /> MEMORY
                                                </button>

                                                <button 
                                                    onClick={() => handleTriggerSystemAction("Perform a search/investigation check for items or loot.")}
                                                    className="px-2 py-1 text-[8px] border border-[color:var(--lain-cyan)]/30 hover:border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors font-bold tracking-wider text-left bg-black flex items-center gap-1 truncate"
                                                    title="Search/Loot"
                                                >
                                                    <Box size={8} /> LOOT
                                                </button>

                                                <button 
                                                    onClick={() => toggleWindow(WindowType.RP_STATUS)}
                                                    className="px-2 py-1 text-[8px] border border-[color:var(--lain-cyan)]/30 hover:border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors font-bold tracking-wider text-left bg-black flex items-center gap-1 truncate"
                                                    title="Status Screen"
                                                >
                                                    <User size={8} /> STATUS
                                                </button>
                                            </div>

                                            <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden">
                                                <div className="relative opacity-20 hidden md:block">
                                                    <Hexagon size={48} strokeWidth={1} className="text-[color:var(--lain-cyan)] animate-spin-slow" />
                                                </div>
                                            </div>

                                            <div className="relative z-10 flex gap-1 justify-end items-center shrink-0 ml-auto">
                                                {[
                                                    { type: WindowType.MAP, label: 'MAP', icon: MapIcon },
                                                    { type: WindowType.WORLD_NEWS, label: 'WORLD', icon: Globe },
                                                    { type: 'dice', label: 'DICE', icon: Dna, action: () => { setShowDiceRoller(!showDiceRoller); audio.playWindowSound(true); } },
                                                    { type: 'ai', label: 'AI', icon: BrainCircuit, action: handleGenerateActions, active: isGeneratingActions },
                                                    { type: 'note', label: 'NOTE', icon: StickyNote, action: () => { setShowQuickNote(!showQuickNote); audio.playClickSound(); }, active: showQuickNote },
                                                    { type: 'log', label: 'LOG', icon: Save, action: handleExportChat }
                                                ].map((btn, i) => (
                                                    <button 
                                                        key={i}
                                                        onClick={btn.action ? btn.action : () => toggleWindow(btn.type as WindowType)}
                                                        disabled={btn.active === undefined ? false : (btn.type === 'ai' ? isGeneratingActions : false)}
                                                        className={`w-10 h-10 border border-[color:var(--lain-cyan)]/30 hover:border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-all flex flex-col items-center justify-center gap-0.5 bg-black group/btn ${btn.active ? 'bg-[color:var(--lain-cyan)]/20 animate-pulse border-[color:var(--lain-cyan)]' : ''}`}
                                                        title={btn.label}
                                                    >
                                                        <btn.icon size={14} className={`group-hover/btn:scale-110 transition-transform ${btn.type === 'ai' && isGeneratingActions ? 'animate-spin' : ''}`}/>
                                                        <span className="text-[7px] font-bold">{btn.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            {showActionDrawer && (
                                                <div className="absolute bottom-full left-0 right-0 mb-1 bg-black/95 border border-[color:var(--lain-cyan)] z-[60] shadow-[0_0_30px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-4 p-4 min-h-[150px]">
                                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-[color:var(--lain-cyan)]/30">
                                                        <div className="flex items-center gap-2 text-[color:var(--lain-cyan)]">
                                                            <Target size={14} className="animate-pulse"/>
                                                            <span className="text-[10px] font-bold tracking-[0.2em]">TACTICAL_DECISION_MATRIX</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={fetchActions}
                                                                disabled={isGeneratingActions} 
                                                                className={`flex items-center gap-1 text-[9px] border border-[color:var(--lain-cyan)]/50 px-2 py-0.5 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors ${isGeneratingActions ? 'animate-pulse' : ''}`}
                                                            >
                                                                <RefreshCw size={10} className={isGeneratingActions ? 'animate-spin' : ''}/> REGENERATE
                                                            </button>
                                                            <button onClick={() => setShowActionDrawer(false)} className="hover:text-red-500 transition-colors ml-2">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    {quickActions.length === 0 && !isGeneratingActions && (
                                                        <div className="text-center py-8 text-xs opacity-50 italic animate-pulse">INITIATING SCAN...</div>
                                                    )}

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto scrollbar-thin p-1">
                                                        {quickActions.map((action, i) => (
                                                            <button 
                                                                key={i}
                                                                onClick={() => handleExecuteAction(action)}
                                                                className={`p-3 border text-left transition-all group relative overflow-hidden flex flex-col gap-2 h-full hover:scale-[1.02] active:scale-95 ${getActionColor(action.category)}`}
                                                            >
                                                                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[size:100%_4px] pointer-events-none opacity-20"></div>
                                                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                                
                                                                <div className="flex justify-between items-center w-full relative z-10 border-b border-current/20 pb-1">
                                                                    <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest">
                                                                        {getActionIcon(action.category)}
                                                                        {action.category || "GENERIC"}
                                                                    </div>
                                                                    <span className={`text-[8px] font-mono font-bold border border-current px-1.5 py-0.5 rounded-sm bg-black/40`}>
                                                                        DC{action.dc}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="font-bold text-xs leading-tight group-hover:text-glow mt-1 relative z-10">
                                                                    {action.label}
                                                                </div>
                                                                
                                                                <div className="text-[9px] opacity-70 mt-auto flex items-center gap-1 relative z-10 bg-black/20 p-1 rounded-sm">
                                                                    <span className="font-bold text-[color:var(--lain-cyan)]">[{String(action.attribute)}]</span>
                                                                    <span className="truncate ml-1">{action.consequence}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {attachments.length > 0 && (
                                        <div className="flex gap-2 px-2 overflow-x-auto">
                                            {attachments.map((src, i) => (
                                                <div key={i} className="relative group">
                                                    <img src={src} className="h-16 w-16 object-cover border border-[color:var(--lain-cyan)] opacity-70" />
                                                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {showEmoji && (
                                        <div className="absolute bottom-16 left-0 bg-black border border-[color:var(--lain-cyan)] p-2 grid grid-cols-10 gap-1 z-50 animate-in slide-in-from-bottom-2 w-64 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                                            {EMOJI_GRID.map(char => <button key={char} onClick={() => setInput(prev => prev + char)} className="hover:bg-[color:var(--lain-cyan)] hover:text-black text-center text-sm p-1 transition-colors">{char}</button>)}
                                        </div>
                                    )}

                                    <div className="flex gap-2 items-end">
                                        <span className={`text-[color:var(--lain-cyan)] py-2 pl-2 select-none animate-pulse ${isOOC ? 'text-yellow-500' : ''}`}>{isOOC ? 'OOC>' : '>'}</span>
                                        <div className="flex gap-2 pb-2">
                                            <button onClick={() => setShowEmoji(!showEmoji)} className="text-[color:var(--lain-cyan)]/50 hover:text-[color:var(--lain-cyan)] p-1 transition-colors"><Smile size={18} /></button>
                                            <button onClick={() => attachmentInputRef.current?.click()} className="text-[color:var(--lain-cyan)]/50 hover:text-[color:var(--lain-cyan)] p-1 transition-colors"><Paperclip size={18} /></button>
                                            {settings.modules?.transcription && (
                                                <button 
                                                    onClick={toggleRecording} 
                                                    className={`p-1 transition-all ${isRecording ? 'text-red-500 animate-pulse border border-red-500 bg-red-900/20' : 'text-[color:var(--lain-cyan)]/50 hover:text-[color:var(--lain-cyan)]'}`}
                                                    title={isRecording ? "Stop Recording" : "Dictate Message"}
                                                >
                                                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                                                </button>
                                            )}
                                            <input type="file" ref={attachmentInputRef} onChange={handleAttachment} className="hidden" accept="image/*" multiple />
                                        </div>
                                        <textarea
                                            value={input}
                                            onChange={(e) => { setInput(e.target.value); audio.playUserTyping(); }}
                                            onKeyDown={handleKeyDown}
                                            disabled={isLoading}
                                            placeholder={isRecording ? t('app_recording', settings.user.language) : (isLoading ? t('ui_processing', settings.user.language) : (isOOC ? "ENTER OOC COMMENT..." : t('ui_cmd', settings.user.language)))}
                                            className={`flex-1 bg-transparent border-none outline-none text-[color:var(--lain-cyan)] resize-none font-['Share_Tech_Mono'] h-12 py-2 focus:ring-0 text-base sm:text-lg placeholder-[color:var(--lain-cyan)]/30 ${isOOC ? 'text-yellow-100 placeholder-yellow-500/30' : ''}`}
                                        />
                                        
                                        <button 
                                            onClick={handleContinue}
                                            disabled={isLoading}
                                            className="h-10 px-2 text-[color:var(--lain-cyan)]/50 hover:text-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)]/10 transition-colors disabled:opacity-30"
                                            title="Continue (Force AI to generate)"
                                        >
                                            <Play size={16} fill="currentColor" />
                                        </button>

                                        {isLoading ? (
                                            <button onClick={handleStopGeneration} className="h-10 px-4 border border-[color:var(--lain-red)] bg-[color:var(--lain-red)]/10 text-[color:var(--lain-red)] font-bold hover:bg-[color:var(--lain-red)] hover:text-white uppercase tracking-wider transition-colors"><Square size={16} fill="currentColor" /></button>
                                        ) : (
                                            <button onClick={handleSend} disabled={(!input.trim() && attachments.length === 0)} className="h-10 px-6 border border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/10 text-[color:var(--lain-cyan)] font-bold hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors disabled:opacity-50 uppercase tracking-widest win98-bevel active:win98-bevel-pressed"><Send size={16} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </NaviWindow>
                    </div>
                )}

                {showDiceRoller && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 h-96 z-[60]">
                        <DiceRoller 
                            onRollComplete={(res) => setInput(prev => `${prev} ${res}`)}
                            onClose={() => setShowDiceRoller(false)}
                            isMinimized={false}
                            isMaximized={false}
                            onMinimize={() => {}}
                            onMaximize={() => {}}
                            userStats={currentSession.userRPStats} 
                            language={settings.user.language}
                        />
                    </div>
                )}

                {(!windows[WindowType.VIDEO].closed || !windows[WindowType.CONSOLE].closed) && (
                    <div className="flex flex-col w-full lg:w-80 gap-4 shrink-0 h-auto lg:h-full">
                         {!windows[WindowType.VIDEO].closed && activePersona && (
                             <div className={`flex-none ${windows[WindowType.VIDEO].minimized ? 'h-auto' : 'h-64'}`} style={{ zIndex: zIndices[WindowType.VIDEO] }}>
                                <NaviWindow 
                                    title={t('nav_visual', settings.user.language)} 
                                    className="h-full" 
                                    isMinimized={windows[WindowType.VIDEO].minimized} 
                                    isMaximized={windows[WindowType.VIDEO].maximized} 
                                    onMinimize={() => updateWindowState(WindowType.VIDEO, { minimized: !windows[WindowType.VIDEO].minimized })} 
                                    onMaximize={() => updateWindowState(WindowType.VIDEO, { maximized: !windows[WindowType.VIDEO].maximized })} 
                                    onClose={() => updateWindowState(WindowType.VIDEO, { closed: true })}
                                    onFocus={() => bringToFront(WindowType.VIDEO)}
                                >
                                    <VisualFeed 
                                        activePersona={activePersona} 
                                        onUpdatePersona={handleUpdatePersona} 
                                        messages={messages} 
                                        apiKey={settings.api.apiKey || process.env.API_KEY || ''} 
                                        opacity={settings.ui.visualFeedOpacity ?? 0.6} 
                                        setOpacity={(val) => setSettings(s => ({...s, ui: {...s.ui, visualFeedOpacity: val}}))} 
                                        settings={settings}
                                        onUpdateSettings={setSettings} 
                                    />
                                </NaviWindow>
                             </div>
                         )}
                         {!windows[WindowType.CONSOLE].closed && (
                             <div className="flex-1 min-h-[200px] h-64 lg:h-auto" style={{ zIndex: zIndices[WindowType.CONSOLE] }}>
                                <NaviWindow 
                                    title={t('nav_system', settings.user.language)} 
                                    className="h-full" 
                                    isMinimized={windows[WindowType.CONSOLE].minimized} 
                                    isMaximized={windows[WindowType.CONSOLE].maximized} 
                                    onMinimize={() => updateWindowState(WindowType.CONSOLE, { minimized: !windows[WindowType.CONSOLE].minimized })} 
                                    onMaximize={() => updateWindowState(WindowType.CONSOLE, { maximized: !windows[WindowType.CONSOLE].maximized })} 
                                    onClose={() => updateWindowState(WindowType.CONSOLE, { closed: true })} 
                                    onFocus={() => bringToFront(WindowType.CONSOLE)}
                                    headerControls={<div className="flex items-center gap-2"><button onClick={() => setSettings(s => ({...s, sound: {...s.sound, ttsEnabled: !s.sound.ttsEnabled}}))} className={`transition-all hover:text-white ${settings.sound.ttsEnabled ? 'opacity-100 text-[color:var(--lain-cyan)] drop-shadow-[0_0_2px_rgba(0,240,255,0.8)]' : 'opacity-40 hover:opacity-80'}`} title="Toggle Voice Synthesis (TTS)"><Speech size={12} /></button><div className="w-px h-3 bg-[color:var(--lain-cyan)]/30 mx-1"></div><button onClick={() => setSettings(s => ({...s, sound: {...s.sound, enabled: !s.sound.enabled}}))} className="hover:text-white transition-opacity hover:opacity-100 opacity-60">{settings.sound.enabled ? <Volume2 size={12} /> : <VolumeX size={12} />}</button></div>}
                                >
                                    <div className="flex flex-col h-full bg-black relative min-h-0 border border-[color:var(--lain-cyan)]/20">
                                        <div className="h-16 shrink-0 border-b border-[color:var(--lain-cyan)]/30 mb-1 bg-black/50"><AudioVisualizer /></div>
                                        <div className="flex-1 overflow-hidden relative min-h-0"><SystemConsole language={settings.user.language} /></div>
                                    </div>
                                </NaviWindow>
                             </div>
                         )}
                    </div>
                )}
            </main>
            
            <footer className="h-10 border-t-2 border-[color:var(--lain-cyan)] bg-black/90 text-[color:var(--lain-cyan)] flex items-center justify-between px-3 text-[10px] font-['Share_Tech_Mono'] uppercase select-none shrink-0 z-40 relative shadow-[0_-5px_15px_rgba(0,240,255,0.1)]">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.05)_1px,transparent_1px)] bg-[size:100%_3px] pointer-events-none"></div>
                <div className="flex items-center gap-6 h-full z-10">
                    <div className="flex items-center gap-2 px-2 py-0.5 border border-[color:var(--lain-cyan)]/30 bg-black/50">
                        <div className="w-2 h-2 rounded-full bg-[color:var(--lain-cyan)] shadow-[0_0_5px_var(--lain-cyan)] animate-pulse"></div>
                        <span className="tracking-widest font-bold">
                            {t('ui_link', settings.user.language)} {linkStatus.toUpperCase()}
                        </span>
                    </div>
                    <button onClick={() => openProfile(settings.user)} className="opacity-70 flex items-center gap-2 hover:opacity-100 hover:text-white transition-all cursor-pointer">
                        <Disc size={10} className="animate-[spin_4s_linear_infinite]" /> ID: {settings.user.username}
                    </button>
                </div>
                <div className="flex items-center gap-4 h-full z-10">
                    <div className="flex items-center gap-2 opacity-60"><HardDrive size={10} /><span>{Math.round(messages.length * 0.5)}KB</span></div>
                    <SystemClock settings={settings} onUpdateSettings={setSettings} onWeatherUpdate={setCurrentWeather} />
                </div>
            </footer>

            {shareModalOpen && shareCandidate && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <NaviWindow title={`SHARE ${('username' in shareCandidate ? shareCandidate.username : shareCandidate.name).toUpperCase()} TO...`} className="w-80 max-h-[80vh]" onClose={() => setShareModalOpen(false)}>
                        <div className="flex flex-col h-full bg-black/90 p-4 gap-2 overflow-y-auto">
                            <div className="text-[10px] opacity-60 uppercase tracking-widest mb-2 border-b border-[color:var(--lain-cyan)]/30 pb-1">Select Network Node</div>
                            {settings.characterLibrary.filter(p => p.id !== settings.activeTargetId && p.id !== (shareCandidate as PersonaSettings).id).map(p => (
                                <button key={p.id} onClick={() => handleShareToTarget(p.id)} className="flex items-center gap-3 p-3 border border-[color:var(--lain-cyan)]/30 hover:bg-[color:var(--lain-cyan)]/10 hover:border-[color:var(--lain-cyan)] hover:text-white transition-all text-left group">
                                    <div className="w-8 h-8 bg-black border border-[color:var(--lain-cyan)] overflow-hidden shrink-0">
                                        {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <User size={16} className="m-auto opacity-50" />}
                                    </div>
                                    <div className="flex flex-col overflow-hidden"><span className="font-bold text-xs truncate group-hover:text-glow">{p.name}</span><span className="text-[9px] opacity-50 truncate">ID: {p.id.substring(0,6)}</span></div>
                                    <Share2 size={12} className="ml-auto opacity-0 group-hover:opacity-100" />
                                </button>
                            ))}
                            {settings.groups?.map(g => (
                                <button key={g.id} onClick={() => handleShareToTarget(g.id)} className="flex items-center gap-3 p-3 border border-[color:var(--lain-cyan)]/30 hover:bg-[color:var(--lain-cyan)]/10 hover:border-[color:var(--lain-cyan)] hover:text-white transition-all text-left group">
                                    <div className="w-8 h-8 bg-black border border-[color:var(--lain-cyan)] flex items-center justify-center shrink-0"><User size={16} className="opacity-50" /></div>
                                    <div className="flex flex-col overflow-hidden"><span className="font-bold text-xs truncate group-hover:text-glow">{g.name}</span><span className="text-[9px] opacity-50 truncate">{g.members.length} Members</span></div>
                                    <Share2 size={12} className="ml-auto opacity-0 group-hover:opacity-100" />
                                </button>
                            ))}
                            <button onClick={() => setShareModalOpen(false)} className="mt-2 py-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white text-xs uppercase tracking-widest">Cancel Transmission</button>
                        </div>
                    </NaviWindow>
                </div>
            )}

            {showNewChatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-96 max-w-[90vw]">
                        <NaviWindow title={t('app_confirm_op', settings.user.language)} onClose={() => setShowNewChatModal(false)}>
                            <div className="bg-[#050505] p-6 flex flex-col gap-4 text-xs font-['Share_Tech_Mono'] text-[color:var(--lain-cyan)] border border-[color:var(--lain-cyan)]/20">
                                <div className="font-bold text-lg tracking-wider text-glow text-center mb-2">{t('ui_new_session', settings.user.language)}</div>
                                <input type="text" value={newSessionName} onChange={(e) => setNewSessionName(e.target.value)} placeholder="SESSION_ID..." className="bg-black border border-[color:var(--lain-cyan)] p-3 text-white focus:outline-none focus:bg-[#111] font-xl win98-bevel-pressed placeholder-[color:var(--lain-cyan)]/30" autoFocus />
                                <div className="flex flex-col gap-2 mt-4">
                                    <button onClick={() => confirmNewChat(true)} className="py-3 bg-[color:var(--lain-red)]/10 border border-[color:var(--lain-red)] text-[color:var(--lain-red)] hover:bg-[color:var(--lain-red)] hover:text-white font-bold transition-all win98-bevel active:win98-bevel-pressed">{t('app_flush', settings.user.language)}</button>
                                    <button onClick={() => confirmNewChat(false)} className="py-3 bg-[color:var(--lain-cyan)]/10 border border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black font-bold transition-all win98-bevel active:win98-bevel-pressed">{t('app_archive', settings.user.language)}</button>
                                    <button onClick={() => setShowNewChatModal(false)} className="py-2 border border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white mt-2 win98-bevel active:win98-bevel-pressed">{t('app_abort_op', settings.user.language)}</button>
                                </div>
                            </div>
                        </NaviWindow>
                    </div>
                </div>
            )}

            {!windows[WindowType.SETTINGS].closed && (
                <SettingsWindow settings={settings} onUpdateSettings={setSettings} lorebook={lorebook} onUpdateLore={setLorebook} onClose={() => updateWindowState(WindowType.SETTINGS, { closed: true })} onExport={handleExportChat} onDeleteChat={handleDeleteChat} />
            )}
        </div>
    );
}

export default App;
