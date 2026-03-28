import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload(): void {
        const { width, height } = this.scale;

        const bar = this.add.rectangle(width / 2 - 160, height / 2, 0, 24, 0x88ff88);
        this.add.rectangle(width / 2, height / 2, 320, 28).setStrokeStyle(2, 0xffffff);
        this.load.on('progress', (progress: number) => {
            bar.width = 316 * progress;
        });

        this.load.image('player', 'assets/player.png');

        this.load.image('costume1', 'assets/costume1.png');
        this.load.image('costume2', 'assets/costume2.png');
        this.load.image('costume3', 'assets/costume3.png');
        this.load.image('costume4', 'assets/costume4.png');

        this.load.image('grzybodziad', 'assets/grzybodziad.png');

        this.load.image('mushroom1', 'assets/mushroom1.png');
        this.load.image('mushroom2', 'assets/mushroom2.png');
        this.load.image('mushroom3', 'assets/mushroom3.png');
        this.load.image('mushroom4', 'assets/mushroom4.png');
        this.load.image('mushroom5', 'assets/mushroom5.png');
        this.load.image('mushroom6', 'assets/mushroom6.png');

        this.load.image('berry', 'assets/berry.png');

        this.load.image('flower1', 'assets/flower1.png');
        this.load.image('flower2', 'assets/flower2.png');
        this.load.image('flower3', 'assets/flower3.png');

        this.load.image('trash_banana', 'assets/trash_banana.png');
        this.load.image('trash_bottle', 'assets/trash_bottle.png');
    }

    create(): void {
        this.scene.start('MainMenu');
    }
}
