import React, { useState } from 'react';
import { NaviWindow } from './NaviWindow';
import { Item } from '../types';
import { RECIPES, canCraft, craftItem, Recipe } from '../services/craftingEngine';
import { Hammer, CheckCircle, XCircle, Package } from 'lucide-react';
import { audio } from '../services/audioEngine';

interface CraftingWindowProps {
    inventory: Item[];
    onUpdateInventory: (items: Item[]) => void;
    onClose: () => void;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
}

export const CraftingWindow: React.FC<CraftingWindowProps> = ({
    inventory, onUpdateInventory, onClose, isMinimized, isMaximized, onMinimize, onMaximize
}) => {
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [message, setMessage] = useState<string>('');

    const handleCraft = () => {
        if (!selectedRecipe) return;
        
        const result = craftItem(inventory, selectedRecipe);
        if (result.success) {
            onUpdateInventory(result.newInventory);
            setMessage(`Successfully crafted: ${result.result?.name}`);
            audio.playItemGetSound();
        } else {
            setMessage('Crafting failed. Missing ingredients.');
            audio.playFailSound();
        }
        
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <NaviWindow 
            title="MATTER_SYNTHESIS_UNIT" 
            onClose={onClose} 
            isMinimized={isMinimized} 
            isMaximized={isMaximized} 
            onMinimize={onMinimize} 
            onMaximize={onMaximize}
            className="w-[600px] h-[450px]"
        >
            <div className="flex h-full bg-black/90 font-mono text-xs">
                {/* Recipe List */}
                <div className="w-1/3 border-r border-[color:var(--lain-cyan)]/30 overflow-y-auto p-2">
                    <div className="text-[10px] uppercase font-bold text-[color:var(--lain-cyan)] mb-2 tracking-widest border-b border-[color:var(--lain-cyan)]/20 pb-1">Blueprints</div>
                    {RECIPES.map(recipe => {
                        const craftable = canCraft(inventory, recipe);
                        return (
                            <button
                                key={recipe.id}
                                onClick={() => { setSelectedRecipe(recipe); setMessage(''); audio.playClickSound(); }}
                                className={`w-full text-left p-2 mb-1 border transition-all ${
                                    selectedRecipe?.id === recipe.id 
                                    ? 'bg-[color:var(--lain-cyan)]/20 border-[color:var(--lain-cyan)] text-white' 
                                    : 'border-transparent hover:bg-[color:var(--lain-cyan)]/10 text-[color:var(--lain-cyan)]'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">{recipe.name}</span>
                                    {craftable && <CheckCircle size={10} className="text-green-500" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Detail View */}
                <div className="flex-1 p-4 flex flex-col relative">
                    {selectedRecipe ? (
                        <>
                            <div className="text-lg font-bold text-[color:var(--lain-cyan)] mb-1">{selectedRecipe.name}</div>
                            <div className="text-[color:var(--lain-cyan)]/50 italic mb-4">{selectedRecipe.result.description}</div>

                            <div className="flex-1">
                                <div className="text-[10px] uppercase font-bold text-white/70 mb-2">Required Materials:</div>
                                <div className="space-y-2">
                                    {selectedRecipe.ingredients.map((ing, i) => {
                                        const owned = inventory.find(item => item.name.toLowerCase() === ing.name.toLowerCase());
                                        const quantityOwned = owned?.quantity || 0;
                                        const hasEnough = quantityOwned >= ing.quantity;
                                        
                                        return (
                                            <div key={i} className="flex justify-between items-center bg-black/50 p-2 border border-white/10">
                                                <span className={hasEnough ? 'text-white' : 'text-red-500'}>{ing.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] ${hasEnough ? 'text-green-400' : 'text-red-500'}`}>
                                                        {quantityOwned} / {ing.quantity}
                                                    </span>
                                                    {hasEnough ? <CheckCircle size={12} className="text-green-500"/> : <XCircle size={12} className="text-red-500"/>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-auto">
                                {message && (
                                    <div className="text-center mb-2 text-yellow-400 animate-pulse">{message}</div>
                                )}
                                <button 
                                    onClick={handleCraft}
                                    disabled={!canCraft(inventory, selectedRecipe)}
                                    className="w-full py-3 border border-[color:var(--lain-cyan)] bg-[color:var(--lain-cyan)]/10 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-all font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Hammer size={16} /> SYNTHESIZE
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-[color:var(--lain-cyan)]/30">
                            <Package size={48} className="mb-2 opacity-50" />
                            <div>SELECT_BLUEPRINT_TO_BEGIN</div>
                        </div>
                    )}
                </div>
            </div>
        </NaviWindow>
    );
};
