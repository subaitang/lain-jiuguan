import { CombatState, RPStats } from '../types';

export const calculateDamage = (attackerAttr: { STR: number, INT: number }, defenderAttr: { CON: number, WIS: number }, type: 'phys' | 'mag' = 'phys'): number => {
    const atk = type === 'phys' ? attackerAttr.STR : attackerAttr.INT;
    const def = type === 'phys' ? defenderAttr.CON : defenderAttr.WIS;
    
    // Simple d20-ish logic
    // Damage = (Stat Mod) + d4
    const statMod = Math.floor((atk - 10) / 2);
    const defMod = Math.floor((def - 10) / 2);
    
    const base = Math.max(1, 2 + statMod);
    const roll = Math.floor(Math.random() * 4) + 1; // 1d4 weapon
    const mitigation = Math.max(0, defMod);
    
    return Math.max(1, (base + roll) - mitigation);
};

export const initCombat = (player: RPStats, enemies: RPStats[]): CombatState => {
    const participants = [
        {
            id: 'player',
            name: player.name || 'Player',
            hp: player.hp.current,
            maxHp: player.hp.max,
            isPlayer: true,
            initiative: player.attributes.DEX + Math.random() * 20
        },
        ...enemies.map((e, i) => ({
            id: `enemy_${i}`,
            name: e.name || `Enemy ${i+1}`,
            hp: e.hp.current,
            maxHp: e.hp.max,
            isPlayer: false,
            initiative: e.attributes.DEX + Math.random() * 20
        }))
    ];

    // Sort by initiative
    participants.sort((a, b) => b.initiative - a.initiative);

    return {
        active: true,
        turn: 1,
        participants,
        log: ['[SYSTEM] Combat Initialized. Initiatives rolled.']
    };
};

export const processCombatAction = (
    state: CombatState, 
    action: { type: 'ATTACK' | 'DEFEND' | 'SKILL', targetId?: string },
    playerStats: RPStats,
    enemyStats: RPStats // Assuming 1v1 for now for simplicity in stats passing, though state supports many
): CombatState => {
    let newState = { ...state, log: [...state.log] };
    const playerPart = newState.participants.find(p => p.isPlayer);
    const enemyPart = newState.participants.find(p => !p.isPlayer);

    if (!playerPart || !enemyPart) return newState;

    // Player Turn
    if (action.type === 'ATTACK') {
        const dmg = calculateDamage(playerStats.attributes, enemyStats.attributes, 'phys');
        enemyPart.hp = Math.max(0, enemyPart.hp - dmg);
        newState.log.push(`> You attacked ${enemyPart.name} for ${dmg} DMG!`);
    } else if (action.type === 'DEFEND') {
        newState.log.push(`> You assumed a defensive stance.`);
        // Logic for defense could be added (temp buff?)
    } else if (action.type === 'SKILL') {
        // Placeholder
        const dmg = calculateDamage(playerStats.attributes, enemyStats.attributes, 'mag');
        enemyPart.hp = Math.max(0, enemyPart.hp - dmg);
        newState.log.push(`> You used a skill on ${enemyPart.name} for ${dmg} DMG!`);
    }

    if (enemyPart.hp <= 0) {
        newState.log.push(`> ${enemyPart.name} was defeated!`);
        newState.active = false; // End combat
        return newState;
    }

    // Enemy Turn (Simple AI)
    const enemyDmg = calculateDamage(enemyStats.attributes, playerStats.attributes, 'phys');
    playerPart.hp = Math.max(0, playerPart.hp - enemyDmg);
    newState.log.push(`> ${enemyPart.name} attacks you for ${enemyDmg} DMG!`);

    if (playerPart.hp <= 0) {
        newState.log.push(`> You were defeated...`);
        newState.active = false;
    } else {
        newState.turn += 1;
    }

    return newState;
};
