import Phaser from 'phaser';
import { ResourceType, RESOURCE_NAMES_PL } from '../data/constants';

type BasketItem = { points: number; spoilAt: number; resourceType: ResourceType | 'trash' };

interface SkupData {
    basket: BasketItem[];
    coins: number;
    score: number;
}

const SELL_SPEED_COSTS = [15, 25, 40]; // cost to reach level 1, 2, 3
const SELL_SPEED_ITEMS = [1, 2, 3, 5]; // items sold per click at level 0, 1, 2, 3

const RESOURCE_COLORS: Record<ResourceType | 'trash', number> = {
    mushroom: 0xdd4444,
    berry:    0x3355cc,
    flower:   0xffdd00,
    trash:    0x998866,
};

export class Skup extends Phaser.Scene {
    private basket: BasketItem[] = [];       // only sellable (non-trash)
    private trashBasket: BasketItem[] = [];  // trash — returned untouched on close
    private coins = 0;
    private score = 0;
    private sellSpeedLevel = 0;
    private coinsText!: Phaser.GameObjects.Text;
    private basketGrid!: Phaser.GameObjects.Container;
    private infoText!: Phaser.GameObjects.Text;
    private sellBtn!: Phaser.GameObjects.Text;
    private upgradeBtn!: Phaser.GameObjects.Text;

    constructor() {
        super('Skup');
    }

    init(data: SkupData): void {
        this.basket = data.basket.filter(i => i.resourceType !== 'trash');
        this.trashBasket = data.basket.filter(i => i.resourceType === 'trash');
        this.coins = data.coins ?? 0;
        this.score = data.score ?? 0;
        this.sellSpeedLevel = this.registry.get('sellSpeedLevel') ?? 0;
    }

    create(): void {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        this.add.rectangle(width / 2, height / 2, 560, 540, 0x2a1a0e, 0.95)
            .setStrokeStyle(3, 0xffcc44);

        this.add.text(width / 2, height / 2 - 245, '🏪  Skup zasobów', {
            fontSize: '32px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.coinsText = this.add.text(width / 2, height / 2 - 207, `Monety: ${this.coins}`, {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffff88'
        }).setOrigin(0.5);

        // Basket grid area
        this.basketGrid = this.add.container(width / 2, height / 2 - 100);
        this.refreshGrid();

        // Sell button
        this.sellBtn = this.add.text(width / 2, height / 2 + 95, '', {
            fontSize: '26px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffffff',
            backgroundColor: '#336633',
            padding: { x: 28, y: 14 },
            align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.sellBtn.on('pointerover', () => {
            if (this.basket.length > 0) this.sellBtn.setStyle({ backgroundColor: '#44aa44' });
        });
        this.sellBtn.on('pointerout', () => {
            if (this.basket.length > 0) this.sellBtn.setStyle({ backgroundColor: '#336633' });
        });
        this.sellBtn.on('pointerdown', () => this.sellBatch());
        this.refreshSellButton();

        // Info text (items sold per click)
        this.infoText = this.add.text(width / 2, height / 2 + 148, '', {
            fontSize: '15px',
            fontFamily: 'Arial, sans-serif',
            color: '#aaaaaa'
        }).setOrigin(0.5);
        this.refreshInfoText();

        // Info about trash in basket (if any)
        if (this.trashBasket.length > 0) {
            this.add.text(width / 2, height / 2 + 168, `🗑 ${this.trashBasket.length} śmieci w koszyku — wyrzuć je do kubła`, {
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                color: '#aa8866'
            }).setOrigin(0.5);
        }

        // Upgrade button: Szybka sprzedaż
        this.upgradeBtn = this.add.text(width / 2, height / 2 + 200, '', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            backgroundColor: '#553300',
            padding: { x: 14, y: 8 },
            align: 'center'
        }).setOrigin(0.5);
        this.refreshUpgradeButton();

        // Back button
        const backBtn = this.add.text(width / 2, height / 2 + 248, '← Wróć do gry', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            backgroundColor: '#883300',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#bb5500' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#883300' }));
        backBtn.on('pointerdown', () => this.close());

        this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Backspace' || e.key === 'Escape') this.close();
            if (e.key === ' ' || e.key === 'Enter') this.sellBatch();
        });
    }

    private refreshGrid(): void {
        this.basketGrid.removeAll(true);
        const now = Date.now();
        const cols = 8;
        const size = 50;
        const gap = 8;
        const total = cols * size + (cols - 1) * gap;

        this.basket.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = -total / 2 + col * (size + gap) + size / 2;
            const y = row * (size + gap);

            const fresh = item.spoilAt > this.time.now;
            const color = fresh ? RESOURCE_COLORS[item.resourceType] : 0x555555;
            const alpha = fresh ? 1 : 0.5;

            const box = this.add.rectangle(x, y, size, size, color, alpha)
                .setStrokeStyle(2, 0xffffff);
            const label = this.add.text(x, y - 6, RESOURCE_NAMES_PL[item.resourceType as ResourceType] ?? '🗑', {
                fontSize: '10px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            const pts = this.add.text(x, y + 10, `${item.points}pt`, {
                fontSize: '13px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            this.basketGrid.add([box, label, pts]);
        });

        if (this.basket.length === 0) {
            const empty = this.add.text(0, 0, 'Koszyk pusty', {
                fontSize: '20px',
                fontFamily: 'Arial, sans-serif',
                color: '#888888'
            }).setOrigin(0.5);
            this.basketGrid.add(empty);
        }
    }

    private sellBatch(): void {
        if (this.basket.length === 0) return;
        const n = SELL_SPEED_ITEMS[this.sellSpeedLevel];
        const now = this.time.now;

        let earned = 0;
        let sold = 0;
        for (let i = 0; i < n && this.basket.length > 0; i++) {
            const item = this.basket.shift()!;
            if (item.spoilAt > now) {
                earned += item.points;
                this.score += item.points;
            }
            sold++;
        }

        this.coins += earned;
        this.coinsText.setText(`Monety: ${this.coins}`);

        // Coin pop text
        if (earned > 0) {
            const popup = this.add.text(this.scale.width / 2, this.scale.height / 2 + 60,
                `+${earned} monet!`, {
                    fontSize: '28px',
                    fontFamily: 'Arial Black, sans-serif',
                    color: '#ffff00',
                    stroke: '#000000',
                    strokeThickness: 4
                }).setOrigin(0.5).setDepth(50);
            this.tweens.add({
                targets: popup,
                y: popup.y - 60,
                alpha: 0,
                duration: 700,
                ease: 'Quad.out',
                onComplete: () => popup.destroy()
            });
        }

        this.refreshGrid();
        this.refreshSellButton();
        this.refreshUpgradeButton();
    }

    private refreshSellButton(): void {
        const n = SELL_SPEED_ITEMS[this.sellSpeedLevel];
        const hasItems = this.basket.length > 0;
        const label = hasItems
            ? `Sprzedaj ${n === 1 ? 'zasób' : `${n} zasoby`}  (Spacja)`
            : 'Koszyk pusty';
        this.sellBtn.setText(label);
        this.sellBtn.setStyle({
            backgroundColor: hasItems ? '#336633' : '#444444',
            color: hasItems ? '#ffffff' : '#888888'
        });
        if (hasItems) {
            this.sellBtn.setInteractive({ useHandCursor: true });
        } else {
            this.sellBtn.disableInteractive();
        }
    }

    private refreshInfoText(): void {
        const n = SELL_SPEED_ITEMS[this.sellSpeedLevel];
        this.infoText.setText(`Jedno kliknięcie sprzedaje ${n} ${n === 1 ? 'zasób' : 'zasoby'} na raz`);
    }

    private refreshUpgradeButton(): void {
        const level = this.sellSpeedLevel;
        const maxLevel = SELL_SPEED_COSTS.length;
        if (level >= maxLevel) {
            this.upgradeBtn.setText('⚡ Szybka sprzedaż: MAX');
            this.upgradeBtn.setStyle({ backgroundColor: '#444444', color: '#888888' });
            this.upgradeBtn.disableInteractive();
            return;
        }
        const cost = SELL_SPEED_COSTS[level];
        const canAfford = this.coins >= cost;
        const nextN = SELL_SPEED_ITEMS[level + 1];
        const label = `⚡ Ulepsz sprzedaż: ${nextN} na raz  (${cost} monet)`;
        this.upgradeBtn.setText(label);
        this.upgradeBtn.setStyle({
            backgroundColor: canAfford ? '#664400' : '#443300',
            color: canAfford ? '#ffffff' : '#888888'
        });
        this.upgradeBtn.off('pointerover').off('pointerout').off('pointerdown');
        this.upgradeBtn.disableInteractive();
        if (canAfford) {
            this.upgradeBtn.setInteractive({ useHandCursor: true });
            this.upgradeBtn.on('pointerover', () => this.upgradeBtn.setStyle({ backgroundColor: '#996600' }));
            this.upgradeBtn.on('pointerout', () => this.upgradeBtn.setStyle({ backgroundColor: '#664400' }));
            this.upgradeBtn.on('pointerdown', () => this.buySpeedUpgrade());
        }
    }

    private buySpeedUpgrade(): void {
        const cost = SELL_SPEED_COSTS[this.sellSpeedLevel];
        if (this.coins < cost) return;
        this.coins -= cost;
        this.sellSpeedLevel++;
        this.registry.set('sellSpeedLevel', this.sellSpeedLevel);
        this.coinsText.setText(`Monety: ${this.coins}`);
        this.refreshSellButton();
        this.refreshInfoText();
        this.refreshUpgradeButton();
    }

    private close(): void {
        this.scene.resume('GameScene', {
            basket: [...this.basket, ...this.trashBasket],
            coins: this.coins,
            score: this.score,
            fromSkup: true
        });
        this.scene.stop('Skup');
    }
}
