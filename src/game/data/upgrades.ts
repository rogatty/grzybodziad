export interface Upgrade {
    id: string;
    namePL: string;
    descriptionPL: string;
    baseCost: number;
    maxLevel: number;
    effect: (level: number) => number;
}

export const UPGRADES: Upgrade[] = [
    {
        id: 'speed',
        namePL: 'Szybkie buty',
        descriptionPL: 'Biegnij szybciej po łące!',
        baseCost: 4,
        maxLevel: 5,
        effect: (level) => level * 40 // +40 speed per level
    },
    {
        id: 'radius',
        namePL: 'Długie ręce',
        descriptionPL: 'Zbieraj z większej odległości!',
        baseCost: 4,
        maxLevel: 4,
        effect: (level) => level * 20 // +20px radius per level
    },
    {
        id: 'spawns',
        namePL: 'Szczęśliwa łąka',
        descriptionPL: 'Więcej roślin wyrasta na łące!',
        baseCost: 5,
        maxLevel: 3,
        effect: (level) => level * 3 // +3 max resources per level
    },
    {
        id: 'basket',
        namePL: 'Pojemny koszyk',
        descriptionPL: 'Więcej miejsca w koszyku!',
        baseCost: 4,
        maxLevel: 4,
        effect: (level) => level * 3 // +3 capacity per level
    },
    {
        id: 'trashbag',
        namePL: 'Worek na śmieci',
        descriptionPL: 'Śmieci trafiają do worka, nie koszyka!',
        baseCost: 5,
        maxLevel: 4,
        effect: (level) => level * 3 // capacity (0 = no bag)
    },
    {
        id: 'recycling',
        namePL: 'Recykling',
        descriptionPL: 'Monety za śmieci przy kubełku!',
        baseCost: 6,
        maxLevel: 3,
        effect: (level) => level // coins per trash item
    }
];

export function upgradeCost(upgrade: Upgrade, currentLevel: number): number {
    return upgrade.baseCost + currentLevel * 3;
}
