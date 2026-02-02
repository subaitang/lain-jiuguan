
import React, { useEffect, useState, useRef } from 'react';

interface WiredEyeProps {
    className?: string;
    style?: React.CSSProperties;
}

export const WiredEye: React.FC<WiredEyeProps> = ({ className, style }) => {
    const [pupilPos, setPupilPos] = useState({ x: 50, y: 50 });
    const [isBlinking, setIsBlinking] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    // Mouse Listener (Always track coords, but decide to use them later)
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Behavior Loop: Blink & Attention
    useEffect(() => {
        let blinkTimeout: NodeJS.Timeout;
        let attentionTimeout: NodeJS.Timeout;

        const triggerBlink = () => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 150);
            
            // Blink every 3-8 seconds
            const nextDelay = 3000 + Math.random() * 5000;
            blinkTimeout = setTimeout(triggerBlink, nextDelay);
        };

        const toggleAttention = () => {
            // 30% chance to track, 70% chance to idle
            const tracking = Math.random() > 0.7; 
            setIsTracking(tracking);
            
            // Switch state every 2-5 seconds
            const nextDelay = 2000 + Math.random() * 3000;
            attentionTimeout = setTimeout(toggleAttention, nextDelay);
        };

        triggerBlink();
        toggleAttention();

        return () => {
            clearTimeout(blinkTimeout);
            clearTimeout(attentionTimeout);
        };
    }, []);

    // Animation Loop for Smooth Tracking
    useEffect(() => {
        let animationFrame: number;

        const updateEye = () => {
            if (!svgRef.current) return;

            let targetX = 50;
            let targetY = 50;

            if (isTracking) {
                const rect = svgRef.current.getBoundingClientRect();
                const eyeCenterX = rect.left + rect.width / 2;
                const eyeCenterY = rect.top + rect.height / 2;
                
                const dx = mouseRef.current.x - eyeCenterX;
                const dy = mouseRef.current.y - eyeCenterY;
                const angle = Math.atan2(dy, dx);
                
                // Limit pupil movement radius
                const maxDist = 15;
                const dist = Math.min(maxDist, Math.sqrt(dx * dx + dy * dy) / (rect.width / 40)); 

                targetX = 50 + Math.cos(angle) * dist;
                targetY = 50 + Math.sin(angle) * dist;
            } else {
                // Idle drift (slight movement around center)
                // We could add Perlin noise here, but simple center return is fine for "spacing out"
                targetX = 50;
                targetY = 50;
            }

            setPupilPos(prev => ({
                x: prev.x + (targetX - prev.x) * 0.1, // Lerp factor 0.1 for smoothness
                y: prev.y + (targetY - prev.y) * 0.1
            }));

            animationFrame = requestAnimationFrame(updateEye);
        };

        updateEye();
        return () => cancelAnimationFrame(animationFrame);
    }, [isTracking]);

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
                <clipPath id="eye-clip">
                    {/* The clipping path determines the eye shape. We scale THIS for blinking. */}
                    <path d="M10 50 Q 50 10 90 50 Q 50 90 10 50 Z" />
                </clipPath>
            </defs>
            <g filter="url(#glow)">
                {/* Tech circles (Always visible, outside blink) */}
                <circle cx="50" cy="50" r="45" strokeOpacity="0.3" strokeDasharray="4 4" className="animate-[spin_10s_linear_infinite]" />
                <circle cx="50" cy="50" r="38" strokeOpacity="0.5" strokeDasharray="20 10" className="animate-[spin_15s_linear_infinite_reverse]" />
                
                {/* The Eye Ball Group - Scales vertically to blink */}
                <g 
                    style={{ 
                        transformOrigin: 'center', 
                        transform: `scaleY(${isBlinking ? 0.1 : 1})`,
                        transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    {/* Sclera / Outline */}
                    <path d="M10 50 Q 50 10 90 50 Q 50 90 10 50 Z" strokeWidth="3" fill="rgba(0, 240, 255, 0.05)" />
                    
                    {/* Pupil Group - Clipped to stay inside eye */}
                    <g clipPath="url(#eye-clip)">
                        <circle cx={pupilPos.x} cy={pupilPos.y} r="18" strokeWidth="2" />
                        <circle cx={pupilPos.x} cy={pupilPos.y} r="8" fill="currentColor" />
                        
                        {/* Highlight */}
                        <circle cx={pupilPos.x + 6} cy={pupilPos.y - 6} r="3" fill="white" className="animate-pulse" />
                    </g>

                    {/* Vertical Glitch Line - Static in center, not affected by pupil movement, but affected by blink (squash) */}
                    {/* User requested: "Don't follow eye occlusion" -> Keep it outside clipPath? */}
                    {/* If outside clipPath, it might bleed out of eye bounds. But user said "don't follow eye occlusion relationship", maybe they want it strictly graphical overlay. */}
                    <line 
                        x1="50" y1="20" 
                        x2="50" y2="80" 
                        strokeWidth="1" 
                        strokeOpacity="0.8" 
                    />
                </g>
            </g>
        </svg>
    );
};
