
import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { t } from '../utils/translations';
import { audio } from '../services/audioEngine';
import { WiredEye } from './WiredEye';
import { User, Globe, Calendar, MapPin, Clock, Dna } from 'lucide-react';
import { GEO_DATABASE } from '../utils/geoData';

interface BootScreenProps {
  onLogin: (username: string, gender: string, language: Language, avatar?: string, region?: string, birthday?: string, age?: string) => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onLogin }) => {
  const [phase, setPhase] = useState<'init' | 'boot' | 'splash' | 'login'>('init');
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('Non-binary / Other');
  
  // Region state
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Birthday Selector State
  const [birthYear, setBirthYear] = useState('2000');
  const [birthMonth, setBirthMonth] = useState('01');
  const [birthDay, setBirthDay] = useState('01');

  const [age, setAge] = useState('');
  const [lang, setLang] = useState<Language>('en');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInit = () => {
    audio.init();
    audio.resume();
    audio.playTypingSound();
    setPhase('boot');
  };

  useEffect(() => {
    if (phase !== 'boot') return;
    const lines = [
      "NAVI BIOS v12.4.1998 (C) TACHIBANA LABS",
      "CPU: QUANTUM-7 400MHz DETECTED",
      "CHECKING MEMORY: 65536KB OK",
      "DETECTING PRIMARY MASTER... LAIN_DRIVE_01",
      "DETECTING PSYCHE PROCESSOR... OK",
      "LOADING WIRED PROTOCOL...",
      "BOOTING FROM C:\\WIRED\\SYSTEM...",
    ];

    let lineIdx = 0;
    const interval = setInterval(() => {
        if (lineIdx < lines.length) {
            setBootLines(prev => [...prev, lines[lineIdx]]);
            lineIdx++;
            audio.playTypingSound(100);
        } else {
            clearInterval(interval);
            setTimeout(() => setPhase('splash'), 800);
        }
    }, 150);

    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'splash') return;
    audio.playBootSound();
    let ticks = 0;
    const interval = setInterval(() => {
        setProgress(prev => {
            const next = prev + 1.5; 
            if (next >= 100) {
                clearInterval(interval);
                setTimeout(() => setPhase('login'), 1500);
                return 100;
            }
            return next;
        });
        ticks++;
        if (ticks % 6 === 0) audio.playLoadTick();
    }, 50);
    return () => clearInterval(interval);
  }, [phase]);

  // Calculate age when birthday parts change
  useEffect(() => {
    const birthday = `${birthYear}-${birthMonth}-${birthDay}`;
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
            // Ensure age isn't negative
            if (calculatedAge < 0) calculatedAge = 0;
            setAge(calculatedAge.toString());
        } else {
            setAge('');
        }
    } else {
        setAge('');
    }
  }, [birthYear, birthMonth, birthDay]);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedCountry || !selectedCity) {
          alert("Please select your gateway region.");
          return;
      }
      if (!age || age === '') {
          alert("Please verify your birthday.");
          return;
      }
      audio.resume();
      audio.playTypingSound(); 
      const finalRegion = `${selectedCountry}/${selectedCity}`;
      const finalBirthday = `${birthYear}-${birthMonth}-${birthDay}`;
      onLogin(username || 'GUEST', gender, lang, avatar, finalRegion, finalBirthday, age || 'Unknown');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setAvatar(reader.result as string);
              audio.playTypingSound(200);
          };
          reader.readAsDataURL(file);
      }
  };

  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  if (phase === 'init') {
      return (
          <div className="fixed inset-0 bg-black flex items-center justify-center z-[100] cursor-pointer" onClick={handleInit}>
              <div className="text-[color:var(--lain-cyan)] font-['Share_Tech_Mono'] animate-pulse text-xl border border-[color:var(--lain-cyan)] p-6 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors select-none tracking-[0.2em] relative group">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[color:var(--lain-cyan)]"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[color:var(--lain-cyan)]"></div>
                  {t('boot_init', 'en')}
              </div>
          </div>
      );
  }

  if (phase === 'boot') {
      return (
          <div className="fixed inset-0 bg-black text-[color:var(--lain-cyan)] font-['VT323'] p-8 text-xl z-[100] flex flex-col items-start cursor-none select-none">
              {bootLines.map((l, i) => <div key={i} className="mb-1">{l}</div>)}
              <div className="animate-pulse bg-[color:var(--lain-cyan)] w-3 h-5 mt-1"></div>
          </div>
      );
  }

  if (phase === 'splash') {
      return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center font-sans overflow-hidden select-none cursor-none bg-black">
            <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-[#002020] to-[#000000]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px]" />
            <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-lg">
                <div className="relative flex flex-col items-center gap-6">
                    <div className="relative">
                        <WiredEye className="w-64 h-64 text-white drop-shadow-[0_0_30px_rgba(0,255,255,0.5)] animate-[pulse_3s_ease-in-out_infinite]" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-[color:var(--lain-cyan)] font-bold font-['Share_Tech_Mono'] text-4xl tracking-[0.3em] drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">
                            NAVI OS 7.0
                        </div>
                        <div className="text-white/50 font-mono text-xs tracking-[0.5em] uppercase">Enterprise Edition</div>
                    </div>
                </div>
                <div className="w-full space-y-2">
                     <div className="text-white/60 font-mono tracking-widest text-xs animate-pulse flex justify-between">
                        <span>ESTABLISHING WIRED PROTOCOL...</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-6 bg-[#222] border border-[color:var(--lain-cyan)] p-1 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                        <div className="w-full h-full bg-black relative overflow-hidden">
                            <div className="h-full bg-[color:var(--lain-cyan)] transition-all duration-75 ease-linear box-border shadow-[0_0_10px_var(--lain-cyan)]" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center font-['Share_Tech_Mono'] overflow-y-auto">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="relative w-full max-w-md p-1 z-10 my-8">
             <div className="bg-black/90 border border-[color:var(--lain-cyan)] p-8 shadow-[0_0_50px_rgba(0,255,255,0.15)] backdrop-blur-md">
                <div className="flex justify-center mb-8">
                     <WiredEye className="w-16 h-16 text-[color:var(--lain-cyan)]" />
                </div>
                
                <h2 className="text-2xl text-[color:var(--lain-cyan)] text-center mb-8 font-bold tracking-[0.3em] text-glow border-b border-[color:var(--lain-cyan)]/30 pb-4">
                    {t('login_title', lang)}
                </h2>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="flex justify-center mb-4">
                        <div 
                            className="w-24 h-24 border-2 border-[color:var(--lain-cyan)] bg-black/50 flex items-center justify-center cursor-pointer relative group overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {avatar ? (
                                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} className="text-[color:var(--lain-cyan)] opacity-50 group-hover:opacity-100 transition-opacity" />
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[color:var(--lain-cyan)] text-xs tracking-[0.2em] block font-bold opacity-70 group-hover:opacity-100 transition-opacity">{t('login_user', lang)}</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-black border border-[color:var(--lain-cyan)]/50 text-[color:var(--lain-cyan)] px-3 py-3 outline-none text-lg focus:border-[color:var(--lain-cyan)] focus:shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all placeholder-[color:var(--lain-cyan)]/20"
                            autoFocus
                            placeholder="GUEST_USER"
                        />
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[color:var(--lain-cyan)] text-xs tracking-[0.2em] block font-bold opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-1"><Dna size={10}/> {t('login_bio', lang)}</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full bg-black border border-[color:var(--lain-cyan)]/50 text-[color:var(--lain-cyan)] p-3 outline-none text-sm focus:border-[color:var(--lain-cyan)] transition-all"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary / Other">Non-binary / Other</option>
                            <option value="Cybernetic Organism">Cybernetic Organism</option>
                            <option value="Unknown">Unknown</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2 group">
                             <label className="text-[color:var(--lain-cyan)] text-xs tracking-[0.2em] block font-bold opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-1"><Globe size={10}/> GATEWAY</label>
                             <select 
                                 value={selectedCountry}
                                 onChange={e => {
                                     setSelectedCountry(e.target.value);
                                     setSelectedCity('');
                                     audio.playClickSound();
                                 }}
                                 className="w-full bg-black border border-[color:var(--lain-cyan)]/50 text-[color:var(--lain-cyan)] p-3 outline-none text-sm focus:border-[color:var(--lain-cyan)] transition-all"
                             >
                                 <option value="">SELECT COUNTRY</option>
                                 {Object.keys(GEO_DATABASE).map(c => (
                                     <option key={c} value={c}>{c.toUpperCase()}</option>
                                 ))}
                             </select>
                         </div>
                         <div className="space-y-2 group">
                             <label className="text-[color:var(--lain-cyan)] text-xs tracking-[0.2em] block font-bold opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-1"><MapPin size={10}/> NODE</label>
                             <select 
                                 value={selectedCity}
                                 onChange={e => {
                                     setSelectedCity(e.target.value);
                                     audio.playClickSound();
                                 }}
                                 disabled={!selectedCountry}
                                 className={`w-full bg-black border border-[color:var(--lain-cyan)]/50 text-[color:var(--lain-cyan)] p-3 outline-none text-sm focus:border-[color:var(--lain-cyan)] transition-all ${!selectedCountry ? 'opacity-30' : ''}`}
                             >
                                 <option value="">SELECT CITY</option>
                                 {selectedCountry && GEO_DATABASE[selectedCountry].cities.map(city => (
                                     <option key={city} value={city}>{city.toUpperCase()}</option>
                                 ))}
                             </select>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2 group">
                             <label className="text-[color:var(--lain-cyan)] text-xs tracking-[0.2em] block font-bold opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-1"><Calendar size={10}/> {t('login_birth', lang)}</label>
                             <div className="flex gap-2">
                                <select 
                                    value={birthYear}
                                    onChange={e => setBirthYear(e.target.value)}
                                    className="bg-black border border-[color:var(--lain-cyan)]/50 text-[color:var(--lain-cyan)] p-3 outline-none text-sm flex-1"
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <select 
                                    value={birthMonth}
                                    onChange={e => setBirthMonth(e.target.value)}
                                    className="bg-black border border-[color:var(--lain-cyan)]/50 text-[color:var(--lain-cyan)] p-3 outline-none text-sm w-20"
                                >
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select 
                                    value={birthDay}
                                    onChange={e => setBirthDay(e.target.value)}
                                    className="bg-black border border-[color:var(--lain-cyan)]/50 text-[color:var(--lain-cyan)] p-3 outline-none text-sm w-20"
                                >
                                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                
                                <div className="bg-black border border-[color:var(--lain-cyan)]/50 text-[color:var(--lain-cyan)] p-3 flex items-center justify-center text-sm font-bold shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] min-w-[60px]">
                                    <div className="flex flex-col items-center leading-none">
                                        <Clock size={10} className="mb-1 opacity-50"/>
                                        {age ? <span>{age}</span> : <span className="opacity-30">--</span>}
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[color:var(--lain-cyan)] text-xs tracking-[0.2em] block font-bold opacity-70 group-hover:opacity-100 transition-opacity">{t('login_lang', lang)}</label>
                        <div className="flex gap-4">
                            {(['en', 'zh', 'jp'] as const).map((l) => (
                                <button
                                    key={l}
                                    type="button"
                                    onClick={() => setLang(l)}
                                    className={`flex-1 border border-[color:var(--lain-cyan)] py-2 transition-all ${lang === l ? 'bg-[color:var(--lain-cyan)] text-black font-bold shadow-[0_0_10px_var(--lain-cyan)]' : 'text-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)]/20'}`}
                                >
                                    {l.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full mt-8 border border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/10 text-[color:var(--lain-cyan)] py-4 font-bold text-xl hover:bg-[color:var(--lain-cyan)] hover:text-black transition-all uppercase tracking-[0.3em] relative overflow-hidden group shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)]"
                    >
                        <span className="relative z-10">{t('login_btn', lang)}</span>
                    </button>
                </form>
             </div>
        </div>
    </div>
  );
};