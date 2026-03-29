import Phaser from 'phaser';

export abstract class Collectible extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
        super(scene, x, y, textureKey);
        scene.add.existing(this);
        this.postFX.addShadow(1, 2, 0.99, 1, 0x000000, 4, 0.012);
        this.setScale(0);
        scene.tweens.add({ targets: this, scale: 1, duration: 300, ease: 'Back.out' });
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
