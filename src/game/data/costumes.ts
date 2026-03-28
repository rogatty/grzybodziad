export interface Costume {
    id: string;
    namePL: string;
    sprite?: string;  // klucz tekstury — jeśli brak, używamy 'player' + kolorowa elipsa
    color: number;    // kolor elipsy (dla przebrań bez sprite'a) lub kolor tła podglądu
    cost: number;     // 0 = darmowe (domyślne)
}

export const COSTUMES: Costume[] = [
    { id: 'domyslne',      namePL: 'Domyślne',      color: 0x6bcb77, cost: 0  },
    { id: 'niebieskie',    namePL: 'Niebieskie',    sprite: 'costume1', color: 0x4d9de0, cost: 10 },
    { id: 'kapelusznik',   namePL: 'Kapelusznik',   sprite: 'costume2', color: 0x9b5de5, cost: 15 },
    { id: 'szaraczek',     namePL: 'Szaraczek',     sprite: 'costume3', color: 0x888888, cost: 10 },
    { id: 'pomaranczowe',  namePL: 'Pomarańczowe',  sprite: 'costume4', color: 0xff6b35, cost: 10 },
];

export const DEFAULT_COSTUME_ID = 'domyslne';
