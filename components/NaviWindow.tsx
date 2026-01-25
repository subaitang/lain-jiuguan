
import React from 'react';
import { Minus, Square, X, Maximize2, Minimize2, Hexagon, Grid } from 'lucide-react';

interface NaviWindowProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    isActive?: boolean;
    headerControls?: React.ReactNode;
    // Window Control Props
    isMinimized?: boolean;
    isMaximized?: boolean;
    onMinimize?: () => void;
    onMaximize?: () => void;
    onClose?: () => void;
    
    // Z-Index Handling
    style?: React.CSSProperties;
    onFocus?: () => void; // Trigger for bring to front
}

export const NaviWindow: React.FC<NaviWindowProps> = ({ 
    title, 
    children, 
    className = "", 
    isActive = true, 
    headerControls,
    isMinimized = false,
    isMaximized = false,
    onMinimize,
    onMaximize,
    onClose,
    style,
    onFocus
}) => {
    // Determine positioning class based on state
    const positionClass = isMaximized 
        ? "fixed inset-0 z-[100] w-screen h-screen m-0 rounded-none border-0 bg-black" 
        : `relative flex flex-col ${className}`;

    const heightStyle = isMinimized && !isMaximized ? { height: 'auto', flex: 'none' } : {};
    
    // Combine styles
    const combinedStyle = { ...style, ...heightStyle };

    return (
        <div 
            className={`
                navi-border transition-all duration-200 ease-linear
                ${positionClass} 
                group
            `}
            style={combinedStyle}
            onMouseDown={onFocus} // Bring to front on click
            onTouchStart={onFocus}
        >
            {/* Decorative Corner Brackets (SVG) */}
            {!isMaximized && (
                <>
                    <svg className="absolute -top-1 -left-1 w-6 h-6 text-[color:var(--lain-cyan)] z-20 pointer-events-none opacity-80" viewBox="0 0 20 20">
                        <path d="M0 20 V 0 H 20" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <svg className="absolute -top-1 -right-1 w-6 h-6 text-[color:var(--lain-cyan)] z-20 pointer-events-none opacity-80" viewBox="0 0 20 20">
                        <path d="M0 0 H 20 V 20" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <svg className="absolute -bottom-1 -left-1 w-6 h-6 text-[color:var(--lain-cyan)] z-20 pointer-events-none opacity-80" viewBox="0 0 20 20">
                        <path d="M0 0 V 20 H 20" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <svg className="absolute -bottom-1 -right-1 w-6 h-6 text-[color:var(--lain-cyan)] z-20 pointer-events-none opacity-80" viewBox="0 0 20 20">
                        <path d="M0 20 H 20 V 0" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                </>
            )}

            {/* Window Header */}
            <div 
                className={`
                    h-8 flex items-center justify-between px-2
                    bg-[color:var(--lain-cyan)]/5
                    border-b border-[color:var(--lain-cyan)]
                    shrink-0 select-none cursor-default
                    relative overflow-hidden navi-stripe-bg
                `}
                onDoubleClick={onMaximize}
            >
                <div className="flex items-center gap-2 z-10 bg-black/80 px-3 py-0.5 border-r border-[color:var(--lain-cyan)]/50 backdrop-blur-sm">
                   <Hexagon size={14} className="fill-[color:var(--lain-cyan)]/20 text-[color:var(--lain-cyan)]" />
                   <h2 className="text-xs font-['Share_Tech_Mono'] font-bold text-[color:var(--lain-cyan)] tracking-[0.2em] uppercase text-glow">
                       {title}
                   </h2>
                </div>

                <div className="flex gap-4 items-center z-10 bg-black/60 px-2 h-full">
                    {headerControls}
                    
                    {/* Window Controls - Retro Style */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMinimize && onMinimize(); }}
                            className="w-4 h-4 flex items-center justify-center bg-[color:var(--lain-cyan)]/10 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors border border-[color:var(--lain-cyan)]"
                        >
                            <Minus size={10} />
                        </button>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMaximize && onMaximize(); }}
                            className="w-4 h-4 flex items-center justify-center bg-[color:var(--lain-cyan)]/10 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors border border-[color:var(--lain-cyan)]"
                        >
                            {isMaximized ? <Minimize2 size={10} /> : <Square size={8} />}
                        </button>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); onClose && onClose(); }}
                            className="w-4 h-4 flex items-center justify-center bg-[color:var(--lain-red)]/10 hover:bg-[color:var(--lain-red)] hover:text-black transition-colors border border-[color:var(--lain-red)] text-[color:var(--lain-red)]"
                        >
                            <X size={10} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {!isMinimized && (
                <div className="flex-1 overflow-hidden relative flex flex-col bg-black/90">
                    {/* Inner Grid */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                         style={{ backgroundImage: `linear-gradient(rgba(0, 240, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.5) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
                    ></div>
                    
                    <div className="w-full h-full relative z-10 flex flex-col">
                         {children}
                    </div>
                </div>
            )}
        </div>
    );
};
