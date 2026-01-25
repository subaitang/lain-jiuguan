import React, { useRef, useState, useEffect } from 'react';
import { NaviWindow } from './NaviWindow';
import { PersonaSettings, UserSettings, Language } from '../types';
import { User, MapPin, Calendar, Activity, Globe, Share2, Users, Heart, Camera, Upload, Clock, Eye, List, Edit3, Check, X } from 'lucide-react';
import { t } from '../utils/translations';
import { WiredEye } from './WiredEye';
import { audio } from '../services/audioEngine';

interface ProfileViewerProps {
    target: PersonaSettings | UserSettings;
    onClose: () => void;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
    language: Language;
    onUpdateUser?: (u: UserSettings) => void;
    onShare?: (target: PersonaSettings | UserSettings) => void;
}

export const ProfileViewer: React.FC<ProfileViewerProps> = ({
    target,
    onClose,
    isMinimized,
    isMaximized,
    onMinimize,
    onMaximize,
    language,
    onUpdateUser,
    onShare
}) => {
    const isPersona = 'systemPrompt' in target;
    const banner = target.banner;
    const name = 'username' in target ? target.username : target.name;
    const region = target.region || "Earth/Unknown";
    const [birthday, setBirthday] = useState(target.birthday || "2000-01-01");
    const [age, setAge] = useState(target.age || "Unknown");
    const [isEditingBirth, setIsEditingBirth] = useState(false);
    
    const description = target.description;
    // Fix numerical bugs by ensuring defaults
    const visitCount = target.visitCount || 0;
    const friends = isPersona ? ((target as PersonaSettings).friendsCount ?? 42) : 0;
    const followers = isPersona ? ((target as PersonaSettings).followersCount ?? 1024) : 0;

    const [showVisitorLog, setShowVisitorLog] = useState(false);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Re-calc age locally if birthday changes
    useEffect(() => {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (datePattern.test(birthday)) {
            const birthDate = new Date(birthday);
            const today = new Date();
            if (!isNaN(birthDate.getTime())) {
                let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    calculatedAge--;
                }
                setAge(calculatedAge.toString());
            }
        }
    }, [birthday]);

    const handleSaveBirthday = () => {
        if (!isPersona && onUpdateUser) {
            onUpdateUser({ 
                ...(target as UserSettings), 
                birthday, 
                age 
            });
            audio.playConfirmSound();
        }
        setIsEditingBirth(false);
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onUpdateUser && !isPersona) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateUser({ ...(target as UserSettings), banner: reader.result as string });
                audio.playConfirmSound();
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <NaviWindow
            title={`${t('prof_title', language)} // ${name.toUpperCase()}`}
            onClose={onClose}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            className="w-full h-full"
        >
            <div className="flex flex-col h-full bg-black/90 font-['Share_Tech_Mono'] text-[color:var(--lain-cyan)] overflow-y-auto relative scrollbar-thin">
                
                <div className="h-56 w-full relative shrink-0 border-b border-[color:var(--lain-cyan)] overflow-hidden group bg-black">
                    {banner ? (
                        <img src={banner} className="w-full h-full object-cover opacity-60" alt="Banner" />
                    ) : (
                        <div className="w-full h-full bg-[repeating-linear-gradient(45deg,rgba(0,240,255,0.05)_0px,rgba(0,240,255,0.05)_2px,transparent_2px,transparent_4px)] flex items-center justify-center bg-black">
                            <WiredEye className="w-48 h-48 opacity-10 animate-spin-slow" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    
                    {!isPersona && onUpdateUser && (
                        <button 
                            onClick={() => bannerInputRef.current?.click()}
                            className="absolute top-4 right-4 bg-black/60 border border-[color:var(--lain-cyan)] p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[color:var(--lain-cyan)] hover:text-black z-20"
                            title={t('prof_upload_banner', language)}
                        >
                            <Camera size={16} />
                        </button>
                    )}
                    <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} className="hidden" accept="image/*" />
                </div>

                <div className="px-6 relative pb-6 flex-1 min-h-0 -mt-16 z-10">
                    
                    <div className="flex justify-between items-end mb-4">
                        <div className="w-32 h-32 border-2 border-[color:var(--lain-cyan)] bg-black p-0.5 shadow-[0_0_20px_rgba(0,240,255,0.4)] overflow-hidden rounded-md relative group/avatar shrink-0">
                            {target.avatar ? (
                                <img src={target.avatar} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                                <div className="w-full h-full bg-[color:var(--lain-cyan)]/10 flex items-center justify-center">
                                    <User size={40} className="opacity-50" />
                                </div>
                            )}
                            <div className="absolute inset-0 ring-1 ring-inset ring-[color:var(--lain-cyan)]/50 pointer-events-none"></div>
                            <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-black/80 px-2 py-0.5 border border-[color:var(--lain-cyan)] text-[9px] font-bold shadow-md">
                                <Activity size={8} className="text-green-500 animate-pulse" /> ONLINE
                            </div>
                        </div>

                        <div className="flex gap-3 mb-2 items-center">
                            {onShare && (
                                <button 
                                    onClick={() => onShare(target)}
                                    className="px-4 py-2 bg-[color:var(--lain-cyan)]/10 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-all flex items-center gap-2 text-xs font-bold tracking-widest win98-bevel active:win98-bevel-pressed shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                                >
                                    <Share2 size={14} /> {t('btn_share_profile', language)}
                                </button>
                            )}
                            <div className="px-3 py-2 border border-[color:var(--lain-cyan)]/50 text-xs font-mono opacity-70 bg-black/50 backdrop-blur-sm h-fit">
                                ID: {('id' in target) ? target.id.substring(0,8) : 'ROOT'}
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h1 className="text-4xl font-bold tracking-[0.1em] text-glow mb-1 leading-tight truncate">{name}</h1>
                        <div className="flex items-center gap-2 text-sm opacity-70 font-mono">
                            <span className="text-[color:var(--lain-cyan)] truncate max-w-[200px]">@{name.replace(/\s+/g, '_').toLowerCase()}</span>
                            <span>•</span>
                            <span className="bg-[color:var(--lain-cyan)]/20 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-sm">{isPersona ? 'AI_CONSTRUCT' : 'WIRED_USER'}</span>
                        </div>
                    </div>

                    {/* Stats Row - Flex layout to distribute evenly */}
                    <div className="flex w-full bg-[color:var(--lain-cyan)]/5 border border-[color:var(--lain-cyan)]/30 mb-6 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[color:var(--lain-cyan)]"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[color:var(--lain-cyan)]"></div>
                        
                        <div className="flex-1 py-4 flex flex-col items-center justify-center border-r border-[color:var(--lain-cyan)]/20">
                            <span className="text-2xl font-bold">{friends.toLocaleString()}</span>
                            <span className="text-[10px] opacity-60 tracking-[0.2em] font-bold uppercase">{t('fl_following', language)}</span>
                        </div>
                        
                        <div className="flex-1 py-4 flex flex-col items-center justify-center border-r border-[color:var(--lain-cyan)]/20">
                            <span className="text-2xl font-bold">{followers.toLocaleString()}</span>
                            <span className="text-[10px] opacity-60 tracking-[0.2em] font-bold uppercase">{t('fl_followers', language)}</span>
                        </div>
                        
                        <div className="flex-1 py-4 flex flex-col items-center justify-center relative group cursor-pointer hover:bg-[color:var(--lain-cyan)]/10 transition-colors"
                             onClick={() => setShowVisitorLog(!showVisitorLog)}
                             title={t('prof_view_visitors', language)}
                        >
                            <span className="text-2xl font-bold flex items-center gap-1">
                                {visitCount.toLocaleString()} <Eye size={12} className="opacity-50" />
                            </span>
                             <span className="text-[10px] opacity-60 tracking-[0.2em] font-bold uppercase">{t('prof_visitors', language)}</span>
                        </div>
                    </div>

                    {showVisitorLog && (
                         <div className="mb-6 border border-[color:var(--lain-cyan)]/30 bg-black/40 p-3 animate-in fade-in slide-in-from-top-2">
                             <h4 className="text-[10px] font-bold tracking-widest uppercase mb-2 border-b border-[color:var(--lain-cyan)]/20 pb-1 flex items-center gap-2">
                                <List size={10} /> {t('prof_view_visitors', language)}
                             </h4>
                             <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-thin">
                                 {(!target.visitors || target.visitors.length === 0) && <div className="text-[10px] opacity-40 italic">No recorded visitors.</div>}
                                 {target.visitors?.map((v, i) => (
                                     <div key={i} className="flex justify-between text-[10px] hover:bg-[color:var(--lain-cyan)]/10 px-1">
                                         <span className="font-bold">{v.id}</span>
                                         <span className="opacity-50 font-mono">{new Date(v.timestamp).toLocaleString()}</span>
                                     </div>
                                 ))}
                             </div>
                         </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-xs border-y border-[color:var(--lain-cyan)]/20 py-4 bg-black/20">
                        <div className="flex flex-col gap-1 opacity-90 p-2 border-r border-[color:var(--lain-cyan)]/10">
                            <span className="text-[9px] opacity-50 tracking-widest uppercase">{t('prof_region', language)}</span>
                            <div className="flex items-center gap-2 font-bold truncate"><MapPin size={12} /> {region}</div>
                        </div>
                        <div className="flex flex-col gap-1 opacity-90 p-2 border-r border-[color:var(--lain-cyan)]/10 relative group">
                            <span className="text-[9px] opacity-50 tracking-widest uppercase">BIRTH DATE</span>
                            {isEditingBirth ? (
                                <div className="flex items-center gap-1 mt-1">
                                    <input 
                                        type="text" 
                                        value={birthday} 
                                        onChange={e => setBirthday(e.target.value)}
                                        className="bg-black border border-[color:var(--lain-cyan)]/50 text-[10px] w-24 p-0.5 focus:outline-none"
                                        placeholder="YYYY-MM-DD"
                                    />
                                    <button onClick={handleSaveBirthday} className="text-green-500"><Check size={12}/></button>
                                    <button onClick={() => setIsEditingBirth(false)} className="text-red-500"><X size={12}/></button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-bold"><Calendar size={12} /> {birthday}</div>
                                    {!isPersona && onUpdateUser && (
                                        <button onClick={() => setIsEditingBirth(true)} className="opacity-0 group-hover:opacity-100 text-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)]/20 rounded p-1"><Edit3 size={10}/></button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-1 opacity-90 p-2 border-r border-[color:var(--lain-cyan)]/10">
                            <span className="text-[9px] opacity-50 tracking-widest uppercase">AGE</span>
                            <div className="flex items-center gap-2 font-bold"><Clock size={12} /> {age} yrs</div>
                        </div>
                        <div className="flex flex-col gap-1 opacity-90 p-2">
                            <span className="text-[9px] opacity-50 tracking-widest uppercase">GENDER</span>
                            <div className="flex items-center gap-2 font-bold truncate"><User size={12} /> {target.gender}</div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="text-[10px] opacity-50 tracking-[0.2em] font-bold mb-2 uppercase">BIO_DATA_STREAM</div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap opacity-90 border border-[color:var(--lain-cyan)]/30 p-4 bg-[color:var(--lain-cyan)]/5 font-serif italic relative min-h-[80px]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[color:var(--lain-cyan)]/20"></div>
                            "{description || "No bio data available."}"
                        </div>
                    </div>

                    {isPersona && (
                        <div className="opacity-60 text-[10px] font-mono mt-8 pt-4 border-t border-[color:var(--lain-cyan)]/20">
                            <div className="mb-2 text-[color:var(--lain-cyan)] font-bold tracking-widest uppercase flex items-center gap-2">
                                <Activity size={10} /> SYSTEM_PROMPT_PREVIEW
                            </div>
                            <div className="truncate bg-black border border-[color:var(--lain-cyan)]/30 p-3 font-mono text-[9px] text-gray-400">
                                {(target as PersonaSettings).systemPrompt.substring(0, 150)}...
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </NaviWindow>
    );
};