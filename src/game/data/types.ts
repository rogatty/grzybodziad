import { ResourceType } from './constants';

export type BasketItem = {
    points: number;
    spoilAt: number;
    resourceType: ResourceType | 'trash';
    textureKey?: string;
};
