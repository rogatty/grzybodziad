export const PLAYER_BASE_SPEED = 200;
export const CAMERA_INITIAL_ZOOM = 1.0;
export const WORLD_WIDTH = 2700;  // 800 * 1.5^3 — fits 3 zoom-out steps
export const WORLD_HEIGHT = 2025; // 600 * 1.5^3
export const BASKET_BASE_CAPACITY = 5;
export const BASKET_SPOIL_TIME = 15000; // ms — resource spoils if not sold within 15s
export const COLLECTION_RADIUS = 40;
export const RESOURCE_SPAWN_INTERVAL = 1500; // ms
export const MAX_RESOURCES_ON_SCREEN = 80; // scaled for larger world (2700x2025)
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
