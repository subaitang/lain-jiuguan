import React, { useState } from 'react';  
import { NaviWindow } from './NaviWindow';  
import { ChatSession, CombatState } from '../types';  
import { Sword, Shield, Zap, X, Activity } from 'lucide-react';  
import { audio } from '../services/audioEngine';  
  
interface CombatInterfaceProps {  
    session: ChatSession;  
    onUpdateSession: (s: ChatSession) => void;  
    onClose: () => void;  
    isMinimized: boolean;  
    isMaximized: boolean;  
    onMinimize: () => void;  
    onMaximize: () => void;  
}  
  
export const CombatInterface: React.FC<CombatInterfaceProps> = ({  
    session, onUpdateSession, onClose, isMinimized, isMaximized, onMinimize, onMaximize  
}) => {  
    const [action, setAction] = useState('');  
    if (!session.combatState || !session.combatState.active) return null;  
  
    const handleAction = (type: string) => {  
        audio.playClickSound();  
        const newLog = [...session.combatState!.log, `Player used ${type}!`];  
        onUpdateSession({  
            ...session,  
            combatState: {  
                ...session.combatState!,  
                log: newLog  
            }  
        });  
    };  
  
    return (  
        <NaviWindow title="TACTICAL COMBAT MATRIX" onClose={onClose} isMinimized={isMinimized} isMaximized={isMaximized} onMinimize={onMinimize} onMaximize={onMaximize} className="w-[600px] h-[400px]">  
            <div className="flex flex-col h-full bg-black/90 text-red-500 font-mono p-4">  
                <div className="flex justify-between items-center mb-4 border-b border-red-500/50 pb-2">  
                    <div className="text-xl font-bold tracking-widest animate-pulse">COMBAT_MODE_ENGAGED</div>  
                    <div className="text-xs">TURN {session.combatState.turn}</div>  
                </div>  
  
                <div className="flex-1 flex gap-4 overflow-hidden">  
                    <div className="flex-1 space-y-2 overflow-y-auto">  
                        {session.combatState.participants.map(p => (  
                            <div key={p.id} className={`p-2 border ${p.isPlayer ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'} bg-black/50`}>  
                                <div className="flex justify-between">  
                                    <span className="font-bold">{p.name}</span>  
                                    <span>HP {p.hp}/{p.maxHp}</span>  
                                </div>  
                                <div className="h-1 bg-gray-800 mt-1">  
                                    <div className={`h-full ${p.isPlayer ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${(p.hp / p.maxHp) * 100}%` }} />  
                                </div>  
                            </div>  
                        ))}  
                    </div>  
  
                    <div className="w-1/3 border-l border-red-500/30 pl-4 text-xs overflow-y-auto font-mono opacity-80">  
                        {session.combatState.log.map((entry, i) => (  
                            <div key={i} className="mb-1">> {entry}</div>  
                        ))}  
                    </div>  
                </div>  
  
                <div className="mt-4 pt-4 border-t border-red-500/50 flex gap-2">  
                    <button onClick={() => handleAction('ATTACK')} className="flex-1 py-3 border border-red-500 hover:bg-red-500 hover:text-black font-bold flex items-center justify-center gap-2 transition-all">  
                        <Sword size={16} /> ATTACK  
                    </button>  
                    <button onClick={() => handleAction('DEFEND')} className="flex-1 py-3 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-black font-bold flex items-center justify-center gap-2 transition-all">  
                        <Shield size={16} /> DEFEND  
                    </button>  
                    <button onClick={() => handleAction('SKILL')} className="flex-1 py-3 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-bold flex items-center justify-center gap-2 transition-all">  
                        <Zap size={16} /> SKILL  
                    </button>  
                    <input value={action} onChange={e => setAction(e.target.value)} placeholder="Free Action..." className="flex-[2] bg-black border border-gray-600 p-2 text-white focus:border-red-500 outline-none" />  
                </div>  
            </div>  
        </NaviWindow>  
    );  
