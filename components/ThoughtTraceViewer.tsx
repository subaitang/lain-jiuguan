
import React, { useState } from 'react';
import { NaviWindow } from './NaviWindow';
import { Message } from '../types';
import { BrainCircuit, Database, FileText, User } from 'lucide-react';

interface ThoughtTraceViewerProps {
    message: Message;
    onClose: () => void;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
}

export const ThoughtTraceViewer: React.FC<ThoughtTraceViewerProps> = ({
    message,
    onClose,
    isMinimized,
    isMaximized,
    onMinimize,
    onMaximize
}) => {
    const [activeTab, setActiveTab] = useState<'main' | 'var' | 'role'>('var');

    return (
        <NaviWindow
            title={`THOUGHT TRACE // PID:${message.id.substring(0,6)}`}
            onClose={onClose}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            className="w-[600px] h-[500px]"
        >
            <div className="flex flex-col h-full bg-black/95 text-[color:var(--lain-cyan)] font-['Share_Tech_Mono']">
                {/* Header Info */}
                <div className="p-3 border-b border-[color:var(--lain-cyan)]/30 bg-[color:var(--lain-cyan)]/5 text-xs flex justify-between items-center">
                    <span className="opacity-70">TIMESTAMP: {message.timestamp}</span>
                    <span className="font-bold">{message.role.toUpperCase()} MODEL OUTPUT</span>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[color:var(--lain-cyan)]/30 bg-black">
                    <button 
                        onClick={() => setActiveTab('var')}
                        className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 hover:bg-[color:var(--lain-cyan)]/10 transition-colors ${activeTab === 'var' ? 'bg-[color:var(--lain-cyan)]/20 border-b-2 border-[color:var(--lain-cyan)]' : 'opacity-50'}`}
                    >
                        <Database size={12} /> VAR CHAIN
                    </button>
                    <button 
                        onClick={() => setActiveTab('main')}
                        className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 hover:bg-[color:var(--lain-cyan)]/10 transition-colors ${activeTab === 'main' ? 'bg-[color:var(--lain-cyan)]/20 border-b-2 border-[color:var(--lain-cyan)]' : 'opacity-50'}`}
                    >
                        <BrainCircuit size={12} /> MAIN CoT
                    </button>
                    <button 
                        onClick={() => setActiveTab('role')}
                        className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 hover:bg-[color:var(--lain-cyan)]/10 transition-colors ${activeTab === 'role' ? 'bg-[color:var(--lain-cyan)]/20 border-b-2 border-[color:var(--lain-cyan)]' : 'opacity-50'}`}
                    >
                        <User size={12} /> ROLE GEN
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-4 scrollbar-thin bg-grid-pattern relative">
                    <div className="absolute inset-0 bg-black/80 pointer-events-none"></div>
                    <div className="relative z-10">
                        {activeTab === 'var' && (
                            <div className="space-y-2">
                                <div className="text-[10px] opacity-50 tracking-widest mb-2 uppercase">Variable Metadata (JSON)</div>
                                {message.metadataRaw ? (
                                    <pre className="text-xs font-mono text-green-400 bg-black/50 p-4 border border-green-500/30 whitespace-pre-wrap">
                                        {message.metadataRaw}
                                    </pre>
                                ) : (
                                    <div className="text-xs opacity-50 italic p-4 border border-dashed border-[color:var(--lain-cyan)]/30">
                                        No metadata variables captured for this response.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'main' && (
                            <div className="space-y-4">
                                {message.thought && (
                                    <div className="space-y-1">
                                        <div className="text-[10px] opacity-50 tracking-widest uppercase text-yellow-400">Hidden Thought Process</div>
                                        <div className="text-xs font-serif text-yellow-100/80 bg-yellow-900/10 p-3 border-l-2 border-yellow-500 whitespace-pre-wrap">
                                            {message.thought}
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <div className="text-[10px] opacity-50 tracking-widest uppercase">Final Output Text</div>
                                    <div className="text-xs whitespace-pre-wrap bg-black/50 p-3 border border-[color:var(--lain-cyan)]/30">
                                        {message.content}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'role' && (
                            <div className="space-y-2">
                                <div className="text-[10px] opacity-50 tracking-widest mb-2 uppercase">System Prompt Snapshot</div>
                                {message.systemPromptUsed ? (
                                    <pre className="text-[10px] font-mono opacity-80 whitespace-pre-wrap leading-relaxed text-gray-300">
                                        {message.systemPromptUsed}
                                    </pre>
                                ) : (
                                    <div className="text-xs opacity-50 italic p-4">
                                        Context snapshot not available.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="p-2 border-t border-[color:var(--lain-cyan)]/30 text-[9px] text-right opacity-50 uppercase">
                    SECURE_LEVEL_5 // DECRYPTION_COMPLETE
                </div>
            </div>
        </NaviWindow>
    );
};
