import React, { useMemo } from 'react';
import { NaviWindow } from './NaviWindow';
import { RPStats } from '../types';
import { User, Users } from 'lucide-react';

interface SocialWebProps {
    npcRegistry: Record<string, RPStats>;
    userStats?: RPStats;
    onClose: () => void;
    isMinimized: boolean;
    isMaximized: boolean;
    onMinimize: () => void;
    onMaximize: () => void;
}

export const SocialWeb: React.FC<SocialWebProps> = ({
    npcRegistry, userStats, onClose, isMinimized, isMaximized, onMinimize, onMaximize
}) => {
    const nodes = useMemo(() => {
        const list = Object.entries(npcRegistry).map(([id, s]) => {
            const stats = s as RPStats;
            return {
                id,
                name: stats.name || id,
                affection: stats.affection || 0,
                alignment: stats.alignment || 'Neutral',
                role: 'npc'
            };
        });
        
        if (userStats) {
            list.push({
                id: 'player',
                name: userStats.name || 'Player',
                affection: 100,
                alignment: 'Player',
                role: 'player'
            });
        }
        return list;
    }, [npcRegistry, userStats]);

    // Simple Circular Layout
    const layout = useMemo(() => {
        const cx = 300; // Center X
        const cy = 200; // Center Y
        const radius = 120;
        
        return nodes.map((node, i) => {
            if (node.role === 'player') return { ...node, x: cx, y: cy };
            
            // Adjust angle to distribute NPCs around circle, skipping the player
            // Filter out player from index calculation logic
            const npcIndex = nodes.filter(n => n.role !== 'player').findIndex(n => n.id === node.id);
            const npcCount = nodes.length - 1;
            
            const angle = (npcIndex / (npcCount || 1)) * 2 * Math.PI - (Math.PI / 2);
            return {
                ...node,
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            };
        });
    }, [nodes]);

    return (
        <NaviWindow 
            title="SOCIAL_CONNECTION_GRAPH" 
            onClose={onClose} 
            isMinimized={isMinimized} 
            isMaximized={isMaximized} 
            onMinimize={onMinimize} 
            onMaximize={onMaximize}
            className="w-[600px] h-[450px]"
        >
            <div className="h-full bg-black relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 z-0">
                    <svg width="100%" height="100%">
                        <defs>
                            <marker id="arrow" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#0ff" />
                            </marker>
                        </defs>
                        
                        {/* Connections from Player to NPCs */}
                        {layout.filter(n => n.role !== 'player').map((node, i) => {
                            const player = layout.find(n => n.role === 'player');
                            if (!player) return null;
                            
                            const isFriend = node.affection > 50;
                            const isEnemy = node.affection < -20;
                            const color = isFriend ? '#0f0' : isEnemy ? '#f00' : '#0ff';
                            
                            return (
                                <g key={`link-${i}`}>
                                    <line 
                                        x1={player.x} y1={player.y} 
                                        x2={node.x} y2={node.y} 
                                        stroke={color} 
                                        strokeWidth={isFriend ? 2 : 1}
                                        strokeOpacity={0.5}
                                        strokeDasharray={isEnemy ? "5,5" : "none"}
                                    />
                                    {/* Label affection on line - midpoint */}
                                    <text 
                                        x={(player.x + node.x) / 2} 
                                        y={(player.y + node.y) / 2} 
                                        fill={color} 
                                        fontSize="10" 
                                        textAnchor="middle"
                                        style={{ textShadow: '0 0 2px black' }}
                                    >
                                        {node.affection}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Nodes */}
                        {layout.map((node, i) => (
                            <g key={`node-${i}`} transform={`translate(${node.x}, ${node.y})`}>
                                <circle 
                                    r={node.role === 'player' ? 20 : 15} 
                                    fill="black" 
                                    stroke={node.role === 'player' ? 'white' : 'var(--lain-cyan)'} 
                                    strokeWidth={2} 
                                    className="cursor-pointer hover:fill-[color:var(--lain-cyan)]/20 transition-all"
                                />
                                <foreignObject x={-15} y={-15} width={30} height={30} style={{ pointerEvents: 'none' }}>
                                    <div className="flex items-center justify-center w-full h-full text-[color:var(--lain-cyan)]">
                                        {node.role === 'player' ? <User size={16} color="white"/> : <Users size={12}/>}
                                    </div>
                                </foreignObject>
                                <text 
                                    y={35} 
                                    fill="var(--lain-cyan)" 
                                    fontSize="10" 
                                    textAnchor="middle" 
                                    fontWeight="bold"
                                    style={{ textShadow: '0 0 2px black' }}
                                >
                                    {node.name}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>
                
                <div className="absolute top-2 left-2 z-10 bg-black/80 border border-[color:var(--lain-cyan)] p-2 text-[10px] text-[color:var(--lain-cyan)]">
                    <div>NODES DETECTED: {nodes.length}</div>
                    <div>NETWORK DENSITY: {nodes.length > 2 ? 'MED' : 'LOW'}</div>
                </div>
            </div>
        </NaviWindow>
    );
};
