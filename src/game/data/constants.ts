export const PLAYER_BASE_SPEED = 200;
export const COLLECTION_RADIUS = 40;
export const RESOURCE_SPAWN_INTERVAL = 2000; // ms
export const MAX_RESOURCES_ON_SCREEN = 15;
export const ROUND_DURATION = 60; // seconds

export const RESOURCE_TYPES = ['mushroom', 'berry', 'flower'] as const;
export type ResourceType = typeof RESOURCE_TYPES[number];

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
