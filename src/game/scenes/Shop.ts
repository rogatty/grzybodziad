import { UPGRADES, upgradeCost } from '../data/upgrades';
import { ModalScene } from './ModalScene';
import { isMobile } from '../utils';

interface ShopData {
    coins: number;
}

export class Shop extends ModalScene {
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
        this.fitToScreen();
        const { width, height } = this.scale;

        // Semi-transparent overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

        // Panel — wider to fit key badges without overlap
        this.add.rectangle(width / 2, height / 2, 580, 550, 0xfff5e0, 1)
            .setStrokeStyle(3, 0xffcc44);

        // Title
        this.add.text(width / 2, height / 2 - 245, '🛍  Sklep', {
            fontSize: '36px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#553300'
        }).setOrigin(0.5);

        // Coins display
        this.coinsText = this.add.text(width / 2, height / 2 - 205, `💵 ${this.coins}`, {
            fontSize: '22px',
            fontFamily: 'Arial, sans-serif',
            color: '#553300'
        }).setOrigin(0.5);

        // Upgrade rows
        // Layout per row (left→right): [key badge] [icon] [name + desc] [level] [buy button]
        // Key badge right edge ≈ -257, icon left edge ≈ -252 → 5px gap, no overlap
        const upgradeIcons = ['upgrade-speed', 'upgrade-radius', 'upgrade-spawns', 'upgrade-basket', 'upgrade-trashbag', 'upgrade-recycling'];
        UPGRADES.forEach((upgrade, i) => {
            const rowY = height / 2 - 155 + i * 65;

            // Key badge (keyboard only)
            if (!isMobile()) this.add.image(width / 2 - 268, rowY, `key_${i + 1}`).setDisplaySize(28, 26);

            // Icon
            this.add.image(width / 2 - 228, rowY, upgradeIcons[i]).setDisplaySize(48, 48);

            // Name
            this.add.text(width / 2 - 196, rowY - 14, upgrade.namePL, {
                fontSize: '19px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#553300'
            });

            // Description
            this.add.text(width / 2 - 196, rowY + 9, upgrade.descriptionPL, {
                fontSize: '13px',
                fontFamily: 'Arial, sans-serif',
                color: '#886633',
                wordWrap: { width: 190 }
            });

            const level = this.upgradeLevels[upgrade.id] ?? 0;
            const cost = upgradeCost(upgrade, level);
            const maxed = level >= upgrade.maxLevel;

            const btnLabel = maxed ? 'MAX' : `${cost} 💵`;
            const canAfford = !maxed && this.coins >= cost;
            const btnColor = maxed ? '#886633' : (canAfford ? '#ffffff' : '#553300');
            const btnBg = maxed ? '#ddccaa' : (canAfford ? '#336633' : '#ddbbaa');

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
                color: '#886633'
            }).setOrigin(1, 0.5);

            this.upgradeTexts.push(btn);
            this.upgradeLevelTexts.push(lvlText);
        });

        // Back button
        const BTN_W = 360, BTN_H = 52;
        const backBg = this.add.rectangle(width / 2, height / 2 + 245, BTN_W, BTN_H, 0x883300)
            .setInteractive({ useHandCursor: true });
        if (!isMobile()) {
            this.add.image(width / 2 - BTN_W / 2 + 55, height / 2 + 245, 'key_empty').setDisplaySize(28, 26);
            this.add.text(width / 2 - BTN_W / 2 + 55, height / 2 + 245, 'Esc', {
                fontSize: '7px', fontFamily: 'Arial Black, sans-serif', color: '#333333'
            }).setOrigin(0.5);
        }
        this.add.text(width / 2 + 15, height / 2 + 245, 'Wyjdź', {
            fontSize: '22px', fontFamily: 'Arial Black, sans-serif', color: '#ffffff'
        }).setOrigin(0.5);
        backBg.on('pointerover', () => backBg.setFillStyle(0xbb5500));
        backBg.on('pointerout', () => backBg.setFillStyle(0x883300));
        backBg.on('pointerdown', () => this.closeShop());

        // Keyboard shortcuts: 1-6 buy upgrade, Backspace/Escape closes shop
        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
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

        this.coinsText.setText(`💵 ${this.coins}`);
        this.refreshButtons();
    }

    private refreshButtons(): void {
        UPGRADES.forEach((upgrade, i) => {
            const btn = this.upgradeTexts[i];
            const level = this.upgradeLevels[upgrade.id] ?? 0;
            const cost = upgradeCost(upgrade, level);
            const maxed = level >= upgrade.maxLevel;
            const canAfford = !maxed && this.coins >= cost;

            btn.setText(maxed ? 'MAX' : `${cost} 💵`);
            this.upgradeLevelTexts[i].setText(`${level}/${upgrade.maxLevel}`);
            btn.off('pointerover').off('pointerout').off('pointerdown');
            btn.disableInteractive();

            if (maxed) {
                btn.setStyle({ color: '#886633', backgroundColor: '#ddccaa' });
            } else if (canAfford) {
                btn.setStyle({ color: '#ffffff', backgroundColor: '#336633' });
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#44aa44' }));
                btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#336633' }));
                btn.on('pointerdown', () => this.buyUpgrade(upgrade.id, i));
            } else {
                btn.setStyle({ color: '#553300', backgroundColor: '#ddbbaa' });
            }
        });
    }

    private closeShop(): void {
        this.closeAndResume('GameScene', { coins: this.coins });
    }
}
