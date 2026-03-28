import Phaser from 'phaser';

export class Trash extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'trash');

        scene.add.existing(this);

        // Spawn animation
        this.setScale(0);
        scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 300,
            ease: 'Back.out'
        });

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
