
import React, { useState } from 'react';
import { NaviWindow } from './NaviWindow';
import { Dna } from 'lucide-react';
import { audio } from '../services/audioEngine';
import { RPStats } from '../types';
import { t } from '../utils/translations';

interface DiceRollerProps {
    onRollComplete: (result: string) => void;
    onClose: () => void;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
    userStats?: RPStats; // Added for modifiers
    language?: string;
}

type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export const DiceRoller: React.FC<DiceRollerProps> = ({ 
    onRollComplete, onClose, isMinimized, isMaximized, onMinimize, onMaximize, userStats, language = 'en'
}) => {
    const [rolling, setRolling] = useState(false);
    const [result, setResult] = useState<number | null>(null);
    const [selectedDie, setSelectedDie] = useState<DieType>('d20');
    const [modifier, setModifier] = useState<number>(0);
    const [history, setHistory] = useState<string[]>([]);

    const diceOptions: { type: DieType, max: number, label: string }[] = [
        { type: 'd4', max: 4, label: 'D4' },
        { type: 'd6', max: 6, label: 'D6' },
        { type: 'd8', max: 8, label: 'D8' },
        { type: 'd10', max: 10, label: 'D10' },
        { type: 'd12', max: 12, label: 'D12' },
        { type: 'd20', max: 20, label: 'D20' },
        { type: 'd100', max: 100, label: 'D100' },
    ];

    const lang = (language as any) || 'en';

    const handleRoll = () => {
        if (rolling) return;
        setRolling(true);
        setResult(null);
        audio.playClickSound();

        const max = diceOptions.find(d => d.type === selectedDie)?.max || 20;
        let ticks = 0;
        const interval = setInterval(() => {
            setResult(Math.floor(Math.random() * max) + 1);
            ticks++;
            if (ticks > 10) {
                clearInterval(interval);
                const rawResult = Math.floor(Math.random() * max) + 1;
                const finalResult = rawResult + modifier;
                setResult(finalResult);
                setRolling(false);
                audio.playConfirmSound();
                
                // Format: D20(15) + 2 = 17
                const sign = modifier >= 0 ? '+' : '-';
                const modText = modifier !== 0 ? ` ${sign} ${Math.abs(modifier)}` : '';
                const resultStr = `${selectedDie.toUpperCase()}(${rawResult})${modText} = ${finalResult}`;
                setHistory(prev => [resultStr, ...prev].slice(0, 10));
            } else {
                audio.playLoadTick();
            }
        }, 80);
    };

    const handleUseResult = () => {
        if (result !== null) {
            onRollComplete(`[DICE_ROLL]: ${selectedDie} + ${modifier} -> **${result}**`);
            onClose();
        }
    };

    // Auto-calculate modifier from stats (D&D style: (Stat - 10) / 2)
    const applyStatModifier = (statValue: number) => {
        const mod = Math.floor((statValue - 10) / 2);
        setModifier(mod);
        audio.playClickSound();
    };

    return (
        <NaviWindow
            title={t('dice_title', lang)}
            onClose={onClose}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            className="w-full h-full"
        >
            <div className="flex flex-col h-full bg-black/90 text-[color:var(--lain-cyan)] font-['Share_Tech_Mono'] p-4">
                
                {/* Visual Display */}
                <div className="flex-1 flex flex-col items-center justify-center border border-[color:var(--lain-cyan)]/30 bg-[color:var(--lain-cyan)]/5 relative mb-4">
                    <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
                    
                    <div className={`text-6xl font-bold text-glow transition-all duration-100 ${rolling ? 'scale-110 opacity-70 blur-sm' : 'scale-100 opacity-100'}`}>
                        {result !== null ? result : "--"}
                    </div>
                    <div className="text-xs tracking-[0.5em] mt-2 opacity-60 uppercase">{rolling ? t('dice_calc', lang) : selectedDie.toUpperCase()}</div>
                    
                    {/* Modifier Display Overlay */}
                    {modifier !== 0 && !rolling && (
                        <div className="absolute top-2 right-2 text-[10px] font-bold bg-black/50 px-2 py-1 rounded border border-[color:var(--lain-cyan)]/30">
                            MOD: {modifier > 0 ? `+${modifier}` : modifier}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-3 mb-4">
                    <div className="grid grid-cols-4 gap-2">
                        {diceOptions.map(die => (
                            <button
                                key={die.type}
                                onClick={() => setSelectedDie(die.type)}
                                className={`p-2 border text-xs font-bold transition-all ${selectedDie === die.type ? 'bg-[color:var(--lain-cyan)] text-black border-[color:var(--lain-cyan)]' : 'border-[color:var(--lain-cyan)]/30 hover:border-[color:var(--lain-cyan)]'}`}
                            >
                                {die.label}
                            </button>
                        ))}
                    </div>

                    {/* Modifier Section */}
                    <div className="flex gap-2 items-center border-t border-[color:var(--lain-cyan)]/20 pt-2">
                        <span className="text-[10px] font-bold opacity-70">{t('dice_mod', lang)}:</span>
                        <input 
                            type="number" 
                            value={modifier} 
                            onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                            className="w-16 bg-black border border-[color:var(--lain-cyan)]/50 text-center text-xs p-1 focus:outline-none"
                        />
                        
                        {/* Auto-Stat Buttons */}
                        {userStats && (
                            <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar">
                                {Object.entries(userStats.attributes).map(([key, val]) => (
                                    <button 
                                        key={key}
                                        // Added explicit cast to number to resolve TypeScript 'unknown' error from Object.entries
                                        onClick={() => applyStatModifier(val as number)}
                                        className="px-2 py-1 border border-[color:var(--lain-cyan)]/30 hover:bg-[color:var(--lain-cyan)] hover:text-black text-[9px] font-bold transition-colors whitespace-nowrap"
                                        title={`${key}: ${val}`}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={handleRoll}
                        disabled={rolling}
                        className="flex-1 py-3 bg-[color:var(--lain-cyan)]/10 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-all font-bold tracking-widest text-sm flex items-center justify-center gap-2 win98-bevel active:win98-bevel-pressed"
                    >
                        <Dna size={16} className={rolling ? "animate-spin" : ""} /> {t('dice_roll', lang)}
                    </button>
                    {result !== null && !rolling && (
                        <button 
                            onClick={handleUseResult}
                            className="flex-1 py-3 bg-green-500/10 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-all font-bold tracking-widest text-sm"
                        >
                            {t('dice_use', lang)}
                        </button>
                    )}
                </div>

                {/* History */}
                <div className="mt-4 border-t border-[color:var(--lain-cyan)]/20 pt-2">
                    <div className="text-[10px] opacity-50 mb-1 tracking-widest">{t('dice_log', lang)}</div>
                    <div className="h-20 overflow-y-auto scrollbar-thin space-y-1 text-[10px] font-mono">
                        {history.map((h, i) => (
                            <div key={i} className="opacity-70 border-l-2 border-[color:var(--lain-cyan)]/30 pl-2">{h}</div>
                        ))}
                    </div>
                </div>
            </div>
        </NaviWindow>
    );
};
