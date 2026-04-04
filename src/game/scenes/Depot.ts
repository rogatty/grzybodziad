import Phaser from 'phaser';
import { ResourceType, BASKET_BASE_CAPACITY, getFreshnessMultiplier } from '../data/constants';
import { BasketItem } from '../data/types';
import { UPGRADES } from '../data/upgrades';
import { DEBUG_FILL_BASKET } from '../data/debug';
import { ModalScene } from './ModalScene';
import { isMobile } from '../utils';
import { Recipe, pickRandomRecipe } from '../data/recipes';

interface DepotData {
    basket: BasketItem[];
    coins: number;
    score: number;
}

export class Depot extends ModalScene {
    private basket: BasketItem[] = [];       // only sellable (non-trash)
    private trashBasket: BasketItem[] = [];  // trash — returned untouched on close
    private coins = 0;
    private score = 0;
    private coinsText!: Phaser.GameObjects.Text;
    private basketGrid!: Phaser.GameObjects.Container;
    private basketGridBaseX = 0;
    private sellBg!: Phaser.GameObjects.Rectangle;
    private sellLabel!: Phaser.GameObjects.Text;

    // Recipe UI
    private currentRecipe: Recipe | null = null;
    private recipeCard!: Phaser.GameObjects.Container;
    private claimBg!: Phaser.GameObjects.Rectangle;
    private claimLabel!: Phaser.GameObjects.Text;

    constructor() {
        super('Depot');
    }

    init(data: DepotData): void {
        this.basket = data.basket.filter(i => i.resourceType !== 'trash');
        this.trashBasket = data.basket.filter(i => i.resourceType === 'trash');
        this.coins = data.coins ?? 0;
        this.score = data.score ?? 0;

        // Load current recipe from registry (or pick a new one)
        const storedRecipe = this.registry.get('currentRecipe') as Recipe | undefined;
        this.currentRecipe = storedRecipe ?? pickRandomRecipe();
        if (!storedRecipe) this.registry.set('currentRecipe', this.currentRecipe);

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

        this.add.text(cx, height / 2 - 255, 'Dom Grzybodziada', {
            fontSize: '32px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#553300'
        }).setOrigin(0.5);

        this.coinsText = this.add.text(cx, height / 2 - 220, `💵 ${this.coins}`, {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#553300'
        }).setOrigin(0.5);

        // Recipe card area
        this.recipeCard = this.add.container(cx, height / 2 - 185);
        this.add.existing(this.recipeCard);

        // Basket grid area
        this.basketGrid = this.add.container(cx, height / 2 - 100);
        this.basketGridBaseX = cx;
        this.refreshGrid();

        // Buttons
        const BTN_W = 360, BTN_H = 52;
        const claimY = height / 2 + 75;
        const sellY = height / 2 + 135;
        const backY = height / 2 + 195;

        // Claim button (hidden by default)
        this.claimBg = this.add.rectangle(cx, claimY, BTN_W, BTN_H, 0xaa8800)
            .setVisible(false);
        this.claimLabel = this.add.text(cx, claimY, '', {
            fontSize: '20px', fontFamily: 'Arial Black, sans-serif', color: '#ffffff'
        }).setOrigin(0.5).setVisible(false);

        this.sellBg = this.add.rectangle(cx, sellY, BTN_W, BTN_H, 0x336633);
        if (!isMobile()) this.add.image(cx - BTN_W / 2 + 55, sellY, 'key_space').setDisplaySize(52, 22);
        this.sellLabel = this.add.text(cx + 15, sellY, '', {
            fontSize: '22px', fontFamily: 'Arial Black, sans-serif', color: '#ffffff'
        }).setOrigin(0.5);
        this.refreshSellButton();

        const backBg = this.add.rectangle(cx, backY, BTN_W, BTN_H, 0x883300)
            .setInteractive({ useHandCursor: true });
        if (!isMobile()) {
            this.add.image(cx - BTN_W / 2 + 55, backY, 'key_empty').setDisplaySize(28, 26);
            this.add.text(cx - BTN_W / 2 + 55, backY, 'Esc', {
                fontSize: '7px', fontFamily: 'Arial Black, sans-serif', color: '#333333'
            }).setOrigin(0.5);
        }
        this.add.text(cx + 15, backY, 'Wyjdź', {
            fontSize: '22px', fontFamily: 'Arial Black, sans-serif', color: '#ffffff'
        }).setOrigin(0.5);
        backBg.on('pointerover', () => backBg.setFillStyle(0xbb5500));
        backBg.on('pointerout', () => backBg.setFillStyle(0x883300));
        backBg.on('pointerdown', () => this.close());

        this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') this.close();
            if (e.key === ' ' || e.key === 'Enter') this.sell();
        });

        // Initial recipe UI refresh
        this.refreshRecipeUI();
    }

    private getBasketRecipeCounts(): Record<string, number> {
        const counts: Record<string, number> = {};
        const now = this.time.now;
        this.basket.forEach(item => {
            if (item.resourceType !== 'trash' && item.spoilAt > now) {
                counts[item.resourceType] = (counts[item.resourceType] ?? 0) + 1;
            }
        });
        return counts;
    }

    private isRecipeFulfilled(): boolean {
        if (!this.currentRecipe) return false;
        const counts = this.getBasketRecipeCounts();
        return this.currentRecipe.ingredients.every(ing => (counts[ing.type] ?? 0) >= ing.count);
    }

    private refreshRecipeUI(): void {
        if (!this.recipeCard) return;
        this.recipeCard.removeAll(true);

        if (!this.currentRecipe) return;

        const recipe = this.currentRecipe;
        const counts = this.getBasketRecipeCounts();

        // Recipe name
        this.recipeCard.add(this.add.text(0, 0, `📋 ${recipe.namePL}`, {
            fontSize: '16px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#553300'
        }).setOrigin(0.5));

        // Ingredient row
        const ingSpacing = 70;
        const totalW = (recipe.ingredients.length - 1) * ingSpacing;
        const startX = -totalW / 2;

        const textureMap: Record<string, string> = {
            mushroom: 'mushroom1',
            berry: 'berry',
            flower: 'flower1'
        };

        recipe.ingredients.forEach((ing, i) => {
            const x = startX + i * ingSpacing;
            const y = 30;
            const have = counts[ing.type] ?? 0;
            const fulfilled = have >= ing.count;

            const imgKey = textureMap[ing.type] ?? ing.type;
            const img = this.add.image(x, y, imgKey)
                .setDisplaySize(24, 24)
                .setAlpha(fulfilled ? 1 : 0.4);
            this.recipeCard.add(img);

            const label = fulfilled ? '✓' : `${have}/${ing.count}`;
            const txt = this.add.text(x, y + 18, label, {
                fontSize: '13px',
                fontFamily: 'Arial Black, sans-serif',
                color: fulfilled ? '#228822' : '#888888'
            }).setOrigin(0.5);
            this.recipeCard.add(txt);
        });

        // Show/hide claim button
        const fulfilled = this.isRecipeFulfilled();
        this.claimBg.setVisible(fulfilled);
        this.claimLabel.setVisible(fulfilled);

        if (fulfilled) {
            this.claimLabel.setText(`📋 Odbierz bonus! +${recipe.bonusCoins}💵`);
            this.claimBg.setInteractive({ useHandCursor: true });
            this.claimBg.off('pointerover').off('pointerout').off('pointerdown');
            this.claimBg.on('pointerover', () => this.claimBg.setFillStyle(0xddaa00));
            this.claimBg.on('pointerout', () => this.claimBg.setFillStyle(0xaa8800));
            this.claimBg.on('pointerdown', () => this.claimRecipe());
        } else {
            this.claimBg.disableInteractive();
        }
    }

    private claimRecipe(): void {
        if (!this.currentRecipe || !this.isRecipeFulfilled()) return;

        // Auto-sell recipe ingredients at their current freshness price
        const now = this.time.now;
        let sellEarned = 0;
        for (const ing of this.currentRecipe.ingredients) {
            let remaining = ing.count;
            for (let i = this.basket.length - 1; i >= 0 && remaining > 0; i--) {
                const item = this.basket[i];
                if (item.resourceType === ing.type && item.spoilAt > now) {
                    const multiplier = getFreshnessMultiplier(item.spoilAt, now);
                    sellEarned += item.points * multiplier;
                    this.basket.splice(i, 1);
                    remaining--;
                }
            }
        }

        // Award sell value + recipe bonus
        const bonus = this.currentRecipe.bonusCoins;
        const total = sellEarned + bonus;
        this.coins += total;
        this.score += total;
        this.coinsText.setText(`💵 ${this.coins}`);

        // Celebration popup
        const recipeName = this.currentRecipe.namePL;
        const popup = this.add.text(this.scale.width / 2 - 80, this.scale.height / 2 - 20,
            `📋 ${recipeName}\n+${sellEarned} 💵 +${bonus} bonus!`, {
                fontSize: '26px', fontFamily: 'Arial Black, sans-serif',
                color: '#44ff44', stroke: '#000000', strokeThickness: 4, align: 'center'
            }).setOrigin(0.5).setDepth(60);
        this.tweens.add({
            targets: popup, y: popup.y - 80, alpha: 0,
            duration: 1800, ease: 'Quad.out',
            onComplete: () => popup.destroy()
        });

        // New recipe
        const newRecipe = pickRandomRecipe(this.currentRecipe);
        this.currentRecipe = newRecipe;
        this.registry.set('currentRecipe', newRecipe);
        this.refreshGrid();
        this.refreshSellButton();
        this.refreshRecipeUI();
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

            let priceLabel: string;
            if (isTrash) {
                priceLabel = '🗑';
            } else if (fresh) {
                const multiplier = getFreshnessMultiplier(item.spoilAt, this.time.now);
                const adjustedPoints = item.points * multiplier;
                priceLabel = `${adjustedPoints}💵`;
            } else {
                priceLabel = `0💵`;
            }
            const pts = this.add.text(x, y + size / 2 - 9, priceLabel, {
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
            const multiplier = getFreshnessMultiplier(item.spoilAt, now);
            earned = item.points * multiplier;
            this.score += earned;
        }

        this.coins += earned;
        this.coinsText.setText(`💵 ${this.coins}`);

        if (earned > 0) {
            const popup = this.add.text(this.scale.width / 2 - 80, this.scale.height / 2 + 60,
                `+${earned} 💵`, {
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
        this.refreshRecipeUI();
    }

    private refreshSellButton(): void {
        const hasItems = this.basket.length > 0;
        this.sellLabel.setText(hasItems ? '💵 Sprzedaj' : 'Koszyk pusty');
        this.sellLabel.setStyle({ color: hasItems ? '#ffffff' : '#888888' });
        this.sellBg.setFillStyle(hasItems ? 0x336633 : 0x444444);
        this.sellBg.off('pointerover').off('pointerout').off('pointerdown');
        if (hasItems) {
            this.sellBg.setInteractive({ useHandCursor: true });
            this.sellBg.on('pointerover', () => this.sellBg.setFillStyle(0x44aa44));
            this.sellBg.on('pointerout', () => this.sellBg.setFillStyle(0x336633));
            this.sellBg.on('pointerdown', () => this.sell());
        } else {
            this.sellBg.disableInteractive();
        }
    }

    private close(): void {
        this.closeAndResume('GameScene', {
            basket: [...this.basket, ...this.trashBasket],
            coins: this.coins,
            score: this.score,
            fromDepot: true
        });
    }
}
