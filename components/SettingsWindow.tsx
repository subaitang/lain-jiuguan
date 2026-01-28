
import { AlertCircle, Award, BrainCircuit, CheckCircle, Cpu, Database, Download, Edit2, FileText, Ghost, Globe, Heart, HeartOff, Image as ImageIcon, Info, Languages, Loader, MapPin, MessageSquare, Mic, MousePointer2, Network, Palette, Plus, Puzzle, RefreshCw, Router, Save, Search, Shuffle, Smile, Sparkles, Speech, TextCursor, Trash2, Type, Upload, User, Users, Video, Volume2, Wifi, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../services/audioEngine';
import { fetchCustomModels, testGoogleConnection } from '../services/geminiService';
import { sessionService } from '../services/sessionService';
import { AppSettings, ChatSession, CustomExtension, GroupSettings, LoreEntry, PersonaSettings, VisualAsset } from '../types';
import { t } from '../utils/translations';
import { NaviWindow } from './NaviWindow';

interface SettingsWindowProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  lorebook: LoreEntry[];
  onUpdateLore: (l: LoreEntry[]) => void;
  onClose: () => void;
  onExport: () => void;
  onDeleteChat: () => void;
}

export const SettingsWindow: React.FC<SettingsWindowProps> = ({
  settings, onUpdateSettings, lorebook, onUpdateLore, onClose, onExport, onDeleteChat
}) => {
  const [activeTab, setActiveTab] = useState<'gen' | 'api' | 'persona' | 'groups' | 'world' | 'modules' | 'data' | 'user' | 'memory' | 'ui' | 'audio'>('gen');
  const [apiLayer, setApiLayer] = useState<'generation' | 'translation' | 'memory' | 'persona' | 'maps'>('generation');

  const { language } = settings.user;
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const chatWallpaperInputRef = useRef<HTMLInputElement>(null);
  const personaAvatarInputRef = useRef<HTMLInputElement>(null);
  const personaBannerInputRef = useRef<HTMLInputElement>(null);
  const personaWallpaperInputRef = useRef<HTMLInputElement>(null);

  // Visual Asset Inputs
  const visualAssetInputRef = useRef<HTMLInputElement>(null);
  const [visualAssetUrl, setVisualAssetUrl] = useState('');
  const [draggedAssetIndex, setDraggedAssetIndex] = useState<number | null>(null);

  // Custom Cursor Input ref used for multiple types
  const customCursorInputRef = useRef<HTMLInputElement>(null);
  const [activeCursorType, setActiveCursorType] = useState<string | null>(null);

  const [importMsg, setImportMsg] = useState('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [statusMsg, setStatusMsg] = useState('');

  const [editingPersonaId, setEditingPersonaId] = useState<string>(
    settings.characterLibrary.find(p => p.id === settings.activeTargetId)?.id || settings.characterLibrary[0]?.id || ''
  );

  const editingPersona = settings.characterLibrary.find(p => p.id === editingPersonaId);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const editingGroup = settings.groups?.find(g => g.id === editingGroupId);

  const [currentSessionMemories, setCurrentSessionMemories] = useState<string[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const sess = sessionService.get(sessionService.getCurrentId() || "");
    if (sess) {
      setCurrentSessionMemories(sess.summaries || []);
    }
  }, [activeTab]);

  useEffect(() => {
    setSessions(sessionService.getAll());
  }, [activeTab]);

  useEffect(() => {
    const loadVoices = () => { setVoices(window.speechSynthesis.getVoices()); };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (editingPersona) {
      const draftKey = `wired_draft_persona_${editingPersona.id}`;
      const handler = setTimeout(() => { localStorage.setItem(draftKey, JSON.stringify(editingPersona)); }, 1000);
      return () => clearTimeout(handler);
    }
  }, [editingPersona]);

  const handleSaveMemories = (newMemories: string[]) => {
    const sess = sessionService.get(sessionService.getCurrentId() || "");
    if (sess) { sess.summaries = newMemories; sessionService.save(sess); setCurrentSessionMemories(newMemories); }
    audio.playConfirmSound();
  };

  const handleAddExtension = () => { onUpdateSettings({ ...settings, extensions: [...(settings.extensions || []), { id: Date.now().toString(), name: "New Injection", content: "...", active: true, position: 'system' }] }); };
  const updateExtension = (id: string, updates: Partial<CustomExtension>) => { onUpdateSettings({ ...settings, extensions: (settings.extensions || []).map(e => e.id === id ? { ...e, ...updates } : e) }); };
  const deleteExtension = (id: string) => { onUpdateSettings({ ...settings, extensions: (settings.extensions || []).filter(e => e.id !== id) }); };
  const updateEditingPersona = (updates: Partial<PersonaSettings>) => { if (editingPersona) onUpdateSettings({ ...settings, characterLibrary: settings.characterLibrary.map(p => p.id === editingPersona.id ? { ...p, ...updates } : p) }); };

  const handleAddPersona = () => {
    const newP: PersonaSettings = { id: Date.now().toString(), name: "New Identity", description: "Unknown Entity", systemPrompt: "You are a new identity.", nativeLanguage: "English", age: "Unknown", gender: "Unknown", friendsCount: 0, followersCount: 0, visitCount: 0, visitors: [], useRandomOpening: true, writingStyle: "", scenario: "", exampleDialogue: "", ipAddress: "192.168.0.x", allowEmoji: true };
    onUpdateSettings({ ...settings, characterLibrary: [...settings.characterLibrary, newP] });
    setEditingPersonaId(newP.id);
  };

  const handleExportPersona = () => {
    if (!editingPersona) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(editingPersona, null, 2));
    const a = document.createElement('a'); a.href = dataStr; a.download = `${editingPersona.name}_card.json`; document.body.appendChild(a); a.click(); a.remove(); audio.playConfirmSound();
  };

  const handleImportPersona = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string); const d = json.data || json;
        const newP: PersonaSettings = { ...d, id: `import-${Date.now()}`, friendsCount: d.friendsCount || 0, followersCount: d.followersCount || 0, visitCount: 0, visitors: [] };
        onUpdateSettings({ ...settings, characterLibrary: [...settings.characterLibrary, newP], activeTargetId: newP.id }); setEditingPersonaId(newP.id); audio.playConfirmSound(); alert("Imported.");
      } catch (e) { alert("Fail."); }
    }; reader.readAsText(file); e.target.value = '';
  };

  const handleDeletePersona = (id: string) => { if (settings.characterLibrary.length <= 1) return alert("Cannot delete last."); if (!confirm("Delete?")) return; onUpdateSettings({ ...settings, characterLibrary: settings.characterLibrary.filter(p => p.id !== id), activeTargetId: settings.characterLibrary[0].id }); audio.playConfirmSound(); };
  const handleAddGroup = (mode: 'msg' | 'rp') => { const g: GroupSettings = { id: `grp-${Date.now()}`, name: "New Group", members: [], description: "", mode }; onUpdateSettings({ ...settings, groups: [...(settings.groups || []), g] }); setEditingGroupId(g.id); };
  const updateEditingGroup = (u: Partial<GroupSettings>) => { if (editingGroup) onUpdateSettings({ ...settings, groups: settings.groups?.map(g => g.id === editingGroup.id ? { ...g, ...u } : g) }); };
  const toggleGroupMember = (pid: string) => { if (editingGroup) updateEditingGroup({ members: editingGroup.members.includes(pid) ? editingGroup.members.filter(m => m !== pid) : [...editingGroup.members, pid] }); };
  const handleDeleteGroup = (id: string) => { if (confirm("Dissolve?")) onUpdateSettings({ ...settings, groups: settings.groups?.filter(g => g.id !== id) }); };
  const handleDeleteSession = (id: string) => { if (confirm("Delete?")) { sessionService.delete(id); setSessions(sessionService.getAll()); } };
  const handleExportSpecificSession = (s: ChatSession) => { const a = document.createElement('a'); a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(s, null, 2)); a.download = `LOG_${s.id}.json`; document.body.appendChild(a); a.click(); a.remove(); };
  const handleDeleteAllSessions = () => { if (confirm("Wipe?")) { sessionService.deleteAll(); setSessions({}); onDeleteChat(); } };
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileImport = (e: any) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { try { const j = JSON.parse(ev.target?.result as string); sessionService.importSession(j); setImportMsg("OK"); setSessions(sessionService.getAll()); } catch (e) { setImportMsg("Fail"); } }; r.readAsText(f); e.target.value = ''; };
  const handleUserAvatarUpload = (e: any) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => onUpdateSettings({ ...settings, user: { ...settings.user, avatar: r.result as string } }); r.readAsDataURL(f); } };
  const handleWallpaperUpload = (e: any) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => onUpdateSettings({ ...settings, ui: { ...settings.ui, wallpaper: r.result as string } }); r.readAsDataURL(f); } };
  const handleChatWallpaperUpload = (e: any) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => onUpdateSettings({ ...settings, ui: { ...settings.ui, chatWallpaper: r.result as string } }); r.readAsDataURL(f); } };
  const handlePersonaAvatarUpload = (e: any) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => updateEditingPersona({ avatar: r.result as string }); r.readAsDataURL(f); } };
  const handlePersonaBannerUpload = (e: any) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => updateEditingPersona({ banner: r.result as string }); r.readAsDataURL(f); } };
  const handlePersonaWallpaperUpload = (e: any) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => updateEditingPersona({ chatWallpaper: r.result as string }); r.readAsDataURL(f); } };

  const handleExportUserProfile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings.user, null, 2));
    const a = document.createElement('a'); a.href = dataStr; a.download = `user_profile_${settings.user.username}.json`; document.body.appendChild(a); a.click(); a.remove(); audio.playConfirmSound();
  };

  const handleCustomCursorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeCursorType) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({
          ...settings,
          ui: {
            ...settings.ui,
            customCursors: {
              ...(settings.ui.customCursors || {}),
              [activeCursorType]: reader.result as string
            }
          }
        });
        audio.playConfirmSound();
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeCustomCursor = (type: string) => {
    const newCursors = { ...settings.ui.customCursors };
    delete newCursors[type];
    onUpdateSettings({ ...settings, ui: { ...settings.ui, customCursors: newCursors } });
    audio.playWindowSound(false);
  };

  const handleVisualAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileReaders = Array.from(files).map((file: File) => {
        return new Promise<VisualAsset>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              url: reader.result as string,
              type: file.type.startsWith('video/') ? 'video' : 'image',
              keywords: '',
              active: true,
              name: file.name,
              position: 'center'
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      try {
        const newAssets = await Promise.all(fileReaders);
        onUpdateSettings({
          ...settings,
          ui: {
            ...settings.ui,
            visualAssets: [...(settings.ui.visualAssets || []), ...newAssets]
          }
        });
        audio.playConfirmSound();
      } catch (error) {
        console.error("Failed to read files", error);
        audio.playWindowSound(false);
      }
    }
    e.target.value = '';
  };

  const handleAddUrlAsset = () => {
    if (!visualAssetUrl.trim()) return;
    const type = (visualAssetUrl.includes('.mp4') || visualAssetUrl.includes('.webm')) ? 'video' : 'image';
    const newAsset: VisualAsset = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      url: visualAssetUrl,
      type,
      keywords: '',
      active: true,
      name: 'URL Asset',
      position: 'center'
    };
    onUpdateSettings({
      ...settings,
      ui: {
        ...settings.ui,
        visualAssets: [...(settings.ui.visualAssets || []), newAsset]
      }
    });
    setVisualAssetUrl('');
    audio.playConfirmSound();
  };

  const updateVisualAsset = (id: string, updates: Partial<VisualAsset>) => {
    onUpdateSettings({
      ...settings,
      ui: {
        ...settings.ui,
        visualAssets: (settings.ui.visualAssets || []).map(a => a.id === id ? { ...a, ...updates } : a)
      }
    });
  };

  const removeVisualAsset = (id: string) => {
    if (confirm("Delete this visual asset?")) {
      onUpdateSettings({
        ...settings,
        ui: {
          ...settings.ui,
          visualAssets: (settings.ui.visualAssets || []).filter(a => a.id !== id)
        }
      });
      audio.playWindowSound(false);
    }
  };

  const handleDragStart = (index: number) => { setDraggedAssetIndex(index); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (index: number) => {
    if (draggedAssetIndex === null || draggedAssetIndex === index) return;
    const assets = [...(settings.ui.visualAssets || [])];
    const [removed] = assets.splice(draggedAssetIndex, 1);
    assets.splice(index, 0, removed);
    onUpdateSettings({ ...settings, ui: { ...settings.ui, visualAssets: assets } });
    setDraggedAssetIndex(null);
    audio.playClickSound();
  };

  const PositionGrid = ({ currentPos, onChange }: { currentPos: string, onChange: (p: string) => void }) => {
    const positions = ['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right'];
    return (
      <div className="grid grid-cols-3 gap-0.5 w-12 h-12 bg-black/50 border border-[color:var(--lain-cyan)]/20 p-0.5">
        {positions.map(pos => (
          <button key={pos} onClick={() => onChange(pos)} className={`w-full h-full hover:bg-[color:var(--lain-cyan)]/50 transition-colors ${currentPos === pos ? 'bg-[color:var(--lain-cyan)]' : 'bg-[color:var(--lain-cyan)]/10'}`} title={pos} />
        ))}
      </div>
    );
  };

  const getCurrentApiConfig = () => { if (apiLayer === 'generation') return settings.api; if (apiLayer === 'translation') return settings.translation || { source: 'google', apiKey: '', baseUrl: '', modelName: '' }; if (apiLayer === 'memory') return settings.memoryApi || settings.api; if (apiLayer === 'maps') return settings.mapsApi || { source: 'google', apiKey: '', baseUrl: '', modelName: '' }; if (apiLayer === 'maps') return settings.mapsApi || { source: 'google', apiKey: '', baseUrl: '', modelName: '' }; return settings.personaConfig || settings.api; };
  const updateCurrentApiConfig = (u: any) => {
    if (apiLayer === 'generation') onUpdateSettings({ ...settings, api: { ...settings.api, ...u } });
    else if (apiLayer === 'translation') onUpdateSettings({ ...settings, translation: { ...(settings.translation || { source: 'google', apiKey: '', baseUrl: '', modelName: '' }), ...u } });
    else if (apiLayer === 'memory') onUpdateSettings({ ...settings, memoryApi: { ...(settings.memoryApi || settings.api), ...u } });
    else if (apiLayer === 'maps') onUpdateSettings({ ...settings, mapsApi: { ...(settings.mapsApi || { source: 'google', apiKey: '', baseUrl: '', modelName: '' }), ...u } });
    else onUpdateSettings({ ...settings, personaConfig: { ...(settings.personaConfig || settings.api), ...u } });
  };

  const handleTestConnection = async () => {
    const config = getCurrentApiConfig();
    setApiStatus('loading');
    setStatusMsg(t('set_connecting', language));
    try {
      if (config.source === 'custom') {
        const models = await fetchCustomModels(config.baseUrl || '', config.apiKey || '');
        setFetchedModels(models);
        if (models.length > 0) setStatusMsg(`Online (${models.length} models)`);
        else setStatusMsg("Online (No models found)");
        setApiStatus('success');
      } else {
        await testGoogleConnection(config.apiKey || '');
        setApiStatus('success');
        setStatusMsg("Online");
      }
    } catch (e: any) { setApiStatus('error'); setStatusMsg(e.message); }
  };

  const handleTestTTS = () => { const u = new SpeechSynthesisUtterance("Audio check."); u.volume = settings.sound.volume; window.speechSynthesis.speak(u); };

  const TabButton = ({ id, label, icon: Icon }: any) => (<button onClick={() => setActiveTab(id)} className={`px-4 py-2 text-xs flex items-center gap-2 border-b-2 transition-all duration-200 ${activeTab === id ? 'border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/10' : 'border-transparent opacity-50 hover:opacity-100'}`}><Icon size={14} /> {label}</button>);

  const ModuleToggle = ({ id, label, icon: Icon, description }: any) => (
    <div className={`p-4 border transition-colors flex flex-col group ${settings.modules[id as keyof typeof settings.modules] ? 'border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/5' : 'border-[color:var(--lain-cyan)]/20 bg-black/40'}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 font-bold text-xs uppercase text-[color:var(--lain-cyan)]">
            <Icon size={14} /> {label}
          </div>
          <div className="text-[10px] opacity-60 max-w-[200px]">{description}</div>
        </div>
        <div
          onClick={() => onUpdateSettings({
            ...settings,
            modules: {
              ...settings.modules,
              [id]: !settings.modules[id as keyof typeof settings.modules]
            }
          })}
          className={`w-10 h-5 rounded-full border border-[color:var(--lain-cyan)] p-0.5 cursor-pointer relative ${settings.modules[id as keyof typeof settings.modules] ? 'bg-[color:var(--lain-cyan)]/20' : 'bg-black'}`}
        >
          <div className={`w-3.5 h-3.5 bg-[color:var(--lain-cyan)] shadow-[0_0_5px_var(--lain-cyan)] transition-transform ${settings.modules[id as keyof typeof settings.modules] ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
      </div>
    </div>
  );

  const renderUserTab = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4">
      <div className="flex gap-4">
        <div onClick={() => avatarInputRef.current?.click()} className="w-24 h-24 border border-[color:var(--lain-cyan)] bg-black flex items-center justify-center cursor-pointer group relative overflow-hidden shrink-0">
          {settings.user.avatar ? <img src={settings.user.avatar} className="w-full h-full object-cover" /> : <User size={32} className="opacity-50" />}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">{t('lbl_avatar_upload', language)}</div>
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <label className="text-[10px] opacity-70 tracking-widest uppercase">{t('lbl_identity', language)}</label>
            <input type="text" value={settings.user.username} onChange={e => onUpdateSettings({ ...settings, user: { ...settings.user, username: e.target.value } })} className="w-full bg-black border-b border-[color:var(--lain-cyan)] p-1 text-sm outline-none" />
          </div>
          <div>
            <label className="text-[10px] opacity-70 tracking-widest uppercase">HONORIFIC / TITLE (How AI calls you)</label>
            <input type="text" value={settings.user.honorific || ''} onChange={e => onUpdateSettings({ ...settings, user: { ...settings.user, honorific: e.target.value } })} placeholder="e.g. Master, User-san, Detective" className="w-full bg-black border-b border-[color:var(--lain-cyan)] p-1 text-sm outline-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] opacity-70 tracking-widest uppercase">{t('lbl_biodata', language)}</label>
          <div className="flex gap-2 mt-1">
            <input type="text" value={settings.user.gender} onChange={e => onUpdateSettings({ ...settings, user: { ...settings.user, gender: e.target.value } })} placeholder={t('lbl_gender', language)} className="flex-1 bg-black border border-[color:var(--lain-cyan)]/30 p-1 text-xs" />
            <input type="text" value={settings.user.age} onChange={e => onUpdateSettings({ ...settings, user: { ...settings.user, age: e.target.value } })} placeholder={t('lbl_age', language)} className="w-16 bg-black border border-[color:var(--lain-cyan)]/30 p-1 text-xs" />
          </div>
        </div>
        <div>
          <label className="text-[10px] opacity-70 tracking-widest uppercase">{t('lbl_region', language)}</label>
          <input type="text" value={settings.user.region} onChange={e => onUpdateSettings({ ...settings, user: { ...settings.user, region: e.target.value } })} placeholder="Country/City" className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-1 text-xs mt-1" />
        </div>
      </div>

      <div>
        <label className="text-[10px] opacity-70 tracking-widest uppercase">{t('lbl_lang_pack', language)}</label>
        <div className="flex gap-2 mt-1">
          {['en', 'zh', 'jp'].map(l => (
            <button key={l} onClick={() => onUpdateSettings({ ...settings, user: { ...settings.user, language: l as any } })} className={`flex-1 py-2 border border-[color:var(--lain-cyan)] text-xs font-bold transition-all ${settings.user.language === l ? 'bg-[color:var(--lain-cyan)] text-black' : 'hover:bg-[color:var(--lain-cyan)]/10'}`}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] opacity-70 tracking-widest uppercase">DESCRIPTION / PERSONA</label>
        <textarea value={settings.user.description} onChange={e => onUpdateSettings({ ...settings, user: { ...settings.user, description: e.target.value } })} className="w-full h-24 bg-black border border-[color:var(--lain-cyan)]/30 p-2 text-xs mt-1 resize-none focus:outline-none focus:border-[color:var(--lain-cyan)]" placeholder="How the AI perceives you..." />
      </div>

      <div className="pt-4 border-t border-[color:var(--lain-cyan)]/30 flex justify-between">
        <button onClick={handleExportUserProfile} className="px-4 py-2 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black text-xs font-bold flex items-center gap-2"><Download size={12} /> EXPORT PROFILE JSON</button>
      </div>
      <input type="file" ref={avatarInputRef} onChange={handleUserAvatarUpload} className="hidden" accept="image/*" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <NaviWindow title={t('settings_title', language)} className="w-full h-full md:w-[950px] md:h-[750px]" onClose={onClose}>
        <div className="flex flex-col h-full font-['Share_Tech_Mono'] text-[color:var(--lain-cyan)] bg-black/90">
          <div className="flex border-b border-[color:var(--lain-cyan)]/30 overflow-x-auto no-scrollbar bg-black/50 shrink-0">
            <TabButton id="gen" label={t('tab_gen', language)} icon={Cpu} />
            <TabButton id="api" label={t('tab_api', language)} icon={Wifi} />
            <TabButton id="modules" label={t('tab_modules', language)} icon={Puzzle} />
            <TabButton id="persona" label={t('tab_persona', language)} icon={User} />
            <TabButton id="groups" label={t('tab_groups', language)} icon={Users} />
            <TabButton id="world" label={t('tab_world', language)} icon={Globe} />
            <TabButton id="ui" label="UI" icon={Palette} />
            <TabButton id="audio" label="AUDIO" icon={Volume2} />
            <TabButton id="memory" label="MEMORY" icon={Database} />
            <TabButton id="data" label={t('tab_data', language)} icon={FileText} />
            <TabButton id="user" label="PROFILE" icon={User} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">

            {/* MODULES TAB - RESTORED */}
            {activeTab === 'modules' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-end border-b border-[color:var(--lain-cyan)]/30 pb-2">
                  <h3 className="font-bold text-lg tracking-widest uppercase flex items-center gap-2">
                    <Puzzle size={20} /> {t('mod_core', language)}
                  </h3>
                  <span className="text-[10px] opacity-40 italic">Active Modules are injected into the reasoning loop.</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ModuleToggle id="search" label={t('mod_search', language)} icon={Search} description={t('mod_search_desc', language)} />
                  <ModuleToggle id="maps" label={t('mod_maps', language)} icon={MapPin} description={t('mod_maps_desc', language)} />
                  <ModuleToggle id="thinking" label={t('mod_thinking', language)} icon={BrainCircuit} description={t('mod_thinking_desc', language)} />
                  <ModuleToggle id="veo" label={t('mod_veo', language)} icon={Video} description={t('mod_veo_desc', language)} />
                  <ModuleToggle id="imageGen" label={t('mod_img_gen', language)} icon={Sparkles} description={t('mod_img_gen_desc', language)} />
                  <ModuleToggle id="imageEdit" label={t('mod_img_edit', language)} icon={Edit2} description={t('mod_img_edit_desc', language)} />
                  <ModuleToggle id="speech" label="Gemini TTS" icon={Speech} description={t('mod_transcription_desc', language)} />
                  <ModuleToggle id="transcription" label={t('mod_transcription', language)} icon={Mic} description={t('mod_transcription_desc', language)} />
                  <ModuleToggle id="live" label={t('mod_live', language)} icon={Router} description={t('mod_live_desc', language)} />
                  <ModuleToggle id="autonomous" label="Autonomous Action" icon={Shuffle} description="Allow AI to perform tasks without user input." />
                  <ModuleToggle id="analysis" label="Context Analysis" icon={Search} description="AI analyzes visual context for smarter replies." />
                </div>
              </div>
            )}

            {activeTab === 'persona' && (
              <div className="flex h-full gap-6 animate-in fade-in slide-in-from-right-2 duration-300">
                {/* Side Selector */}
                <div className="w-1/4 border-r border-[color:var(--lain-cyan)]/30 pr-4 flex flex-col gap-2">
                  <button onClick={handleAddPersona} className="w-full py-2 border border-dashed border-[color:var(--lain-cyan)] text-[10px] font-bold tracking-widest hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors mb-2 uppercase">+ New Node</button>
                  <div className="flex gap-2 mb-2">
                    <button onClick={handleExportPersona} className="flex-1 border border-[color:var(--lain-cyan)]/30 text-[9px] hover:text-white transition-all uppercase"><Download size={10} className="inline mr-1" /> Exp</button>
                    <button onClick={handleImportClick} className="flex-1 border border-[color:var(--lain-cyan)]/30 text-[9px] hover:text-white transition-all uppercase"><Upload size={10} className="inline mr-1" /> Imp</button>
                    <input type="file" ref={fileInputRef} onChange={handleImportPersona} className="hidden" accept=".json" />
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
                    {settings.characterLibrary.map(p => (
                      <div key={p.id} onClick={() => setEditingPersonaId(p.id)} className={`p-2 cursor-pointer border text-[10px] truncate flex items-center justify-between group ${editingPersonaId === p.id ? 'border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/20 font-bold text-glow shadow-[0_0_5px_var(--lain-cyan)]' : 'border-transparent hover:bg-[color:var(--lain-cyan)]/10 opacity-70 hover:opacity-100'}`}>
                        <span className="truncate">{p.name}</span>
                        {editingPersonaId === p.id && <RefreshCw size={8} className="animate-spin-slow" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Editor Area - SillyTavern / AIRP Inspired */}
                <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
                  {editingPersona ? (
                    <div className="space-y-6">
                      {/* Header Section */}
                      <div className="flex justify-between items-start border-b border-[color:var(--lain-cyan)]/30 pb-4">
                        <div className="flex items-center gap-2">
                          <Award size={18} className="text-yellow-400" />
                          <h3 className="font-bold text-lg tracking-[0.2em] uppercase">ENTITY_CONFIG: {editingPersona.name.toUpperCase()}</h3>
                        </div>
                        <button onClick={() => handleDeletePersona(editingPersona.id)} className="text-red-500 hover:text-white transition-colors flex items-center gap-1 text-[10px] border border-red-500/30 px-2 py-1 hover:bg-red-500/20"><Trash2 size={12} /> {t('ui_delete', language)}</button>
                      </div>

                      {/* Visuals / Identity Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <div onClick={() => personaAvatarInputRef.current?.click()} className="w-24 h-24 border border-[color:var(--lain-cyan)] bg-black cursor-pointer overflow-hidden relative group shrink-0 win98-bevel">
                              {editingPersona.avatar ? <img src={editingPersona.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <User size={32} className="m-auto opacity-30 mt-6" />}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold transition-opacity">AVATAR</div>
                            </div>
                            <input type="file" ref={personaAvatarInputRef} onChange={handlePersonaAvatarUpload} className="hidden" accept="image/*" />
                            <div className="flex-1 space-y-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold opacity-50 tracking-widest uppercase flex items-center gap-1"><Info size={8} /> {t('lbl_name', language)}</label>
                                <input value={editingPersona.name} onChange={e => updateEditingPersona({ name: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/40 p-2 text-sm font-bold focus:outline-none focus:border-[color:var(--lain-cyan)] win98-bevel-pressed" placeholder="Name" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold opacity-50 tracking-widest uppercase">{t('lbl_age', language)}</label>
                                  <input value={editingPersona.age || ""} onChange={e => updateEditingPersona({ age: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/40 p-2 text-[10px] focus:outline-none focus:border-[color:var(--lain-cyan)]" placeholder="Age" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold opacity-50 tracking-widest uppercase">{t('lbl_gender', language)}</label>
                                  <input value={editingPersona.gender || ""} onChange={e => updateEditingPersona({ gender: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/40 p-2 text-[10px] focus:outline-none focus:border-[color:var(--lain-cyan)]" placeholder="Gender" />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold opacity-50 tracking-widest uppercase flex items-center gap-1"><MapPin size={8} /> {t('lbl_region', language)}</label>
                              <input value={editingPersona.region || ""} onChange={e => updateEditingPersona({ region: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/40 p-2 text-[10px] focus:outline-none focus:border-[color:var(--lain-cyan)]" placeholder="Location" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold opacity-50 tracking-widest uppercase flex items-center gap-1"><Languages size={8} /> {t('lbl_lang', language)}</label>
                              <input value={editingPersona.nativeLanguage || "English"} onChange={e => updateEditingPersona({ nativeLanguage: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/40 p-2 text-[10px] focus:outline-none focus:border-[color:var(--lain-cyan)]" placeholder="Language" />
                            </div>
                          </div>
                        </div>

                        {/* Meta Info Sidebar */}
                        <div className="space-y-4">
                          <div className="p-3 border border-[color:var(--lain-cyan)]/20 bg-black/40 space-y-3">
                            <label className="text-[10px] font-bold opacity-60 tracking-[0.2em] block border-b border-[color:var(--lain-cyan)]/20 pb-1 mb-2 uppercase">{t('lbl_persona_trait', language)}</label>
                            <textarea value={editingPersona.personality || ""} onChange={e => updateEditingPersona({ personality: e.target.value })} className="w-full bg-black/50 border border-[color:var(--lain-cyan)]/30 p-2 text-[10px] h-20 resize-none focus:outline-none focus:border-[color:var(--lain-cyan)]" placeholder="Stoic, mysterious, analytical..." />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold opacity-50 tracking-widest uppercase flex items-center gap-1 text-green-400"><Heart size={8} /> {t('lbl_likes', language)}</label>
                              <textarea value={editingPersona.likes || ""} onChange={e => updateEditingPersona({ likes: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-2 text-[9px] h-16 resize-none focus:outline-none" placeholder="Reading, tea..." />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold opacity-50 tracking-widest uppercase flex items-center gap-1 text-red-400"><HeartOff size={8} /> {t('lbl_dislikes', language)}</label>
                              <textarea value={editingPersona.dislikes || ""} onChange={e => updateEditingPersona({ dislikes: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-2 text-[9px] h-16 resize-none focus:outline-none" placeholder="Crowds, noise..." />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Prompting Logic - AIRP / SillyTavern Style */}
                      <div className="space-y-4 border-t border-[color:var(--lain-cyan)]/20 pt-6">
                        <div className="space-y-1">
                          <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold text-[color:var(--lain-cyan)] tracking-[0.2em] uppercase">{t('lbl_sys_prompt', language)}</label>
                            <span className="text-[8px] opacity-40 font-mono">Character depth and core behavior</span>
                          </div>
                          <textarea value={editingPersona.systemPrompt} onChange={e => updateEditingPersona({ systemPrompt: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/40 p-3 text-xs font-mono h-40 resize-none focus:outline-none focus:border-[color:var(--lain-cyan)] win98-bevel-pressed leading-relaxed" placeholder="Describe the core logic, personality, and instructions..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-blue-400 tracking-widest uppercase flex items-center gap-1"><Globe size={10} /> {t('lbl_scenario', language)}</label>
                            <textarea value={editingPersona.scenario || ""} onChange={e => updateEditingPersona({ scenario: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-3 text-xs h-24 resize-none focus:outline-none focus:border-[color:var(--lain-cyan)]" placeholder="Describe the current situation, world, or specific setting..." />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-purple-400 tracking-widest uppercase flex items-center gap-1"><Users size={10} /> {t('lbl_relationships', language)}</label>
                            <textarea value={editingPersona.relationships || ""} onChange={e => updateEditingPersona({ relationships: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-3 text-xs h-24 resize-none focus:outline-none focus:border-[color:var(--lain-cyan)]" placeholder="Connections with the user or other NPCs..." />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-yellow-300 tracking-widest uppercase flex items-center gap-1"><Type size={10} /> {t('lbl_writing_style', language)}</label>
                          <textarea value={editingPersona.writingStyle || ""} onChange={e => updateEditingPersona({ writingStyle: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-2 text-xs h-16 resize-none focus:outline-none focus:border-[color:var(--lain-cyan)]" placeholder="Briefly describe how they talk (e.g. 'short sentences, frequent pauses, lowercase')...." />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold text-[color:var(--lain-cyan)] tracking-widest uppercase flex items-center gap-1"><MessageSquare size={10} /> {t('lbl_example_dialogue', language)}</label>
                            <span className="text-[8px] opacity-40">Format as: User: text\nPersona: text</span>
                          </div>
                          <textarea value={editingPersona.exampleDialogue || ""} onChange={e => updateEditingPersona({ exampleDialogue: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-3 text-xs font-mono h-32 resize-none focus:outline-none focus:border-[color:var(--lain-cyan)]" placeholder="User: Hello there.\nPersona: ...connected. Greeting sequence initialized." />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[color:var(--lain-cyan)] tracking-widest uppercase">{t('lbl_custom_opening', language)}</label>
                          <textarea value={editingPersona.customOpening || ""} onChange={e => updateEditingPersona({ customOpening: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-2 text-xs h-16 resize-none focus:outline-none focus:border-[color:var(--lain-cyan)]" placeholder="The first thing the character says when a new session starts..." />
                        </div>
                      </div>

                      {/* Decoration & Feature Sidebar */}
                      <div className="border-t border-[color:var(--lain-cyan)]/20 pt-6 pb-4">
                        <h4 className="text-[11px] font-bold tracking-[0.3em] mb-4 uppercase flex items-center gap-2 opacity-60"><Palette size={12} /> Appearance & Protocols (Custom Layer)</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 border border-[color:var(--lain-cyan)]/30 bg-black/40 flex items-center justify-between group hover:bg-[color:var(--lain-cyan)]/5 transition-all">
                            <div className="flex items-center gap-3">
                              <Smile size={16} className={editingPersona.allowEmoji ? 'text-[color:var(--lain-cyan)] animate-pulse' : 'opacity-40'} />
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest">{t('lbl_emoji_prot', language)}</div>
                                <div className="text-[8px] opacity-50 uppercase">{t('lbl_emoji_desc', language)}</div>
                              </div>
                            </div>
                            <div
                              onClick={() => updateEditingPersona({ allowEmoji: !editingPersona.allowEmoji })}
                              className={`w-10 h-5 border border-[color:var(--lain-cyan)] p-0.5 cursor-pointer relative ${editingPersona.allowEmoji ? 'bg-[color:var(--lain-cyan)]/20' : 'bg-black'}`}
                            >
                              <div className={`w-3.5 h-3.5 bg-[color:var(--lain-cyan)] shadow-[0_0_5px_var(--lain-cyan)] transition-transform ${editingPersona.allowEmoji ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold opacity-50 tracking-widest uppercase">{t('lbl_banner_upload', language)}</label>
                              <div onClick={() => personaBannerInputRef.current?.click()} className="h-10 w-full border border-dashed border-[color:var(--lain-cyan)]/40 cursor-pointer flex items-center justify-center text-[8px] opacity-70 hover:opacity-100 transition-all overflow-hidden relative bg-black/40">
                                {editingPersona.banner ? <img src={editingPersona.banner} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" /> : "UPLOAD"}
                                <Upload size={10} className="absolute inset-0 m-auto opacity-20 pointer-events-none" />
                              </div>
                              <input type="file" ref={personaBannerInputRef} onChange={handlePersonaBannerUpload} className="hidden" accept="image/*" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold opacity-50 tracking-widest uppercase">{t('set_chat_bg', language)}</label>
                              <div onClick={() => personaWallpaperInputRef.current?.click()} className="h-10 w-full border border-dashed border-[color:var(--lain-cyan)]/40 cursor-pointer flex items-center justify-center text-[8px] opacity-70 hover:opacity-100 transition-all overflow-hidden relative bg-black/40">
                                {editingPersona.chatWallpaper ? <img src={editingPersona.chatWallpaper} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" /> : "UPLOAD"}
                                <ImageIcon size={10} className="absolute inset-0 m-auto opacity-20 pointer-events-none" />
                              </div>
                              <input type="file" ref={personaWallpaperInputRef} onChange={handlePersonaWallpaperUpload} className="hidden" accept="image/*" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="text-[9px] font-bold opacity-50 tracking-widest uppercase flex items-center gap-1"><Ghost size={8} /> {t('lbl_author_notes', language)}</label>
                        <textarea value={editingPersona.notes || ""} onChange={e => updateEditingPersona({ notes: e.target.value })} className="w-full bg-black/50 border border-[color:var(--lain-cyan)]/20 p-2 text-[10px] h-20 resize-none focus:outline-none italic" placeholder="Personal notes about this character's story arc or private details..." />
                      </div>
                    </div>
                  ) : <div className="opacity-40 text-center mt-20 flex flex-col items-center gap-4"><Network size={48} className="animate-pulse" /><div className="text-sm tracking-[0.2em]">SELECT NETWORK NODE TO CONFIGURE</div></div>}
                </div>
              </div>
            )}

            {activeTab === 'gen' && (
              <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div className="space-y-2 mb-6">
                  <label className="block text-xs font-bold tracking-widest opacity-80 uppercase">{t('lbl_mode', language)}</label>
                  <div className="flex border border-[color:var(--lain-cyan)]/30 bg-black p-1 win98-bevel-pressed">
                    <button onClick={() => onUpdateSettings({ ...settings, generation: { ...settings.generation, chatMode: 'rp' } })} className={`flex-1 py-3 text-xs tracking-widest font-bold transition-all duration-200 ${settings.generation.chatMode === 'rp' ? 'bg-[color:var(--lain-cyan)] text-black text-glow' : 'hover:bg-[color:var(--lain-cyan)]/10 text-[color:var(--lain-cyan)] opacity-60'}`}>{t('opt_rp', language)}</button>
                    <button onClick={() => onUpdateSettings({ ...settings, generation: { ...settings.generation, chatMode: 'msg' } })} className={`flex-1 py-3 text-xs tracking-widest font-bold transition-all duration-200 ${settings.generation.chatMode === 'msg' ? 'bg-[color:var(--lain-cyan)] text-black text-glow' : 'hover:bg-[color:var(--lain-cyan)]/10 text-[color:var(--lain-cyan)] opacity-60'}`}>{t('opt_msg', language)}</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="block text-xs font-bold tracking-widest opacity-80">{t('lbl_ctx', language)}</label><input type="number" value={settings.generation.maxContextLength} onChange={e => onUpdateSettings({ ...settings, generation: { ...settings.generation, maxContextLength: parseInt(e.target.value) } })} className="w-full bg-black border border-[color:var(--lain-cyan)]/50 p-3 text-right focus:outline-none focus:border-[color:var(--lain-cyan)] win98-bevel-pressed" /></div>
                  <div className="space-y-2"><label className="block text-xs font-bold tracking-widest opacity-80">{t('lbl_out', language)}</label><input type="number" value={settings.generation.maxOutputTokens} onChange={e => onUpdateSettings({ ...settings, generation: { ...settings.generation, maxOutputTokens: parseInt(e.target.value) } })} className="w-full bg-black border border-[color:var(--lain-cyan)]/50 p-3 text-right focus:outline-none focus:border-[color:var(--lain-cyan)] win98-bevel-pressed" /></div>
                </div>
                <div className="p-4 border border-[color:var(--lain-cyan)]/30 bg-black/40 flex items-center justify-between"><div><div className="font-bold text-xs tracking-[0.2em] text-[color:var(--lain-cyan)] mb-1 uppercase">Verbose_Descriptions</div><div className="text-[10px] opacity-70">Include environmental and sensory data in responses</div></div><input type="checkbox" checked={settings.generation.includeActions !== false} onChange={e => onUpdateSettings({ ...settings, generation: { ...settings.generation, includeActions: e.target.checked } })} className="w-5 h-5 accent-[color:var(--lain-cyan)]" /></div>
                <div className="flex items-center justify-between border border-[color:var(--lain-cyan)]/30 p-4 bg-[color:var(--lain-cyan)]/5"><span className="font-bold tracking-widest text-sm uppercase">{t('lbl_stream', language)}</span><input type="checkbox" checked={settings.generation.streaming} onChange={e => onUpdateSettings({ ...settings, generation: { ...settings.generation, streaming: e.target.checked } })} className="w-5 h-5 accent-[color:var(--lain-cyan)]" /></div>
                <div className="space-y-4 p-5 border border-[color:var(--lain-cyan)]/30 bg-black/40"><h3 className="font-bold border-b border-[color:var(--lain-cyan)]/30 pb-2 mb-4 text-xs tracking-[0.2em] text-[color:var(--lain-cyan)] uppercase">{t('lbl_sampling', language)}</h3><div className="space-y-3"><div className="flex justify-between text-xs sm:text-sm uppercase"><span>{t('lbl_temp', language)}</span><span className="font-mono bg-[color:var(--lain-cyan)]/10 px-2 rounded">{settings.generation.temperature}</span></div><input type="range" min="0" max="2" step="0.05" value={settings.generation.temperature} onChange={e => onUpdateSettings({ ...settings, generation: { ...settings.generation, temperature: parseFloat(e.target.value) } })} className="w-full accent-[color:var(--lain-cyan)] h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" /></div></div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div className="flex border-b border-[color:var(--lain-cyan)]/30 mb-4 overflow-x-auto no-scrollbar">
                  <button onClick={() => setApiLayer('generation')} className={`px-4 py-2 text-xs font-bold tracking-wider border-b-2 transition-all shrink-0 ${apiLayer === 'generation' ? 'border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)]' : 'border-transparent opacity-50 hover:opacity-100'}`}>{t('set_gen_link', language)}</button>
                  <button onClick={() => setApiLayer('translation')} className={`px-4 py-2 text-xs font-bold tracking-wider border-b-2 transition-all shrink-0 ${apiLayer === 'translation' ? 'border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)]' : 'border-transparent opacity-50 hover:opacity-100'}`}>{t('set_trans_layer', language)}</button>
                  <button onClick={() => setApiLayer('memory')} className={`px-4 py-2 text-xs font-bold tracking-wider border-b-2 transition-all shrink-0 ${apiLayer === 'memory' ? 'border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)]' : 'border-transparent opacity-50 hover:opacity-100'}`}>{t('set_mem_layer', language)}</button>
                  <button onClick={() => setApiLayer('persona')} className={`px-4 py-2 text-xs font-bold tracking-wider border-b-2 transition-all shrink-0 ${apiLayer === 'persona' ? 'border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)]' : 'border-transparent opacity-50 hover:opacity-100'}`}>{t('set_persona_layer', language)}</button>
                  <button onClick={() => setApiLayer('maps')} className={`px-4 py-2 text-xs font-bold tracking-wider border-b-2 transition-all shrink-0 ${apiLayer === 'maps' ? 'border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)]' : 'border-transparent opacity-50 hover:opacity-100'}`}>MAPS</button>
                  <button onClick={() => setApiLayer('maps')} className={`px-4 py-2 text-xs font-bold tracking-wider border-b-2 transition-all shrink-0 ${apiLayer === 'maps' ? 'border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)]' : 'border-transparent opacity-50 hover:opacity-100'}`}>MAPS</button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2"><label className="text-xs font-bold tracking-widest opacity-70 uppercase">{t('lbl_source', language)}</label><select value={getCurrentApiConfig().source} onChange={(e) => updateCurrentApiConfig({ source: e.target.value as any })} className="w-full bg-black border border-[color:var(--lain-cyan)]/50 p-2 text-sm focus:border-[color:var(--lain-cyan)]"><option value="google">GOOGLE GEMINI (OFFICIAL)</option><option value="custom">CUSTOM OPENAI-COMPATIBLE</option></select></div>
                  {getCurrentApiConfig().source === 'custom' && (<div className="space-y-2"><label className="text-xs font-bold tracking-widest opacity-70 uppercase">{t('lbl_url', language)}</label><input type="text" value={getCurrentApiConfig().baseUrl} onChange={(e) => updateCurrentApiConfig({ baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" className="w-full bg-black border border-[color:var(--lain-cyan)]/50 p-2 text-sm focus:border-[color:var(--lain-cyan)] placeholder-[color:var(--lain-cyan)]/30" /></div>)}
                  <div className="space-y-2"><label className="text-xs font-bold tracking-widest opacity-70 uppercase">{t('lbl_key', language)}</label><input type="password" value={getCurrentApiConfig().apiKey} onChange={(e) => updateCurrentApiConfig({ apiKey: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/50 p-2 text-sm focus:border-[color:var(--lain-cyan)]" placeholder={apiLayer === 'translation' ? "Use Main Key if empty" : "sk-..."} /></div>
                  <div className="space-y-2"><label className="text-xs font-bold tracking-widest opacity-70 uppercase">{t('lbl_model', language)}</label>{getCurrentApiConfig().source === 'google' ? (<select value={getCurrentApiConfig().modelName} onChange={(e) => updateCurrentApiConfig({ modelName: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/50 p-2 text-sm"><option value="gemini-3-flash-preview">Gemini 3 Flash</option><option value="gemini-3-pro-preview">Gemini 3 Pro</option><option value="gemini-2.5-flash-latest">Gemini 2.5 Flash</option><option value="gemini-2.5-pro-latest">Gemini 2.5 Pro</option></select>) : (<div className="flex gap-2"><input type="text" value={getCurrentApiConfig().modelName} onChange={(e) => updateCurrentApiConfig({ modelName: e.target.value })} placeholder="gpt-4o" className="flex-1 bg-black border border-[color:var(--lain-cyan)]/50 p-2 text-sm" />{fetchedModels.length > 0 && (<select onChange={(e) => updateCurrentApiConfig({ modelName: e.target.value })} className="w-32 bg-black border border-[color:var(--lain-cyan)]/50 text-xs"><option value="">Select...</option>{fetchedModels.map(m => <option key={m} value={m}>{m}</option>)}</select>)}</div>)}</div>
                  <button onClick={handleTestConnection} disabled={apiStatus === 'loading'} className={`w-full py-3 mt-4 border border-[color:var(--lain-cyan)] font-bold tracking-widest text-xs transition-all duration-300 ${apiStatus === 'success' ? 'bg-green-500/20 border-green-500 text-green-500 shadow-[0_0_10px_green]' : apiStatus === 'error' ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_10px_red]' : 'hover:bg-[color:var(--lain-cyan)] hover:text-black'}`}>
                    {apiStatus === 'loading' ? <Loader className="animate-spin inline mr-2" size={14} /> : (apiStatus === 'success' ? <CheckCircle className="inline mr-2" size={14} /> : (apiStatus === 'error' ? <AlertCircle className="inline mr-2" size={14} /> : <Wifi className="inline mr-2" size={14} />))}
                    {apiStatus === 'loading' ? t('set_connecting', language) : t('set_test_conn', language)}
                  </button>
                  {statusMsg && (<div className={`text-center text-xs font-bold tracking-widest p-2 border ${apiStatus === 'error' ? 'border-red-500 text-red-500 bg-red-900/10' : (apiStatus === 'success' ? 'border-green-500 text-green-500 bg-green-900/10' : 'border-[color:var(--lain-cyan)]/30')}`}>{statusMsg}</div>)}
                </div>
              </div>
            )}

            {activeTab === 'user' && renderUserTab()}

            {activeTab === 'ui' && (
              <div className="space-y-8 max-w-2xl mx-auto animate-in slide-in-from-right-4 duration-300">
                <div className="p-6 border border-[color:var(--lain-cyan)]/30 bg-[color:var(--lain-cyan)]/5 space-y-6">
                  <h3 className="font-bold tracking-widest uppercase flex items-center gap-2"><Palette size={18} /> APPEARANCE / THEME</h3>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest opacity-70 uppercase">{t('set_app_bg', language)}</label>
                      <div className="flex gap-2">
                        <button onClick={() => wallpaperInputRef.current?.click()} className="flex-1 py-2 border border-dashed border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)]/10 text-[10px] transition-all uppercase">{t('set_upload', language)}</button>
                        {settings.ui.wallpaper && <button onClick={() => onUpdateSettings({ ...settings, ui: { ...settings.ui, wallpaper: undefined } })} className="px-3 border border-red-500 text-red-500 hover:text-white hover:bg-red-500 transition-all"><X size={12} /></button>}
                        <input type="file" ref={wallpaperInputRef} onChange={handleWallpaperUpload} className="hidden" accept="image/*" />
                      </div>
                      <div className="flex items-center gap-2 mt-2"><span className="text-[10px] opacity-60 uppercase">{t('set_opacity', language)}</span><input type="range" min="0" max="1" step="0.1" value={settings.ui.wallpaperOpacity} onChange={(e) => onUpdateSettings({ ...settings, ui: { ...settings.ui, wallpaperOpacity: parseFloat(e.target.value) } })} className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[color:var(--lain-cyan)]" /></div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest opacity-70 uppercase">{t('set_chat_bg', language)}</label>
                      <div className="flex gap-2">
                        <button onClick={() => chatWallpaperInputRef.current?.click()} className="flex-1 py-2 border border-dashed border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)]/10 text-[10px] transition-all uppercase">{t('set_upload', language)}</button>
                        {settings.ui.chatWallpaper && <button onClick={() => onUpdateSettings({ ...settings, ui: { ...settings.ui, chatWallpaper: undefined } })} className="px-3 border border-red-500 text-red-500 hover:text-white hover:bg-red-500 transition-all"><X size={12} /></button>}
                        <input type="file" ref={chatWallpaperInputRef} onChange={handleChatWallpaperUpload} className="hidden" accept="image/*" />
                      </div>
                      <div className="flex items-center gap-2 mt-2"><span className="text-[10px] opacity-60 uppercase">{t('set_opacity', language)}</span><input type="range" min="0" max="1" step="0.1" value={settings.ui.chatWallpaperOpacity} onChange={(e) => onUpdateSettings({ ...settings, ui: { ...settings.ui, chatWallpaperOpacity: parseFloat(e.target.value) } })} className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[color:var(--lain-cyan)]" /></div>
                    </div>
                  </div>

                  {/* Visual Asset Manager */}
                  <div className="space-y-4 pt-4 border-t border-[color:var(--lain-cyan)]/20">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold tracking-widest opacity-70 flex items-center gap-2 uppercase">
                        <ImageIcon size={12} /> Visual Assets (SPRITE_LAYER)
                      </label>
                      <div className="flex gap-2">
                        <button onClick={() => visualAssetInputRef.current?.click()} className="p-1 px-2 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black text-[9px] flex items-center gap-1 uppercase transition-all">
                          <Upload size={10} /> Bulk Upload
                        </button>
                        <input type="file" ref={visualAssetInputRef} onChange={handleVisualAssetUpload} className="hidden" accept="image/*,video/mp4,video/webm" multiple />
                      </div>
                    </div>

                    <div className="bg-black/40 border border-[color:var(--lain-cyan)]/20 p-4 space-y-4">
                      <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-bold opacity-60 uppercase">Visual Mode:</div>
                        <div className="flex border border-[color:var(--lain-cyan)]/30">
                          {[{ id: 'static', label: 'STATIC' }, { id: 'cycle', label: 'CYCLE' }, { id: 'context', label: 'CONTEXT' }].map((mode) => (
                            <button key={mode.id} onClick={() => onUpdateSettings({ ...settings, ui: { ...settings.ui, visualMode: mode.id as any } })} className={`flex-1 py-2 text-[10px] transition-all ${settings.ui.visualMode === mode.id ? 'bg-[color:var(--lain-cyan)] text-black font-bold' : 'hover:bg-[color:var(--lain-cyan)]/10 text-[color:var(--lain-cyan)]'}`}>{mode.label}</button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto scrollbar-thin p-1 border border-[color:var(--lain-cyan)]/10 bg-black/20">
                        {(settings.ui.visualAssets || []).map((asset, index) => (
                          <div key={asset.id} draggable onDragStart={() => handleDragStart(index)} onDragOver={handleDragOver} onDrop={() => handleDrop(index)} className={`relative border border-[color:var(--lain-cyan)]/30 bg-black p-1 flex flex-col gap-1 cursor-grab active:cursor-grabbing hover:border-[color:var(--lain-cyan)]/60 transition-all ${draggedAssetIndex === index ? 'opacity-30' : ''}`}>
                            <div className="w-full h-16 bg-black/50 relative overflow-hidden flex items-center justify-center group/img">
                              {asset.type === 'video' ? <Video size={20} className="opacity-50" /> : <img src={asset.url} alt="asset" className="w-full h-full object-cover opacity-70 group-hover/img:opacity-100 transition-opacity" style={{ objectPosition: asset.position || 'center' }} />}
                              <div className="absolute top-0 left-0 opacity-0 group-hover/img:opacity-100 transition-all scale-75 origin-top-left"><PositionGrid currentPos={asset.position || 'center'} onChange={(pos) => updateVisualAsset(asset.id, { position: pos })} /></div>
                              <button onClick={() => removeVisualAsset(asset.id)} className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-sm opacity-0 group-hover/img:opacity-100 transition-all"><X size={8} /></button>
                            </div>
                            <div className="flex items-center gap-1">
                              <input type="checkbox" checked={asset.active} onChange={(e) => updateVisualAsset(asset.id, { active: e.target.checked })} className="accent-[color:var(--lain-cyan)] w-3 h-3" />
                              <input type="text" value={asset.keywords} onChange={(e) => updateVisualAsset(asset.id, { keywords: e.target.value })} placeholder="tags" className="flex-1 bg-transparent border-b border-[color:var(--lain-cyan)]/30 text-[8px] focus:outline-none placeholder-white/20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Custom Cursor Section */}
                  <div className="space-y-4 pt-4 border-t border-[color:var(--lain-cyan)]/20">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold tracking-widest opacity-70 flex items-center gap-2 uppercase">
                        <MousePointer2 size={12} /> Custom Cursors (UI_REPLACEMENT)
                      </label>
                      <input type="file" ref={customCursorInputRef} onChange={handleCustomCursorUpload} className="hidden" accept="image/*" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[{ id: 'default', label: 'ARROW', icon: MousePointer2 }, { id: 'pointer', label: 'CLICK', icon: MousePointer2 }, { id: 'text', label: 'EDIT', icon: TextCursor }, { id: 'wait', label: 'BUSY', icon: Loader }].map((cursor) => (
                        <div key={cursor.id} className="flex flex-col gap-2 p-2 border border-[color:var(--lain-cyan)]/20 bg-black/40 group relative overflow-hidden">
                          <div className="text-[9px] font-bold opacity-60 text-center uppercase tracking-tighter">{cursor.label}</div>
                          <div className="h-10 flex items-center justify-center bg-black/50 border border-[color:var(--lain-cyan)]/10 relative">
                            {settings.ui.customCursors?.[cursor.id] ? <img src={settings.ui.customCursors[cursor.id]} alt={cursor.id} className="h-6 w-auto object-contain" /> : <cursor.icon size={16} className="opacity-20" />}
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                              <button onClick={() => { setActiveCursorType(cursor.id); customCursorInputRef.current?.click(); }} className="p-1 text-[color:var(--lain-cyan)] hover:text-white" title="Upload"><Upload size={10} /></button>
                              {settings.ui.customCursors?.[cursor.id] && <button onClick={() => removeCustomCursor(cursor.id)} className="p-1 text-red-500 hover:text-white" title="Reset"><X size={10} /></button>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'world' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold uppercase flex items-center gap-2"><Globe size={18} /> {t('tab_world', language)} / LOREBOOK</h3><button onClick={() => onUpdateLore([...lorebook, { id: Date.now().toString(), keywords: "", content: "", active: true }])} className="p-1 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-all"><Plus size={14} /></button></div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin pr-2">
                  {lorebook.length === 0 && <div className="text-center opacity-40 text-xs py-8 border border-dashed border-[color:var(--lain-cyan)]/20 uppercase tracking-widest">No entries in memory_bank</div>}
                  {lorebook.map((entry, idx) => (
                    <div key={entry.id} className="border border-[color:var(--lain-cyan)]/30 p-4 bg-black/40 group relative overflow-hidden">
                      <div className="flex gap-2 mb-2 relative z-10">
                        <input value={entry.keywords} onChange={e => onUpdateLore(lorebook.map((l, i) => i === idx ? { ...l, keywords: e.target.value } : l))} className="flex-1 bg-black border-b border-[color:var(--lain-cyan)]/50 p-1 text-xs font-bold focus:outline-none uppercase tracking-tighter" placeholder="Keywords (comma separated)" />
                        <div className="flex items-center gap-2"><input type="checkbox" checked={entry.active} onChange={e => onUpdateLore(lorebook.map((l, i) => i === idx ? { ...l, active: e.target.checked } : l))} className="accent-[color:var(--lain-cyan)]" /><button onClick={() => onUpdateLore(lorebook.filter((_, i) => i !== idx))} className="text-red-500 hover:text-white transition-colors"><Trash2 size={14} /></button></div>
                      </div>
                      <textarea value={entry.content} onChange={e => onUpdateLore(lorebook.map((l, i) => i === idx ? { ...l, content: e.target.value } : l))} className="w-full bg-black/50 p-2 text-xs h-20 resize-none focus:outline-none border border-transparent focus:border-[color:var(--lain-cyan)]/30 win98-bevel-pressed relative z-10 font-mono" placeholder="Context content..." />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="flex h-full gap-4 animate-in fade-in duration-300">
                <div className="w-1/3 border-r border-[color:var(--lain-cyan)]/30 pr-2 overflow-y-auto scrollbar-thin flex flex-col gap-2">
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => handleAddGroup('msg')} className="flex-1 text-[9px] border border-[color:var(--lain-cyan)]/50 hover:bg-[color:var(--lain-cyan)]/10 py-1 transition-all uppercase tracking-widest font-bold">+ New MSG Group</button>
                    <button onClick={() => handleAddGroup('rp')} className="flex-1 text-[9px] border border-purple-500/50 hover:bg-purple-500/10 py-1 transition-all uppercase tracking-widest font-bold">+ New Party</button>
                  </div>
                  {(settings.groups || []).map(g => (
                    <div key={g.id} onClick={() => setEditingGroupId(g.id)} className={`p-2 cursor-pointer border transition-all duration-200 ${editingGroupId === g.id ? 'border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/10 shadow-[0_0_5px_var(--lain-cyan)]' : 'border-transparent hover:border-[color:var(--lain-cyan)]/30 opacity-70 hover:opacity-100'}`}>
                      <div className="font-bold text-xs truncate">{g.name}</div>
                      <div className="text-[8px] opacity-50 uppercase tracking-widest">{g.mode?.toUpperCase() || 'MSG'} • {g.members.length} Members</div>
                    </div>
                  ))}
                </div>
                <div className="flex-1 pl-2 overflow-y-auto scrollbar-thin">
                  {editingGroup ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-[color:var(--lain-cyan)]/20 pb-2"><h3 className="font-bold text-sm tracking-widest uppercase">GROUP_SYNC: {editingGroup.name.toUpperCase()}</h3><button onClick={() => handleDeleteGroup(editingGroup.id)} className="text-red-500 hover:text-white transition-all"><Trash2 size={14} /></button></div>
                      <div className="space-y-1"><label className="text-[9px] opacity-60 font-bold uppercase tracking-widest">{t('lbl_name', language)}</label><input value={editingGroup.name} onChange={e => updateEditingGroup({ name: e.target.value })} className="w-full bg-black border-b border-[color:var(--lain-cyan)]/50 p-1 text-sm outline-none font-bold" /></div>
                      <div className="space-y-1"><label className="text-[9px] opacity-60 font-bold uppercase tracking-widest">{t('lbl_desc', language)}</label><textarea value={editingGroup.description} onChange={e => updateEditingGroup({ description: e.target.value })} className="w-full bg-black border border-[color:var(--lain-cyan)]/30 p-2 text-xs h-16 resize-none focus:outline-none" /></div>
                      <div>
                        <div className="text-[10px] opacity-70 font-bold uppercase tracking-widest mb-3 border-b border-[color:var(--lain-cyan)]/20 pb-1 flex items-center gap-2"><Users size={12} /> Connected Nodes</div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                          {settings.characterLibrary.map(p => (
                            <div key={p.id} onClick={() => toggleGroupMember(p.id)} className={`flex items-center gap-2 p-2 cursor-pointer border transition-all ${editingGroup.members.includes(p.id) ? 'border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/20 shadow-[0_0_5px_var(--lain-cyan)]' : 'border-[color:var(--lain-cyan)]/10 hover:bg-[color:var(--lain-cyan)]/5 opacity-60 hover:opacity-100'}`}>
                              <div className={`w-3 h-3 ${editingGroup.members.includes(p.id) ? 'bg-[color:var(--lain-cyan)] shadow-[0_0_5px_var(--lain-cyan)]' : 'bg-gray-800'} transition-all`}></div>
                              <span className="text-[10px] truncate uppercase font-bold">{p.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : <div className="text-center opacity-40 mt-10 uppercase tracking-[0.3em] italic">Select a group to reconfigure node mesh</div>}
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-6 max-w-xl mx-auto animate-in fade-in duration-300">
                <h3 className="font-bold border-b border-[color:var(--lain-cyan)]/30 pb-2 mb-4 flex items-center gap-2 uppercase tracking-[0.2em]"><Volume2 size={18} /> Audio_Subsystem</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><span className="text-xs font-bold tracking-widest uppercase">{t('set_master_gain', language)}</span><input type="range" min="0" max="1" step="0.05" value={settings.sound.volume} onChange={(e) => onUpdateSettings({ ...settings, sound: { ...settings.sound, volume: parseFloat(e.target.value) } })} className="w-32 accent-[color:var(--lain-cyan)] h-1 bg-gray-700 rounded-lg cursor-pointer" /></div>
                  <div className="flex items-center justify-between"><span className="text-xs font-bold tracking-widest uppercase">{t('set_sfx', language)}</span><input type="checkbox" checked={settings.sound.enabled} onChange={(e) => onUpdateSettings({ ...settings, sound: { ...settings.sound, enabled: e.target.checked } })} className="accent-[color:var(--lain-cyan)] w-4 h-4 shadow-[0_0_5px_var(--lain-cyan)]" /></div>
                  <div className="border-t border-[color:var(--lain-cyan)]/20 my-4 pt-4">
                    <div className="flex items-center justify-between mb-4"><span className="text-xs font-bold tracking-widest flex items-center gap-2 uppercase"><Speech size={14} /> {t('set_tts', language)}_GATE</span><input type="checkbox" checked={settings.sound.ttsEnabled} onChange={(e) => onUpdateSettings({ ...settings, sound: { ...settings.sound, ttsEnabled: e.target.checked } })} className="accent-[color:var(--lain-cyan)] w-4 h-4 shadow-[0_0_5px_var(--lain-cyan)]" /></div>
                    {settings.sound.ttsEnabled && (
                      <div className="space-y-4 pl-4 border-l border-[color:var(--lain-cyan)]/20 animate-in slide-in-from-left-2">
                        <div className="space-y-1"><label className="text-[10px] font-bold opacity-60 uppercase">{t('set_voice_model', language)}</label><select value={settings.sound.ttsVoice || ''} onChange={(e) => onUpdateSettings({ ...settings, sound: { ...settings.sound, ttsVoice: e.target.value } })} className="w-full bg-black border border-[color:var(--lain-cyan)]/50 p-1 text-xs focus:border-[color:var(--lain-cyan)]"><option value="">{t('set_auto', language)}</option>{voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}</select></div>
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-1"><label className="text-[10px] font-bold opacity-60 uppercase">{t('set_speed', language)}</label><input type="range" min="0.5" max="2" step="0.1" value={settings.sound.ttsSpeed || 1} onChange={(e) => onUpdateSettings({ ...settings, sound: { ...settings.sound, ttsSpeed: parseFloat(e.target.value) } })} className="w-full accent-[color:var(--lain-cyan)] h-1 bg-gray-700 rounded-lg cursor-pointer" /></div>
                          <div className="flex-1 space-y-1"><label className="text-[10px] font-bold opacity-60 uppercase">{t('set_pitch', language)}</label><input type="range" min="0.5" max="2" step="0.1" value={settings.sound.ttsPitch || 1} onChange={(e) => onUpdateSettings({ ...settings, sound: { ...settings.sound, ttsPitch: parseFloat(e.target.value) } })} className="w-full accent-[color:var(--lain-cyan)] h-1 bg-gray-700 rounded-lg cursor-pointer" /></div>
                        </div>
                        <button onClick={handleTestTTS} className="px-4 py-2 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black text-xs font-bold w-full transition-all uppercase tracking-widest win98-bevel active:win98-bevel-pressed">{t('set_test_audio', language)}</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'memory' && (
              <div className="h-full flex flex-col gap-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-[color:var(--lain-cyan)]/30 pb-2"><div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase"><Database size={16} /> {t('mem_desc', language)}</div><div className="text-[10px] opacity-40 uppercase tracking-widest font-mono">Syncing...</div></div>
                <div className="flex-1 relative">
                  <textarea value={currentSessionMemories.join('\n\n')} onChange={(e) => setCurrentSessionMemories(e.target.value.split('\n\n'))} className="w-full h-full bg-black/60 border border-[color:var(--lain-cyan)]/30 p-4 text-xs font-mono resize-none focus:outline-none focus:border-[color:var(--lain-cyan)] win98-bevel-pressed leading-relaxed scrollbar-thin" placeholder="Neural summaries will appear here during session evaluation..." />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-[color:var(--lain-cyan)]/20">
                  <button onClick={() => handleSaveMemories(currentSessionMemories)} className="px-6 py-2 bg-[color:var(--lain-cyan)]/20 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-widest win98-bevel active:win98-bevel-pressed"><Save size={14} /> Synchronize Memory</button>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6 max-w-xl mx-auto animate-in fade-in duration-300">
                <h3 className="font-bold border-b border-[color:var(--lain-cyan)]/30 pb-2 mb-4 flex items-center gap-2 uppercase tracking-[0.2em]"><Database size={18} /> {t('tab_data', language)}</h3>
                <div className="space-y-4">
                  <button onClick={handleDeleteAllSessions} className="w-full py-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs tracking-[0.3em] flex items-center justify-center gap-2 transition-all duration-300 bg-red-950/10"><Trash2 size={16} /> {t('sys_hard_reset', language)}</button>
                  <div className="border border-[color:var(--lain-cyan)]/30 p-4 bg-black/40">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-[color:var(--lain-cyan)]/20"><span className="text-[10px] font-bold tracking-widest uppercase opacity-60">{t('set_saved_sess', language)} ({Object.keys(sessions).length})</span><input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".json" /><button onClick={handleImportClick} className="text-[10px] border border-[color:var(--lain-cyan)] px-3 py-1 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-all uppercase tracking-widest font-bold">{t('set_import', language)}</button></div>
                    <div className="max-h-60 overflow-y-auto scrollbar-thin space-y-1">
                      {(Object.values(sessions) as ChatSession[]).map(s => (
                        <div key={s.id} className="flex justify-between items-center text-[10px] p-2 hover:bg-[color:var(--lain-cyan)]/10 border border-transparent hover:border-[color:var(--lain-cyan)]/30 transition-all duration-200">
                          <div className="flex flex-col"><span className="font-bold truncate text-[11px] uppercase tracking-tighter">{s.title || s.id}</span><span className="opacity-40 font-mono text-[8px]">{new Date(s.lastModified).toLocaleString()} • {s.messages?.length || 0} PKTS</span></div>
                          <div className="flex gap-2"><button onClick={() => handleExportSpecificSession(s)} className="p-1 hover:text-[color:var(--lain-cyan)] transition-all" title="Download"><Download size={12} /></button><button onClick={() => handleDeleteSession(s.id)} className="p-1 hover:text-red-500 transition-all" title="Delete"><Trash2 size={12} /></button></div>
                        </div>
                      ))}
                      {Object.keys(sessions).length === 0 && <div className="text-center opacity-30 text-[10px] py-10 uppercase tracking-[0.2em] italic">Archive empty</div>}
                    </div>
                    {importMsg && <div className={`text-[9px] text-right mt-2 font-bold tracking-widest uppercase ${importMsg === 'OK' ? 'text-green-500' : 'text-red-500'}`}>Protocol: {importMsg}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </NaviWindow>
    </div>
  );
};
