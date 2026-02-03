
import React from 'react';
import { Quest, RPStats } from '../types';
import { Target, CheckCircle, Circle } from 'lucide-react';

interface QuestTrackerProps {
    quests: Quest[];
    visible: boolean;
}

export const QuestTracker: React.FC<QuestTrackerProps> = ({ quests, visible }) => {
    if (!visible) return null;

    const activeQuests = quests.filter(q => q.status === 'active');

    if (activeQuests.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-[50] w-64 bg-black/60 border border-[color:var(--lain-cyan)]/30 backdrop-blur-sm p-2 font-['Share_Tech_Mono'] text-[color:var(--lain-cyan)] pointer-events-none select-none animate-in slide-in-from-right-4">
            <div className="flex items-center gap-2 mb-2 border-b border-[color:var(--lain-cyan)]/30 pb-1">
                <Target size={12} className="animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Current Objectives</span>
            </div>
            <div className="space-y-3">
                {activeQuests.map(quest => (
                    <div key={quest.id} className="space-y-1">
                        <div className="text-xs font-bold text-yellow-400 drop-shadow-md">{quest.title}</div>
                        <div className="space-y-0.5">
                            {quest.objectives.map(obj => (
                                <div key={obj.id} className={`flex items-start gap-1.5 text-[10px] ${obj.completed ? 'opacity-50 text-green-400' : 'opacity-90'}`}>
                                    <div className="mt-0.5">
                                        {obj.completed ? <CheckCircle size={8} /> : <Circle size={8} />}
                                    </div>
                                    <span>{obj.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
