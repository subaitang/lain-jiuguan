
import React, { useEffect, useState, useRef } from 'react';
import { logger, LogEntry, ProcessStatus } from '../services/logger';
import { Activity, Cpu, HardDrive, Wifi, Search, Shield, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/translations';

interface SystemStats {
    fps: number;
    mem: number;
    uptime: number;
    latency: number;
}

interface SystemConsoleProps {
    language?: Language;
}

export const SystemConsole: React.FC<SystemConsoleProps> = ({ language = 'en' }) => {
    const lang = language as Language;
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<SystemStats>({ fps: 60, mem: 12, uptime: 0, latency: 0 });
    const [processes, setProcesses] = useState<ProcessStatus[]>([]);
    const endRef = useRef<HTMLDivElement>(null);
    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Logger subscription
    useEffect(() => {
        const unsubscribeLogs = logger.subscribe((entry) => {
            setLogs(prev => {
                const next = [...prev, entry];
                if (next.length > 100) return next.slice(-100);
                return next;
            });
        });

        const unsubscribeProcs = logger.subscribeProcesses((procs) => {
            setProcesses(procs);
        });

        return () => {
            unsubscribeLogs();
            unsubscribeProcs();
        };
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (endRef.current && scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            // Only auto-scroll if we are near the bottom
            if (scrollHeight - scrollTop - clientHeight < 100) {
                endRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [logs]);

    // System Monitor Loop (Simulation + Real Latency estimation)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = performance.now();
            const delta = now - lastTime.current;
            frameCount.current++;

            if (delta >= 1000) {
                const fps = Math.round((frameCount.current * 1000) / delta);
                
                // Estimate latency based on recent API logs if possible, otherwise random fluctuation
                let estimatedLatency = 0;
                const recentLogs = logs.slice(-10);
                const tx = recentLogs.find(l => l.type === 'tx');
                const rx = recentLogs.find(l => l.type === 'rx');
                
                if (tx && rx && rx.timestamp > tx.timestamp) {
                     // Very rough simulation of latency displayed
                     estimatedLatency = Math.floor(Math.random() * 50) + 20;
                } else {
                     estimatedLatency = 10 + Math.floor(Math.random() * 5);
                }

                setStats(prev => ({
                    fps,
                    uptime: prev.uptime + 1,
                    mem: 64 + Math.floor(Math.random() * 16) + (processes.length * 5), 
                    latency: estimatedLatency
                }));
                
                frameCount.current = 0;
                lastTime.current = now;
            }
        }, 1000); 

        return () => clearInterval(interval);
    }, [logs, processes.length]);

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600).toString().padStart(2, '0');
        const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const getLogColor = (type: string) => {
        switch (type) {
            case 'error': return 'text-red-500 font-bold';
            case 'warn': return 'text-yellow-400';
            case 'tx': return 'text-blue-400';
            case 'rx': return 'text-green-400';
            case 'auth': return 'text-purple-400';
            default: return 'text-[color:var(--lain-cyan)] opacity-80';
        }
    };

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'error': return <AlertTriangle size={10} />;
            case 'tx': return <ArrowUp size={10} />;
            case 'rx': return <ArrowDown size={10} />;
            case 'auth': return <Shield size={10} />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden text-[color:var(--lain-cyan)] font-mono text-xs bg-black">
            {/* Real-time Status Header */}
            <div className="border-b border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/5 p-1 grid grid-cols-2 gap-1 text-[10px] sm:text-xs">
                <div className="flex items-center gap-1">
                    <Activity size={10} className="animate-pulse" />
                    <span>UP: {formatTime(stats.uptime)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <HardDrive size={10} />
                    <span>MEM: {stats.mem}MB</span>
                </div>
                <div className="flex items-center gap-1">
                    <Wifi size={10} />
                    <span>LAT: {stats.latency}ms</span>
                </div>
                <div className="flex items-center gap-1">
                    <Cpu size={10} />
                    <span>FPS: {stats.fps}</span>
                </div>
            </div>

            {/* Background Execution Detection Monitor */}
            <div className="border-b border-[color:var(--lain-cyan)]/30 p-2 bg-black/40 min-h-[80px]">
                <div className="flex items-center justify-between text-[10px] font-bold tracking-widest mb-2 opacity-80 text-[color:var(--lain-cyan)]">
                    <div className="flex items-center gap-2">
                        <Search size={10} className="animate-[spin_3s_linear_infinite]" />
                        <span>{t('sys_bg_detect', lang)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-400 animate-pulse">
                        <Shield size={10} />
                        <span>{t('sys_active', lang)}: {processes.length}</span>
                    </div>
                </div>
                <div className="space-y-1 font-['Share_Tech_Mono']">
                    <div className="flex text-[9px] opacity-50 mb-1 border-b border-[color:var(--lain-cyan)]/20 pb-0.5">
                        <span className="w-16">ID</span>
                        <span className="flex-1">DAEMON</span>
                        <span className="w-12 text-center">STAT</span>
                        <span className="w-10 text-right">LOAD</span>
                    </div>
                    {processes.length === 0 && <div className="text-[9px] opacity-30 italic text-center py-2">NO ACTIVE THREADS</div>}
                    {processes.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-[10px] leading-tight group hover:bg-[color:var(--lain-cyan)]/10 cursor-default">
                             <span className="w-16 opacity-50 text-[color:var(--lain-cyan)] truncate font-mono">{p.id}</span>
                             <span className="flex-1 truncate text-white/80 group-hover:text-white transition-colors">{p.name}</span>
                             <span className={`w-12 text-center font-bold ${
                                 p.state === 'EXEC' ? 'text-green-400 animate-pulse' : 
                                 p.state === 'WAIT' ? 'text-yellow-400' : 
                                 p.state === 'ERR' ? 'text-red-500' : 'text-[color:var(--lain-cyan)]/50'
                             }`}>
                                 {p.state}
                             </span>
                             <div className="w-10 flex items-center gap-1 justify-end">
                                <div className="h-1 bg-[color:var(--lain-cyan)]/30 w-full relative">
                                    <div 
                                        className={`absolute top-0 left-0 h-full transition-all duration-300 ${p.load > 90 ? 'bg-red-500' : 'bg-[color:var(--lain-cyan)]'}`} 
                                        style={{ width: `${Math.min(100, p.load)}%` }}
                                    ></div>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scrolling Logs */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin bg-black/80"
            >
                {logs.length === 0 && <div className="text-center opacity-30 mt-10">SYSTEM_LOG_INITIALIZED... WAITING_FOR_EVENTS</div>}
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-2 font-['VT323'] text-sm leading-tight hover:bg-white/5 px-1 py-0.5">
                        <span className="text-[color:var(--lain-cyan)]/30 shrink-0 font-mono text-[10px] pt-0.5">{log.timestamp.split('.')[0]}</span>
                        <span className="opacity-40 text-[10px] w-12 shrink-0 pt-0.5 text-right font-bold">{log.source}</span>
                        <span className="opacity-50 shrink-0">{'>'}</span>
                        <span className={`break-all flex items-start gap-1 ${getLogColor(log.type)}`}>
                            {getLogIcon(log.type) && <span className="pt-1 opacity-70">{getLogIcon(log.type)}</span>}
                            {log.message}
                        </span>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            
            <div className="p-1 border-t border-[color:var(--lain-cyan)]/20 text-[9px] text-right opacity-40">
                LOG_STREAM_ACTIVE // PID: {Math.floor(Math.random() * 9999)}
            </div>
        </div>
    );
};
