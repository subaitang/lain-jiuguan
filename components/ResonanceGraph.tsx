
import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types';

interface ResonanceGraphProps {
    messages: Message[];
    currentMood: string;
    affection: number;
}

export const ResonanceGraph: React.FC<ResonanceGraphProps> = ({ messages, currentMood, affection }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dataPoints, setDataPoints] = useState<number[]>([]);

    useEffect(() => {
        // Generate pseudo-data based on recent message lengths and affection
        const recent = messages.slice(-20);
        const points = recent.map(m => {
            const base = m.role === 'user' ? 50 : (affection || 50);
            const variance = (m.content.length % 20) - 10;
            return Math.max(10, Math.min(90, base + variance));
        });
        
        // Pad if empty
        while(points.length < 20) points.unshift(50);
        setDataPoints(points);
    }, [messages, affection]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let offset = 0;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 20, 30, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Grid
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let x=0; x<canvas.width; x+=20) { ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); }
            for(let y=0; y<canvas.height; y+=10) { ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); }
            ctx.stroke();

            // Draw Waveform
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            const step = canvas.width / (dataPoints.length - 1);
            
            for (let i = 0; i < dataPoints.length - 1; i++) {
                const x1 = i * step;
                const y1 = canvas.height - (dataPoints[i] / 100) * canvas.height;
                const x2 = (i + 1) * step;
                const y2 = canvas.height - (dataPoints[i+1] / 100) * canvas.height;
                
                // Add jitter
                const jitter = Math.sin(offset + i) * 2;
                
                if (i === 0) ctx.moveTo(x1, y1 + jitter);
                else ctx.lineTo(x1, y1 + jitter);
            }
            ctx.stroke();

            // Draw "Current Position" scanner line
            const scanX = (offset * 2) % canvas.width;
            ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
            ctx.fillRect(scanX, 0, 2, canvas.height);

            offset += 0.1;
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrameId);
    }, [dataPoints]);

    return (
        <div className="w-full h-24 border-b border-[color:var(--lain-cyan)]/30 relative overflow-hidden bg-black">
            <div className="absolute top-1 left-2 text-[9px] font-bold tracking-widest text-[color:var(--lain-cyan)] z-10 bg-black/50 px-1">
                RESONANCE_FREQ // {currentMood.toUpperCase()}
            </div>
            <div className="absolute top-1 right-2 text-[9px] font-mono text-[color:var(--lain-cyan)] z-10 bg-black/50 px-1">
                SYNC: {affection}%
            </div>
            <canvas ref={canvasRef} width={600} height={100} className="w-full h-full opacity-80" />
        </div>
    );
};
