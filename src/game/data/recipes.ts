import { ResourceType } from './constants';

export interface Recipe {
    ingredients: { type: ResourceType; count: number }[];
    bonusCoins: number;
    namePL: string;
}

export const RECIPE_POOL: Recipe[] = [
    { namePL: 'Bukiet', ingredients: [{ type: 'mushroom', count: 1 }, { type: 'berry', count: 1 }, { type: 'flower', count: 1 }], bonusCoins: 10 },
    { namePL: 'Grzybobranie', ingredients: [{ type: 'mushroom', count: 3 }], bonusCoins: 8 },
    { namePL: 'Jagodowy kosz', ingredients: [{ type: 'berry', count: 3 }], bonusCoins: 10 },
    { namePL: 'Wianuszek', ingredients: [{ type: 'flower', count: 2 }, { type: 'berry', count: 1 }], bonusCoins: 12 },
    { namePL: 'Leśny mix', ingredients: [{ type: 'mushroom', count: 2 }, { type: 'flower', count: 1 }], bonusCoins: 9 },
    { namePL: 'Pełny koszyk', ingredients: [{ type: 'mushroom', count: 1 }, { type: 'berry', count: 2 }, { type: 'flower', count: 2 }], bonusCoins: 18 },
];

export function pickRandomRecipe(exclude?: Recipe): Recipe {
    const pool = exclude ? RECIPE_POOL.filter(r => r !== exclude) : RECIPE_POOL;
    return pool[Math.floor(Math.random() * pool.length)];
}
