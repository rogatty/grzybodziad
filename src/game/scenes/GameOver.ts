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
        const BTN_W = 360, BTN_H = 52;
        const btnY = height / 2 + 100;
        const playBg = this.add.rectangle(width / 2, btnY, BTN_W, BTN_H, 0x227722)
            .setInteractive({ useHandCursor: true });
        this.add.image(width / 2 - BTN_W / 2 + 55, btnY, 'key_space').setDisplaySize(52, 22);
        this.add.text(width / 2 + 15, btnY, 'Jeszcze raz', {
            fontSize: '26px', fontFamily: 'Arial Black, sans-serif', color: '#ffffff'
        }).setOrigin(0.5);

        const startGame = () => this.scene.start('GameScene');
        playBg.on('pointerover', () => playBg.setFillStyle(0x33aa33));
        playBg.on('pointerout', () => playBg.setFillStyle(0x227722));
        playBg.on('pointerdown', startGame);

        this.input.keyboard!.on('keydown-SPACE', startGame);
    }
}
