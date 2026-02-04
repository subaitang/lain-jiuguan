import { Item } from '../types';

export interface Recipe {
    id: string;
    name: string;
    ingredients: { name: string; quantity: number }[];
    result: Item;
}

export const RECIPES: Recipe[] = [
    {
        id: 'potion_hp_small',
        name: 'Small Health Potion',
        ingredients: [{ name: 'Medicinal Herb', quantity: 2 }, { name: 'Clean Water', quantity: 1 }],
        result: { id: 'potion_hp_s', name: 'Small Health Potion', type: 'consumable', rarity: 'common', description: 'Restores 20 HP.', effect: 'Heal 20 HP', quantity: 1 }
    },
    {
        id: 'potion_mp_small',
        name: 'Small Mana Potion',
        ingredients: [{ name: 'Glowing Mushroom', quantity: 2 }, { name: 'Clean Water', quantity: 1 }],
        result: { id: 'potion_mp_s', name: 'Small Mana Potion', type: 'consumable', rarity: 'common', description: 'Restores 10 MP.', effect: 'Restore 10 MP', quantity: 1 }
    },
    {
        id: 'iron_sword',
        name: 'Iron Sword',
        ingredients: [{ name: 'Iron Ore', quantity: 3 }, { name: 'Wood Scrap', quantity: 1 }],
        result: { id: 'w_iron_sword', name: 'Iron Sword', type: 'weapon', rarity: 'uncommon', description: 'A sturdy iron blade.', attributes: { STR: 2 }, quantity: 1 }
    },
    {
        id: 'data_chip',
        name: 'Decrypted Data Chip',
        ingredients: [{ name: 'Encrypted Shard', quantity: 4 }],
        result: { id: 'k_data_chip', name: 'Decrypted Data Chip', type: 'key', rarity: 'rare', description: 'Contains valuable intel.', quantity: 1 }
    }
];

export const canCraft = (inventory: Item[], recipe: Recipe): boolean => {
    for (const ing of recipe.ingredients) {
        const item = inventory.find(i => i.name.toLowerCase() === ing.name.toLowerCase());
        if (!item || (item.quantity || 1) < ing.quantity) {
            return false;
        }
    }
    return true;
};

export const craftItem = (inventory: Item[], recipe: Recipe): { success: boolean, newInventory: Item[], result?: Item } => {
    if (!canCraft(inventory, recipe)) {
        return { success: false, newInventory: inventory };
    }

    let newInventory = inventory.map(i => ({ ...i })); // Deep copy-ish

    // Consume ingredients
    for (const ing of recipe.ingredients) {
        const itemIndex = newInventory.findIndex(i => i.name.toLowerCase() === ing.name.toLowerCase());
        if (itemIndex > -1) {
            const item = newInventory[itemIndex];
            const q = item.quantity || 1;
            if (q > ing.quantity) {
                newInventory[itemIndex] = { ...item, quantity: q - ing.quantity };
            } else {
                newInventory.splice(itemIndex, 1);
            }
        }
    }

    // Add result
    const resultItem = { ...recipe.result };
    const existingIndex = newInventory.findIndex(i => i.id === resultItem.id);
    if (existingIndex > -1 && resultItem.type === 'consumable') {
         // Stack logic for consumables
         newInventory[existingIndex].quantity = (newInventory[existingIndex].quantity || 1) + (resultItem.quantity || 1);
    } else {
        newInventory.push(resultItem);
    }

    return { success: true, newInventory, result: resultItem };
};
