import React from 'react';

interface WiredEyeProps {
    className?: string;
    style?: React.CSSProperties;
}

export const WiredEye: React.FC<WiredEyeProps> = ({ className, style }) => {
    return (
        <svg viewBox="0 0 100 100" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <g filter="url(#glow)">
                {/* Tech circles */}
                <circle cx="50" cy="50" r="45" strokeOpacity="0.3" strokeDasharray="4 4" className="animate-[spin_10s_linear_infinite]" />
                <circle cx="50" cy="50" r="38" strokeOpacity="0.5" strokeDasharray="20 10" className="animate-[spin_15s_linear_infinite_reverse]" />
                
                {/* Main Eye Shape */}
                <path d="M10 50 Q 50 10 90 50 Q 50 90 10 50 Z" strokeWidth="3" fill="rgba(0, 240, 255, 0.1)" />
                
                {/* Iris/Pupil */}
                <circle cx="50" cy="50" r="18" strokeWidth="2" />
                <circle cx="50" cy="50" r="8" fill="currentColor" />
                
                {/* Vertical Pupil Line / Glitch */}
                <line x1="50" y1="20" x2="50" y2="80" strokeWidth="1" strokeOpacity="0.8" />
                
                {/* Decor */}
                <circle cx="50" cy="50" r="2" fill="white" className="animate-pulse" />
            </g>
        </svg>
    );
};