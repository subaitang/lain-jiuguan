
import React, { useState } from 'react';
import { NaviWindow } from './NaviWindow';
import { WorldEvent, RPDate, Language } from '../types';
import { Newspaper, Globe, RefreshCw, Calendar, Clock, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { t } from '../utils/translations';

interface WorldNewsViewerProps {
    events: WorldEvent[];
    onGenerate: () => void;
    isLoading: boolean;
    onClose: () => void;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
    rpDate?: RPDate;
    onAdvanceDay?: () => void;
    language: Language;
}

export const WorldNewsViewer: React.FC<WorldNewsViewerProps> = ({
    events,
    onGenerate,
    isLoading,
    onClose,
    isMinimized,
    isMaximized,
    onMinimize,
    onMaximize,
    rpDate,
    onAdvanceDay,
    language
}) => {
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

    // Get current day's event if it exists
    const todayEvent = rpDate ? events.find(e => e.dayCount === rpDate.dayCount) : null;

    // Filter old events (exclude today's as it's shown prominently if expanded, or in list)
    const historyEvents = events.filter(e => e.id !== todayEvent?.id).sort((a,b) => b.dayCount - a.dayCount);

    return (
        <NaviWindow
            title={t('wn_title', language)}
            onClose={onClose}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            className="w-full h-full"
        >
            <div className="flex flex-col h-full bg-black/90 text-[color:var(--lain-cyan)] font-['Share_Tech_Mono']">
                
                {/* RP Clock Header */}
                {rpDate && (
                    <div className="p-3 border-b border-[color:var(--lain-cyan)]/30 bg-[color:var(--lain-cyan)]/10 flex justify-between items-center">
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="animate-pulse" />
                                <span className="font-bold tracking-widest">{t('wn_time', language)}</span>
                            </div>
                            <div className="font-mono bg-black/50 px-2 py-1 border border-[color:var(--lain-cyan)]/30">
                                {rpDate.year}-{String(rpDate.month + 1).padStart(2,'0')}-{String(rpDate.day).padStart(2,'0')} 
                                <span className="opacity-50 ml-2">[{rpDate.timeOfDay}]</span>
                            </div>
                            <div className="text-[10px] opacity-70 uppercase font-bold">{t('wn_day', language)}: {rpDate.dayCount}</div>
                        </div>
                        {onAdvanceDay && (
                            <button 
                                onClick={onAdvanceDay}
                                className="px-2 py-1 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors text-[10px] flex items-center gap-1 font-bold"
                            >
                                {t('wn_next_day', language)}
                            </button>
                        )}
                    </div>
                )}

                {/* Main Action Bar */}
                <div className="p-3 border-b border-[color:var(--lain-cyan)]/30 flex justify-between items-center bg-[color:var(--lain-cyan)]/5">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-widest">
                        <Globe size={14} /> NEWS FEED
                    </div>
                    <button 
                        onClick={onGenerate}
                        disabled={isLoading}
                        className="px-3 py-1 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors text-xs flex items-center gap-2"
                    >
                        <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                        {isLoading ? "SCANNING..." : (todayEvent ? t('wn_regenerate', language) : t('wn_update', language))}
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                    {/* Today's Highlight */}
                    {todayEvent ? (
                        <div className="border-2 border-[color:var(--lain-cyan)] p-4 bg-[color:var(--lain-cyan)]/5 shadow-[0_0_15px_rgba(0,240,255,0.1)] mb-6">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-[color:var(--lain-cyan)] text-black px-2 py-0.5 text-[9px] font-bold uppercase">LATEST</span>
                                <span className="text-[10px] opacity-60 font-mono">{todayEvent.date}</span>
                            </div>
                            <h2 className="text-lg font-bold text-glow mb-2 uppercase leading-tight">{todayEvent.headline}</h2>
                            <div className={`text-xs opacity-90 font-serif leading-relaxed transition-all overflow-hidden ${expandedEventId === todayEvent.id ? 'max-h-96' : 'max-h-0'}`}>
                                <div className="py-2 border-t border-[color:var(--lain-cyan)]/30 mt-2">
                                    {todayEvent.content}
                                </div>
                            </div>
                            <button 
                                onClick={() => setExpandedEventId(expandedEventId === todayEvent.id ? null : todayEvent.id)}
                                className="w-full text-center mt-2 pt-1 border-t border-[color:var(--lain-cyan)]/20 hover:bg-[color:var(--lain-cyan)]/10 transition-colors flex justify-center"
                            >
                                {expandedEventId === todayEvent.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                            </button>
                        </div>
                    ) : (
                        <div className="border border-dashed border-[color:var(--lain-cyan)]/30 p-6 text-center opacity-50 mb-6">
                            NO REPORT GENERATED FOR TODAY (DAY {rpDate?.dayCount}).
                        </div>
                    )}

                    <div className="text-[10px] font-bold tracking-[0.2em] opacity-50 uppercase border-b border-[color:var(--lain-cyan)]/20 pb-1 mb-2">ARCHIVE</div>

                    {historyEvents.length === 0 && (
                        <div className="text-center opacity-40 text-xs italic">No historical archives.</div>
                    )}
                    
                    {historyEvents.map(event => (
                        <div key={event.id} className="border border-[color:var(--lain-cyan)]/20 bg-black/40 p-3 relative group hover:border-[color:var(--lain-cyan)]/50 transition-colors">
                            <div className="flex justify-between items-center mb-1">
                                <div className="text-[10px] opacity-60 font-mono">DAY {event.dayCount}</div>
                                <div className="text-[9px] uppercase font-bold border border-[color:var(--lain-cyan)]/30 px-1 rounded text-[color:var(--lain-cyan)] opacity-70">
                                    {event.type}
                                </div>
                            </div>
                            <div 
                                className="cursor-pointer flex justify-between items-center"
                                onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                            >
                                <h3 className="text-xs font-bold opacity-90 group-hover:text-glow">{event.headline}</h3>
                                {expandedEventId === event.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                            </div>
                            
                            {expandedEventId === event.id && (
                                <div className="mt-2 pt-2 border-t border-[color:var(--lain-cyan)]/20 text-[10px] opacity-80 leading-relaxed font-serif animate-in slide-in-from-top-1">
                                    {event.content}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </NaviWindow>
    );
};
