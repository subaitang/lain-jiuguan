
import React, { useState, useEffect, useRef } from 'react';
import { NaviWindow } from './NaviWindow';
import { RPStats, AppSettings, Message } from '../types';
import { User, Activity, Shield, Zap, Backpack, Book, Star, Dna, Edit2, Save, RefreshCw, X, Loader2, Sparkles, Scale, Heart, Shuffle, Search, Target, Users, ChevronDown } from 'lucide-react';
import { generateRandomUserStats, generateUserStatsFromInput } from '../services/geminiService';
import { audio } from '../services/audioEngine';
import { t } from '../utils/translations';

interface RPStatusViewerProps {
    userStats: RPStats;
    charStats: RPStats;
    npcRegistry: Record<string, RPStats>;
    userName: string;
    charName: string;
    onClose: () => void;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
    settings: AppSettings;
    onUpdateUserStats: (stats: RPStats) => void;
    onUpdateNpcRegistry: (registry: Record<string, RPStats>) => void;
    messages: Message[];
}

const StatBar = ({ label, current, max, color, icon }: { label: string, current: number, max: number, color: string, icon?: React.ReactNode }) => (
    <div className="flex items-center gap-2 text-[10px] w-full">
        <span className="w-8 font-bold flex items-center gap-1">{icon}{label}</span>
        <div className="flex-1 h-2 bg-gray-800 border border-gray-600 relative overflow-hidden">
            <div 
                className={`h-full absolute top-0 left-0 transition-all duration-500 ${color}`} 
                style={{ width: `${Math.min(100, (current / max) * 100)}%` }} 
            />
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] w-full opacity-30"></div>
        </div>
        <span className="w-12 text-right font-mono">{current}/{max}</span>
    </div>
);

export const RPStatusViewer: React.FC<RPStatusViewerProps> = ({
    userStats, charStats, npcRegistry, userName, charName,
    onClose, isMinimized, isMaximized, onMinimize, onMaximize,
    settings, onUpdateUserStats, onUpdateNpcRegistry
}) => {
    const [activeTab, setActiveTab] = useState<'user' | 'npc'>('user');
    const [selectedNpcId, setSelectedNpcId] = useState<string>('active');
    const [isEditing, setIsEditing] = useState(false);
    const [tempStats, setTempStats] = useState<RPStats | null>(null);
    
    // Generation states
    const [isGenerating, setIsGenerating] = useState(false);
    const [keyword, setKeyword] = useState('');
    const abortControllerRef = useRef<AbortController | null>(null);

    // Determine which stats to show based on tab and selection
    const getDisplayedStats = () => {
        if (activeTab === 'user') return userStats;
        if (selectedNpcId === 'active') return charStats;
        return npcRegistry[selectedNpcId] || charStats;
    };

    const currentStats = getDisplayedStats();
    const currentName = activeTab === 'user' ? userName : (selectedNpcId === 'active' ? charName : currentStats.name || "Unknown");
    const lang = settings.user.language;
    const targetLangName = lang === 'zh' ? 'Chinese' : lang === 'jp' ? 'Japanese' : 'English';

    useEffect(() => {
        if (isEditing) setTempStats(currentStats);
    }, [isEditing, currentStats]);

    // Handle Saving Changes
    const handleSave = () => {
        if (!tempStats) return;

        if (activeTab === 'user') {
            onUpdateUserStats(tempStats);
        } else {
            if (selectedNpcId === 'active') {
                const updatedRegistry = { ...npcRegistry, [settings.activeTargetId]: tempStats };
                onUpdateNpcRegistry(updatedRegistry);
            } else {
                const updatedRegistry = { ...npcRegistry, [selectedNpcId]: tempStats };
                onUpdateNpcRegistry(updatedRegistry);
            }
        }
        setIsEditing(false);
        audio.playConfirmSound();
    };

    const cancelGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsGenerating(false);
        audio.playWindowSound(false);
    };

    const getApiConfig = () => {
        return (settings.personaConfig && settings.personaConfig.apiKey) ? settings.personaConfig : settings.api;
    };

    // --- GENERATION HANDLERS ---

    const handleGeneratePlayerRandom = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        audio.playLoadTick();
        
        abortControllerRef.current = new AbortController();
        const config = getApiConfig();

        try {
            const worldInfo = "Cyberpunk/Fantasy World" + (settings.ui.wallpaper ? " with visual context" : "");
            const stats = await generateRandomUserStats(config, abortControllerRef.current.signal, worldInfo, targetLangName);
            if (stats && !abortControllerRef.current.signal.aborted) {
                onUpdateUserStats(stats);
                audio.playLevelUpSound();
            }
        } catch(e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    };

    const handleGeneratePlayerKeyword = async () => {
        if (isGenerating || !keyword.trim()) return;
        setIsGenerating(true);
        audio.playLoadTick();
        
        abortControllerRef.current = new AbortController();
        const config = getApiConfig();

        try {
            const stats = await generateUserStatsFromInput(keyword, config, abortControllerRef.current.signal, targetLangName);
            if (stats && !abortControllerRef.current.signal.aborted) {
                onUpdateUserStats(stats);
                audio.playLevelUpSound();
                setKeyword('');
            }
        } catch(e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    };

    const handleGenerateTarget = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        audio.playLoadTick();
        
        abortControllerRef.current = new AbortController();
        const config = getApiConfig();
        
        const activePersona = settings.characterLibrary.find(p => p.id === settings.activeTargetId);
        
        let promptDescription = "";
        if (selectedNpcId === 'active' && activePersona) {
            promptDescription = `Character Name: ${activePersona.name}. Role: ${activePersona.description}. World Context: ${activePersona.scenario || "Unknown World"}. Generate RPG stats consistent with this character.`;
        } else {
            promptDescription = "Generate stats for a random NPC in this world context.";
        }

        try {
            const stats = await generateUserStatsFromInput(promptDescription, config, abortControllerRef.current.signal, targetLangName);
            if (stats && !abortControllerRef.current.signal.aborted) {
                const targetId = selectedNpcId === 'active' ? settings.activeTargetId : selectedNpcId;
                const newRegistry = { ...npcRegistry, [targetId]: stats };
                onUpdateNpcRegistry(newRegistry);
                audio.playLevelUpSound();
            }
        } catch(e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    };

    return (
        <NaviWindow
            title={`STATUS // ${currentName.toUpperCase()}`}
            onClose={onClose}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            className="w-full h-full"
        >
            <div className="flex flex-col h-full bg-black/90 text-[color:var(--lain-cyan)] font-['Share_Tech_Mono']">
                {/* TABS */}
                <div className="flex border-b border-[color:var(--lain-cyan)]/30 shrink-0">
                    <button 
                        onClick={() => { setActiveTab('user'); audio.playClickSound(); }} 
                        className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'user' ? 'bg-[color:var(--lain-cyan)] text-black' : 'hover:bg-[color:var(--lain-cyan)]/10'}`}
                    >
                        <User size={12} /> {t('rp_player', lang)}
                    </button>
                    <button 
                        onClick={() => { setActiveTab('npc'); audio.playClickSound(); }} 
                        className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'npc' ? 'bg-[color:var(--lain-cyan)] text-black' : 'hover:bg-[color:var(--lain-cyan)]/10'}`}
                    >
                        <Target size={12} /> {t('rp_target', lang)}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                    {/* NPC SELECTOR */}
                    {activeTab === 'npc' && (
                        <div className="mb-4">
                            <label className="text-[9px] font-bold tracking-widest opacity-60 mb-1 block uppercase">{t('rp_active_target', lang)}</label>
                            <div className="relative group">
                                <select 
                                    value={selectedNpcId}
                                    onChange={(e) => setSelectedNpcId(e.target.value)}
                                    className="w-full bg-black border border-[color:var(--lain-cyan)] p-2 text-xs font-bold appearance-none focus:outline-none focus:bg-[color:var(--lain-cyan)]/10 transition-colors cursor-pointer"
                                >
                                    <option value="active">[ACTIVE LINK]: {charName}</option>
                                    {Object.entries(npcRegistry).map(([id, stats]) => {
                                        const npcStats = stats as RPStats;
                                        if (id === settings.activeTargetId) return null; 
                                        return <option key={id} value={id}>[CACHED]: {npcStats.name || "Unknown NPC"}</option>;
                                    })}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-2.5 pointer-events-none opacity-70" />
                            </div>
                        </div>
                    )}

                    {/* GENERATION / EDIT CONTROLS */}
                    <div className="flex flex-col gap-2 mb-4 border-b border-[color:var(--lain-cyan)]/30 pb-4">
                        {isGenerating && (
                            <div className="flex items-center gap-2 text-xs animate-pulse text-yellow-400 justify-center py-2 bg-yellow-900/20 mb-2 border border-yellow-500/30">
                                <Loader2 size={14} className="animate-spin" /> 
                                <span className="tracking-widest">NEURAL GENERATION IN PROGRESS...</span>
                                <button onClick={cancelGeneration} className="ml-2 border border-red-500 text-red-500 px-2 hover:bg-red-500 hover:text-white text-[9px] font-bold">ABORT</button>
                            </div>
                        )}

                        {activeTab === 'user' && !isGenerating && (
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleGeneratePlayerRandom}
                                        className="flex-1 py-2 border border-dashed border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors text-[10px] flex items-center justify-center gap-1 win98-bevel active:win98-bevel-pressed"
                                    >
                                        <Shuffle size={10} /> {t('rp_gen_random', lang)}
                                    </button>
                                    <button 
                                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                        className={`px-3 py-2 text-[10px] border ${isEditing ? 'border-green-500 text-green-500 bg-green-900/10' : 'border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black'} transition-colors win98-bevel active:win98-bevel-pressed`}
                                    >
                                        {isEditing ? <Save size={10}/> : <Edit2 size={10}/>} {isEditing ? "SAVE" : "EDIT"}
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        placeholder={t('rp_placeholder_keyword', lang)}
                                        className="flex-1 bg-black border border-[color:var(--lain-cyan)]/50 p-1 pl-2 text-[10px] focus:outline-none focus:border-[color:var(--lain-cyan)]"
                                        onKeyDown={(e) => e.key === 'Enter' && handleGeneratePlayerKeyword()}
                                    />
                                    <button 
                                        onClick={handleGeneratePlayerKeyword}
                                        disabled={!keyword.trim()}
                                        className="px-3 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors text-[10px] win98-bevel active:win98-bevel-pressed disabled:opacity-50"
                                    >
                                        {t('rp_gen_keyword', lang)}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'npc' && !isGenerating && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleGenerateTarget}
                                    className="flex-1 py-2 border border-dashed border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors text-[10px] flex items-center justify-center gap-2 win98-bevel active:win98-bevel-pressed"
                                >
                                    <Target size={12} /> {t('rp_gen_target', lang)} (AUTO)
                                </button>
                                <button 
                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                    className={`px-3 py-2 text-[10px] border ${isEditing ? 'border-green-500 text-green-500 bg-green-900/10' : 'border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black'} transition-colors win98-bevel active:win98-bevel-pressed`}
                                >
                                    {isEditing ? <Save size={10}/> : <Edit2 size={10}/>}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* MAIN VITALS DISPLAY */}
                    <div className="flex gap-4 mb-4">
                        <div className="w-20 h-20 border-2 border-[color:var(--lain-cyan)] flex flex-col items-center justify-center bg-[color:var(--lain-cyan)]/5 shrink-0 shadow-[0_0_15px_var(--lain-cyan)] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
                            <span className="text-[10px] opacity-60 font-bold tracking-widest">{t('rp_lvl', lang)}</span>
                            <span className="text-3xl font-bold text-glow">{currentStats?.level || 1}</span>
                            <div className="absolute bottom-0 w-full bg-[color:var(--lain-cyan)] text-black text-[8px] text-center font-bold truncate px-1">
                                {currentStats?.class || "NO_CLASS"}
                            </div>
                        </div>
                        
                        <div className="flex-1 space-y-1.5 py-1">
                            <StatBar label={t('rp_hp', lang)} current={currentStats?.hp.current || 0} max={currentStats?.hp.max || 10} color="bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
                            <StatBar label={t('rp_mp', lang)} current={currentStats?.mp.current || 0} max={currentStats?.mp.max || 10} color="bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                            <StatBar label={t('rp_xp', lang)} current={currentStats?.xp || 0} max={currentStats?.maxXp || 100} color="bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                            
                            {activeTab === 'npc' && (
                                <div className="flex items-center gap-2 text-[10px] w-full mt-2 animate-in slide-in-from-left-2">
                                    <span className="w-8 font-bold flex items-center gap-1 text-pink-400"><Heart size={10} className="fill-current"/>{t('rp_aff', lang)}</span>
                                    <div className="flex-1 h-2 bg-gray-900 border border-pink-900 relative overflow-hidden">
                                        <div 
                                            className="h-full absolute top-0 left-0 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)] transition-all duration-700" 
                                            style={{ width: `${Math.min(100, currentStats?.affection || 0)}%` }} 
                                        />
                                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.5)_2px,rgba(0,0,0,0.5)_4px)] opacity-50"></div>
                                    </div>
                                    <span className="w-12 text-right font-mono text-pink-300">{currentStats?.affection || 0}%</span>
                                </div>
                            )}

                            {activeTab === 'user' && (
                                <div className="flex items-center gap-2 text-[10px] w-full mt-2">
                                    <span className="w-8 font-bold flex items-center gap-1 text-orange-400"><Zap size={10} className="fill-current"/>LIM</span>
                                    <div className="flex-1 h-2 bg-gray-900 border border-orange-900 relative overflow-hidden">
                                        <div 
                                            className="h-full absolute top-0 left-0 bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]" 
                                            style={{ width: `${Math.min(100, currentStats?.limitGauge || 0)}%` }} 
                                        />
                                    </div>
                                    <span className="w-12 text-right font-mono text-orange-300">{currentStats?.limitGauge || 0}%</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BASIC INFO GRID */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        {['race', 'gender', 'class', 'alignment'].map((field) => (
                            <div key={field} className="border border-[color:var(--lain-cyan)]/30 p-2 bg-[color:var(--lain-cyan)]/5 flex items-center gap-2 relative group">
                                {field === 'race' && <Dna size={12} className="opacity-70"/>}
                                {field === 'gender' && <Users size={12} className="opacity-70"/>}
                                {field === 'alignment' && <Scale size={12} className="opacity-70"/>}
                                {field === 'class' && <Star size={12} className="opacity-70"/>}
                                <span className="font-bold text-[9px] opacity-50 uppercase tracking-wider">{field}:</span>
                                {isEditing ? (
                                    <input 
                                        className="bg-black border-b border-[color:var(--lain-cyan)]/50 w-full focus:outline-none focus:border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)]" 
                                        value={(tempStats as any)?.[field] || ''} 
                                        onChange={e => setTempStats(prev => prev ? {...prev, [field]: e.target.value} : null)}
                                    />
                                ) : (
                                    <span className="truncate">{(currentStats as any)?.[field] || "Unknown"}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {/* ATTRIBUTES */}
                        <div>
                            <h4 className="text-[10px] font-bold tracking-widest opacity-70 mb-2 flex items-center gap-2 border-b border-[color:var(--lain-cyan)]/20 pb-1">
                                <Activity size={12}/> {t('rp_core_attr', lang)}
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(currentStats.attributes).map(([key, val]) => (
                                    <div key={key} className="bg-black border border-[color:var(--lain-cyan)]/30 p-2 text-center group hover:bg-[color:var(--lain-cyan)]/10 transition-colors relative">
                                        <div className="text-[9px] opacity-60 font-bold tracking-wider">{key}</div>
                                        {isEditing ? (
                                            <input 
                                                type="number"
                                                className="w-full bg-transparent text-center font-bold text-sm focus:outline-none text-[color:var(--lain-cyan)]"
                                                value={(tempStats?.attributes as any)?.[key] || val}
                                                onChange={(e) => setTempStats(prev => prev ? {
                                                    ...prev, 
                                                    attributes: { ...prev.attributes, [key]: parseInt(e.target.value) || 10 }
                                                } : null)}
                                            />
                                        ) : (
                                            <div className="text-sm font-bold text-glow">{val}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* STATUS EFFECTS */}
                        <div>
                            <h4 className="text-[10px] font-bold tracking-widest opacity-70 mb-2 flex items-center gap-2 border-b border-[color:var(--lain-cyan)]/20 pb-1">
                                <Sparkles size={12}/> {t('rp_status', lang)}
                            </h4>
                            {isEditing ? (
                                <textarea 
                                    className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-2 text-xs font-mono" 
                                    value={tempStats?.statusEffects?.join(', ') || ''} 
                                    onChange={(e) => {
                                        const arr = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                        setTempStats(prev => prev ? {...prev, statusEffects: arr} : null);
                                    }}
                                    placeholder="Poisoned, Hasted..."
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {(currentStats.statusEffects || []).length > 0 ? (currentStats.statusEffects || []).map((eff, i) => (
                                        <span key={i} className="text-[10px] px-2 py-1 bg-purple-900/30 border border-purple-500 text-purple-300 rounded shadow-[0_0_5px_rgba(168,85,247,0.4)]">{eff}</span>
                                    )) : <span className="text-[10px] opacity-40 italic">Normal Condition</span>}
                                </div>
                            )}
                        </div>

                        {/* EQUIPMENT */}
                        <div>
                            <h4 className="text-[10px] font-bold tracking-widest opacity-70 mb-2 flex items-center gap-2 border-b border-[color:var(--lain-cyan)]/20 pb-1">
                                <Shield size={12}/> {t('rp_equip', lang)}
                            </h4>
                            {isEditing ? (
                                <textarea 
                                    className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-2 text-xs font-mono h-20" 
                                    value={tempStats?.equipment?.join(', ') || ''} 
                                    onChange={(e) => {
                                        const arr = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                        setTempStats(prev => prev ? {...prev, equipment: arr} : null);
                                    }}
                                    placeholder="Sword, Armor, Boots..."
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {(currentStats.equipment || []).length > 0 ? currentStats.equipment.map((item, i) => (
                                        <span key={i} className="text-[10px] px-2 py-1 bg-blue-900/30 border border-blue-500/50 text-blue-200 rounded hover:bg-blue-900/50 transition-colors cursor-help">{item}</span>
                                    )) : <span className="text-[10px] opacity-40 italic">Nothing equipped.</span>}
                                </div>
                            )}
                        </div>

                        {/* INVENTORY */}
                        <div>
                            <h4 className="text-[10px] font-bold tracking-widest opacity-70 mb-2 flex items-center gap-2 border-b border-[color:var(--lain-cyan)]/20 pb-1">
                                <Backpack size={12}/> {t('rp_inv', lang)}
                            </h4>
                            {isEditing ? (
                                <textarea 
                                    className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-2 text-xs font-mono h-20" 
                                    value={tempStats?.inventory?.join(', ') || ''} 
                                    onChange={(e) => {
                                        const arr = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                        setTempStats(prev => prev ? {...prev, inventory: arr} : null);
                                    }}
                                    placeholder="Item1, Item2..."
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {(currentStats.inventory || []).length > 0 ? currentStats.inventory.map((item, i) => (
                                        <span key={i} className="text-[10px] px-2 py-1 bg-[color:var(--lain-cyan)]/10 border border-[color:var(--lain-cyan)]/30 text-[color:var(--lain-cyan)] rounded hover:bg-[color:var(--lain-cyan)]/20 transition-colors cursor-help" title="Item">{item}</span>
                                    )) : <span className="text-[10px] opacity-40 italic">Empty.</span>}
                                </div>
                            )}
                        </div>

                        {/* SKILLS */}
                        <div>
                            <h4 className="text-[10px] font-bold tracking-widest opacity-70 mb-2 flex items-center gap-2 border-b border-[color:var(--lain-cyan)]/20 pb-1">
                                <Book size={12}/> {t('rp_skill', lang)}
                            </h4>
                            {isEditing ? (
                                <textarea 
                                    className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-2 text-xs font-mono h-20" 
                                    value={tempStats?.skills?.join(', ') || ''} 
                                    onChange={(e) => {
                                        const arr = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                        setTempStats(prev => prev ? {...prev, skills: arr} : null);
                                    }}
                                    placeholder="Fireball, Hack..."
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {(currentStats.skills || []).length > 0 ? currentStats.skills.map((skill, i) => (
                                        <span key={i} className="text-[10px] px-2 py-1 bg-yellow-900/30 border border-yellow-600 text-yellow-200 rounded hover:bg-yellow-900/50 transition-colors cursor-help border-dashed">{skill}</span>
                                    )) : <span className="text-[10px] opacity-40 italic">No skills recorded.</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </NaviWindow>
    );
};
