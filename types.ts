export type Language = "en" | "zh" | "jp";

export interface Message {
  id: string;
  role: "user" | "model" | "system";
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
    visualPosition?: string; // NEW: CSS object-position
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
  source: "google" | "custom";
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
  translationMode?: "literal" | "interpretive";
}

export interface GroupSettings {
  id: string;
  name: string;
  members: string[];
  description: string;
  mode: "msg" | "rp";
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
  type: "memo" | "event";
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
  position: "system" | "user_pre";
}

export interface ModuleConfig {
  apiKey?: string;
  enabled?: boolean;
}

export interface VisualAsset {
  id: string;
  url: string;
  type: "image" | "video";
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
  platform?:
    | "local"
    | "web"
    | "spotify"
    | "netease"
    | "qq"
    | "apple"
    | "youtube"
    | "soundcloud";
  addedBy: "user" | "ai";
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
    chatMode: "msg" | "rp";
    rpPerspective?: "1st" | "2nd" | "3rd" | "DM";
    rpInnerMonologue?: boolean;
    forceJson?: boolean; // NEW: Enforce State Engine execution
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
  mapsApi?: ApiSettings; // NEW: Dedicated Map API
  variableApi?: ApiSettings; // NEW: Dedicated Variable API
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
    fontSize: "sm" | "base" | "lg" | "xl";
    wallpaper?: string;
    wallpaperOpacity: number;
    chatWallpaper?: string;
    chatWallpaperOpacity: number;
    visualFeedOpacity?: number;
    cursorSize?: number;
    customCursors?: Record<string, string>;
    // New Visual Asset Manager Props
    visualAssets?: VisualAsset[];
    visualMode?: "static" | "cycle" | "context";
    visualCycleInterval?: number; // in seconds
    fontFamily?: string; // NEW: Custom Font
  };
  // NEW: Music Player Settings
  music?: {
    enabled: boolean;
    mode: "manual" | "ai";
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
  inventory: Item[];
  equipment: Item[];
  gender?: string;
  skills: string[];
  gold: number;
  class: string;
  affection?: number;
  // New Fields for RP
  alignment?: string;
  statusEffects?: StatusEffect[];
  limitGauge?: number; // 0-100
  traits?: string[];
  quests?: Quest[]; // NEW: Quest tracking
}

export interface Item {
  id: string;
  name: string;
  type: "weapon" | "armor" | "consumable" | "key" | "misc";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  description?: string;
  effect?: string;
  quantity?: number;
  attributes?: Record<string, number>; // e.g. { STR: 1, DEF: 5 }
}

export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  type: "buff" | "debuff";
  duration: string; // e.g. "3 turns", "1 hour"
  source?: string;
  effect?: string; // e.g. "+2 STR", "1d4 DMG per turn"
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "failed";
  objectives: { id: string; text: string; completed: boolean }[];
}

export interface RPDate {
  year: number;
  month: number;
  day: number;
  dayCount: number;
  timeOfDay: "Morning" | "Noon" | "Evening" | "Night";
}

export interface WorldEvent {
  id: string;
  dayCount: number;
  date: string;
  headline: string;
  content: string;
  type: "political" | "environmental" | "technological" | "mystical";
}

export interface MapNode {
  x: number;
  y: number;
  type: "room" | "corridor" | "loot" | "enemy" | "entrance" | "exit" | "poi";
  description?: string;
  eventId?: string;
  icon?: string;
}

export interface MapData {
  grid: string[][];
  width: number;
  height: number;
  biome?: string;
  nodes?: MapNode[]; // Rich interaction points
  legend?: Record<string, string>;
}

export interface MemoryLayers {
  layer1: string; // Raw Details / User Input
  layer2: string; // Short Summary / Episodic
  layer3: string; // Long Summary / Core Themes
}

export interface CombatState {
  active: boolean;
  turn: number;
  participants: {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    isPlayer: boolean;
    initiative: number;
  }[];
  log: string[];
}

export interface ChatSession {
  id: string;
  targetId: string;
  type: "persona" | "group";
  title: string;
  messages: Message[];
  rpMessages?: Message[];
  msgMessages?: Message[];
  summaries: string[]; // Legacy
  dataTable: string; // Legacy
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
  combatState?: CombatState; // NEW: Combat System
  userPos?: { x: number; y: number };
  charPos?: { x: number; y: number };
  npcRegistry?: Record<string, RPStats>;
}

export enum WindowType {
  CHAT = "CHAT",
  VIDEO = "VIDEO",
  CONSOLE = "CONSOLE",
  FRIENDS = "FRIENDS",
  SETTINGS = "SETTINGS",
  SOCIAL = "SOCIAL",
  MEMORY = "MEMORY",
  PROFILE = "PROFILE",
  RP_STATUS = "RP_STATUS",
  WORLD_NEWS = "WORLD_NEWS",
  THOUGHT_TRACE = "THOUGHT_TRACE",
  MAP = "MAP",
  MUSIC = "MUSIC",
  QUESTS = "QUESTS", // NEW
  COMBAT = "COMBAT",
}

export interface WeatherData {
  location: string;
  temp: number;
  condition: string;
  icon: "sun" | "cloud" | "rain" | "snow" | "storm" | "mist";
  city?: string;
  forecast?: {
    date: string;
    maxTemp: number;
    minTemp: number;
    condition: string;
    icon: any;
  }[];
}

export type ActionCategory =
  | "combat"
  | "social"
  | "exploration"
  | "tech"
  | "stealth";

export interface QuickReplyOption {
  label: string;
  attribute?: string;
  dc?: number;
  consequence?: string;
  category?: ActionCategory;
}
