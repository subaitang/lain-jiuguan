import React, { useState } from 'react';  
import { CombatState } from '../types';  
import { Sword, Shield, Zap, Wind, Skull, Activity } from 'lucide-react';  
import { audio } from '../services/audioEngine';  
  
interface CombatOverlayProps {  
    combatState: CombatState;  
    onAction: (action: string) => void;  
    onClose: () => void;  
  
export const CombatOverlay: React.FC<CombatOverlayProps> = ({ combatState, onAction, onClose }) => {  
    const [customAction, setCustomAction] = useState('');  
  
    const handleAction = (act: string) => {  
        audio.playCombatSound();  
        onAction(act);  
        setCustomAction('');  
  
    return (  
        <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none">  
            <div className="w-full max-w-4xl h-[600px] bg-black/80 backdrop-blur-sm border-y-2 border-red-500 pointer-events-auto flex flex-col animate-in zoom-in-95 duration-300 relative overflow-hidden win98-bevel">  
                <div className="bg-red-900/20 p-2 flex justify-between items-center border-b border-red-500/50">  
                    <div className="text-red-500 font-bold tracking-[0.5em] text-xl animate-pulse">COMBAT_MODE_ENGAGED</div>  
                    <div className="font-mono text-red-400 text-xs">TURN {combatState.turn}</div>  
  
                <div className="flex-1 flex gap-4 p-4 overflow-hidden relative z-10">  
                    <div className="flex-1 flex flex-col justify-center gap-4">  
                        {combatState.enemies.map(enemy => (  
                            <div key={enemy.id} className="border border-red-500/50 bg-black/60 p-4 relative group hover:bg-red-900/10 transition-colors">  
                                <div className="flex justify-between items-end mb-2">  
                                    <span className="text-lg font-bold text-red-100">{enemy.name}</span>  
                                    <div className="text-xs text-red-400 font-mono">{enemy.status.join(' ')}</div>  
                                </div>  
                                <div className="h-4 bg-red-950 w-full relative border border-red-500/30">  
                                    <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${(enemy.hp.current / enemy.hp.max) * 100}%` }}></div>  
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white shadow-black drop-shadow-md">  
                                        {enemy.hp.current} / {enemy.hp.max}  
                                    </span>  
                                </div>  
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">  
                                    <Skull className="text-red-500 animate-bounce" size={20} />  
                                </div>  
                            </div>  
                        ))}  
  
                    <div className="w-1/3 border border-red-500/30 bg-black/80 p-2 font-mono text-xs text-red-300 overflow-y-auto scrollbar-thin">  
                        {combatState.log.map((entry, i) => (  
                            <div key={i} className="mb-1 border-b border-red-500/10 pb-1">{entry}</div>  
                        ))}  
                    </div>  
                </div>  
                <div className="p-4 bg-black/90 border-t border-red-500 grid grid-cols-1 md:grid-cols-2 gap-4 z-20">  
                    <div className="grid grid-cols-4 gap-2">  
                        <button onClick={() => handleAction('Attack')} className="flex flex-col items-center justify-center p-2 border border-red-500/50 hover:bg-red-500 hover:text-black transition-all text-red-500">  
                            <Sword size={20} />  
                            <span className="text-[10px] font-bold mt-1">ATTACK</span>  
                        </button>  
                        <button onClick={() => handleAction('Defend')} className="flex flex-col items-center justify-center p-2 border border-blue-500/50 text-blue-500 hover:bg-blue-500 hover:text-black transition-all">  
                            <Shield size={20} />  
                            <span className="text-[10px] font-bold mt-1">DEFEND</span>  
                        </button>  
                        <button onClick={() => handleAction('Skill')} className="flex flex-col items-center justify-center p-2 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all">  
                            <Zap size={20} />  
                            <span className="text-[10px] font-bold mt-1">SKILL</span>  
                        </button>  
                        <button onClick={() => handleAction('Flee')} className="flex flex-col items-center justify-center p-2 border border-gray-500/50 text-gray-500 hover:bg-gray-500 hover:text-black transition-all">  
                            <Wind size={20} />  
                            <span className="text-[10px] font-bold mt-1">FLEE</span>  
                        </button>  
                    </div>  
                    <div className="flex gap-2">  
                        <input value={customAction} onChange={(e) => setCustomAction(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAction(customAction)} placeholder="Free Action..." className="flex-1 bg-black border border-red-500/30 p-2 text-red-100 text-sm focus:outline-none focus:border-red-500 font-mono placeholder-red-900" />  
                        <button onClick={() => handleAction(customAction)} className="px-6 bg-red-900/20 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black transition-all font-bold text-xs tracking-widest">EXECUTE</button>  
                    </div>  
                </div>  
            </div>  
        </div>  
    );  
}; 
