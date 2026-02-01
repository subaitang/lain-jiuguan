import React from 'react';  
import { X, Box } from 'lucide-react';  
  
interface ItemCardProps {  
    item: string;  
    onClose: () => void;  
    position?: { x: number, y: number };  
    isTooltip?: boolean;  
}  
  
export const ItemCard: React.FC<ItemCardProps> = ({ item, onClose, position, isTooltip = false }) => {  
    const description = "A mysterious item found in the Wired.";  
    const rarity = "Common";  
  
    if (isTooltip) {  
        if (!position) return null;  
        return (  
            <div   
                className="fixed z-[300] bg-black border border-[color:var(--lain-cyan)] p-2 pointer-events-none animate-in fade-in duration-200"  
                style={{ top: position.y + 10, left: position.x + 10 }}  
            >  
                <div className="text-xs font-bold text-[color:var(--lain-cyan)] uppercase mb-1 flex items-center gap-1">  
                    <Box size={10} /> {item}  
                </div>  
                <div className="text-[10px] opacity-70">{description}</div>  
            </div>  
        );  
    }  
  
    return (  
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>  
            <div className="w-80 bg-black border border-[color:var(--lain-cyan)] p-4 relative" onClick={e => e.stopPropagation()}>  
                <button onClick={onClose} className="absolute top-2 right-2 text-red-500 hover:text-white"><X size={14} /></button>  
                <div className="flex gap-4 mb-4">  
                    <div className="w-20 h-20 bg-[color:var(--lain-cyan)]/10 border border-[color:var(--lain-cyan)] flex items-center justify-center">  
                        <Box size={32} className="text-[color:var(--lain-cyan)]" />  
                    </div>  
                    <div>  
                        <h3 className="font-bold text-lg text-[color:var(--lain-cyan)] uppercase">{item}</h3>  
                        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300">{rarity}</span>  
                    </div>  
                </div>  
                <div className="text-sm opacity-80 font-mono leading-relaxed border-t border-[color:var(--lain-cyan)]/30 pt-4">  
                    {description}  
                </div>  
                <div className="mt-4 flex justify-end gap-2">  
                    <button className="px-4 py-2 border border-red-500 text-red-500 text-xs hover:bg-red-500 hover:text-white transition-all uppercase">Discard</button>  
                    <button className="px-4 py-2 border border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)] text-xs hover:bg-[color:var(--lain-cyan)] hover:text-black transition-all uppercase">Use</button>  
                </div>  
            </div>  
        </div>  
    );
};  
