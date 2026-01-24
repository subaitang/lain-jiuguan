
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
    personality?: string;
    likes?: string;
    dislikes?: string;
    relationships?: string;
    notes?: string; 
    allowEmoji?: boolean;
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

// Added missing ActionCategory and QuickReplyOption
export type ActionCategory = 'combat' | 'social' | 'exploration' | 'tech' | 'stealth' | 'generic';

export interface QuickReplyOption {
    label: string;
    category?: ActionCategory;
    attribute?: keyof RPAttributes;
    dc?: number;
    consequence?: string;
}

// Added missing RPDate
export interface RPDate {
    year: number;
    month: number;
    day: number;
    dayCount: number;
    timeOfDay: 'Morning' | 'Noon' | 'Evening' | 'Night';
}

// Added missing WorldEvent
export interface WorldEvent {
    id: string;
    dayCount: number;
    date: string;
    headline: string;
    content: string;
    type: string;
}

// Added missing WeatherData
export interface WeatherData {
    temp: number;
    condition: string;
    location: string;
    city?: string;
    icon: 'sun' | 'cloud' | 'rain' | 'snow' | 'storm' | 'mist';
    forecast?: Array<{
        date: string;
        temp?: number;
        minTemp?: number;
        maxTemp?: number;
        condition: string;
        icon: WeatherData['icon'];
    }>;
}

// Added missing SocialComment and SocialPost
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

// Added missing CalendarNote and CalendarEvent
export interface CalendarNote {
    id: string;
    date: string;
    content: string;
    type: 'memo' | 'event' | 'holiday';
}

export interface CalendarEvent {
    id: string;
    title: string;
    date: string;
}

// Added missing MapData
export interface MapData {
    biome: string;
    grid: string[][];
}

// Added missing MemoryLayers
export interface MemoryLayers {
    layer1: string;
    layer2: string;
    layer3: string;
}

// Added missing MusicTrack
export interface MusicTrack {
    id: string;
    title: string;
    artist: string;
    url: string;
    platform: 'spotify' | 'netease' | 'qq' | 'apple' | 'youtube' | 'soundcloud' | 'local' | 'web';
    addedBy: 'user' | 'ai';
}

export interface AppSettings {
    user: UserSettings;
    api: ApiSettings;
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
    };
    activeTargetId: string;
    characterLibrary: PersonaSettings[];
    groups: GroupSettings[];
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
        visualAssets?: VisualAsset[];
        visualMode?: 'static' | 'cycle' | 'context';
    };
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
    // Added SocialPost type
    socialPosts: SocialPost[];
    // Added CalendarNote type
    calendarNotes: CalendarNote[];
    extensions: any[];
    translation?: ApiSettings;
    memoryApi?: ApiSettings;
    personaConfig?: ApiSettings;
    // Added missing music property
    music?: {
        enabled: boolean;
        mode: 'manual' | 'ai';
        volume: number;
        playlist: MusicTrack[];
        isPlaying: boolean;
        currentTrackId?: string;
    };
    moduleConfigs?: Record<string, any>;
}

export interface VisualAsset {
    id: string;
    url: string;
    type: 'image' | 'video';
    keywords: string;
    active: boolean;
    name?: string;
    position?: string;
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
    // Added missing fields used in RPStatusViewer
    alignment?: string;
    statusEffects?: string[];
    limitGauge?: number;
}

export interface ChatSession {
    id: string;
    targetId: string;
    type: 'persona' | 'group';
    title: string;
    messages: Message[];
    rpMessages?: Message[];
    msgMessages?: Message[];
    summaries: string[];
    dataTable: string;
    affection: number;
    stress: number;
    energy: number;
    currentMood: string;
    lastModified: number;
    npcRegistry?: Record<string, RPStats>;
    userRPStats?: RPStats;
    charRPStats?: RPStats;
    // Added missing properties
    rpDate?: RPDate;
    rpWorldContext?: string;
    mapData?: MapData;
    userPos?: { x: number, y: number };
    charPos?: { x: number, y: number };
    memoryLayers?: MemoryLayers;
    worldEvents?: WorldEvent[];
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
    MUSIC = 'MUSIC'
}
