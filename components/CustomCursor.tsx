
import React, { useEffect, useRef, useState } from 'react';

interface CustomCursorProps {
    isBusy?: boolean; 
    isSystemBusy?: boolean; 
    customCursors?: Record<string, string>; 
    scale?: number; 
}

type CursorState = 'default' | 'pointer' | 'text' | 'wait' | 'thinking' | 'crosshair' | 'not-allowed';

const CURSOR_ASSETS = {
    default: 'https://files.catbox.moe/9ik3ab.png', 
    pointer: 'https://files.catbox.moe/mw4on0.png', 
    text: 'https://files.catbox.moe/225fxr.png',    
    wait: 'https://files.catbox.moe/bql29i.png',    
    thinking: 'https://files.catbox.moe/ydaoe3.png',
    crosshair: 'https://files.catbox.moe/ifzojs.png',
    notAllowed: 'https://files.catbox.moe/o5ph9n.png' 
};

const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
};

export const CustomCursor: React.FC<CustomCursorProps> = ({ isBusy, isSystemBusy, customCursors, scale = 1 }) => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const trailRef1 = useRef<HTMLDivElement>(null);
    const trailRef2 = useRef<HTMLDivElement>(null);
    const trailRef3 = useRef<HTMLDivElement>(null);

    const mousePos = useRef({ x: 0, y: 0 });
    const trailPos1 = useRef({ x: 0, y: 0 });
    const trailPos2 = useRef({ x: 0, y: 0 });
    const trailPos3 = useRef({ x: 0, y: 0 });

    const requestRef = useRef<number>(0);
    
    const [cursorState, setCursorState] = useState<CursorState>('default');
    const [isVisible, setIsVisible] = useState(true); 
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        Object.values(CURSOR_ASSETS).forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }, []);

    useEffect(() => {
        const animate = () => {
            if (!mousePos.current || !trailPos1.current || !trailPos2.current || !trailPos3.current) return;

            const { x, y } = mousePos.current;

            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            }

            trailPos1.current.x = lerp(trailPos1.current.x, x, 0.4);
            trailPos1.current.y = lerp(trailPos1.current.y, y, 0.4);
            
            trailPos2.current.x = lerp(trailPos2.current.x, trailPos1.current.x, 0.4);
            trailPos2.current.y = lerp(trailPos2.current.y, trailPos1.current.y, 0.4);

            trailPos3.current.x = lerp(trailPos3.current.x, trailPos2.current.x, 0.4);
            trailPos3.current.y = lerp(trailPos3.current.y, trailPos2.current.y, 0.4);

            if (trailRef1.current) trailRef1.current.style.transform = `translate3d(${trailPos1.current.x}px, ${trailPos1.current.y}px, 0)`;
            if (trailRef2.current) trailRef2.current.style.transform = `translate3d(${trailPos2.current.x}px, ${trailPos2.current.y}px, 0)`;
            if (trailRef3.current) trailRef3.current.style.transform = `translate3d(${trailPos3.current.x}px, ${trailPos3.current.y}px, 0)`;

            requestRef.current = requestAnimationFrame(animate);
        };
        
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (mousePos.current) {
                mousePos.current = { x: e.clientX, y: e.clientY };
            }
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        const handleMouseOver = (e: MouseEvent) => {
            if (isBusy || isSystemBusy) return;

            const target = e.target as HTMLElement;
            if (!target) return;
            
            const computedStyle = window.getComputedStyle(target);
            const cursorStyle = computedStyle.cursor;
            const tagName = target.tagName.toLowerCase();

            if (cursorStyle === 'wait' || cursorStyle === 'progress') {
                setCursorState('wait');
            } else if (tagName === 'input' || tagName === 'textarea' || cursorStyle === 'text') {
                setCursorState('text');
            } else if (
                cursorStyle === 'pointer' || 
                tagName === 'button' || 
                tagName === 'a' || 
                target.closest('button') || 
                target.closest('a') ||
                target.getAttribute('role') === 'button'
            ) {
                setCursorState('pointer');
            } else if (cursorStyle === 'crosshair') {
                setCursorState('crosshair');
            } else if (cursorStyle === 'not-allowed' || cursorStyle === 'no-drop') {
                setCursorState('not-allowed');
            } else {
                setCursorState('default');
            }
        };

        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseLeave = () => setIsVisible(false);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('mouseleave', handleMouseLeave);
        
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseenter', handleMouseEnter);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [isVisible, isBusy, isSystemBusy]);

    let effectiveState = cursorState;
    if (isSystemBusy) effectiveState = 'wait';
    else if (isBusy) effectiveState = 'thinking';

    const getCursorImage = (state: string) => {
        if (customCursors && customCursors[state]) return customCursors[state];
        if (state === 'default' && customCursors?.['default']) return customCursors['default'];
        
        switch (state) {
            case 'pointer': return CURSOR_ASSETS.pointer;
            case 'text': return CURSOR_ASSETS.text;
            case 'wait': return CURSOR_ASSETS.wait;
            case 'thinking': return CURSOR_ASSETS.thinking;
            case 'crosshair': return CURSOR_ASSETS.crosshair;
            case 'not-allowed': return CURSOR_ASSETS.notAllowed;
            default: return CURSOR_ASSETS.default;
        }
    };

    const activeIcon = getCursorImage(effectiveState);
    const isInteractive = effectiveState === 'pointer';
    
    let sizeClass = "w-5 h-auto";
    let offsetClass = "translate-x-0 translate-y-0"; 
    let effectiveScale = scale; 
    let animationClass = "cursor-glitch"; 

    if (effectiveState === 'wait' || effectiveState === 'thinking') {
        effectiveScale = 1; 
        sizeClass = effectiveState === 'wait' ? "w-6 h-auto animate-spin-slow" : "w-8 h-auto animate-pulse";
        animationClass = "";
    } else if (effectiveState === 'text' || effectiveState === 'crosshair') {
        offsetClass = "-translate-x-1/2 -translate-y-1/2";
        sizeClass = "w-6 h-auto";
    } else if (customCursors?.[effectiveState]) {
        sizeClass = "w-auto h-8"; 
    } else {
        if (effectiveState === 'pointer') {
            sizeClass = "w-6 h-auto";
            effectiveScale = scale * 1.5; 
            animationClass = ""; 
        }
    }

    if (!isVisible) return null;

    const TrailImage = () => (
        <img 
            src={activeIcon} 
            className={`${sizeClass} opacity-30 mix-blend-screen filter hue-rotate-90 blur-[1px]`} 
            alt="" 
        />
    );

    return (
        <>
            <style>{`
                @keyframes cursor-glitch-anim {
                    0% { transform: scale(1); filter: hue-rotate(0deg); opacity: 1; }
                    92% { transform: scale(1); filter: hue-rotate(0deg); opacity: 1; }
                    93% { transform: scale(1.1) skewX(10deg); filter: hue-rotate(90deg) invert(0.2); opacity: 0.8; }
                    94% { transform: scale(1); filter: hue-rotate(0deg); opacity: 1; }
                    96% { transform: scale(0.9) skewY(-5deg); filter: invert(1); opacity: 0.7; }
                    98% { transform: scale(1.05); filter: hue-rotate(-45deg); opacity: 0.9; }
                    100% { transform: scale(1); filter: hue-rotate(0deg); opacity: 1; }
                }
                .cursor-glitch {
                    animation: cursor-glitch-anim 4s infinite linear;
                }
                @keyframes cursor-pulse-ring {
                    0% { transform: scale(1); opacity: 0.5; border-width: 2px; }
                    100% { transform: scale(2.5); opacity: 0; border-width: 0px; }
                }
            `}</style>

            {!isBusy && !isSystemBusy && (
                <>
                    <div ref={trailRef3} className={`fixed top-0 left-0 z-[9996] pointer-events-none will-change-transform ${offsetClass}`} style={{ transform: `scale(${effectiveScale})` }}><TrailImage/></div>
                    <div ref={trailRef2} className={`fixed top-0 left-0 z-[9997] pointer-events-none will-change-transform ${offsetClass}`} style={{ transform: `scale(${effectiveScale})` }}><TrailImage/></div>
                    <div ref={trailRef1} className={`fixed top-0 left-0 z-[9998] pointer-events-none will-change-transform ${offsetClass}`} style={{ transform: `scale(${effectiveScale})` }}><TrailImage/></div>
                </>
            )}

            <div 
                ref={cursorRef}
                className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-screen will-change-transform"
                style={{ pointerEvents: 'none' }} 
            >
                <div 
                    className={`relative transition-transform duration-100 ease-out ${offsetClass} ${isClicking ? 'scale-90' : ''}`}
                    style={{
                        transform: `scale(${effectiveScale})`
                    }}
                >
                    <img 
                        src={activeIcon}
                        alt="cursor"
                        className={`${sizeClass} drop-shadow-[0_0_5px_rgba(0,240,255,0.8)] ${animationClass}`}
                    />
                    
                    {effectiveState === 'default' && !customCursors?.['default'] && (
                        <div className="absolute -top-2 -left-2 w-[140%] h-[140%] border border-[color:var(--lain-cyan)] rounded-full opacity-30 animate-spin-slow pointer-events-none border-dashed"></div>
                    )}
                    
                    {isInteractive && (
                        <div className="absolute -inset-2 border border-[color:var(--lain-cyan)] rounded-full opacity-0 animate-[cursor-pulse-ring_1.5s_infinite] pointer-events-none"></div>
                    )}
                </div>
            </div>
        </>
    );
};
