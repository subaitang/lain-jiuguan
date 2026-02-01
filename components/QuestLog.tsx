
import React from 'react';
import { NaviWindow } from './NaviWindow';
import { Quest, RPStats } from '../types';
import { CheckCircle, Circle, AlertCircle, Scroll } from 'lucide-react';

interface QuestLogProps {
    quests: Quest[];
    onClose: () => void;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
    userStats: RPStats;
    onUpdateStats: (stats: RPStats) => void;
}

export const QuestLog: React.FC<QuestLogProps> = ({
    quests,
    onClose,
    isMinimized,
    isMaximized,
    onMinimize,
    onMaximize,
    userStats,
    onUpdateStats
}) => {
    return (
        <NaviWindow
            title="MISSION LOG // QUESTS"
            onClose={onClose}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            className="w-[500px] h-[600px]"
        >
            <div className="flex flex-col h-full bg-black/90 p-4 font-['Share_Tech_Mono'] text-[color:var(--lain-cyan)]">
                {quests.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                        <Scroll size={48} className="mb-4 animate-pulse"/>
                        <div className="text-xl tracking-widest">NO ACTIVE MISSIONS</div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin pr-2">
                        {quests.map(quest => (
                            <div key={quest.id} className={`border p-4 relative overflow-hidden group ${quest.status === 'completed' ? 'border-green-500 bg-green-900/10' : quest.status === 'failed' ? 'border-red-500 bg-red-900/10' : 'border-[color:var(--lain-cyan)]/50 bg-[color:var(--lain-cyan)]/5'}`}>
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <h3 className="font-bold text-lg uppercase tracking-wider">{quest.title}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 border ${quest.status === 'completed' ? 'border-green-500 text-green-500' : quest.status === 'failed' ? 'border-red-500 text-red-500' : 'border-yellow-500 text-yellow-500'}`}>
                                        {quest.status.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-xs opacity-80 mb-4 font-sans italic">{quest.description}</p>
                                
                                <div className="space-y-2">
                                    {quest.objectives.map(obj => (
                                        <div key={obj.id} className="flex items-center gap-2 text-xs">
                                            {obj.completed ? <CheckCircle size={14} className="text-green-500"/> : <Circle size={14} className="opacity-50"/>}
                                            <span className={obj.completed ? "line-through opacity-50" : ""}>{obj.text}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => {
                                            const updated = quests.filter(q => q.id !== quest.id);
                                            onUpdateStats({ ...userStats, quests: updated });
                                        }}
                                        className="text-[10px] text-red-500 hover:bg-red-500 hover:text-white px-1"
                                    >
                                        ABANDON
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </NaviWindow>
    );
};
