
import { ArrowUpDown, Eye, Hexagon, Layers, MessageSquarePlus, Plus, Search, Share2, Shuffle, Signal, Trash2, User, Users, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../services/audioEngine';
import { generatePersonaFromInput, generateRandomPersona, resolveConfig } from '../services/geminiService';
import { AppSettings, PersonaSettings, UserSettings } from '../types';
import { t } from '../utils/translations';
import { NaviWindow } from './NaviWindow';

interface FriendListProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  onClose: () => void;
  isMinimized: boolean;
  isMaximized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onNewChat: (id: string) => void;
  onOpenProfile: (target: PersonaSettings | UserSettings) => void;
  onShareProfile?: (target: PersonaSettings | UserSettings) => void;
  onSystemBusy?: (busy: boolean) => void;
}

export const FriendList: React.FC<FriendListProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  isMinimized,
  isMaximized,
  onMinimize,
  onMaximize,
  onNewChat,
  onOpenProfile,
  onShareProfile,
  onSystemBusy
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isGeneratingRandom, setIsGeneratingRandom] = useState(false);
  const [hoveredProfile, setHoveredProfile] = useState<PersonaSettings | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ top: number, left: number } | null>(null);

  // Progress & Abort
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'age'>('date');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const lang = settings.user.language;
  const isRP = settings.generation.chatMode === 'rp';

  useEffect(() => {
    let interval: number;
    if (isSearching || isGeneratingRandom) {
      setProgress(0);
      interval = window.setInterval(() => {
        setProgress(prev => Math.min(prev + (100 - prev) * 0.1, 95));
      }, 200);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isSearching, isGeneratingRandom]);

  const handleSelectTarget = (id: string) => {
    if (settings.activeTargetId !== id) {
      onUpdateSettings({ ...settings, activeTargetId: id });
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSearching(false);
    setIsGeneratingRandom(false);
    onSystemBusy?.(false);
    setProgress(0);
    audio.playWindowSound(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    onSystemBusy?.(true);
    audio.playSendSound();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Use Persona Config if available, otherwise fall back to main API
    const apiConfig = resolveConfig((settings.personaConfig && settings.personaConfig.apiKey) ? settings.personaConfig : settings.api, settings.variables);

    try {
      // PASS THE CHAT MODE TO GENERATE APPROPRIATE PERSONA TYPE
      const newPersona = await generatePersonaFromInput(
        searchQuery,
        apiConfig,
        controller.signal,
        settings.generation.chatMode
      );

      // Check if still active and not aborted
      if (newPersona && !controller.signal.aborted && abortControllerRef.current === controller) {
        onUpdateSettings({
          ...settings,
          characterLibrary: [...settings.characterLibrary, newPersona],
          activeTargetId: newPersona.id
        });
        audio.playBootSound();
        setSearchQuery('');
        setShowSearch(false);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') console.error(error);
    } finally {
      if (abortControllerRef.current === controller) {
        setIsSearching(false);
        onSystemBusy?.(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleRandomGen = async () => {
    if (isGeneratingRandom) return;
    setIsGeneratingRandom(true);
    onSystemBusy?.(true);
    audio.playSendSound();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Use Persona Config if available, otherwise fall back to main API
    const apiConfig = resolveConfig((settings.personaConfig && settings.personaConfig.apiKey) ? settings.personaConfig : settings.api, settings.variables);

    try {
      // PASS THE CHAT MODE
      const newPersona = await generateRandomPersona(
        apiConfig,
        controller.signal,
        settings.generation.chatMode
      );

      if (newPersona && !controller.signal.aborted && abortControllerRef.current === controller) {
        onUpdateSettings({
          ...settings,
          characterLibrary: [...settings.characterLibrary, newPersona],
          activeTargetId: newPersona.id
        });
        audio.playBootSound();
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') console.error(error);
    } finally {
      if (abortControllerRef.current === controller) {
        setIsGeneratingRandom(false);
        onSystemBusy?.(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleDeletePersona = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (settings.characterLibrary.length <= 1) {
      alert("CANNOT DELETE LAST NODE.");
      return;
    }

    if (!confirm(t('fl_del_node', lang))) return;

    // Clean up draft cache
    localStorage.removeItem(`wired_draft_persona_${id}`);
    localStorage.removeItem(`wired_draft_input_${id}`);

    // Create new library array
    const newLibrary = settings.characterLibrary.filter(p => p.id !== id);

    // Determine next active target if we deleted the current one
    let nextTargetId = settings.activeTargetId;
    if (settings.activeTargetId === id) {
      // Default to the first available in the new list, or keep old if not found (fallback)
      nextTargetId = newLibrary.length > 0 ? newLibrary[0].id : 'default-lain';
    }

    // Construct new settings object explicitly
    const newSettings = {
      ...settings,
      characterLibrary: newLibrary,
      activeTargetId: nextTargetId
    };

    // Update
    onUpdateSettings(newSettings);
    audio.playConfirmSound();
  };

  const handleMouseEnterEye = (e: React.MouseEvent, p: PersonaSettings) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (hoverTimeout) clearTimeout(hoverTimeout);

    const timeout = window.setTimeout(() => {
      setHoveredProfile(p);
      setHoverPos({ top: rect.top, left: rect.left - 280 });
      audio.playTypingSound(10);
    }, 200);
    setHoverTimeout(timeout);
  };

  const handleMouseLeaveEye = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoveredProfile(null);
  };

  const handleShareNode = (e: React.MouseEvent, p: PersonaSettings) => {
    e.stopPropagation();
    if (onShareProfile) {
      onShareProfile(p);
    }
  };

  const sortedPersonas = [...settings.characterLibrary].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'age') return (parseInt(a.age || '0') || 0) - (parseInt(b.age || '0') || 0);
    if (a.id.startsWith('default')) return -1;
    if (b.id.startsWith('default')) return 1;
    return b.id.localeCompare(a.id);
  });

  // FILTER GROUPS BASED ON CHAT MODE
  const filteredGroups = (settings.groups || []).filter(g => (g.mode || 'msg') === settings.generation.chatMode);

  return (
    <NaviWindow
      title={isRP ? "TACTICAL // UNIT LIST" : t('fl_title', lang)}
      onClose={onClose}
      isMinimized={isMinimized}
      isMaximized={isMaximized}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
      className="h-full relative"
    >
      <div className="flex flex-col h-full bg-black/90 text-[color:var(--lain-cyan)] font-['Share_Tech_Mono']">
        {/* Header Actions */}
        <div className="p-2 border-b border-[color:var(--lain-cyan)] flex justify-between items-center bg-[color:var(--lain-cyan)]/10">
          <div className="flex items-center gap-2 text-xs tracking-wider">
            <Users size={14} />
            <span className="font-bold">
              {isRP ? "PARTY MEMBERS" : t('nav_nodes', lang)}: {settings.characterLibrary.length + filteredGroups.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setShowSortMenu(!showSortMenu);
                  audio.playClickSound();
                }}
                className={`p-1 hover:text-white transition-colors border border-transparent hover:border-[color:var(--lain-cyan)] ${showSortMenu ? 'text-white border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/20' : ''}`}
              >
                <ArrowUpDown size={14} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 bg-black border border-[color:var(--lain-cyan)] z-50 w-32 shadow-lg animate-in fade-in zoom-in duration-100 origin-top-right">
                  <button
                    onClick={() => { setSortBy('date'); setShowSortMenu(false); audio.playClickSound(); }}
                    className={`w-full text-left p-2 text-xs hover:bg-[color:var(--lain-cyan)] hover:text-black ${sortBy === 'date' ? 'bg-[color:var(--lain-cyan)]/20' : ''}`}
                  >
                    {t('fl_sort_date', lang)}
                  </button>
                  <button
                    onClick={() => { setSortBy('name'); setShowSortMenu(false); audio.playClickSound(); }}
                    className={`w-full text-left p-2 text-xs hover:bg-[color:var(--lain-cyan)] hover:text-black ${sortBy === 'name' ? 'bg-[color:var(--lain-cyan)]/20' : ''}`}
                  >
                    {t('fl_sort_name', lang)}
                  </button>
                  <button
                    onClick={() => { setSortBy('age'); setShowSortMenu(false); audio.playClickSound(); }}
                    className={`w-full text-left p-2 text-xs hover:bg-[color:var(--lain-cyan)] hover:text-black ${sortBy === 'age' ? 'bg-[color:var(--lain-cyan)]/20' : ''}`}
                  >
                    {t('fl_sort_age', lang)}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1 hover:text-white transition-colors border border-transparent hover:border-[color:var(--lain-cyan)] ${showSearch ? 'text-white bg-[color:var(--lain-cyan)]/20' : ''}`}
              title="Add Nodes"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Search / Matchmaker Input */}
        {showSearch && (
          <div className="p-3 border-b border-[color:var(--lain-cyan)] bg-black animate-in slide-in-from-top-2 relative">
            {(isSearching || isGeneratingRandom) && (
              <div className="absolute inset-x-0 top-0 h-1 bg-[color:var(--lain-cyan)]/20">
                <div
                  className="h-full bg-[color:var(--lain-cyan)] transition-all duration-200 shadow-[0_0_10px_var(--lain-cyan)]"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <form onSubmit={handleSearch} className="flex flex-col gap-2">
                <label className="text-[10px] opacity-70 tracking-widest uppercase">
                  {isRP ? "SUMMON PARTY MEMBER (KEYWORD)" : t('fl_add_keyword', lang)}:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRP ? "e.g. Cyberpunk Paladin..." : "e.g. Cyberpunk Detective..."}
                    disabled={isSearching || isGeneratingRandom}
                    className="flex-1 bg-black border border-[color:var(--lain-cyan)] p-2 text-xs focus:outline-none win98-bevel-pressed disabled:opacity-50"
                    autoFocus
                  />
                  {isSearching ? (
                    <button
                      type="button"
                      onClick={handleCancelGeneration}
                      className="px-3 border border-red-500 bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors win98-bevel active:win98-bevel-pressed font-bold text-[10px]"
                    >
                      STOP
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSearching || isGeneratingRandom}
                      className="px-3 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors win98-bevel active:win98-bevel-pressed"
                    >
                      <Search size={14} />
                    </button>
                  )}
                </div>
              </form>

              <div className="flex items-center gap-2">
                <div className="h-px bg-[color:var(--lain-cyan)]/30 flex-1"></div>
                <span className="text-[10px] opacity-50">{t('fl_or', lang)}</span>
                <div className="h-px bg-[color:var(--lain-cyan)]/30 flex-1"></div>
              </div>

              {isGeneratingRandom ? (
                <button
                  onClick={handleCancelGeneration}
                  className="w-full py-2 border border-red-500 bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-xs flex items-center justify-center gap-2 font-bold tracking-widest"
                >
                  <X size={14} /> ABORT GENERATION
                </button>
              ) : (
                <button
                  onClick={handleRandomGen}
                  disabled={isSearching}
                  className="w-full py-2 border border-dashed border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors text-xs flex items-center justify-center gap-2"
                >
                  <Shuffle size={14} />
                  {isRP ? "RANDOM ADVENTURER" : t('fl_gen_random', lang)}
                </button>
              )}
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin relative">
          {sortedPersonas.map(persona => {
            const isActive = persona.id === settings.activeTargetId;
            return (
              <div
                key={persona.id}
                className={`border transition-all duration-200 group relative overflow-visible ${isActive ? 'border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/10' : 'border-[color:var(--lain-cyan)]/30 hover:border-[color:var(--lain-cyan)]/60'}`}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[color:var(--lain-cyan)] animate-pulse"></div>}

                <div className="p-3 pl-4 flex items-center justify-between cursor-pointer" onClick={() => handleSelectTarget(persona.id)}>
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="relative">
                      <div
                        className={`w-12 h-12 flex shrink-0 items-center justify-center border border-[color:var(--lain-cyan)] bg-black ${isActive ? 'shadow-[0_0_8px_var(--lain-cyan)]' : ''}`}
                      >
                        {persona.avatar ? (
                          <img src={persona.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} className={isActive ? 'text-[color:var(--lain-cyan)]' : 'opacity-50'} />
                        )}
                      </div>
                      {isActive && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-black shadow-lg"></div>}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="font-bold truncate text-sm tracking-wide group-hover:text-white transition-colors">{persona.name}</div>
                      <div className="flex items-center gap-2 text-[10px] opacity-70 font-mono">
                        <span>{persona.gender || "N/A"}</span>
                        <span className="opacity-30">|</span>
                        <span>{persona.age || "N/A"}</span>
                      </div>
                      <div className="text-[10px] opacity-50 truncate font-mono flex items-center gap-1">
                        <Signal size={8} />
                        {isActive ? t('fl_connected', lang) : t('fl_idle', lang)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProfile(persona);
                        audio.playConfirmSound();
                      }}
                      onMouseEnter={(e) => handleMouseEnterEye(e, persona)}
                      onMouseLeave={handleMouseLeaveEye}
                      className="p-1.5 hover:text-white hover:bg-[color:var(--lain-cyan)] rounded-sm transition-all border border-[color:var(--lain-cyan)] relative z-10"
                      title={t('fl_profile', lang)}
                    >
                      <Eye size={12} />
                    </button>

                    <div className="flex gap-1">
                      <button
                        onClick={(e) => handleShareNode(e, persona)}
                        className="p-1.5 hover:text-white hover:bg-[color:var(--lain-cyan)] rounded-sm opacity-0 group-hover:opacity-100 transition-all border border-[color:var(--lain-cyan)]"
                        title={t('fl_share_node', lang)}
                      >
                        <Share2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNewChat(persona.id);
                        }}
                        className="p-1.5 hover:text-white hover:bg-[color:var(--lain-cyan)] rounded-sm opacity-0 group-hover:opacity-100 transition-all border border-[color:var(--lain-cyan)]"
                        title="Direct Link"
                      >
                        <MessageSquarePlus size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeletePersona(e, persona.id)}
                        className="p-1.5 hover:text-white hover:bg-red-500 rounded-sm opacity-0 group-hover:opacity-100 transition-all border border-[color:var(--lain-red)] text-[color:var(--lain-red)]"
                        title="Delete Node"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredGroups.length > 0 && (
            <div className="border-t border-[color:var(--lain-cyan)]/30 my-2 pt-2 text-[10px] font-bold opacity-50 tracking-widest pl-2">
              {isRP ? "ACTIVE PARTIES" : t('lbl_groups', lang)}
            </div>
          )}

          {filteredGroups.map(group => {
            const isActive = group.id === settings.activeTargetId;
            return (
              <div
                key={group.id}
                className={`border transition-all duration-200 group relative overflow-hidden ${isActive ? 'border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/10' : 'border-[color:var(--lain-cyan)]/30 hover:border-[color:var(--lain-cyan)]/60'}`}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[color:var(--lain-cyan)] animate-pulse"></div>}
                <div className="p-3 pl-4 flex items-center justify-between cursor-pointer" onClick={() => handleSelectTarget(group.id)}>
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="relative">
                      <div className={`w-12 h-12 flex shrink-0 items-center justify-center border border-[color:var(--lain-cyan)] bg-black ${isActive ? 'shadow-[0_0_8px_var(--lain-cyan)]' : ''}`}>
                        {group.mode === 'rp' ? (
                          <Hexagon size={20} className={isActive ? 'text-[color:var(--lain-cyan)]' : 'opacity-50'} />
                        ) : (
                          <Layers size={20} className={isActive ? 'text-[color:var(--lain-cyan)]' : 'opacity-50'} />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="font-bold truncate text-sm tracking-wide group-hover:text-white transition-colors">{group.name}</div>
                      <div className="text-[10px] opacity-70 font-mono">
                        {group.members.length} {t('lbl_members', lang)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewChat(group.id);
                    }}
                    className="p-1.5 hover:text-white hover:bg-[color:var(--lain-cyan)] rounded-sm opacity-0 group-hover:opacity-100 transition-all border border-[color:var(--lain-cyan)]"
                    title="Direct Link"
                  >
                    <MessageSquarePlus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover Profile Card */}
      {hoveredProfile && (
        <div
          className="fixed z-[300] w-64 bg-black border border-[color:var(--lain-cyan)] shadow-[0_0_30px_rgba(0,240,255,0.4)] pointer-events-none animate-in fade-in zoom-in-95 duration-200 overflow-hidden backdrop-blur-md"
          style={{
            top: Math.min(window.innerHeight - 300, Math.max(10, hoverPos?.top || 0)),
            left: (hoverPos?.left || 0) < 300 ? (hoverPos?.left || 0) + 320 : (hoverPos?.left || 0)
          }}
        >
          <div className="h-6 bg-[color:var(--lain-cyan)]/20 flex items-center px-2 border-b border-[color:var(--lain-cyan)]/50">
            <span className="text-[10px] font-bold tracking-widest text-[color:var(--lain-cyan)]">ID_CARD_V4</span>
            <div className="ml-auto w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_lime]"></div>
          </div>
          <div className="p-4 relative">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(0,240,255,0.1)_50%,transparent_55%)] bg-[size:200%_200%] animate-[gradient_3s_infinite] pointer-events-none"></div>
            <div className="flex gap-4">
              <div className="w-16 h-20 border border-[color:var(--lain-cyan)] bg-black p-0.5 shrink-0">
                {hoveredProfile.avatar ? (
                  <img src={hoveredProfile.avatar} className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="m-auto opacity-50 h-full" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="font-bold text-lg text-white leading-none mb-1 truncate">{hoveredProfile.name}</div>
                <div className="text-[9px] font-mono opacity-60 mb-2 truncate">@{hoveredProfile.name.toLowerCase()}</div>
                <div className="text-[9px] bg-[color:var(--lain-cyan)]/10 border border-[color:var(--lain-cyan)]/30 px-1 py-0.5 w-fit">
                  LVL. {(hoveredProfile.friendsCount || 0) > 100 ? '99' : '12'}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-[10px] font-mono">
              <div className="flex justify-between border-b border-[color:var(--lain-cyan)]/20 pb-1">
                <span className="opacity-50">CLASS</span>
                <span className="font-bold text-[color:var(--lain-cyan)]">AI_CONSTRUCT</span>
              </div>
              <div className="flex justify-between border-b border-[color:var(--lain-cyan)]/20 pb-1">
                <span className="opacity-50">LOC</span>
                <span className="font-bold">{hoveredProfile.region || "UNKNOWN"}</span>
              </div>
              <div className="pt-1 opacity-80 leading-tight line-clamp-3 italic">
                "{hoveredProfile.description}"
              </div>
            </div>
          </div>
          <div className="h-1 w-full bg-[color:var(--lain-cyan)] animate-pulse"></div>
        </div>
      )}
    </NaviWindow>
  );
};
