import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    create(): void {
        // All assets are generated as textures in Boot — nothing to load from disk yet.
        // When real art arrives, load it here with this.load.image / this.load.spritesheet

        // Show a brief loading screen in case asset loading is added later
        const { width, height } = this.scale;

        const bar = this.add.rectangle(width / 2 - 160, height / 2, 0, 24, 0x88ff88);
        this.add.rectangle(width / 2, height / 2, 320, 28).setStrokeStyle(2, 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = 316 * progress;
        });

        this.load.once('complete', () => {
            this.scene.start('MainMenu');
        });

        // If nothing to load, go straight to MainMenu
        if (!this.load.isLoading()) {
            this.scene.start('MainMenu');
        }
    }
}
