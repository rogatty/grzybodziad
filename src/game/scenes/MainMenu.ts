import Phaser from 'phaser';

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

        // Time selection label
        this.add.text(width / 2, height / 2 + 20, 'Ile czasu na rundę?', {
            fontSize: '22px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffaa'
        }).setOrigin(0.5);

        const timeOptions = [
            { label: '1 minuta\n(szybki test)', seconds: 60 },
            { label: '2 minuty', seconds: 120 },
            { label: '3 minuty\n(dobra zabawa!)', seconds: 180 },
        ];

        timeOptions.forEach((option, i) => {
            const x = width / 2 - 200 + i * 200;
            const btn = this.add.text(x, height / 2 + 110, option.label, {
                fontSize: '18px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#ffffff',
                backgroundColor: '#227722',
                padding: { x: 18, y: 12 },
                align: 'center'
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#33aa33' }));
            btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#227722' }));
            btn.on('pointerdown', () => {
                this.registry.set('roundDuration', option.seconds);
                this.scene.start('GameScene');
            });
        });

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
