import Phaser from 'phaser';
import { ResourceType, RESOURCE_POINTS, RESOURCE_TEXTURES } from '../data/constants';
import { Collectible } from './Collectible';

export class Resource extends Collectible {
    readonly resourceType: ResourceType;
    readonly points: number;

    constructor(scene: Phaser.Scene, x: number, y: number, type: ResourceType) {
        const variants = RESOURCE_TEXTURES[type];
        const textureKey = variants[Math.floor(Math.random() * variants.length)];
        super(scene, x, y, textureKey);
        this.resourceType = type;
        this.points = RESOURCE_POINTS[type];

        // Floating animation
        scene.tweens.add({
            targets: this,
            y: y - 6,
            duration: 1200 + Math.random() * 400,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }
}
