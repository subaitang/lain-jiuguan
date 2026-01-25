
import React, { useEffect, useState } from 'react';
import { Sword, Sparkles, Box, CheckCircle, Skull } from 'lucide-react';

export type FXType = 'combat' | 'levelup' | 'item' | 'quest' | null;

interface FXOverlayProps {
    type: FXType;
    onComplete: () => void;
}

export const FXOverlay: React.FC<FXOverlayProps> = ({ type, onComplete }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (type) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onComplete, 500); // Wait for fade out
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [type, onComplete]);

    if (!visible || !type) return null;

    const getConfig = () => {
        switch (type) {
            case 'combat': return { icon: <Sword size={64} />, text: "COMBAT_ENGAGED", color: "text-red-500", border: "border-red-500" };
            case 'levelup': return { icon: <Sparkles size={64} />, text: "LEVEL_UP", color: "text-yellow-400", border: "border-yellow-400" };
            case 'item': return { icon: <Box size={64} />, text: "ITEM_ACQUIRED", color: "text-blue-400", border: "border-blue-400" };
            case 'quest': return { icon: <CheckCircle size={64} />, text: "QUEST_COMPLETE", color: "text-green-400", border: "border-green-400" };
            default: return { icon: <Skull size={64} />, text: "UNKNOWN", color: "text-gray-500", border: "border-gray-500" };
        }
    };

    const cfg = getConfig();

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none">
            <div className={`
                flex flex-col items-center justify-center gap-4 p-8 
                bg-black/90 border-2 ${cfg.border} shadow-[0_0_50px_rgba(0,0,0,0.8)]
                animate-in zoom-in fade-in duration-300
                ${cfg.color}
            `}>
                <div className="animate-bounce">{cfg.icon}</div>
                <div className="text-2xl font-['Share_Tech_Mono'] font-bold tracking-[0.3em] text-glow uppercase">
                    {cfg.text}
                </div>
                <div className="w-full h-1 bg-current animate-[pulse_0.5s_infinite]"></div>
            </div>
        </div>
    );
};
