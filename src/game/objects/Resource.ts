import Phaser from 'phaser';
import { ResourceType, RESOURCE_POINTS } from '../data/constants';

export class Resource extends Phaser.Physics.Arcade.Sprite {
    readonly resourceType: ResourceType;
    readonly points: number;

    constructor(scene: Phaser.Scene, x: number, y: number, type: ResourceType) {
        super(scene, x, y, type);
        this.resourceType = type;
        this.points = RESOURCE_POINTS[type];

        scene.add.existing(this);

        // Spawn animation: scale from 0 to 1
        this.setScale(0);
        scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 300,
            ease: 'Back.out'
        });

        // Gentle floating animation
        scene.tweens.add({
            targets: this,
            y: y - 6,
            duration: 1200 + Math.random() * 400,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    collect(): void {
        // Pop animation before destroying
        this.scene.tweens.add({
            targets: this,
            scale: 1.5,
            alpha: 0,
            duration: 200,
            ease: 'Quad.out',
            onComplete: () => this.destroy()
        });
    }
}
