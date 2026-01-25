
import React, { useState, useEffect } from 'react';
import { NaviWindow } from './NaviWindow';
import { RefreshCw, Save, Database, Layers, ArrowRight } from 'lucide-react';
import { t } from '../utils/translations';
import { Language, AppSettings, MemoryLayers } from '../types';
import { summarizeMemoryLayer } from '../services/geminiService';
import { audio } from '../services/audioEngine';

interface MemoryTableViewerProps {
    memoryLayers: MemoryLayers; // New structured prop
    onSave: (layers: MemoryLayers) => void;
    onClose: () => void;
    language: Language;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
    apiSettings: AppSettings['memoryApi']; // Needed for summarization
}

export const MemoryTableViewer: React.FC<MemoryTableViewerProps> = ({
    memoryLayers,
    onSave,
    onClose,
    language,
    isMinimized,
    isMaximized,
    onMinimize,
    onMaximize,
    apiSettings
}) => {
    const [activeLayer, setActiveLayer] = useState<1 | 2 | 3>(1);
    const [layers, setLayers] = useState<MemoryLayers>(memoryLayers || { layer1: "", layer2: "", layer3: "" });
    const [isSummarizing, setIsSummarizing] = useState(false);

    useEffect(() => {
        if (memoryLayers) setLayers(memoryLayers);
    }, [memoryLayers]);

    const handleSummarize = async (fromLevel: 1 | 2) => {
        if (isSummarizing) return;
        setIsSummarizing(true);
        audio.playLoadTick();

        const source = fromLevel === 1 ? layers.layer1 : layers.layer2;
        const targetLevel = fromLevel === 1 ? 2 : 3;
        
        try {
            // Check API Key
            if (!apiSettings?.apiKey) {
                alert("API Key required for summarization. Check Settings > API > Memory Layer.");
                setIsSummarizing(false);
                return;
            }

            const summary = await summarizeMemoryLayer(source, targetLevel, apiSettings);
            
            const newLayers = { ...layers };
            if (targetLevel === 2) newLayers.layer2 = summary;
            else newLayers.layer3 = summary;
            
            setLayers(newLayers);
            onSave(newLayers); // Auto-save
            audio.playBootSound();
            setActiveLayer(targetLevel);
        } catch (e) {
            console.error(e);
            audio.playFailSound();
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleSave = () => {
        onSave(layers);
        audio.playConfirmSound();
    };

    return (
        <NaviWindow
            title={t('mem_desc', language)}
            onClose={onClose}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            className="h-full"
        >
            <div className="flex flex-col h-full bg-black/90 text-[color:var(--lain-cyan)] font-['Share_Tech_Mono']">
                {/* Header / Tabs */}
                <div className="flex border-b border-[color:var(--lain-cyan)]/30 bg-[color:var(--lain-cyan)]/5">
                    {[1, 2, 3].map((lvl) => (
                        <button
                            key={lvl}
                            onClick={() => setActiveLayer(lvl as 1|2|3)}
                            className={`flex-1 py-3 text-xs font-bold tracking-widest transition-all flex items-center justify-center gap-2
                                ${activeLayer === lvl ? 'bg-[color:var(--lain-cyan)] text-black' : 'hover:bg-[color:var(--lain-cyan)]/10 text-[color:var(--lain-cyan)] opacity-60 hover:opacity-100'}
                            `}
                        >
                            <Layers size={14} />
                            {lvl === 1 ? t('mem_l1', language) : lvl === 2 ? t('mem_l2', language) : t('mem_l3', language)}
                        </button>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="p-2 border-b border-[color:var(--lain-cyan)]/30 bg-black flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 text-xs opacity-70">
                        <Database size={12} />
                        <span>LAYER {activeLayer} DATA</span>
                    </div>
                    <div className="flex gap-2">
                        {activeLayer < 3 && (
                            <button 
                                onClick={() => handleSummarize(activeLayer as 1 | 2)}
                                disabled={isSummarizing}
                                className={`px-3 py-1 border border-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors text-[10px] flex items-center gap-2 ${isSummarizing ? 'animate-pulse' : ''}`}
                            >
                                <RefreshCw size={10} className={isSummarizing ? "animate-spin" : ""} />
                                {isSummarizing ? "PROCESSING..." : (activeLayer === 1 ? t('mem_sum_l1l2', language) : t('mem_sum_l2l3', language))}
                            </button>
                        )}
                        <button 
                            onClick={handleSave}
                            className="px-3 py-1 bg-[color:var(--lain-cyan)]/20 border border-[color:var(--lain-cyan)] text-[color:var(--lain-cyan)] hover:bg-[color:var(--lain-cyan)] hover:text-black font-bold text-[10px] flex items-center gap-2"
                        >
                            <Save size={10} /> SAVE
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 relative">
                    <textarea 
                        value={activeLayer === 1 ? layers.layer1 : activeLayer === 2 ? layers.layer2 : layers.layer3}
                        onChange={(e) => {
                            const val = e.target.value;
                            setLayers(prev => ({
                                ...prev,
                                [activeLayer === 1 ? 'layer1' : activeLayer === 2 ? 'layer2' : 'layer3']: val
                            }));
                        }}
                        className="w-full h-full bg-black text-[color:var(--lain-cyan)] p-4 font-mono text-xs resize-none focus:outline-none leading-relaxed"
                        spellCheck={false}
                        placeholder={t('mem_placeholder', language)}
                    />
                    
                    {/* Visual Overlay for Summarizing */}
                    {isSummarizing && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none z-10">
                            <div className="flex items-center gap-4 text-[color:var(--lain-cyan)] text-lg animate-pulse">
                                <Layers size={24} />
                                <ArrowRight size={24} />
                                <Layers size={24} className="fill-current" />
                            </div>
                            <div className="mt-2 text-xs tracking-[0.2em] font-bold">COMPRESSING NEURAL DATA...</div>
                        </div>
                    )}
                </div>
            </div>
        </NaviWindow>
    );
};
