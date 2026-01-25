
import React, { useState, useEffect, useMemo } from 'react';
import { AppSettings, WeatherData, CalendarEvent, CalendarNote } from '../types';
import { Calendar, Clock, Sun, Moon, Cloud, CloudRain, Snowflake, Zap, Wind, MapPin, X, ChevronLeft, ChevronRight, RefreshCcw, Search, Plus, Trash2, List, Flag } from 'lucide-react';
import { t } from '../utils/translations';
import { audio } from '../services/audioEngine';
import { fetchWeather } from '../services/geminiService';
import { GEO_DATABASE } from '../utils/geoData';

interface SystemClockProps {
    settings: AppSettings;
    onUpdateSettings: (s: AppSettings) => void;
    onWeatherUpdate?: (data: WeatherData | null) => void; 
}

export const SystemClock: React.FC<SystemClockProps> = ({ settings, onUpdateSettings, onWeatherUpdate }) => {
    const [time, setTime] = useState(new Date());
    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'calendar' | 'weather'>('calendar');
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    
    const [searchLoc, setSearchLoc] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const [viewDate, setViewDate] = useState(new Date());
    const [jumpYear, setJumpYear] = useState(viewDate.getFullYear());
    const [jumpMonth, setJumpMonth] = useState(viewDate.getMonth());
    
    const [showNoteEditor, setShowNoteEditor] = useState<{ d: number, m: number, y: number } | null>(null);
    const [noteContent, setNoteContent] = useState('');

    const lang = settings.user.language;

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const updateWeather = async (loc?: string) => {
        if (weatherLoading) return;
        setWeatherLoading(true);
        const targetLoc = loc || settings.user.region?.split('/')[1] || settings.user.region || 'Neo Tokyo';
        const data = await fetchWeather(targetLoc);
        if (data) {
             setWeather(data);
             if(onWeatherUpdate) onWeatherUpdate(data);
        }
        setWeatherLoading(false);
    };

    useEffect(() => {
        if (isOpen && viewMode === 'weather' && !weather) {
            updateWeather();
        }
    }, [isOpen, viewMode]);

    const getTimeOfDay = () => {
        const h = time.getHours();
        if (h >= 5 && h < 12) return { text: t('cal_morning', lang), icon: Sun };
        if (h >= 12 && h < 17) return { text: t('cal_afternoon', lang), icon: Sun };
        if (h >= 17 && h < 21) return { text: t('cal_evening', lang), icon: Cloud };
        return { text: t('cal_night', lang), icon: Moon };
    };

    const getWeatherIcon = (icon: WeatherData['icon'], size = 14) => {
        switch(icon) {
            case 'sun': return <Sun size={size} className="text-yellow-400" />;
            case 'cloud': return <Cloud size={size} className="text-gray-400" />;
            case 'rain': return <CloudRain size={size} className="text-blue-400" />;
            case 'snow': return <Snowflake size={size} className="text-white" />;
            case 'storm': return <Zap size={size} className="text-purple-400" />;
            case 'mist': return <Wind size={size} className="text-teal-400" />;
            default: return <Sun size={size} />;
        }
    };

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleAddNote = (d: number, m: number, y: number) => {
        if (!noteContent.trim()) return;
        const dateStr = `${y}-${(m+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
        const newNote: CalendarNote = {
            id: `note-${Date.now()}`,
            date: dateStr,
            content: noteContent,
            type: 'memo'
        };
        onUpdateSettings({ ...settings, calendarNotes: [...(settings.calendarNotes || []), newNote] });
        setNoteContent('');
        setShowNoteEditor(null);
        audio.playConfirmSound();
    };

    const handleDeleteNote = (id: string) => {
        onUpdateSettings({ ...settings, calendarNotes: settings.calendarNotes.filter(n => n.id !== id) });
        audio.playWindowSound(false);
    };

    const handleJump = () => {
        setViewDate(new Date(jumpYear, jumpMonth, 1));
        audio.playClickSound();
    };

    const handleWeatherSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchLoc.trim()) return;
        setIsSearching(true);
        await updateWeather(searchLoc);
        setIsSearching(false);
    };

    const getHolidayForDay = (countryName: string, month: number, day: number) => {
        const country = GEO_DATABASE[countryName];
        if (!country) return null;
        return country.holidays.find(h => h.month === month && h.day === day);
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`pad-${i}`} className="h-8 w-8 opacity-0"></div>);
        }

        const countryName = settings.user.region?.split('/')[0] || '';

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${(month+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
            const isToday = d === time.getDate() && month === time.getMonth() && year === time.getFullYear();
            const holiday = getHolidayForDay(countryName, month, d);
            const notes = settings.calendarNotes?.filter(n => n.date === dateStr) || [];
            
            days.push(
                <div 
                    key={d} 
                    onClick={() => setShowNoteEditor({ d, m: month, y: year })}
                    className={`h-8 w-8 flex flex-col items-center justify-center text-[10px] border relative cursor-pointer
                        ${isToday ? 'bg-[color:var(--lain-cyan)] text-black border-[color:var(--lain-cyan)] font-bold shadow-[0_0_8px_var(--lain-cyan)]' : 'border-transparent hover:border-[color:var(--lain-cyan)]/30'}
                        ${holiday ? 'text-[color:var(--lain-red)] font-bold shadow-[inset_0_0_5px_rgba(255,42,42,0.2)]' : ''}
                    `}
                    title={holiday ? (holiday.name[lang] || holiday.name.en) : (notes.length > 0 ? notes.map(n => n.content).join(', ') : undefined)}
                >
                    <span className={holiday ? "animate-pulse" : ""}>{d}</span>
                    <div className="flex gap-0.5 mt-0.5">
                        {notes.map(n => <div key={n.id} className={`w-0.5 h-0.5 rounded-full ${isToday ? 'bg-black' : 'bg-[color:var(--lain-cyan)]'}`}></div>)}
                    </div>
                    {holiday && <div className="absolute top-0 right-0 w-1 h-1 bg-[color:var(--lain-red)]"></div>}
                </div>
            );
        }
        return days;
    };

    const tod = getTimeOfDay();

    return (
        <div className="flex items-center h-full gap-0">
            <div 
                className="flex items-center gap-2 px-3 h-full border-l border-[color:var(--lain-cyan)]/30 cursor-help group hover:bg-[color:var(--lain-cyan)]/5 transition-colors"
                onClick={() => { setIsOpen(true); setViewMode('weather'); audio.playClickSound(); }}
            >
                {weatherLoading ? (
                    <RefreshCcw size={12} className="animate-spin opacity-50" />
                ) : weather ? (
                    <div className="flex items-center gap-2">
                        {getWeatherIcon(weather.icon)}
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-xs font-bold text-glow">{weather.temp}°C</span>
                            <span className="text-[8px] opacity-60 uppercase tracking-tighter whitespace-nowrap">{weather.city || weather.location}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-[10px] opacity-30 tracking-tighter">{t('wea_error', lang)}</div>
                )}
            </div>

            <button 
                onClick={() => { 
                    setIsOpen(!isOpen); 
                    setViewMode('calendar');
                    setViewDate(new Date()); 
                    audio.playClickSound(); 
                }}
                className={`flex items-center gap-3 px-4 py-0.5 border-l border-[color:var(--lain-cyan)]/30 hover:bg-[color:var(--lain-cyan)]/10 transition-colors h-full relative z-20 ${isOpen ? 'bg-[color:var(--lain-cyan)]/20' : ''}`}
            >
                <tod.icon size={12} className={time.getHours() >= 18 || time.getHours() < 6 ? 'text-blue-300' : 'text-yellow-300'} />
                <div className="flex flex-col items-start leading-none min-w-[80px]">
                    <span className="text-[9px] font-bold tracking-widest opacity-80">{time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <div className="flex items-center gap-2">
                         <span className="text-xs font-bold font-mono">{time.toLocaleTimeString([], { hour12: false })}</span>
                         <span className="text-[8px] opacity-60 uppercase tracking-tighter">{tod.text}</span>
                    </div>
                </div>
            </button>

            {isOpen && (
                <div className="absolute bottom-11 right-1 w-80 bg-black border border-[color:var(--lain-cyan)] shadow-[0_0_25px_rgba(0,240,255,0.3)] animate-in slide-in-from-bottom-2 font-['Share_Tech_Mono'] overflow-hidden z-[100] flex flex-col">
                    <div className="bg-[color:var(--lain-cyan)]/10 border-b border-[color:var(--lain-cyan)]/50 p-2 flex justify-between items-center">
                         <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setViewMode('calendar')}
                                className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${viewMode === 'calendar' ? 'text-[color:var(--lain-cyan)] border-b border-current' : 'opacity-40 hover:opacity-100'}`}
                            >
                                {t('cal_title', lang)}
                            </button>
                            <button 
                                onClick={() => setViewMode('weather')}
                                className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${viewMode === 'weather' ? 'text-[color:var(--lain-cyan)] border-b border-current' : 'opacity-40 hover:opacity-100'}`}
                            >
                                {t('wea_title', lang)}
                            </button>
                         </div>
                         <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-[color:var(--lain-red)] hover:text-black text-[color:var(--lain-red)]"><X size={10} /></button>
                    </div>
                    
                    <div className="p-3 max-h-[450px] overflow-y-auto scrollbar-thin">
                        {viewMode === 'calendar' ? (
                            <div className="space-y-4">
                                {/* Calendar UI preserved here */}
                                <div className="flex gap-2 items-center bg-black/40 p-2 border border-[color:var(--lain-cyan)]/20">
                                    <div className="flex-1 flex gap-2">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[8px] opacity-50 uppercase">{t('cal_select_year', lang)}</span>
                                            <input type="number" value={jumpYear} onChange={e => setJumpYear(parseInt(e.target.value))} className="w-16 bg-black border border-[color:var(--lain-cyan)]/30 text-[10px] px-1" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[8px] opacity-50 uppercase">{t('cal_select_month', lang)}</span>
                                            <select value={jumpMonth} onChange={e => setJumpMonth(parseInt(e.target.value))} className="w-16 bg-black border border-[color:var(--lain-cyan)]/30 text-[10px] px-1">
                                                {Array.from({length:12}).map((_,i) => <option key={i} value={i}>{i+1}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={handleJump} className="px-2 py-1 bg-[color:var(--lain-cyan)] text-black font-bold text-[9px] uppercase win98-bevel active:win98-bevel-pressed">{t('cal_jump', lang)}</button>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2 px-1">
                                         <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-1 opacity-50 hover:opacity-100"><ChevronLeft size={12}/></button>
                                         <span className="text-xs font-bold flex items-center gap-2"><Flag size={10} className="text-[color:var(--lain-cyan)]" />{viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                                         <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-1 opacity-50 hover:opacity-100"><ChevronRight size={12}/></button>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['S','M','T','W','T','F','S'].map((d, i) => (<div key={i} className="text-[8px] text-center opacity-40 font-bold">{d}</div>))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                                </div>
                                {showNoteEditor && (
                                    <div className="border-t border-[color:var(--lain-cyan)]/20 pt-4 animate-in slide-in-from-bottom-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-[color:var(--lain-cyan)] uppercase tracking-widest">NOTES: {showNoteEditor.y}-{showNoteEditor.m+1}-{showNoteEditor.d}</span>
                                            <button onClick={() => setShowNoteEditor(null)} className="p-1 opacity-50 hover:text-white"><X size={12}/></button>
                                        </div>
                                        <div className="space-y-2 mb-3">
                                            {settings.calendarNotes?.filter(n => n.date === `${showNoteEditor.y}-${(showNoteEditor.m+1).toString().padStart(2,'0')}-${showNoteEditor.d.toString().padStart(2,'0')}`).map(n => (
                                                <div key={n.id} className="flex items-center justify-between text-[10px] bg-[color:var(--lain-cyan)]/5 p-2 border border-[color:var(--lain-cyan)]/20">
                                                    <span className="truncate flex-1">{n.content}</span>
                                                    <button onClick={() => handleDeleteNote(n.id)} className="p-1 text-red-500 hover:text-white"><Trash2 size={10}/></button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="text" value={noteContent} onChange={e => setNoteContent(e.target.value)} className="flex-1 bg-black border border-[color:var(--lain-cyan)]/50 p-2 text-[10px] focus:outline-none" placeholder={t('cal_add_note', lang)} onKeyDown={(e) => e.key === 'Enter' && handleAddNote(showNoteEditor.d, showNoteEditor.m, showNoteEditor.y)} />
                                            <button onClick={() => handleAddNote(showNoteEditor.d, showNoteEditor.m, showNoteEditor.y)} className="p-2 bg-[color:var(--lain-cyan)] text-black"><Plus size={12}/></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 h-full">
                                {/* Search Bar */}
                                <form onSubmit={handleWeatherSearch} className="flex gap-2 shrink-0">
                                    <input 
                                        type="text" 
                                        value={searchLoc}
                                        onChange={e => setSearchLoc(e.target.value)}
                                        className="flex-1 bg-black border border-[color:var(--lain-cyan)] p-2 text-sm focus:outline-none placeholder-white/30"
                                        placeholder={t('wea_search', lang)}
                                    />
                                    <button type="submit" disabled={isSearching} className="w-10 flex items-center justify-center border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors">
                                        {isSearching ? <RefreshCcw size={16} className="animate-spin" /> : <Search size={16} />}
                                    </button>
                                </form>

                                {weather ? (
                                    <div className="flex-1 flex flex-col gap-4">
                                        {/* Main Card (Neon Style) */}
                                        <div className="border border-[color:var(--lain-cyan)] p-4 relative overflow-hidden bg-black/50">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-5xl font-bold text-glow font-['Share_Tech_Mono'] text-[color:var(--lain-cyan)]">
                                                        {weather.temp}°C
                                                    </div>
                                                    <div className="text-sm font-bold uppercase tracking-widest text-[color:var(--lain-cyan)] opacity-90">
                                                        {weather.condition}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] opacity-60 mt-1">
                                                        <MapPin size={10}/> {weather.location}
                                                    </div>
                                                </div>
                                                <div className="opacity-80">
                                                    {getWeatherIcon(weather.icon, 64)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 90 Days Forecast List */}
                                        <div className="flex-1 flex flex-col min-h-0">
                                            <div className="flex justify-between items-end border-b border-[color:var(--lain-cyan)]/30 pb-1 mb-2">
                                                <span className="text-[10px] font-bold tracking-[0.2em] text-[color:var(--lain-cyan)]">{t('wea_forecast', lang)}</span>
                                                <span className="text-[10px] opacity-50">{t('wea_high_low', lang)}</span>
                                            </div>
                                            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-1">
                                                {weather.forecast?.map((day, i) => (
                                                    <div key={i} className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 transition-colors border-l-2 border-transparent hover:border-[color:var(--lain-cyan)]">
                                                        <span className="text-[10px] font-mono opacity-70 w-20">{day.date}</span>
                                                        <div className="flex items-center gap-2 flex-1 justify-center opacity-80">
                                                            {getWeatherIcon(day.icon, 12)}
                                                            <span className="text-[10px] uppercase truncate w-16">{day.condition}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold font-mono w-16 text-right">
                                                            <span className="text-red-400">{day.maxTemp}°</span> / <span className="text-blue-400">{day.minTemp}°</span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-center opacity-30 text-xs tracking-widest border border-dashed border-[color:var(--lain-cyan)]/30">
                                        {t('wea_loading', lang)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="bg-[color:var(--lain-cyan)]/5 border-t border-[color:var(--lain-cyan)]/20 p-2 text-[8px] tracking-[0.2em] opacity-50 flex justify-between uppercase shrink-0">
                         <span>Wired_Time_Sync: OK</span>
                         <span>Rel: 1.15.0 AIRP</span>
                    </div>
                </div>
            )}
        </div>
    );
};
