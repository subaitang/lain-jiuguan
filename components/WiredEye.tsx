
import React, { useEffect, useState, useRef } from 'react';

interface WiredEyeProps {
    className?: string;
    style?: React.CSSProperties;
}

export const WiredEye: React.FC<WiredEyeProps> = ({ className, style }) => {
    const [pupilPos, setPupilPos] = useState({ x: 50, y: 50 });
    const [isBlinking, setIsBlinking] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!svgRef.current) return;
            
            // Only track if visible/close enough to save performance
            const rect = svgRef.current.getBoundingClientRect();
            const eyeCenterX = rect.left + rect.width / 2;
            const eyeCenterY = rect.top + rect.height / 2;
            
            // Calculate angle and distance
            const dx = e.clientX - eyeCenterX;
            const dy = e.clientY - eyeCenterY;
            const angle = Math.atan2(dy, dx);
            const dist = Math.min(10, Math.sqrt(dx * dx + dy * dy) / (rect.width / 20)); // Normalize distance

            const px = 50 + Math.cos(angle) * dist;
            const py = 50 + Math.sin(angle) * dist;

            setPupilPos({ x: px, y: py });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const blinkLoop = () => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 150);
            
            // Random blink interval between 2s and 8s
            const nextBlink = 2000 + Math.random() * 6000;
            timeoutId = setTimeout(blinkLoop, nextBlink);
        };
        
        let timeoutId = setTimeout(blinkLoop, 3000);
        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <svg 
            ref={svgRef}
            viewBox="0 0 100 100" 
            className={className} 
            style={style} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
        >
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
                
                {/* Main Eye Shape (Eyelids) */}
                <path 
                    d={isBlinking ? "M10 50 Q 50 50 90 50" : "M10 50 Q 50 10 90 50 Q 50 90 10 50 Z"} 
                    strokeWidth="3" 
                    fill={isBlinking ? "currentColor" : "rgba(0, 240, 255, 0.1)"}
                    className="transition-all duration-100"
                />
                
                {/* Iris/Pupil - Hide when blinking */}
                {!isBlinking && (
                    <>
                        <circle cx={pupilPos.x} cy={pupilPos.y} r="18" strokeWidth="2" className="transition-all duration-75 ease-out" />
                        <circle cx={pupilPos.x} cy={pupilPos.y} r="8" fill="currentColor" className="transition-all duration-75 ease-out" />
                        
                        {/* Vertical Pupil Line / Glitch */}
                        <line 
                            x1={pupilPos.x} y1={pupilPos.y - 30} 
                            x2={pupilPos.x} y2={pupilPos.y + 30} 
                            strokeWidth="1" 
                            strokeOpacity="0.8" 
                            className="transition-all duration-75 ease-out"
                        />
                        
                        {/* Decor */}
                        <circle cx={pupilPos.x + 5} cy={pupilPos.y - 5} r="2" fill="white" className="animate-pulse transition-all duration-75 ease-out" />
                    </>
                )}
            </g>
        </svg>
    );
};
