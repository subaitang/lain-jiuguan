
import React, { useEffect, useRef } from 'react';
import { MapData } from '../types';

interface TacticalMapProps {
  mapData?: MapData;
  userPos?: { x: number, y: number };
  charPos?: { x: number, y: number };
  className?: string;
  zoom?: number;
  panOffset?: { x: number, y: number };
  onPan?: (dx: number, dy: number) => void;
  onCellClick?: (x: number, y: number) => void;
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
  onCellClick,
  interactive = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const startDrag = useRef({ x: 0, y: 0 });
  const lastMouse = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number>(0);

  // Handle Mouse Events for Panning & Clicking
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    isDragging.current = true;
    startDrag.current = { x: e.clientX, y: e.clientY };
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !onPan) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    onPan(dx, dy);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // Detect Click (if moved less than 5px)
    const dist = Math.sqrt(Math.pow(e.clientX - startDrag.current.x, 2) + Math.pow(e.clientY - startDrag.current.y, 2));
    if (dist < 5 && onCellClick && mapData) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Recalculate grid sizing (mirrors draw logic)
      const mapSize = 10;
      const minDim = Math.min(canvas.width, canvas.height);
      const baseCellSize = (minDim / (mapSize + 2));
      const cellSize = baseCellSize * zoom;
      const totalMapWidth = cellSize * mapSize;
      const totalMapHeight = cellSize * mapSize;
      const startX = (canvas.width - totalMapWidth) / 2 + panOffset.x;
      const startY = (canvas.height - totalMapHeight) / 2 + panOffset.y;

      const gridX = Math.floor((mouseX - startX) / cellSize);
      const gridY = Math.floor((mouseY - startY) / cellSize);

      if (gridX >= 0 && gridX < mapSize && gridY >= 0 && gridY < mapSize) {
        onCellClick(gridX, gridY);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Only update dimensions if they changed to avoid clearing canvas unnecessarily on re-render
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      time += 0.05;

      // Clear
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (mapData) {
        const mapSize = 10; // 10x10 grid
        // Base cell size to fit screen at zoom 1
        const minDim = Math.min(canvas.width, canvas.height);
        const baseCellSize = (minDim / (mapSize + 2));
        const cellSize = baseCellSize * zoom;

        // Center the map initially, then apply pan
        const totalMapWidth = cellSize * mapSize;
        const totalMapHeight = cellSize * mapSize;

        const startX = (canvas.width - totalMapWidth) / 2 + panOffset.x;
        const startY = (canvas.height - totalMapHeight) / 2 + panOffset.y;

        // Clipping for clean edges
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.clip();

        // Draw Grid & Cells
        mapData.grid.forEach((row, y) => {
          for (let x = 0; x < row.length; x++) {
            const cell = row[x];
            const posX = startX + x * cellSize;
            const posY = startY + y * cellSize;

            // Skip if offscreen
            if (posX < -cellSize || posY < -cellSize || posX > canvas.width || posY > canvas.height) continue;

            // --- CELL RENDERING ---

            // Default Floor
            ctx.fillStyle = 'rgba(0, 20, 10, 0.8)';
            ctx.strokeStyle = 'rgba(0, 255, 100, 0.15)';
            ctx.lineWidth = 1;

            if (cell === '#') {
              // WALL: 3D Block effect
              ctx.fillStyle = 'rgba(0, 60, 30, 0.9)';
              ctx.fillRect(posX, posY, cellSize, cellSize);

              // Inner bevel
              ctx.strokeStyle = 'rgba(0, 255, 100, 0.6)';
              ctx.strokeRect(posX + 2, posY + 2, cellSize - 4, cellSize - 4);

              // Crosshatch
              ctx.beginPath();
              ctx.moveTo(posX, posY); ctx.lineTo(posX + cellSize, posY + cellSize);
              ctx.stroke();
            }
            else if (cell === '~') {
              // WATER: Animated waves
              ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
              ctx.fillRect(posX, posY, cellSize, cellSize);

              ctx.strokeStyle = 'rgba(0, 200, 255, 0.4)';
              ctx.beginPath();
              for (let i = 0; i < cellSize; i += 5) {
                const waveY = posY + i + Math.sin(time + x + (i * 0.1)) * 2;
                ctx.moveTo(posX, waveY);
                ctx.lineTo(posX + cellSize, waveY);
              }
              ctx.stroke();
            }
            else {
              // FLOOR: Grid dots
              ctx.fillStyle = 'rgba(0, 255, 100, 0.05)';
              ctx.fillRect(posX + 2, posY + 2, cellSize - 4, cellSize - 4);

              // Corner markers
              ctx.fillStyle = 'rgba(0, 255, 100, 0.4)';
              ctx.fillRect(posX, posY, 2, 2);
              ctx.fillRect(posX + cellSize - 2, posY, 2, 2);
              ctx.fillRect(posX, posY + cellSize - 2, 2, 2);
              ctx.fillRect(posX + cellSize - 2, posY + cellSize - 2, 2, 2);
            }

            // Grid Border
            ctx.strokeStyle = 'rgba(0, 255, 100, 0.1)';
            ctx.strokeRect(posX, posY, cellSize, cellSize);

            // Items / Points of Interest
            if (cell === '$') {
              // LOOT: Spinning Box
              ctx.save();
              ctx.translate(posX + cellSize / 2, posY + cellSize / 2);
              ctx.rotate(time);
              ctx.fillStyle = 'yellow';
              ctx.fillRect(-cellSize / 6, -cellSize / 6, cellSize / 3, cellSize / 3);
              ctx.shadowColor = 'yellow';
              ctx.shadowBlur = 10;
              ctx.strokeRect(-cellSize / 4, -cellSize / 4, cellSize / 2, cellSize / 2);
              ctx.restore();
            }
            if (cell === 'E') {
              // ENEMY: Pulsing Diamond
              const pulse = 1 + Math.sin(time * 5) * 0.2;
              ctx.save();
              ctx.translate(posX + cellSize / 2, posY + cellSize / 2);
              ctx.scale(pulse, pulse);
              ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
              ctx.beginPath();
              ctx.moveTo(0, -cellSize / 3);
              ctx.lineTo(cellSize / 3, 0);
              ctx.lineTo(0, cellSize / 3);
              ctx.lineTo(-cellSize / 3, 0);
              ctx.fill();
              // Glitch effect
              if (Math.random() > 0.95) {
                ctx.fillStyle = 'white';
                ctx.fillRect(-10, -5, 20, 2);
              }
              ctx.restore();
            }
          }
        });

        // Draw Entities
        const drawEntity = (pos: { x: number, y: number }, color: string, label: string, isPlayer: boolean) => {
          const cx = startX + (pos.x + 0.5) * cellSize;
          const cy = startY + (pos.y + 0.5) * cellSize;

          if (isPlayer) {
            // Radar Cone
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 2);
            ctx.fillStyle = 'rgba(0, 255, 100, 0.2)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, cellSize, 0, Math.PI / 4);
            ctx.fill();
            ctx.restore();

            // Player Marker
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(cx, cy, cellSize / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            // NPC Marker
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx, cy, cellSize / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Label
          ctx.fillStyle = 'white';
          ctx.font = `bold ${Math.max(10, cellSize / 4)}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(label, cx, cy - cellSize / 2);
        };

        if (charPos) drawEntity(charPos, 'cyan', 'NPC', false);
        if (userPos) drawEntity(userPos, 'white', 'P1', true);

        ctx.restore();

      } else {
        // RENDER SCANNING RADAR (Fallback)
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const rMax = Math.min(cx, cy) * 0.8;

        // Grid (Green)
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let r = 20; r < rMax; r += 40) {
          ctx.moveTo(cx + r, cy);
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Scanning Text
        ctx.fillStyle = 'rgba(0, 255, 100, 0.8)';
        ctx.font = '12px monospace';
        ctx.fillText("SCANNING SECTOR...", 10, 20);

        // Radar Sweep
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time);

        const grad = ctx.createLinearGradient(0, 0, rMax, 0);
        grad.addColorStop(0, 'rgba(0, 255, 100, 0)');
        grad.addColorStop(1, 'rgba(0, 255, 100, 0.5)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, rMax, 0, 0.5);
        ctx.lineTo(0, 0);
        ctx.fill();
        ctx.restore();
      }

      requestRef.current = requestAnimationFrame(draw);
    };

    // Initial call
    requestRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [mapData, userPos, charPos, zoom, panOffset]);

  return (
    <div
      className={`relative bg-black overflow-hidden group ${className || 'w-full h-32 border-b border-[color:var(--lain-cyan)]/30'}`}
      onMouseDown={interactive ? handleMouseDown : undefined}
      onMouseMove={interactive ? handleMouseMove : undefined}
      onMouseUp={interactive ? handleMouseUp : undefined}
      onMouseLeave={interactive ? handleMouseUp : undefined}
      style={{ cursor: interactive ? 'grab' : 'default' }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Scanlines overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,100,0.05)_1px,transparent_1px)] bg-[size:100%_2px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-radial-gradient(circle, transparent 60%, black 100%) pointer-events-none"></div>
    </div>
  );
};
