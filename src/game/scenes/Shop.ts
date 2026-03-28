import Phaser from 'phaser';
import { UPGRADES, upgradeCost } from '../data/upgrades';

interface ShopData {
    score: number;
}

export class Shop extends Phaser.Scene {
    private score = 0;
    private upgradeLevels: Record<string, number> = {};
    private scoreText!: Phaser.GameObjects.Text;
    private upgradeTexts: Phaser.GameObjects.Text[] = [];

    constructor() {
        super('Shop');
    }

    init(data: ShopData): void {
        this.score = data.score ?? 0;
        this.upgradeLevels = this.registry.get('upgradeLevels') ?? {};
        this.upgradeTexts = [];
        // Ensure all upgrade ids exist
        for (const u of UPGRADES) {
            if (this.upgradeLevels[u.id] === undefined) {
                this.upgradeLevels[u.id] = 0;
            }
        }
    }

    create(): void {
        const { width, height } = this.scale;

        // Semi-transparent overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

        // Panel
        this.add.rectangle(width / 2, height / 2, 520, 420, 0x1a1a3e, 0.95)
            .setStrokeStyle(3, 0x8888ff);

        // Title
        this.add.text(width / 2, height / 2 - 180, '🛍  Sklep', {
            fontSize: '36px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Score display
        this.scoreText = this.add.text(width / 2, height / 2 - 130, `Twoje punkty: ${this.score}`, {
            fontSize: '22px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffff88'
        }).setOrigin(0.5);

        // Upgrade rows
        const upgradeIcons = ['upgrade-speed', 'upgrade-radius', 'upgrade-spawns'];
        UPGRADES.forEach((upgrade, i) => {
            const rowY = height / 2 - 60 + i * 90;

            // Icon
            this.add.image(width / 2 - 220, rowY, upgradeIcons[i]).setDisplaySize(52, 52);

            this.add.text(width / 2 - 186, rowY - 14, upgrade.namePL, {
                fontSize: '20px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#ffffff'
            });

            this.add.text(width / 2 - 186, rowY + 14, upgrade.descriptionPL, {
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                color: '#aaaaaa'
            });

            const level = this.upgradeLevels[upgrade.id] ?? 0;
            const cost = upgradeCost(upgrade, level);
            const maxed = level >= upgrade.maxLevel;

            const btnLabel = maxed
                ? 'MAX'
                : `Kup  (${cost} pkt)  Poziom: ${level}/${upgrade.maxLevel}`;

            const canAfford = !maxed && this.score >= cost;
            const btnColor = maxed ? '#888888' : (canAfford ? '#ffffff' : '#888888');
            const btnBg = maxed ? '#444444' : (canAfford ? '#336633' : '#553333');

            const btn = this.add.text(width / 2 + 140, rowY, btnLabel, {
                fontSize: '18px',
                fontFamily: 'Arial, sans-serif',
                color: btnColor,
                backgroundColor: btnBg,
                padding: { x: 14, y: 8 }
            }).setOrigin(0.5);

            if (canAfford) {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#44aa44' }));
                btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#336633' }));
                btn.on('pointerdown', () => this.buyUpgrade(upgrade.id, i));
            }

            this.upgradeTexts.push(btn);
        });

        // Back button
        const backBtn = this.add.text(width / 2, height / 2 + 180, '← Wróć do gry', {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            backgroundColor: '#883300',
            padding: { x: 24, y: 12 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#aa4400' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#883300' }));
        backBtn.on('pointerdown', () => this.closeShop());
    }

    private buyUpgrade(upgradeId: string, index: number): void {
        const upgrade = UPGRADES[index];
        const level = this.upgradeLevels[upgradeId] ?? 0;
        const cost = upgradeCost(upgrade, level);

        if (this.score < cost || level >= upgrade.maxLevel) return;

        this.score -= cost;
        this.upgradeLevels[upgradeId] = level + 1;
        this.registry.set('upgradeLevels', { ...this.upgradeLevels });

        this.scoreText.setText(`Twoje punkty: ${this.score}`);
        this.refreshButtons();
    }

    private refreshButtons(): void {
        UPGRADES.forEach((upgrade, i) => {
            const btn = this.upgradeTexts[i];
            const level = this.upgradeLevels[upgrade.id] ?? 0;
            const cost = upgradeCost(upgrade, level);
            const maxed = level >= upgrade.maxLevel;
            const canAfford = !maxed && this.score >= cost;

            btn.setText(maxed ? 'MAX' : `Kup  (${cost} pkt)  Poziom: ${level}/${upgrade.maxLevel}`);
            btn.removeInteractive();
            btn.removeAllListeners();

            if (maxed) {
                btn.setStyle({ color: '#888888', backgroundColor: '#444444' });
            } else if (canAfford) {
                btn.setStyle({ color: '#ffffff', backgroundColor: '#336633' });
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#44aa44' }));
                btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#336633' }));
                btn.on('pointerdown', () => this.buyUpgrade(upgrade.id, i));
            } else {
                btn.setStyle({ color: '#888888', backgroundColor: '#553333' });
            }
        });
    }

    private closeShop(): void {
        this.scene.resume('GameScene', { score: this.score });
        this.scene.stop('Shop');
    }
}
