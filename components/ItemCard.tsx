import React from 'react';
import { X, Box, Zap, Shield, Sword, Book } from 'lucide-react';
import { Item, StatusEffect, Skill } from '../types';

interface ItemCardProps {
    item: Item | StatusEffect | Skill | string;
    onClose: () => void;
    position?: { x: number, y: number };
    isTooltip?: boolean;
}
  
export const ItemCard: React.FC<ItemCardProps> = ({ item, onClose, position, isTooltip = false }) => {
    const isObj = typeof item !== 'string';
    const name = isObj ? item.name : item;
    const description = isObj ? item.description || "No data." : "A mysterious item found in the Wired.";
    const rarity = isObj && 'rarity' in item ? item.rarity : "Unknown";
    const type = isObj && 'type' in item ? item.type : "misc";
    const attributes = isObj && 'attributes' in item ? item.attributes : undefined;
    const duration = isObj && 'duration' in item ? item.duration : undefined;
    const source = isObj && 'source' in item ? item.source : undefined;
    const effect = isObj && 'effect' in item ? item.effect : undefined;
    const cost = isObj && 'cost' in item ? item.cost : undefined;
    const cooldown = isObj && 'cooldown' in item ? item.cooldown : undefined;

    const getRarityColor = (r: string) => {
        switch(r.toLowerCase()) {
            case 'legendary': return 'text-yellow-400 border-yellow-400';
            case 'epic': return 'text-purple-400 border-purple-400';
            case 'rare': return 'text-blue-400 border-blue-400';
            case 'uncommon': return 'text-green-400 border-green-400';
            default: return 'text-gray-300 border-gray-600';
        }
    };

    const rarityClass = isObj && 'rarity' in item ? getRarityColor(item.rarity) : 'text-gray-300';

    if (isTooltip) {
        if (!position) return null;
        // User requested: "upper right corner of that module".
        // We will position it relative to the rect passed in.
        // position.x = rect.right, position.y = rect.top
        return (
            <div
                className="fixed z-[300] bg-black/95 backdrop-blur-md border border-[color:var(--lain-cyan)] p-3 pointer-events-none animate-in fade-in duration-200 min-w-[200px] max-w-[300px] shadow-[0_0_15px_rgba(0,0,0,0.8)]"
                style={{ top: position.y, left: position.x + 10 }}
            >
                <div className="text-xs font-bold text-[color:var(--lain-cyan)] uppercase mb-1 flex items-center gap-2 border-b border-[color:var(--lain-cyan)]/30 pb-1">
                    {type === 'weapon' ? <Sword size={12}/> : type === 'armor' ? <Shield size={12}/> : (cost ? <Book size={12}/> : <Box size={12} />)} {name}
                </div>
                <div className="text-[10px] opacity-70 mb-2 italic">{description}</div>
                {attributes && (
                    <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
                        {Object.entries(attributes).map(([k, v]) => (
                            <div key={k} className="flex justify-between bg-white/5 px-1 rounded">
                                <span className="opacity-60">{k}</span>
                                <span className="font-bold text-green-400">+{v}</span>
                            </div>
                        ))}
                    </div>
                )}
                {effect && (
                    <div className="mt-1 text-[9px] text-yellow-300 flex items-center gap-1">
                        <Zap size={8}/> {effect}
                    </div>
                )}
                {cost && (
                    <div className="mt-1 text-[9px] text-blue-300 flex items-center gap-1">
                        <span className="opacity-50">COST:</span> {cost}
                    </div>
                )}
                {duration && (
                    <div className="mt-1 text-[9px] opacity-50">Duration: {duration}</div>
                )}
            </div>
        );
    }
  
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className={`w-96 bg-black border p-6 relative shadow-[0_0_20px_rgba(0,0,0,0.8)] ${isObj && 'rarity' in item && item.rarity === 'legendary' ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-[color:var(--lain-cyan)]'}`} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-2 right-2 text-red-500 hover:text-white"><X size={14} /></button>
                <div className="flex gap-4 mb-4">
                    <div className={`w-20 h-20 bg-[color:var(--lain-cyan)]/10 border flex items-center justify-center ${rarityClass}`}>
                        <Box size={32} />
                    </div>
                    <div className="flex-1">
                        <h3 className={`font-bold text-xl uppercase ${rarityClass.split(' ')[0]}`}>{name}</h3>
                        {isObj && 'rarity' in item && (
                            <span className={`text-[10px] border px-2 py-0.5 rounded uppercase tracking-wider ${rarityClass}`}>
                                {item.rarity}
                            </span>
                        )}
                        <div className="mt-2 text-[10px] opacity-50 uppercase tracking-widest">{type}</div>
                    </div>
                </div>
                
                <div className="text-sm opacity-80 font-mono leading-relaxed border-t border-[color:var(--lain-cyan)]/30 pt-4 mb-4">
                    {description}
                </div>

                {attributes && (
                    <div className="mb-4 bg-white/5 p-2 rounded border border-white/10">
                        <div className="text-[10px] font-bold opacity-60 mb-2 uppercase tracking-widest">Attributes</div>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(attributes).map(([k, v]) => (
                                <div key={k} className="flex justify-between items-center text-xs">
                                    <span className="opacity-70">{k}</span>
                                    <span className="font-bold text-green-400">+{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(effect || duration || source || cost || cooldown) && (
                    <div className="mb-4 space-y-1 text-xs">
                        {cost && <div className="text-blue-400"><span className="opacity-50">COST:</span> {cost}</div>}
                        {cooldown && <div className="text-gray-400"><span className="opacity-50">COOLDOWN:</span> {cooldown}</div>}
                        {effect && <div className="text-yellow-300"><span className="opacity-50">EFFECT:</span> {effect}</div>}
                        {duration && <div className="text-blue-300"><span className="opacity-50">DURATION:</span> {duration}</div>}
                        {source && <div className="text-purple-300"><span className="opacity-50">SOURCE:</span> {source}</div>}
                    </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                    <button className="px-4 py-2 border border-red-500 text-red-500 text-xs hover:bg-red-500 hover:text-white transition-all uppercase">Discard</button>
                    <button className="px-4 py-2 border border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)] text-xs hover:bg-[color:var(--lain-cyan)] hover:text-black transition-all uppercase">Use</button>
                </div>
            </div>
        </div>
    );
};
