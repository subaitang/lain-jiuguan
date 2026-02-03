
import React, { useState, useRef, useEffect } from 'react';
import { NaviWindow } from './NaviWindow';
import { AppSettings, MusicTrack } from '../types';
import { Play, Pause, SkipForward, SkipBack, Plus, Music, Upload, Search, X, Volume2, Radio, Headphones, Globe, CloudRain, Zap, Coffee, Building2 } from 'lucide-react';
import { audio } from '../services/audioEngine';

interface MusicPlayerWindowProps {
    settings: AppSettings;
    onUpdateSettings: (s: AppSettings) => void;
    onClose: () => void;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
}

export const MusicPlayerWindow: React.FC<MusicPlayerWindowProps> = ({
    settings,
    onUpdateSettings,
    onClose,
    isMinimized,
    isMaximized,
    onMinimize,
    onMaximize
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
    const [activeTab, setActiveTab] = useState<'playlist' | 'search'>('playlist');
    const [isSearching, setIsSearching] = useState(false);

    const musicState = settings.music || {
        enabled: true,
        mode: 'manual',
        volume: 0.5,
        playlist: [],
        isPlaying: false
    };

    const currentTrack = musicState.playlist.find(t => t.id === musicState.currentTrackId);

    // Audio Element Management
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = musicState.volume;
            if (musicState.isPlaying) {
                audioRef.current.play().catch(e => console.log("Auto-play blocked", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [musicState.isPlaying, musicState.volume, musicState.currentTrackId]);

    // Visualizer Loop
    useEffect(() => {
        let animationId: number;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        
        const render = () => {
            if (!canvas || !ctx) return;
            
            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Mock Visualization based on time/playing state
            const bars = 32;
            const barWidth = canvas.width / bars;
            
            for (let i = 0; i < bars; i++) {
                let height = 5;
                if (musicState.isPlaying) {
                    const seed = (Date.now() / 100) + i;
                    height = Math.max(5, Math.abs(Math.sin(seed)) * (canvas.height * 0.8));
                } else {
                    height = 2; // Flatline
                }
                
                const hue = (i / bars) * 180 + 180; // Cyan/Blue range
                ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
                ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 1, height);
                
                // Peak
                ctx.fillStyle = '#fff';
                ctx.fillRect(i * barWidth, canvas.height - height - 2, barWidth - 1, 2);
            }
            
            animationId = requestAnimationFrame(render);
        };
        
        render();
        return () => cancelAnimationFrame(animationId);
    }, [musicState.isPlaying]);

    const handlePlayPause = () => {
        const newIsPlaying = !musicState.isPlaying;
        onUpdateSettings({
            ...settings,
            music: { ...musicState, isPlaying: newIsPlaying }
        });
        if (newIsPlaying) audio.playClickSound();
    };

    const handleNext = () => {
        if (!musicState.playlist.length) return;
        const idx = musicState.playlist.findIndex(t => t.id === musicState.currentTrackId);
        const nextIdx = (idx + 1) % musicState.playlist.length;
        onUpdateSettings({
            ...settings,
            music: { ...musicState, currentTrackId: musicState.playlist[nextIdx].id, isPlaying: true }
        });
        audio.playClickSound();
    };

    const handlePrev = () => {
        if (!musicState.playlist.length) return;
        const idx = musicState.playlist.findIndex(t => t.id === musicState.currentTrackId);
        const prevIdx = (idx - 1 + musicState.playlist.length) % musicState.playlist.length;
        onUpdateSettings({
            ...settings,
            music: { ...musicState, currentTrackId: musicState.playlist[prevIdx].id, isPlaying: true }
        });
        audio.playClickSound();
    };

    const handleSelectTrack = (trackId: string) => {
        onUpdateSettings({
            ...settings,
            music: { ...musicState, currentTrackId: trackId, isPlaying: true }
        });
        audio.playConfirmSound();
    };

    const handleAddTrack = (track: MusicTrack) => {
        onUpdateSettings({
            ...settings,
            music: { ...musicState, playlist: [...musicState.playlist, track] }
        });
        audio.playConfirmSound();
    };

    const handleRemoveTrack = (trackId: string) => {
        onUpdateSettings({
            ...settings,
            music: { 
                ...musicState, 
                playlist: musicState.playlist.filter(t => t.id !== trackId),
                // Stop if removing current
                currentTrackId: musicState.currentTrackId === trackId ? undefined : musicState.currentTrackId,
                isPlaying: musicState.currentTrackId === trackId ? false : musicState.isPlaying
            }
        });
        audio.playWindowSound(false);
    };

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        setCurrentTime(e.currentTarget.currentTime);
        setDuration(e.currentTarget.duration || 0);
    };

    const handleTrackEnded = () => {
        handleNext(); // Auto-advance
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const newTrack: MusicTrack = {
                id: `local-${Date.now()}`,
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: "Local Upload",
                url: url,
                platform: 'local',
                addedBy: 'user'
            };
            handleAddTrack(newTrack);
            // Switch to playlist tab
            setActiveTab('playlist');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        audio.playSendSound();

        // Simulate searching
        setTimeout(() => {
            const mockResults: MusicTrack[] = [
                { id: `web-${Date.now()}-1`, title: `${searchQuery} (Demo Mix)`, artist: "Unknown Artist", url: "https://files.catbox.moe/uhkyia.mp4", platform: 'web', addedBy: 'user' }, // Using existing egg as placeholder sound
                { id: `web-${Date.now()}-2`, title: "Cyberpunk Ambience", artist: "Neon Grid", url: "", platform: 'soundcloud', addedBy: 'user' },
                { id: `web-${Date.now()}-3`, title: "Lain's Theme (Remix)", artist: "Wired Sound", url: "", platform: 'youtube', addedBy: 'user' },
            ];
            
            // If user pasted a URL, prioritize it
            if (searchQuery.startsWith('http')) {
                mockResults.unshift({
                    id: `web-${Date.now()}-0`,
                    title: "Web Stream",
                    artist: "URL Source",
                    url: searchQuery,
                    platform: 'web',
                    addedBy: 'user'
                });
            }

            setSearchResults(mockResults);
            setIsSearching(false);
            audio.playReceiveSound();
        }, 1500);
    };

    const formatTime = (sec: number) => {
        if (!sec || isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const platformIcons = {
        spotify: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
        netease: "https://s1.music.126.net/style/favicon.ico",
        qq: "https://y.qq.com/favicon.ico",
        apple: "https://www.apple.com/favicon.ico",
        youtube: "https://www.youtube.com/s/desktop/12d59688/img/favicon.ico",
        soundcloud: "https://a-v2.sndcdn.com/assets/images/sc-icons/favicon-2cadd14bdb.ico",
        local: null,
        web: null
    };

    return (
        <NaviWindow
            title="AUDIO // MUSIC PLAYER"
            onClose={onClose}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            className="w-[400px] h-[500px]"
        >
            <div className="flex flex-col h-full bg-black/90 text-[color:var(--lain-cyan)] font-['Share_Tech_Mono']">
                
                {/* Visualizer & Info Area */}
                <div className="h-32 bg-black relative border-b border-[color:var(--lain-cyan)]/30 shrink-0">
                    <canvas ref={canvasRef} width={400} height={128} className="w-full h-full absolute inset-0 opacity-50" />
                    
                    <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center justify-between mb-1">
                            <div className="text-[10px] font-bold tracking-widest opacity-60 uppercase flex items-center gap-2">
                                {musicState.mode === 'ai' ? <Headphones size={12} className="text-purple-400 animate-pulse"/> : <Radio size={12}/>}
                                MODE: {musicState.mode.toUpperCase()}
                            </div>
                            <button 
                                onClick={() => onUpdateSettings({...settings, music: {...musicState, mode: musicState.mode === 'ai' ? 'manual' : 'ai'}})}
                                className={`text-[9px] border px-2 py-0.5 rounded-sm transition-colors ${musicState.mode === 'ai' ? 'border-purple-500 text-purple-400 bg-purple-900/20' : 'border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)]/20'}`}
                            >
                                SWITCH
                            </button>
                        </div>
                        <div className="overflow-hidden whitespace-nowrap">
                            <div className={`text-lg font-bold text-glow ${musicState.isPlaying ? 'animate-[marquee_10s_linear_infinite]' : ''}`}>
                                {currentTrack ? `${currentTrack.title} - ${currentTrack.artist}` : "NO TRACK SELECTED"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ambience Controls */}
                <div className="flex justify-between items-center p-2 bg-[color:var(--lain-cyan)]/10 border-b border-[color:var(--lain-cyan)]/30">
                    <div className="text-[10px] font-bold opacity-60 tracking-wider">ATMOSPHERE</div>
                    <div className="flex gap-1">
                        <button onClick={() => audio.playAmbience('rain')} className="p-1.5 hover:bg-[color:var(--lain-cyan)] hover:text-black border border-[color:var(--lain-cyan)]/30 transition-colors" title="Rain"><CloudRain size={12}/></button>
                        <button onClick={() => audio.playAmbience('city')} className="p-1.5 hover:bg-[color:var(--lain-cyan)] hover:text-black border border-[color:var(--lain-cyan)]/30 transition-colors" title="City"><Building2 size={12}/></button>
                        <button onClick={() => audio.playAmbience('tension')} className="p-1.5 hover:bg-[color:var(--lain-cyan)] hover:text-black border border-[color:var(--lain-cyan)]/30 transition-colors" title="Tension"><Zap size={12}/></button>
                        <button onClick={() => audio.playAmbience('calm')} className="p-1.5 hover:bg-[color:var(--lain-cyan)] hover:text-black border border-[color:var(--lain-cyan)]/30 transition-colors" title="Calm"><Coffee size={12}/></button>
                        <button onClick={() => audio.stopAmbience()} className="p-1.5 hover:bg-red-500 hover:text-white border border-red-500/30 transition-colors ml-2" title="Stop Ambience"><X size={12}/></button>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-3 bg-[color:var(--lain-cyan)]/5 border-b border-[color:var(--lain-cyan)]/30">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-mono opacity-70">
                        <span>{formatTime(currentTime)}</span>
                        <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[color:var(--lain-cyan)]" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}></div>
                        </div>
                        <span>{formatTime(duration)}</span>
                    </div>
                    
                    <div className="flex justify-center items-center gap-6">
                        <button onClick={handlePrev} className="hover:text-white transition-colors"><SkipBack size={16}/></button>
                        <button 
                            onClick={handlePlayPause}
                            className="w-10 h-10 border border-[color:var(--lain-cyan)] flex items-center justify-center rounded-full hover:bg-[color:var(--lain-cyan)] hover:text-black transition-all shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                        >
                            {musicState.isPlaying ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor" className="ml-0.5"/>}
                        </button>
                        <button onClick={handleNext} className="hover:text-white transition-colors"><SkipForward size={16}/></button>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 justify-center opacity-60 hover:opacity-100 transition-opacity">
                        <Volume2 size={12} />
                        <input 
                            type="range" 
                            min="0" max="1" step="0.05" 
                            value={musicState.volume}
                            onChange={(e) => onUpdateSettings({...settings, music: {...musicState, volume: parseFloat(e.target.value)}})}
                            className="w-24 h-1 accent-[color:var(--lain-cyan)] bg-gray-700 appearance-none rounded-lg"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[color:var(--lain-cyan)]/30">
                    <button 
                        onClick={() => setActiveTab('playlist')}
                        className={`flex-1 py-2 text-xs font-bold transition-all ${activeTab === 'playlist' ? 'bg-[color:var(--lain-cyan)]/20 border-b-2 border-[color:var(--lain-cyan)]' : 'hover:bg-[color:var(--lain-cyan)]/5'}`}
                    >
                        PLAYLIST
                    </button>
                    <button 
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-2 text-xs font-bold transition-all ${activeTab === 'search' ? 'bg-[color:var(--lain-cyan)]/20 border-b-2 border-[color:var(--lain-cyan)]' : 'hover:bg-[color:var(--lain-cyan)]/5'}`}
                    >
                        SEARCH / ADD
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                    {activeTab === 'playlist' ? (
                        <div className="space-y-1">
                            {!musicState.playlist.length && <div className="text-center opacity-40 text-xs py-10 italic">Playlist empty.</div>}
                            {musicState.playlist.map((track) => (
                                <div 
                                    key={track.id}
                                    className={`flex items-center justify-between p-2 text-xs border ${track.id === musicState.currentTrackId ? 'border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/10 font-bold' : 'border-transparent hover:bg-[color:var(--lain-cyan)]/5'} group cursor-pointer`}
                                    onClick={() => handleSelectTrack(track.id)}
                                >
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="truncate">{track.title}</div>
                                        <div className="text-[9px] opacity-60 truncate flex items-center gap-1">
                                            {track.platform && track.platform !== 'local' && track.platform !== 'web' && (
                                                <img src={platformIcons[track.platform as keyof typeof platformIcons] || ''} className="w-3 h-3 grayscale opacity-70" alt={track.platform}/>
                                            )}
                                            {track.artist}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {track.id === musicState.currentTrackId && musicState.isPlaying && <div className="w-2 h-2 bg-[color:var(--lain-cyan)] rounded-full animate-pulse"></div>}
                                        <button onClick={(e) => { e.stopPropagation(); handleRemoveTrack(track.id); }} className="hover:text-red-500"><X size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Song, Artist, or URL..."
                                    className="flex-1 bg-black border border-[color:var(--lain-cyan)]/50 p-2 text-xs focus:outline-none focus:border-[color:var(--lain-cyan)] placeholder-white/30"
                                />
                                <button type="submit" disabled={isSearching} className="px-3 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors">
                                    <Search size={14} className={isSearching ? "animate-spin" : ""} />
                                </button>
                            </form>

                            <div className="flex gap-2 justify-center">
                                {/* Simulated Platform Icons */}
                                {['spotify', 'apple', 'youtube', 'soundcloud', 'netease', 'qq'].map(p => (
                                    <div key={p} className="w-6 h-6 bg-white/10 rounded flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-help" title={`Search ${p}`}>
                                        <Globe size={12}/> 
                                    </div>
                                ))}
                            </div>

                            <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-[color:var(--lain-cyan)]/50 hover:bg-[color:var(--lain-cyan)]/10 cursor-pointer transition-colors text-xs">
                                <Upload size={14} />
                                <span>UPLOAD LOCAL FILE</span>
                                <input type="file" className="hidden" accept="audio/*" onChange={handleUpload} />
                            </label>

                            <div className="border-t border-[color:var(--lain-cyan)]/20 pt-2">
                                <div className="text-[10px] opacity-50 tracking-widest mb-2">RESULTS</div>
                                {searchResults.map((result) => (
                                    <div key={result.id} className="flex items-center justify-between p-2 border border-[color:var(--lain-cyan)]/20 hover:border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)]/5 text-xs mb-1">
                                        <div className="truncate flex-1 pr-2">
                                            <div className="font-bold truncate">{result.title}</div>
                                            <div className="text-[9px] opacity-60">{result.artist}</div>
                                        </div>
                                        <button 
                                            onClick={() => handleAddTrack(result)}
                                            className="p-1 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors"
                                        >
                                            <Plus size={12}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden Player */}
                <audio 
                    ref={audioRef}
                    src={currentTrack?.url}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleTrackEnded}
                    onError={() => console.error("Audio Error")}
                />
            </div>
        </NaviWindow>
    );
};