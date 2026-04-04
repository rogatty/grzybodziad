import Phaser from 'phaser';
import { isMobile } from '../utils';

export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create(): void {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, 'background');

        // Title
        this.add.text(width / 2, height / 2 - 140, 'Grzybodziad', {
            fontSize: '64px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffffff',
            stroke: '#2d5a00',
            strokeThickness: 8,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 4, fill: true }
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 60, 'Zbieraj grzyby, jagody i kwiatki!', {
            fontSize: '22px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffaa'
        }).setOrigin(0.5);

        const playBtn = this.add.text(width / 2, height / 2 + 60, '▶  GRAJ', {
            fontSize: '32px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffffff',
            backgroundColor: '#227722',
            padding: { x: 36, y: 16 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        playBtn.on('pointerover', () => playBtn.setStyle({ backgroundColor: '#33aa33' }));
        playBtn.on('pointerout', () => playBtn.setStyle({ backgroundColor: '#227722' }));
        const startGame = () => {
            this.registry.set('roundDuration', 180);
            if (isMobile()) {
                document.documentElement.requestFullscreen?.().catch(() => {});
            }
            this.scene.start('GameScene');
        };
        playBtn.on('pointerdown', startGame);

        // Space key hint below play button (keyboard only)
        if (!isMobile()) this.add.image(width / 2, height / 2 + 120, 'key_space').setDisplaySize(100, 24);

        this.input.keyboard!.on('keydown-SPACE', startGame);

        // Bounce animation on title
        this.tweens.add({
            targets: this.children.list[1],
            y: height / 2 - 150,
            duration: 1200,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }
}
