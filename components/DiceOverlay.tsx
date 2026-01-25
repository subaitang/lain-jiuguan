
import React, { useEffect, useState } from 'react';
import { Hexagon, Zap, MousePointer2 } from 'lucide-react';

interface DiceOverlayProps {
    rolling: boolean;
    result: number | null;
    tier?: 'crit_fail' | 'fail' | 'success' | 'crit_success' | 'normal'; // Extended tiers
    onComplete: () => void;
}

export const DiceOverlay: React.FC<DiceOverlayProps> = ({ rolling, result, tier = 'normal', onComplete }) => {
    const [displayNum, setDisplayNum] = useState(1);
    const [visible, setVisible] = useState(false);
    const [shake, setShake] = useState(false);
    const [canDismiss, setCanDismiss] = useState(false);

    useEffect(() => {
        if (rolling) {
            setVisible(true);
            setCanDismiss(false);
            const interval = setInterval(() => {
                // Chaotic number shuffling
                setDisplayNum(Math.floor(Math.random() * 99));
            }, 30); // Very fast for decoding effect
            return () => clearInterval(interval);
        } else if (result !== null) {
            setDisplayNum(result);
            setShake(true); // Impact effect
            const shakeTimeout = setTimeout(() => setShake(false), 200);
            
            // Allow dismissal after a brief moment to prevent accidental double clicks
            const dismissTimeout = setTimeout(() => {
                setCanDismiss(true);
            }, 500); 

            return () => {
                clearTimeout(shakeTimeout);
                clearTimeout(dismissTimeout);
            };
        } else {
            setVisible(false);
            setCanDismiss(false);
        }
    }, [rolling, result]);

    const handleClick = () => {
        if (!rolling && result !== null && canDismiss) {
            setVisible(false);
            onComplete();
        }
    };

    if (!visible) return null;

    const getConfig = () => {
        if (rolling) return { color: 'text-[color:var(--lain-cyan)]', borderColor: 'border-[color:var(--lain-cyan)]', shadow: '', glow: 'text-[color:var(--lain-cyan)]' };
        switch (tier) {
            case 'crit_fail': return { color: 'text-red-600', borderColor: 'border-red-600', shadow: 'shadow-[0_0_50px_red]', glow: 'text-red-500' };
            case 'fail': return { color: 'text-orange-500', borderColor: 'border-orange-500', shadow: 'shadow-[0_0_30px_orange]', glow: 'text-orange-400' };
            case 'success': return { color: 'text-green-400', borderColor: 'border-green-400', shadow: 'shadow-[0_0_30px_lime]', glow: 'text-green-300' };
            case 'crit_success': return { color: 'text-yellow-300', borderColor: 'border-yellow-300', shadow: 'shadow-[0_0_50px_gold]', glow: 'text-yellow-200' };
            default: return { color: 'text-[color:var(--lain-cyan)]', borderColor: 'border-[color:var(--lain-cyan)]', shadow: '', glow: 'text-[color:var(--lain-cyan)]' };
        }
    };

    const cfg = getConfig();

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
            onClick={handleClick}
        >
            <div className={`relative flex items-center justify-center w-80 h-80 ${shake ? 'animate-[shake_0.2s_ease-in-out_infinite]' : ''}`}>
                
                {/* Background Grid Flash */}
                {!rolling && (tier === 'crit_success' || tier === 'crit_fail') && (
                    <div className={`absolute inset-0 opacity-20 animate-pulse ${cfg.shadow.replace('shadow-', 'bg-')}`} />
                )}

                {/* Rotating Rings - Cyberpunk Style */}
                <div className={`absolute inset-0 border-[4px] border-dashed rounded-full animate-[spin_4s_linear_infinite] opacity-30 ${cfg.borderColor}`}></div>
                <div className={`absolute inset-4 border-[2px] border-dotted rounded-full animate-[spin_6s_linear_infinite_reverse] opacity-50 ${cfg.borderColor}`}></div>
                <div className={`absolute inset-10 border-[1px] rounded-full animate-[ping_2s_linear_infinite] opacity-10 ${cfg.borderColor}`}></div>
                
                {/* Decorative Hexagon */}
                <div className={`absolute inset-0 flex items-center justify-center opacity-10 scale-150`}>
                     <Hexagon size={200} className={`${cfg.color} animate-pulse`} strokeWidth={1} />
                </div>

                {/* Glitch Container */}
                <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-xs font-bold tracking-[0.5em] mb-2 animate-pulse text-[color:var(--lain-cyan)]">
                        {rolling ? "DECODING_ENTROPY..." : "RESULT_LOCKED"}
                    </div>
                    
                    <div className="relative">
                        {/* Main Number */}
                        <div className={`text-9xl font-['Share_Tech_Mono'] font-bold ${cfg.glow} drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-150`}>
                            {displayNum}
                        </div>
                        
                        {/* Glitch Effect Clones */}
                        {rolling && (
                            <>
                                <div className="absolute top-0 left-1 text-9xl font-['Share_Tech_Mono'] font-bold text-red-500 opacity-30 mix-blend-screen animate-pulse pointer-events-none">{displayNum}</div>
                                <div className="absolute top-0 -left-1 text-9xl font-['Share_Tech_Mono'] font-bold text-blue-500 opacity-30 mix-blend-screen animate-pulse delay-75 pointer-events-none">{displayNum}</div>
                            </>
                        )}
                    </div>

                    <div className={`mt-4 px-6 py-1 border ${cfg.borderColor} bg-black text-xs font-bold tracking-[0.3em] uppercase ${rolling ? 'animate-pulse' : 'scale-110 transition-transform'}`}>
                        {rolling ? "CALCULATING" : tier.replace('_', ' ')}
                    </div>

                    {/* Dismiss Prompt */}
                    {!rolling && canDismiss && (
                        <div className="absolute top-full mt-8 flex items-center gap-2 text-[10px] animate-bounce text-white/70">
                            <MousePointer2 size={12} /> CLICK TO DISMISS
                        </div>
                    )}
                </div>
                
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[color:var(--lain-cyan)] opacity-50"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[color:var(--lain-cyan)] opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[color:var(--lain-cyan)] opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[color:var(--lain-cyan)] opacity-50"></div>
            </div>
        </div>
    );
};
