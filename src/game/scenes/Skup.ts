import Phaser from 'phaser';
import { ResourceType, BASKET_BASE_CAPACITY } from '../data/constants';
import { UPGRADES } from '../data/upgrades';
import { DEBUG_FILL_BASKET } from '../data/debug';

type BasketItem = { points: number; spoilAt: number; resourceType: ResourceType | 'trash'; textureKey?: string };

interface SkupData {
    basket: BasketItem[];
    coins: number;
    score: number;
}

export class Skup extends Phaser.Scene {
    private basket: BasketItem[] = [];       // only sellable (non-trash)
    private trashBasket: BasketItem[] = [];  // trash — returned untouched on close
    private coins = 0;
    private score = 0;
    private coinsText!: Phaser.GameObjects.Text;
    private basketGrid!: Phaser.GameObjects.Container;
    private basketGridBaseX = 0;
    private sellBtn!: Phaser.GameObjects.Text;

    constructor() {
        super('Skup');
    }

    init(data: SkupData): void {
        this.basket = data.basket.filter(i => i.resourceType !== 'trash');
        this.trashBasket = data.basket.filter(i => i.resourceType === 'trash');
        this.coins = data.coins ?? 0;
        this.score = data.score ?? 0;

        if (DEBUG_FILL_BASKET) {
            const basketUpgrade = UPGRADES.find(u => u.id === 'basket')!;
            const maxCapacity = BASKET_BASE_CAPACITY + basketUpgrade.effect(basketUpgrade.maxLevel);
            const types: ResourceType[] = ['mushroom', 'berry', 'flower'];
            while (this.basket.length < maxCapacity) {
                const i = this.basket.length % 3;
                this.basket.push({ points: i + 1, spoilAt: Date.now() + 30000, resourceType: types[i], textureKey: types[i] });
            }
        }
    }

    create(): void {
        const { width, height } = this.scale;
        const cx = Math.round(width / 2) - 150; // dialog center, shifted left to make room for grzybodziad

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

        this.add.rectangle(width / 2, height / 2, width - 20, 540, 0xfff5e0, 1)
            .setStrokeStyle(3, 0xffcc44);

        this.add.image(width - 190, height / 2, 'grzybodziad')
            .setOrigin(0.5)
            .setDisplaySize(300, 460);

        this.add.text(cx, height / 2 - 245, 'Dom Grzybodziada', {
            fontSize: '32px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#553300'
        }).setOrigin(0.5);

        this.coinsText = this.add.text(cx, height / 2 - 207, `💵 ${this.coins}`, {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#553300'
        }).setOrigin(0.5);

        // Basket grid area
        this.basketGrid = this.add.container(cx, height / 2 - 100);
        this.basketGridBaseX = cx;
        this.refreshGrid();

        // Sell button
        this.sellBtn = this.add.text(cx, height / 2 + 115, '', {
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
        this.sellBtn.on('pointerdown', () => this.sell());
        this.refreshSellButton();

        // Space key hint below sell button
        this.add.image(cx, height / 2 + 158, 'key_space').setDisplaySize(100, 24);

        // Back button
        const backBtn = this.add.text(cx + 30, height / 2 + 220, '← Wróć do gry', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            backgroundColor: '#883300',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#bb5500' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#883300' }));
        backBtn.on('pointerdown', () => this.close());

        this.add.image(cx - 70, height / 2 + 220, 'key_empty').setDisplaySize(28, 26);
        this.add.text(cx - 70, height / 2 + 220, 'Esc', {
            fontSize: '7px', fontFamily: 'Arial Black, sans-serif', color: '#333333'
        }).setOrigin(0.5);

        this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') this.close();
            if (e.key === ' ' || e.key === 'Enter') this.sell();
        });
    }

    private refreshGrid(): void {
        this.basketGrid.removeAll(true);
        const cols = 7;
        const size = 50;
        const gap = 8;
        const total = cols * size + (cols - 1) * gap;

        const allItems = [...this.basket, ...this.trashBasket];
        allItems.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = -total / 2 + col * (size + gap) + size / 2;
            const y = row * (size + gap);

            const isTrash = item.resourceType === 'trash';
            const fresh = item.spoilAt > this.time.now;
            const alpha = (!isTrash && !fresh) ? 0.4 : 1;
            const borderColor = isTrash ? 0xaa3300 : (fresh ? 0xaa8833 : 0x888888);

            const bg = this.add.rectangle(x, y, size, size, 0xfff5e0, 1)
                .setStrokeStyle(2, borderColor);

            const imgKey = item.textureKey ?? (isTrash ? 'trash_banana' : item.resourceType);
            const img = this.add.image(x, y - 4, imgKey)
                .setAlpha(alpha);
            const imgSize = size - 10;
            const scale = Math.min(imgSize / img.width, (imgSize - 8) / img.height);
            img.setScale(scale);

            const pts = this.add.text(x, y + size / 2 - 9, isTrash ? '🗑' : `${item.points}pt`, {
                fontSize: '11px',
                fontFamily: 'Arial Black, sans-serif',
                color: isTrash ? '#aa3300' : (fresh ? '#553300' : '#888888'),
            }).setOrigin(0.5);

            this.basketGrid.add([bg, img, pts]);
        });

    }

    private showTrashFeedback(): void {
        // Shake the grid — kill any in-progress shake first and snap back to base
        this.tweens.killTweensOf(this.basketGrid);
        this.basketGrid.x = this.basketGridBaseX;
        this.tweens.add({
            targets: this.basketGrid,
            x: this.basketGridBaseX + 10,
            duration: 45,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut',
            onComplete: () => { this.basketGrid.x = this.basketGridBaseX; }
        });

        // Popup text
        const popup = this.add.text(this.basketGrid.x, this.basketGrid.y - 30, '🗑 Śmieci do śmietnika!', {
            fontSize: '20px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#aa3300',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({
            targets: popup,
            y: popup.y - 40,
            alpha: 0,
            duration: 900,
            ease: 'Quad.out',
            onComplete: () => popup.destroy()
        });
    }

    private sell(): void {
        if (this.basket.length === 0) {
            if (this.trashBasket.length > 0) this.showTrashFeedback();
            return;
        }
        const item = this.basket.shift()!;
        const now = this.time.now;

        let earned = 0;
        if (item.spoilAt > now) {
            earned = item.points;
            this.score += earned;
        }

        this.coins += earned;
        this.coinsText.setText(`💵 ${this.coins}`);

        if (earned > 0) {
            const popup = this.add.text(this.scale.width / 2 - 80, this.scale.height / 2 + 60,
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
    }

    private refreshSellButton(): void {
        const hasItems = this.basket.length > 0;
        this.sellBtn.setText(hasItems ? 'Sprzedaj zasób' : 'Koszyk pusty');
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
