
import { AlertTriangle, Box, Footprints, Gem, Hexagon, Skull, Target } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { MapData } from '../types';

interface TacticalMapProps {
  mapData?: MapData;
  userPos?: { x: number, y: number };
  charPos?: { x: number, y: number };
  className?: string;
  zoom?: number;
  panOffset?: { x: number, y: number };
  onPan?: (dx: number, dy: number) => void;
  interactive?: boolean;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  mapData,
  userPos,
  charPos,
  className,
  zoom = 1,
  panOffset = { x: 0, y: 0 },
  onPan,
  interactive = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive || !onPan) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !onPan) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    onPan(dx, dy);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const renderTile = (x: number, y: number) => {
    let content = null;
    let bgClass = "bg-black/20 border-white/5";
    let iconClass = "text-white/20";

    // Check for entity
    const isUser = userPos && userPos.x === x && userPos.y === y;
    const isChar = charPos && charPos.x === x && charPos.y === y;

    if (mapData?.tiles) {
      const tile = mapData.tiles.find(t => t.x === x && t.y === y);
      if (tile) {
        switch (tile.type) {
          case 'wall':
            content = <Box size={14} />;
            bgClass = "bg-[color:var(--lain-cyan)]/20 border-[color:var(--lain-cyan)]/50";
            iconClass = "text-[color:var(--lain-cyan)]";
            break;
          case 'floor':
            // Empty usually
            break;
          case 'hazard':
            content = <AlertTriangle size={14} />;
            bgClass = "bg-red-500/20 border-red-500/50";
            iconClass = "text-red-500 animate-pulse";
            break;
          case 'point_of_interest':
          case 'loot':
            content = <Gem size={14} />;
            bgClass = "bg-yellow-500/20 border-yellow-500/50";
            iconClass = "text-yellow-500";
            break;
        }
      }
    } else if (mapData?.grid) {
      // Legacy Fallback
      const cell = mapData.grid[y]?.[x];
      if (cell === '#') {
        content = <Box size={14} />;
        bgClass = "bg-gray-800 border-gray-600";
      } else if (cell === 'E') {
        content = <Skull size={14} />;
        iconClass = "text-red-500";
      }
    }

    if (isUser) {
      return (
        <div key={`${x}-${y}`} className="relative w-full h-full flex items-center justify-center bg-blue-500/30 border border-blue-400 shadow-[0_0_10px_blue]">
          <Target size={16} className="text-white animate-spin-slow" />
          <div className="absolute -top-3 text-[8px] bg-blue-500 text-black px-1 font-bold">P1</div>
        </div>
      );
    }

    if (isChar) {
      return (
        <div key={`${x}-${y}`} className="relative w-full h-full flex items-center justify-center bg-pink-500/30 border border-pink-400">
          <Footprints size={16} className="text-pink-300" />
        </div>
      );
    }

    return (
      <div key={`${x}-${y}`} className={`w-full h-full border flex items-center justify-center text-[10px] ${bgClass}`}>
        <div className={iconClass}>{content}</div>
      </div>
    );
  };

  const gridSize = 10;

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden select-none ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`
        }}
      >
        <div
          className="grid gap-1 p-4 bg-black/80 border border-[color:var(--lain-cyan)]/30 shadow-[0_0_30px_rgba(0,240,255,0.1)]"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 40px)`,
            gridTemplateRows: `repeat(${gridSize}, 40px)`
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);
            return renderTile(x, y);
          })}
        </div>
      </div>

      {/* HUD Overlay */}
      <div className="absolute top-2 left-2 pointer-events-none">
        <div className="flex items-center gap-2 text-[color:var(--lain-cyan)] text-xs font-mono">
          <Hexagon size={14} className="animate-spin-slow" />
          <span>SECTOR: {mapData?.biome || "UNKNOWN"}</span>
        </div>
      </div>
    </div>
  );
};
