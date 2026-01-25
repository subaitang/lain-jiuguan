import React, { useEffect, useState, useRef } from 'react';
import { audio } from '../services/audioEngine';
import { Mic, MicOff } from 'lucide-react';

export const AudioVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [error, setError] = useState<string>('');

  const toggleMic = async () => {
      try {
          if (micEnabled) {
              audio.disableMicrophone();
              setMicEnabled(false);
          } else {
              await audio.enableMicrophone();
              setMicEnabled(true);
              setError('');
          }
      } catch (e) {
          setError('MIC ACCESS DENIED');
      }
  };

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dataArray = audio.getAudioData();
      
      // Clear with trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (dataArray.length > 0) {
        const barWidth = (canvas.width / dataArray.length) * 2;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const value = dataArray[i];
          const barHeight = (value / 255) * canvas.height;

          // Dynamic coloring based on intensity
          const hue = 180 + (value / 255) * 60; // Cyan to Blue/Purple
          ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
          
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

          // Top pixel
          ctx.fillStyle = '#fff';
          ctx.fillRect(x, canvas.height - barHeight - 2, barWidth, 2);

          x += barWidth + 1;
        }
      } else {
         // Heartbeat line if no data
         ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
         ctx.lineWidth = 1;
         ctx.beginPath();
         ctx.moveTo(0, canvas.height / 2);
         ctx.lineTo(canvas.width, canvas.height / 2);
         ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="w-full h-full relative group">
        <canvas 
            ref={canvasRef} 
            width={300} 
            height={80} 
            className="w-full h-full object-contain pointer-events-none"
        />
        <div className="absolute top-1 right-1 z-10">
            <button 
                onClick={toggleMic}
                className={`p-1 border border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors opacity-50 hover:opacity-100 ${micEnabled ? 'bg-[color:var(--lain-cyan)]/20 animate-pulse' : ''}`}
                title="Toggle Real-time Audio Input"
            >
                {micEnabled ? <Mic size={12} /> : <MicOff size={12} />}
            </button>
        </div>
        {error && <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-red-500 text-xs">{error}</div>}
    </div>
  );
};