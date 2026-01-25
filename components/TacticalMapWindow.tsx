
import React, { useState, useEffect, useRef } from 'react';
import { NaviWindow } from './NaviWindow';
import { TacticalMap } from './TacticalMap';
import { MapData } from '../types';
import { RefreshCw, Search, Map as MapIcon, Globe, Play, ZoomIn, ZoomOut, Maximize, Navigation } from 'lucide-react';
import { generateMapData } from '../services/geminiService';
import { audio } from '../services/audioEngine';
import { t } from '../utils/translations';

interface TacticalMapWindowProps {
    mapData?: MapData;
    userPos?: { x: number, y: number };
    charPos?: { x: number, y: number };
    worldContext?: string;
    apiKey: string;
    onUpdateMap: (map: MapData) => void;
    onClose: () => void;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
    onSystemBusy?: (busy: boolean) => void;
    language?: string;
}

const Minimap: React.FC<{ 
    mapData: MapData; 
    userPos?: { x: number, y: number };
    viewport: { x: number, y: number, w: number, h: number }; 
}> = ({ mapData, userPos, viewport }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = 'rgba(0, 20, 10, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Map Points
        const cellSize = canvas.width / 10;
        mapData.grid.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                const cell = row[x];
                if (cell === '#') ctx.fillStyle = 'rgba(0, 255, 100, 0.5)';
                else if (cell === '~') ctx.fillStyle = 'rgba(0, 100, 255, 0.5)';
                else if (cell === '$') ctx.fillStyle = 'yellow';
                else if (cell === 'E') ctx.fillStyle = 'red';
                else ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
                
                ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
            }
        });

        // Draw Player
        if (userPos) {
            ctx.fillStyle = 'white';
            ctx.fillRect(userPos.x * cellSize, userPos.y * cellSize, cellSize, cellSize);
        }

        // Draw Viewport Rect
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            viewport.x * canvas.width, 
            viewport.y * canvas.height, 
            viewport.w * canvas.width, 
            viewport.h * canvas.height
        );

    }, [mapData, userPos, viewport]);

    return (
        <div className="absolute bottom-4 right-4 w-24 h-24 border border-[color:var(--lain-cyan)] bg-black z-20 shadow-[0_0_10px_black]">
            <canvas ref={canvasRef} width={100} height={100} className="w-full h-full" />
            <div className="absolute top-0 left-0 bg-black/50 text-[8px] px-1 text-white font-mono">MINIMAP</div>
        </div>
    );
};

export const TacticalMapWindow: React.FC<TacticalMapWindowProps> = ({
    mapData,
    userPos,
    charPos,
    worldContext,
    apiKey,
    onUpdateMap,
    onClose,
    isMinimized,
    isMaximized,
    onMinimize,
    onMaximize,
    onSystemBusy,
    language = 'en'
}) => {
    const [keyword, setKeyword] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Zoom & Pan State
    const [zoom, setZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

    const lang = (language as any) || 'en';

    const handleZoom = (delta: number) => {
        setZoom(prev => Math.min(3, Math.max(1, prev + delta)));
        audio.playClickSound();
    };

    const handlePan = (dx: number, dy: number) => {
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    };

    const resetView = () => {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
        audio.playConfirmSound();
    };

    const handleGenerate = async (prompt: string) => {
        if (isGenerating || !apiKey) return;
        setIsGenerating(true);
        onSystemBusy?.(true);
        audio.playLoadTick();

        try {
            const context = prompt || worldContext || "A mysterious procedural dungeon";
            const newMap = await generateMapData(context, apiKey);
            if (newMap) {
                onUpdateMap(newMap);
                audio.playBootSound();
                resetView();
            } else {
                audio.playWindowSound(false);
            }
        } catch (e) {
            console.error(e);
            audio.playWindowSound(false);
        } finally {
            setIsGenerating(false);
            onSystemBusy?.(false);
        }
    };

    const getViewportRect = () => {
        const viewSize = 1 / zoom;
        const offsetX = -panOffset.x / (300 * zoom); 
        const offsetY = -panOffset.y / (300 * zoom);
        
        return {
            x: Math.max(0, Math.min(1 - viewSize, 0.5 - viewSize/2 + offsetX)),
            y: Math.max(0, Math.min(1 - viewSize, 0.5 - viewSize/2 + offsetY)),
            w: viewSize,
            h: viewSize
        };
    };

    return (
        <NaviWindow
            title={`${t('map_title', lang)} // ${mapData?.biome?.toUpperCase() || "UNKNOWN SECTOR"}`}
            onClose={onClose}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            className="w-[600px] h-[550px]"
        >
            <div className="flex flex-col h-full bg-black/95 text-[color:var(--lain-cyan)] font-['Share_Tech_Mono']">
                {/* Header Info */}
                <div className="p-2 border-b border-[color:var(--lain-cyan)]/30 bg-[color:var(--lain-cyan)]/5 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                        <MapIcon size={14} />
                        <span className="font-bold tracking-widest">GRID_V3.1</span>
                    </div>
                    {mapData && (
                        <div className="flex gap-2">
                            <button onClick={resetView} className="p-1 hover:text-white" title="Recenter"><Maximize size={12}/></button>
                            <button onClick={() => handleZoom(-0.2)} className="p-1 hover:text-white" title="Zoom Out"><ZoomOut size={12}/></button>
                            <span className="font-mono opacity-60">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => handleZoom(0.2)} className="p-1 hover:text-white" title="Zoom In"><ZoomIn size={12}/></button>
                        </div>
                    )}
                </div>

                {/* Map Display */}
                <div className="flex-1 relative border-b border-[color:var(--lain-cyan)]/30 overflow-hidden bg-black cursor-crosshair">
                    <TacticalMap 
                        mapData={mapData} 
                        userPos={userPos} 
                        charPos={charPos} 
                        className="w-full h-full absolute inset-0"
                        zoom={zoom}
                        panOffset={panOffset}
                        onPan={handlePan}
                        interactive={true}
                    />
                    
                    {/* Persistent Minimap */}
                    {mapData && (
                        <Minimap 
                            mapData={mapData} 
                            userPos={userPos} 
                            viewport={getViewportRect()} 
                        />
                    )}

                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 backdrop-blur-sm">
                            <div className="border border-[color:var(--lain-cyan)] p-4 flex flex-col items-center gap-2 bg-black animate-pulse">
                                <RefreshCw className="animate-spin" size={24} />
                                <span className="text-xs font-bold tracking-[0.2em]">{t('map_mapping', lang)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-4 bg-[color:var(--lain-cyan)]/5">
                    <div className="flex flex-col gap-3">
                        <div className="text-[9px] font-bold tracking-widest opacity-50 uppercase mb-1 flex items-center gap-2">
                            <Navigation size={10} /> {t('map_terrain', lang)}
                        </div>
                        
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="text" 
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="e.g. Cyberpunk Slums, Alien Nest..."
                                    className="w-full bg-black border border-[color:var(--lain-cyan)]/50 p-2 pl-8 text-xs focus:outline-none focus:border-[color:var(--lain-cyan)]"
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate(keyword)}
                                />
                                <Search size={12} className="absolute left-2 top-2.5 opacity-50" />
                            </div>
                            <button 
                                onClick={() => handleGenerate(keyword)}
                                disabled={!keyword.trim() || isGenerating}
                                className="px-4 bg-[color:var(--lain-cyan)] text-black text-xs font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                <Play size={10} fill="currentColor" /> {t('map_gen', lang)}
                            </button>
                        </div>

                        <button 
                            onClick={() => handleGenerate(worldContext || "")}
                            disabled={isGenerating}
                            className="w-full py-2 border border-dashed border-[color:var(--lain-cyan)]/50 hover:bg-[color:var(--lain-cyan)]/10 text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                            <Globe size={12} /> {t('map_regen', lang)}
                        </button>
                    </div>
                </div>
            </div>
        </NaviWindow>
    );
};
