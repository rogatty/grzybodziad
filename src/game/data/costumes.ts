export interface Costume {
    id: string;
    namePL: string;
    color: number;   // tymczasowy kolor — zastąpiony sprite'em gdy będzie gotowy
    cost: number;    // 0 = darmowe (domyślne)
}

export const COSTUMES: Costume[] = [
    { id: 'zielony',       namePL: 'Zielony',       color: 0x6bcb77, cost: 0  },
    { id: 'niebieski',     namePL: 'Niebieski',     color: 0x4d9de0, cost: 10 },
    { id: 'czerwony',      namePL: 'Czerwony',      color: 0xe15554, cost: 15 },
    { id: 'żółty',         namePL: 'Żółty',         color: 0xf4d35e, cost: 10 },
    { id: 'fioletowy',     namePL: 'Fioletowy',     color: 0x9b5de5, cost: 20 },
    { id: 'różowy',        namePL: 'Różowy',        color: 0xf15bb5, cost: 15 },
    { id: 'pomarańczowy',  namePL: 'Pomarańczowy',  color: 0xff6b35, cost: 15 },
];

export const DEFAULT_COSTUME_ID = 'zielony';
