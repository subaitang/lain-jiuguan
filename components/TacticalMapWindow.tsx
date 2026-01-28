import { Play, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { audio } from '../services/audioEngine';
import { generateMapData } from '../services/worldEngine';
import { AppSettings, MapData, MapNode } from '../types';
import { NaviWindow } from './NaviWindow';
import { TacticalMap } from './TacticalMap';

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
  mapData, userPos, charPos, worldContext, settings, onUpdateMap, onClose, isMinimized, isMaximized, onMinimize, onMaximize, onSystemBusy
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
      if (newMap) { onUpdateMap(newMap); audio.playBootSound(); setZoom(1); setPanOffset({ x: 0, y: 0 }); }
      else audio.playWindowSound(false);
    } catch (e) { console.error(e); audio.playWindowSound(false); }
    finally { setIsGenerating(false); onSystemBusy?.(false); }
  };

  return (
    <NaviWindow title="TACTICAL GRID" onClose={onClose} isMinimized={isMinimized} isMaximized={isMaximized} onMinimize={onMinimize} onMaximize={onMaximize} className="w-[800px] h-[600px]">
      <div className="flex h-full bg-black/95 text-[color:var(--lain-cyan)] font-['Share_Tech_Mono']">
        <div className="flex-1 relative border-r border-[color:var(--lain-cyan)]/30 overflow-hidden bg-black">
          <TacticalMap mapData={mapData} userPos={userPos} charPos={charPos} className="w-full h-full" zoom={zoom} panOffset={panOffset} onPan={(dx, dy) => setPanOffset(p => ({ x: p.x + dx, y: p.y + dy }))} interactive={true} />
          {isGenerating && <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20"><RefreshCw className="animate-spin" size={32} /></div>}
        </div>
        <div className="w-64 flex flex-col bg-[color:var(--lain-cyan)]/5 border-l border-[color:var(--lain-cyan)]/30">
          <div className="p-4 border-b border-[color:var(--lain-cyan)]/30">
            <h3 className="font-bold tracking-widest uppercase mb-2">SECTOR_CONTROL</h3>
            <div className="flex gap-2 mb-2">
              <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Terrain Type..." className="w-full bg-black border border-[color:var(--lain-cyan)]/50 p-2 text-xs" />
              <button onClick={() => handleGenerate(keyword)} disabled={isGenerating} className="p-2 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black"><Play size={14} /></button>
            </div>
            <div className="flex justify-between text-xs opacity-60">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>[-]</button>
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.2))}>[+]</button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <h4 className="font-bold border-b border-[color:var(--lain-cyan)]/30 pb-1 mb-2 text-xs">NODES_DETECTED</h4>
            {mapData?.nodes?.map((n, i) => (
              <div key={i} className="mb-2 p-2 border border-[color:var(--lain-cyan)]/20 hover:bg-[color:var(--lain-cyan)]/10 cursor-pointer text-xs" onClick={() => setSelectedNode(n)}>
                <div className="font-bold flex items-center gap-2">{n.icon} {n.type.toUpperCase()}</div>
                <div className="opacity-70 truncate">{n.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NaviWindow>
  );
}; 
