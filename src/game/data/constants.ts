export const PLAYER_BASE_SPEED = 200;
export const CAMERA_INITIAL_ZOOM = 1.0;
export const BASKET_BASE_CAPACITY = 5;
export const BASKET_SPOIL_TIME = 15000; // ms — resource spoils if not sold within 15s
export const COLLECTION_RADIUS = 40;
export const RESOURCE_SPAWN_INTERVAL = 3000; // ms
export const MAX_RESOURCES_ON_SCREEN = 40; // scaled for larger world (2700x2025)
export const TRASH_SPAWN_INTERVAL = 2500; // ms
export const MAX_TRASH_ON_SCREEN = 20;
export const ROUND_DURATION = 180; // seconds

export const RESOURCE_TYPES = ['mushroom', 'berry', 'flower'] as const;
export type ResourceType = typeof RESOURCE_TYPES[number];

export const RESOURCE_TEXTURES: Record<ResourceType, string[]> = {
    mushroom: ['mushroom1', 'mushroom2', 'mushroom3', 'mushroom4', 'mushroom5', 'mushroom6'],
    berry:    ['berry'],
    flower:   ['flower1', 'flower2', 'flower3'],
};

export const TRASH_TEXTURES = ['trash_banana', 'trash_bottle'];

// Base coins per trash type (multiplied by recycling level)
export const TRASH_BASE_COINS: Record<string, number> = {
    'trash_banana': 1,
    'trash_bottle': 2
};

export const RESOURCE_POINTS: Record<ResourceType, number> = {
    mushroom: 1,
    berry: 2,
    flower: 3
};

export const RESOURCE_NAMES_PL: Record<ResourceType, string> = {
    mushroom: 'Grzyb',
    berry: 'Jagoda',
    flower: 'Kwiatek'
};

// Building proximity
export const HUT_ENTRY_RADIUS = 55;        // distance to trigger building entry
export const HUT_EXIT_RADIUS = 110;        // distance to reset entry cooldown after leaving
export const HUT_AVOIDANCE_DISTANCE = 150; // min distance from huts when placing trash bins

// Spawn spacing
export const RESOURCE_MIN_SPACING = 70;    // min distance between resources (also trash-to-trash)
export const TRASH_MIN_SPACING = 60;       // min cross-type distance (resource↔trash)
export const BUILDING_SPAWN_CLEARANCE = 110; // min distance from buildings when spawning items
export const BIN_SPACING = 300;            // min distance between trash bins

// Fog
export const FOG_TRANSITION_START = 0.8;   // fog begins at this fraction of zone radius
export const FOG_SAFE_MARGIN = 0.35;       // bins must be within this fraction of zone half-size

// Returns how many coins 1 base-point is worth, based on remaining freshness
export function getFreshnessMultiplier(spoilAt: number, now: number): number {
    const remaining = (spoilAt - now) / BASKET_SPOIL_TIME;
    if (remaining > 0.75) return 3;
    if (remaining > 0.5) return 2;
    return 1;
}
