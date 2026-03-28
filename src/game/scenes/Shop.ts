import Phaser from 'phaser';
import { UPGRADES, upgradeCost } from '../data/upgrades';

interface ShopData {
    coins: number;
}

export class Shop extends Phaser.Scene {
    private coins = 0;
    private upgradeLevels: Record<string, number> = {};
    private coinsText!: Phaser.GameObjects.Text;
    private upgradeTexts: Phaser.GameObjects.Text[] = [];
    private upgradeLevelTexts: Phaser.GameObjects.Text[] = [];

    constructor() {
        super('Shop');
    }

    init(data: ShopData): void {
        this.coins = data.coins ?? 0;
        this.upgradeLevels = this.registry.get('upgradeLevels') ?? {};
        this.upgradeTexts = [];
        this.upgradeLevelTexts = [];
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

        // Panel — wider to fit key badges without overlap
        this.add.rectangle(width / 2, height / 2, 580, 550, 0x1a1a3e, 0.95)
            .setStrokeStyle(3, 0x8888ff);

        // Title
        this.add.text(width / 2, height / 2 - 245, '🛍  Sklep', {
            fontSize: '36px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Coins display
        this.coinsText = this.add.text(width / 2, height / 2 - 205, `Twoje monety: ${this.coins}`, {
            fontSize: '22px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffff88'
        }).setOrigin(0.5);

        // Upgrade rows
        // Layout per row (left→right): [key badge] [icon] [name + desc] [level] [buy button]
        // Key badge right edge ≈ -257, icon left edge ≈ -252 → 5px gap, no overlap
        const upgradeIcons = ['upgrade-speed', 'upgrade-radius', 'upgrade-spawns', 'upgrade-basket', 'upgrade-trashbag', 'upgrade-recycling'];
        UPGRADES.forEach((upgrade, i) => {
            const rowY = height / 2 - 155 + i * 65;

            // Key badge
            this.add.text(width / 2 - 268, rowY, `${i + 1}`, {
                fontSize: '15px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#ddddff',
                backgroundColor: '#3a3a6a',
                padding: { x: 7, y: 5 },
                stroke: '#6666aa',
                strokeThickness: 2
            }).setOrigin(0.5);

            // Icon
            this.add.image(width / 2 - 228, rowY, upgradeIcons[i]).setDisplaySize(48, 48);

            // Name
            this.add.text(width / 2 - 196, rowY - 14, upgrade.namePL, {
                fontSize: '19px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#ffffff'
            });

            // Description
            this.add.text(width / 2 - 196, rowY + 9, upgrade.descriptionPL, {
                fontSize: '13px',
                fontFamily: 'Arial, sans-serif',
                color: '#aaaaaa',
                wordWrap: { width: 190 }
            });

            const level = this.upgradeLevels[upgrade.id] ?? 0;
            const cost = upgradeCost(upgrade, level);
            const maxed = level >= upgrade.maxLevel;

            const btnLabel = maxed ? 'MAX' : `Kup (${cost} monet)`;
            const canAfford = !maxed && this.coins >= cost;
            const btnColor = maxed ? '#888888' : (canAfford ? '#ffffff' : '#888888');
            const btnBg = maxed ? '#444444' : (canAfford ? '#336633' : '#553333');

            const btn = this.add.text(width / 2 + 278, rowY, btnLabel, {
                fontSize: '17px',
                fontFamily: 'Arial, sans-serif',
                color: btnColor,
                backgroundColor: btnBg,
                padding: { x: 12, y: 7 },
                fixedWidth: 135,
                align: 'center'
            }).setOrigin(1, 0.5);

            if (canAfford) {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#44aa44' }));
                btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#336633' }));
                btn.on('pointerdown', () => this.buyUpgrade(upgrade.id, i));
            }

            const lvlText = this.add.text(width / 2 + 104, rowY, `${level}/${upgrade.maxLevel}`, {
                fontSize: '15px',
                fontFamily: 'Arial, sans-serif',
                color: '#aaaaaa'
            }).setOrigin(1, 0.5);

            this.upgradeTexts.push(btn);
            this.upgradeLevelTexts.push(lvlText);
        });

        // Back button row: [⌫ badge] [← Wróć do gry]
        this.add.text(width / 2 - 118, height / 2 + 245, '⌫', {
            fontSize: '15px',
            fontFamily: 'Arial, sans-serif',
            color: '#ddddff',
            backgroundColor: '#3a3a6a',
            padding: { x: 7, y: 12 },
            stroke: '#6666aa',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Back button
        const backBtn = this.add.text(width / 2 + 20, height / 2 + 245, '← Wróć do gry', {
            fontSize: '22px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            backgroundColor: '#883300',
            padding: { x: 22, y: 12 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#bb5500' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#883300' }));
        backBtn.on('pointerdown', () => this.closeShop());

        // Keyboard shortcuts: 1-6 buy upgrade, Backspace/Escape closes shop
        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Backspace' || event.key === 'Escape') {
                this.closeShop();
            } else {
                const index = parseInt(event.key) - 1;
                if (index >= 0 && index < UPGRADES.length) {
                    this.buyUpgrade(UPGRADES[index].id, index);
                }
            }
        });
    }

    private buyUpgrade(upgradeId: string, index: number): void {
        const upgrade = UPGRADES[index];
        const level = this.upgradeLevels[upgradeId] ?? 0;
        const cost = upgradeCost(upgrade, level);

        if (this.coins < cost || level >= upgrade.maxLevel) return;

        this.coins -= cost;
        this.upgradeLevels[upgradeId] = level + 1;
        this.registry.set('upgradeLevels', { ...this.upgradeLevels });

        this.coinsText.setText(`Twoje monety: ${this.coins}`);
        this.refreshButtons();
    }

    private refreshButtons(): void {
        UPGRADES.forEach((upgrade, i) => {
            const btn = this.upgradeTexts[i];
            const level = this.upgradeLevels[upgrade.id] ?? 0;
            const cost = upgradeCost(upgrade, level);
            const maxed = level >= upgrade.maxLevel;
            const canAfford = !maxed && this.coins >= cost;

            btn.setText(maxed ? 'MAX' : `Kup (${cost} monet)`);
            this.upgradeLevelTexts[i].setText(`${level}/${upgrade.maxLevel}`);
            btn.off('pointerover').off('pointerout').off('pointerdown');
            btn.disableInteractive();

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
        this.scene.resume('GameScene', { coins: this.coins });
        this.scene.stop('Shop');
    }
}
