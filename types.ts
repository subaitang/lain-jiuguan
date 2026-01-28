
export type Language = 'en' | 'zh' | 'jp';

export interface Message {
    id: string;
    role: 'user' | 'model' | 'system';
    content: string;
    speakerName?: string;
    timestamp: string;
    attachments?: string[];
    excludeFromContext?: boolean;
    translation?: string;
    thought?: string;
    metadataRaw?: string;
    systemPromptUsed?: string;
    metadata?: any;
    replyTo?: {
        id: string;
        speakerName?: string;
        content: string;
    };
    swipes?: string[];
    swipeIndex?: number;
}

export interface LoreEntry {
    id: string;
    keywords: string;
    content: string;
    active: boolean;
    linkedPersonaIds?: string[]; // New: Bind specific lore to specific characters
}

export interface VisitorRecord {
    id: string;
    timestamp: number;
}

export interface PersonaSettings {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    nativeLanguage: string;
    avatar?: string;
    banner?: string;
    chatWallpaper?: string;
    age?: string;
    gender?: string;
    region?: string;
    friendsCount?: number;
    followersCount?: number;
    visitCount?: number;
    visitors?: VisitorRecord[];
    writingStyle?: string;
    scenario?: string;
    exampleDialogue?: string;
    useRandomOpening?: boolean;
    customOpening?: string;
    ipAddress?: string;
    visualImage?: string;
    birthday?: string;
    // New fields for SillyTavern/AIRP style cards
    personality?: string;
    likes?: string;
    dislikes?: string;
    relationships?: string;
    notes?: string; // Author's notes
    allowEmoji?: boolean; // NEW: Control if the persona can use emojis
}

export interface UserSettings {
    username: string;
    gender: string;
    language: Language;
    description?: string;
    region?: string;
    avatar?: string;
    banner?: string;
    birthday?: string;
    age?: string;
    ipAddress?: string;
    visitCount?: number;
    visitors?: VisitorRecord[];
    honorific?: string;
}

export interface ApiSettings {
    source: 'google' | 'custom';
    apiKey?: string;
    baseUrl?: string;
    modelName?: string;
    translationMode?: 'literal' | 'interpretive';
}

export interface GroupSettings {
    id: string;
    name: string;
    members: string[];
    description: string;
    mode: 'msg' | 'rp';
}

export interface SocialComment {
    id: string;
    userId: string;
    content: string;
    timestamp: number;
}

export interface StrangerData {
    name: string;
    handle: string;
    prompt: string;
}

export interface SocialPost {
    id: string;
    personaId: string;
    content: string;
    timestamp: number;
    likes: number;
    likedBy: string[];
    comments: SocialComment[];
    image?: string;
    strangerData?: StrangerData;
}

export interface CalendarNote {
    id: string;
    date: string;
    content: string;
    type: 'memo' | 'event';
}

export interface CalendarEvent {
    id: string;
    date: string;
    title: string;
}

export interface CustomExtension {
    id: string;
    name: string;
    content: string;
    active: boolean;
    position: 'system' | 'user_pre';
}

export interface ModuleConfig {
    apiKey?: string;
    enabled?: boolean;
}

export interface VisualAsset {
    id: string;
    url: string;
    type: 'image' | 'video';
    keywords: string; // Comma separated keywords for context matching
    active: boolean; // Is active for cycling
    name?: string;
    position?: string; // CSS object-position (e.g. 'center', 'top', 'bottom right')
}

export interface MusicTrack {
    id: string;
    title: string;
    artist: string;
    url: string;
    duration?: number;
    platform?: 'local' | 'web' | 'spotify' | 'netease' | 'qq' | 'apple' | 'youtube' | 'soundcloud';
    addedBy: 'user' | 'ai';
}

export interface AppSettings {
    user: UserSettings;
    api: ApiSettings;
    mapApi?: ApiSettings; // Dedicated API for Map Generation
    generation: {
        maxContextLength: number;
        maxOutputTokens: number;
        streaming: boolean;
        temperature: number;
        frequencyPenalty: number;
        presencePenalty: number;
        topP: number;
        seed: number;
        includeActions: boolean;
        chatMode: 'msg' | 'rp';
        rpPerspective?: '1st' | '2nd' | '3rd' | 'DM';
        rpInnerMonologue?: boolean;
        thinking?: { enabled: boolean; budget: number };
        logitBias?: Record<string, number>;
    };
    activeTargetId: string;
    characterLibrary: PersonaSettings[];
    groups: GroupSettings[];
    socialPosts: SocialPost[];
    calendarNotes: CalendarNote[];
    extensions: CustomExtension[];
    modules: {
        search: boolean;
        maps: boolean;
        thinking: boolean;
        veo: boolean;
        imageGen: boolean;
        imageEdit: boolean;
        speech: boolean;
        transcription: boolean;
        analysis: boolean;
        live: boolean;
        autonomous: boolean;
    };
    moduleConfigs?: Record<string, ModuleConfig>;
    translation?: ApiSettings;
    memoryApi?: ApiSettings;
    personaConfig?: ApiSettings;
    sound: {
        enabled: boolean;
        volume: number;
        ttsEnabled: boolean;
        ttsVoice?: string;
        ttsSpeed?: number;
        ttsPitch?: number;
    };
    ui: {
        autoScroll: boolean;
        fontSize: 'sm' | 'base' | 'lg' | 'xl';
        wallpaper?: string;
        wallpaperOpacity: number;
        chatWallpaper?: string;
        chatWallpaperOpacity: number;
        visualFeedOpacity?: number;
        cursorSize?: number;
        customCursors?: Record<string, string>;
        // New Visual Asset Manager Props
        visualAssets?: VisualAsset[];
        visualMode?: 'static' | 'cycle' | 'context';
        visualCycleInterval?: number; // in seconds
    };
    // NEW: Music Player Settings
    music?: {
        enabled: boolean;
        mode: 'manual' | 'ai';
        volume: number;
        playlist: MusicTrack[];
        currentTrackId?: string;
        isPlaying: boolean;
    };
}

export interface RPAttributes {
    STR: number;
    DEX: number;
    CON: number;
    INT: number;
    WIS: number;
    CHA: number;
}

export interface RPStats {
    name?: string;
    race?: string;
    level: number;
    xp: number;
    maxXp: number;
    hp: { current: number; max: number };
    mp: { current: number; max: number };
    attributes: RPAttributes;
    inventory: string[];
    equipment: string[];
    gender?: string;
    skills: string[];
    gold: number;
    class: string;
    affection?: number;
    // New Fields for RP
    alignment?: string;
    statusEffects?: string[];
    limitGauge?: number; // 0-100
    traits?: string[];
}

export interface RPDate {
    year: number;
    month: number;
    day: number;
    dayCount: number;
    timeOfDay: 'Morning' | 'Noon' | 'Evening' | 'Night';
}

export interface WorldEvent {
    id: string;
    dayCount: number;
    date: string;
    headline: string;
    content: string;
    type: 'political' | 'environmental' | 'technological' | 'mystical';
}

export interface MapTile {
    x: number;
    y: number;
    type: 'wall' | 'floor' | 'open' | 'obstacle' | 'hazard' | 'point_of_interest' | 'player' | 'npc';
    symbol?: string; // fallback char
    description?: string;
    icon?: string; // lucide icon name
}

export interface MapData {
    grid?: string[][]; // Legacy support
    tiles?: MapTile[]; // New structure
    width: number;
    height: number;
    biome?: string;
    difficulty?: number;
}

export interface MemoryLayers {
    layer1: string; // Raw Details / User Input
    layer2: string; // Short Summary / Episodic
    layer3: string; // Long Summary / Core Themes
}

export interface ChatSession {
    id: string;
    targetId: string;
    type: 'persona' | 'group';
    title: string;
    messages: Message[];
    rpMessages?: Message[];
    msgMessages?: Message[];
    summaries: string[]; // Legacy
    dataTable: string;   // Legacy
    memoryLayers?: MemoryLayers; // NEW: Tiered Memory
    affection: number;
    stress: number;
    energy: number;
    currentMood: string;
    lastModified: number;
    worldEvents?: WorldEvent[];
    rpDate?: RPDate;
    userRPStats?: RPStats;
    charRPStats?: RPStats;
    rpWorldContext?: string;
    mapData?: MapData;
    userPos?: { x: number, y: number };
    charPos?: { x: number, y: number };
    npcRegistry?: Record<string, RPStats>;
}

export enum WindowType {
    CHAT = 'CHAT',
    VIDEO = 'VIDEO',
    CONSOLE = 'CONSOLE',
    FRIENDS = 'FRIENDS',
    SETTINGS = 'SETTINGS',
    SOCIAL = 'SOCIAL',
    MEMORY = 'MEMORY',
    PROFILE = 'PROFILE',
    RP_STATUS = 'RP_STATUS',
    WORLD_NEWS = 'WORLD_NEWS',
    THOUGHT_TRACE = 'THOUGHT_TRACE',
    MAP = 'MAP',
    MUSIC = 'MUSIC' // NEW
}

export interface WeatherData {
    location: string;
    temp: number;
    condition: string;
    icon: 'sun' | 'cloud' | 'rain' | 'snow' | 'storm' | 'mist';
    city?: string;
    forecast?: { date: string, maxTemp: number, minTemp: number, condition: string, icon: any }[];
}

export type ActionCategory = 'combat' | 'social' | 'exploration' | 'tech' | 'stealth';

export interface QuickReplyOption {
    label: string;
    attribute?: string;
    dc?: number;
    consequence?: string;
    category?: ActionCategory;
}
