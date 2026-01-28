import React, { useState, useEffect, useRef } from 'react';  
import { NaviWindow } from './NaviWindow';  
import { TacticalMap } from './TacticalMap';  
import { MapData, AppSettings, MapNode } from '../types';  
import { RefreshCw, Search, Map as MapIcon, Globe, Play, ZoomIn, ZoomOut, Maximize, Navigation, Info, X } from 'lucide-react';  
import { generateMapData } from '../services/worldEngine';  
import { audio } from '../services/audioEngine';  
import { t } from '../utils/translations';  
  
interface TacticalMapWindowProps {  
    mapData?: MapData;  
    userPos?: { x: number, y: number };  
    charPos?: { x: number, y: number };  
    worldContext?: string;  
    settings: AppSettings;  
    onUpdateMap: (map: MapData) => void;  
    onClose: () => void;  
    isMinimized: boolean;  
    isMaximized: boolean;  
    onMinimize: () => void;  
    onMaximize: () => void;  
    onSystemBusy?: (busy: boolean) => void;  
    language?: string;  
}  
  
export const TacticalMapWindow: React.FC<TacticalMapWindowProps> = ({  
    mapData, userPos, charPos, worldContext, settings, onUpdateMap, onClose, isMinimized, isMaximized, onMinimize, onMaximize, onSystemBusy, language = 'en'  
}) => {  
    const [keyword, setKeyword] = useState('');  
    const [isGenerating, setIsGenerating] = useState(false);  
    const [zoom, setZoom] = useState(1);  
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });  
    const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);  
  
    const handleGenerate = async (prompt: string) => {  
        const config = settings.mapsApi || settings.api;  
        if (isGenerating) return;  
        setIsGenerating(true);  
        onSystemBusy?.(true);  
        audio.playLoadTick();  
        try {  
            const context = prompt || worldContext || "A mysterious procedural dungeon";  
            const newMap = await generateMapData(context, config);  
            if (newMap) { onUpdateMap(newMap); audio.playBootSound(); setZoom(1); setPanOffset({x:0,y:0}); }  
            else audio.playWindowSound(false);  
        } catch (e) { console.error(e); audio.playWindowSound(false); }  
        finally { setIsGenerating(false); onSystemBusy?.(false); }  
    };  
  
    return (  
        <NaviWindow title="TACTICAL GRID" onClose={onClose} isMinimized={isMinimized} isMaximized={isMaximized} onMinimize={onMinimize} onMaximize={onMaximize} className="w-[800px] h-[600px]">  
            <div className="flex h-full bg-black/95 text-[color:var(--lain-cyan)] font-['Share_Tech_Mono']">  
                <div className="flex-1 relative border-r border-[color:var(--lain-cyan)]/30 overflow-hidden bg-black">  
                    <TacticalMap mapData={mapData} userPos={userPos} charPos={charPos} className="w-full h-full" zoom={zoom} panOffset={panOffset} onPan={(dx, dy) => setPanOffset(p => ({x:p.x+dx, y:p.y+dy}))} interactive={true} />  
