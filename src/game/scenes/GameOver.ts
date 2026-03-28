import Phaser from 'phaser';

interface GameOverData {
    score: number;
}

export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data: GameOverData): void {
        this.registry.set('lastScore', data.score ?? 0);
    }

    create(): void {
        const { width, height } = this.scale;
        const score: number = this.registry.get('lastScore') ?? 0;

        this.add.image(width / 2, height / 2, 'background').setAlpha(0.4);

        this.add.text(width / 2, height / 2 - 160, 'Koniec rundy!', {
            fontSize: '56px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffffff',
            stroke: '#2d5a00',
            strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 70, `Zebrałeś: ${score} punktów`, {
            fontSize: '32px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffff88'
        }).setOrigin(0.5);

        const medal = score >= 60 ? '🏆' : score >= 30 ? '🌟' : '🍄';
        const comment = score >= 60 ? 'Niesamowite!' : score >= 30 ? 'Świetnie!' : 'Dobra robota!';

        this.add.text(width / 2, height / 2, `${medal}  ${comment}`, {
            fontSize: '36px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Play again button
        const playBtn = this.add.text(width / 2, height / 2 + 100, '▶  Jeszcze raz', {
            fontSize: '28px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            backgroundColor: '#227722',
            padding: { x: 20, y: 12 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        playBtn.on('pointerover', () => playBtn.setStyle({ backgroundColor: '#33aa33' }));
        playBtn.on('pointerout', () => playBtn.setStyle({ backgroundColor: '#227722' }));
        playBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}
