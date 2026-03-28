import Phaser from 'phaser';
import { TRASH_TEXTURES } from '../data/constants';

export class Trash extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        const key = TRASH_TEXTURES[Math.floor(Math.random() * TRASH_TEXTURES.length)];
        super(scene, x, y, key);

        scene.add.existing(this);
        this.postFX.addShadow(1, 2, 0.99, 1, 0x000000, 4, 0.012);

        // Spawn animation
        this.setScale(0);
        scene.tweens.add({ targets: this, scale: 1, duration: 300, ease: 'Back.out' });

        // Gentle wobble
        scene.tweens.add({
            targets: this,
            angle: 15,
            duration: 900 + Math.random() * 300,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    collect(): void {
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
