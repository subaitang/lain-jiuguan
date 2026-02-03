
import React, { useState } from 'react';
import { NaviWindow } from './NaviWindow';
import { Book, Cpu, MessageSquare, Shield, Globe, Database, Target, Music, Terminal } from 'lucide-react';

interface SystemManualProps {
    onClose: () => void;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
}

export const SystemManual: React.FC<SystemManualProps> = ({
    onClose,
    isMinimized,
    isMaximized,
    onMinimize,
    onMaximize
}) => {
    const [activeSection, setActiveSection] = useState<'intro' | 'modes' | 'features'>('intro');

    return (
        <NaviWindow
            title="SYSTEM MANUAL // HELP"
            onClose={onClose}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            className="w-[600px] h-[500px]"
        >
            <div className="flex flex-col h-full bg-black/95 text-[color:var(--lain-cyan)] font-['Share_Tech_Mono']">
                {/* Tabs */}
                <div className="flex border-b border-[color:var(--lain-cyan)]/30">
                    <button 
                        onClick={() => setActiveSection('intro')}
                        className={`flex-1 py-3 hover:bg-[color:var(--lain-cyan)]/10 transition-colors border-r border-[color:var(--lain-cyan)]/30 ${activeSection === 'intro' ? 'bg-[color:var(--lain-cyan)] text-black font-bold' : ''}`}
                    >
                        INTRO
                    </button>
                    <button 
                        onClick={() => setActiveSection('modes')}
                        className={`flex-1 py-3 hover:bg-[color:var(--lain-cyan)]/10 transition-colors border-r border-[color:var(--lain-cyan)]/30 ${activeSection === 'modes' ? 'bg-[color:var(--lain-cyan)] text-black font-bold' : ''}`}
                    >
                        MODES
                    </button>
                    <button 
                        onClick={() => setActiveSection('features')}
                        className={`flex-1 py-3 hover:bg-[color:var(--lain-cyan)]/10 transition-colors ${activeSection === 'features' ? 'bg-[color:var(--lain-cyan)] text-black font-bold' : ''}`}
                    >
                        MODULES
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-6">
                    {activeSection === 'intro' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 border-2 border-[color:var(--lain-cyan)] flex items-center justify-center bg-[color:var(--lain-cyan)]/10 rounded-full animate-pulse">
                                    <Cpu size={32} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-widest text-glow">WIRED_NAVI OS</h1>
                                    <div className="text-xs opacity-60">v12.6.0 // STABLE</div>
                                </div>
                            </div>
                            <p className="text-sm opacity-80 leading-relaxed">
                                Welcome to the Wired. This terminal is designed for seamless interface with Artificial Intelligence entities in both casual and simulation environments.
                            </p>
                            <div className="p-4 border border-[color:var(--lain-cyan)]/30 bg-[color:var(--lain-cyan)]/5">
                                <h3 className="font-bold mb-2 flex items-center gap-2"><Terminal size={14}/> QUICK START</h3>
                                <ul className="list-disc list-inside text-xs space-y-1 opacity-80">
                                    <li>Select a <strong>Persona</strong> from the Network Node list.</li>
                                    <li>Choose a <strong>Mode</strong> (MSG for chat, RP for game).</li>
                                    <li>Type in the console to begin transmission.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeSection === 'modes' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold border-b border-[color:var(--lain-cyan)]/30 pb-1 flex items-center gap-2">
                                    <MessageSquare size={18} /> MSG MODE (Messenger)
                                </h3>
                                <p className="text-xs opacity-70">
                                    Standard communication protocol. Focuses on conversation, emotional resonance, and topic exploration.
                                </p>
                                <ul className="text-xs space-y-1 pl-4 opacity-60 list-square">
                                    <li>Tracks **Affection**, **Mood**, and **Stress**.</li>
                                    <li>Use **Topic Suggestions** to find new subjects.</li>
                                    <li>Best for: Casual chat, therapy, interviewing.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold border-b border-[color:var(--lain-cyan)]/30 pb-1 flex items-center gap-2 text-yellow-400">
                                    <Shield size={18} /> RP MODE (Roleplay)
                                </h3>
                                <p className="text-xs opacity-70">
                                    Simulation protocol. Activates the **Game State Engine**.
                                </p>
                                <ul className="text-xs space-y-1 pl-4 opacity-60 list-square">
                                    <li>**Status Bar**: Tracks HP, MP, XP, Inventory, and Equipment.</li>
                                    <li>**Dice Roller**: Automated d20 checks for actions.</li>
                                    <li>**Quest System**: Tracks objectives and rewards automatically.</li>
                                    <li>**World Gen**: Generates lore, factions, and maps.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeSection === 'features' && (
                        <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-right-4">
                            <div className="p-3 border border-[color:var(--lain-cyan)]/20 bg-black/40">
                                <div className="font-bold flex items-center gap-2 mb-2 text-sm"><Database size={14}/> MEMORY MATRIX</div>
                                <p className="text-[10px] opacity-70">
                                    The system automatically compresses long conversations into **Episodic Summaries**.
                                    Open the Memory window to view or edit these summaries to ensure the AI remembers key events.
                                </p>
                            </div>

                            <div className="p-3 border border-[color:var(--lain-cyan)]/20 bg-black/40">
                                <div className="font-bold flex items-center gap-2 mb-2 text-sm"><Target size={14}/> QUEST TRACKER</div>
                                <p className="text-[10px] opacity-70">
                                    In RP Mode, a HUD overlay appears to track missions. 
                                    Click the **QUESTS** button in the top bar to view detailed logs and rewards.
                                </p>
                            </div>

                            <div className="p-3 border border-[color:var(--lain-cyan)]/20 bg-black/40">
                                <div className="font-bold flex items-center gap-2 mb-2 text-sm"><Globe size={14}/> WORLD CODEX</div>
                                <p className="text-[10px] opacity-70">
                                    Use the **WORLD** button to generate a setting. 
                                    Explore **Factions** and **History** tabs to deepen the lore.
                                </p>
                            </div>

                            <div className="p-3 border border-[color:var(--lain-cyan)]/20 bg-black/40">
                                <div className="font-bold flex items-center gap-2 mb-2 text-sm"><Music size={14}/> AUDIO / VISUAL</div>
                                <p className="text-[10px] opacity-70">
                                    Customize your experience in **Settings**. 
                                    Change fonts, enable TTS (Text-to-Speech), or adjust the Visual Feed opacity.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </NaviWindow>
    );
};
