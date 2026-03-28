import Phaser from 'phaser';
import { TRASH_BASE_COINS } from '../data/constants';

type BasketItem = { points: number; spoilAt: number; resourceType: string; textureKey?: string };

interface TrashBinData {
    trashBag: string[];
    basket: BasketItem[];   // full basket including trash
    coins: number;
}

export class TrashBin extends Phaser.Scene {
    private trashBag: string[] = [];         // items from game's trashBag
    private basketTrash: BasketItem[] = [];  // trash items from basket
    private nonTrashBasket: BasketItem[] = [];
    private coins = 0;
    private recyclingLevel = 0;
    private coinsText!: Phaser.GameObjects.Text;
    private throwBg!: Phaser.GameObjects.Rectangle;
    private throwLabel!: Phaser.GameObjects.Text;
    private trashGrid!: Phaser.GameObjects.Container;

    constructor() {
        super('TrashBin');
    }

    init(data: TrashBinData): void {
        this.trashBag = [...(data.trashBag ?? [])];
        this.basketTrash = (data.basket ?? []).filter(i => i.resourceType === 'trash');
        this.nonTrashBasket = (data.basket ?? []).filter(i => i.resourceType !== 'trash');
        this.coins = data.coins ?? 0;
        const upgradeLevels: Record<string, number> = this.registry.get('upgradeLevels') ?? {};
        this.recyclingLevel = upgradeLevels['recycling'] ?? 0;
    }

    create(): void {
        const { width, height } = this.scale;
        const cx = width / 2;

        this.add.rectangle(cx, height / 2, width, height, 0x000000, 0.7);
        this.add.rectangle(cx, height / 2, 560, 500, 0xf5f5f5, 1)
            .setStrokeStyle(3, 0x888888);

        this.add.text(cx, height / 2 - 225, '🗑 Śmietnik', {
            fontSize: '36px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#333333'
        }).setOrigin(0.5);

        this.coinsText = this.add.text(cx, height / 2 - 183, '', {
            fontSize: '20px', fontFamily: 'Arial, sans-serif', color: '#553300'
        }).setOrigin(0.5).setVisible(false);

        this.trashGrid = this.add.container(cx, height / 2 - 80);
        this.refreshGrid();

        const BTN_W = 360, BTN_H = 52;
        const throwY = height / 2 + 120;
        const backY = height / 2 + 185;

        this.throwBg = this.add.rectangle(cx, throwY, BTN_W, BTN_H, 0x555555);
        this.add.image(cx - BTN_W / 2 + 55, throwY, 'key_space').setDisplaySize(52, 22);
        this.throwLabel = this.add.text(cx + 15, throwY, '', {
            fontSize: '22px', fontFamily: 'Arial Black, sans-serif', color: '#ffffff'
        }).setOrigin(0.5);
        this.refreshThrowButton();

        const backBg = this.add.rectangle(cx, backY, BTN_W, BTN_H, 0x883300)
            .setInteractive({ useHandCursor: true });
        this.add.image(cx - BTN_W / 2 + 55, backY, 'key_empty').setDisplaySize(28, 26);
        this.add.text(cx - BTN_W / 2 + 55, backY, 'Esc', {
            fontSize: '7px', fontFamily: 'Arial Black, sans-serif', color: '#333333'
        }).setOrigin(0.5);
        this.add.text(cx + 15, backY, 'Wyjdź', {
            fontSize: '22px', fontFamily: 'Arial Black, sans-serif', color: '#ffffff'
        }).setOrigin(0.5);
        backBg.on('pointerover', () => backBg.setFillStyle(0xbb5500));
        backBg.on('pointerout', () => backBg.setFillStyle(0x883300));
        backBg.on('pointerdown', () => this.close());

        this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') this.close();
            if (e.key === ' ' || e.key === 'Enter') this.throwOne();
        });
    }

    private allTrashTextures(): string[] {
        return [
            ...this.trashBag,
            ...this.basketTrash.map(i => i.textureKey ?? 'trash_banana')
        ];
    }

    private refreshGrid(): void {
        this.trashGrid.removeAll(true);
        const items = this.allTrashTextures();
        if (items.length === 0) return;

        const cols = 7, size = 50, gap = 8;
        const total = cols * size + (cols - 1) * gap;

        items.forEach((textureKey, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = -total / 2 + col * (size + gap) + size / 2;
            const y = row * (size + gap);

            const coinValue = (TRASH_BASE_COINS[textureKey] ?? 1) * this.recyclingLevel;
            const borderColor = this.recyclingLevel > 0 ? 0xaa8833 : 0x888888;

            const bg = this.add.rectangle(x, y, size, size, 0xeeeeee, 1).setStrokeStyle(2, borderColor);
            const imgSize = size - 10;
            const img = this.add.image(x, y - 4, textureKey);
            img.setScale(Math.min(imgSize / img.width, (imgSize - 8) / img.height));
            const pts = this.add.text(x, y + size / 2 - 9,
                this.recyclingLevel > 0 ? `${coinValue}💵` : '🗑', {
                    fontSize: '11px', fontFamily: 'Arial Black, sans-serif',
                    color: this.recyclingLevel > 0 ? '#336633' : '#aa3300'
                }).setOrigin(0.5);

            this.trashGrid.add([bg, img, pts]);
        });
    }

    private refreshThrowButton(): void {
        const hasTrash = this.allTrashTextures().length > 0;
        const recycling = hasTrash && this.recyclingLevel > 0;
        const normalColor = recycling ? 0x336633 : 0x555555;
        const hoverColor = recycling ? 0x44aa44 : 0x777777;
        this.throwLabel.setText(hasTrash ? (recycling ? '♻️ Recykling!' : '🗑 Wyrzuć śmieć') : 'Brak śmieci');
        this.throwLabel.setStyle({ color: hasTrash ? '#ffffff' : '#888888' });
        this.throwBg.setFillStyle(hasTrash ? normalColor : 0x444444);
        this.throwBg.off('pointerover').off('pointerout').off('pointerdown');
        if (hasTrash) {
            this.throwBg.setInteractive({ useHandCursor: true });
            this.throwBg.on('pointerover', () => this.throwBg.setFillStyle(hoverColor));
            this.throwBg.on('pointerout', () => this.throwBg.setFillStyle(normalColor));
            this.throwBg.on('pointerdown', () => this.throwOne());
        } else {
            this.throwBg.disableInteractive();
        }
    }

    private throwOne(): void {
        let textureKey: string;
        if (this.trashBag.length > 0) {
            textureKey = this.trashBag.shift()!;
        } else if (this.basketTrash.length > 0) {
            textureKey = this.basketTrash.shift()!.textureKey ?? 'trash_banana';
        } else {
            return;
        }

        const earned = (TRASH_BASE_COINS[textureKey] ?? 1) * this.recyclingLevel;
        this.coins += earned;

        if (earned > 0) {
            const popup = this.add.text(this.scale.width / 2, this.scale.height / 2 + 60,
                `+${earned} 💵`, {
                    fontSize: '28px', fontFamily: 'Arial Black, sans-serif',
                    color: '#ffff00', stroke: '#000000', strokeThickness: 4
                }).setOrigin(0.5).setDepth(50);
            this.tweens.add({
                targets: popup, y: popup.y - 60, alpha: 0, duration: 700,
                ease: 'Quad.out', onComplete: () => popup.destroy()
            });
        }

        this.refreshGrid();
        this.refreshThrowButton();
    }

    private close(): void {
        this.scene.resume('GameScene', {
            trashBag: this.trashBag,
            basket: [...this.nonTrashBasket, ...this.basketTrash],
            coins: this.coins,
            fromTrashBin: true
        });
        this.scene.stop('TrashBin');
    }
}
