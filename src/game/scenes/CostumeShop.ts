import { COSTUMES, DEFAULT_COSTUME_ID } from '../data/costumes';
import { DEBUG_ALL_COSTUMES_OWNED } from '../data/debug';
import { ModalScene } from './ModalScene';
import { isMobile } from '../utils';

interface CostumeShopData {
    coins: number;
}

export class CostumeShop extends ModalScene {
    private coins = 0;
    private ownedCostumes: string[] = [];
    private activeCostume = DEFAULT_COSTUME_ID;
    private coinsText!: Phaser.GameObjects.Text;
    private buttons: Phaser.GameObjects.Text[] = [];
    private previewImage!: Phaser.GameObjects.Image;

    constructor() {
        super('CostumeShop');
    }

    init(data: CostumeShopData): void {
        this.coins = data.coins ?? 0;
        this.ownedCostumes = DEBUG_ALL_COSTUMES_OWNED
            ? COSTUMES.map(c => c.id)
            : (this.registry.get('ownedCostumes') ?? [DEFAULT_COSTUME_ID]);
        this.activeCostume = this.registry.get('activeCostume') ?? DEFAULT_COSTUME_ID;
        this.buttons = [];
    }

    create(): void {
        const { width, height } = this.scale;
        const cx = Math.round(width / 2) - 150; // shifted left to make room for preview

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        this.add.rectangle(width / 2, height / 2, width - 20, 560, 0xfff5e0, 1)
            .setStrokeStyle(3, 0xffcc44);

        // Large costume preview on the right (same size/position as grzybodziad in Skup)
        const activeSprite = COSTUMES.find(c => c.id === this.activeCostume)?.sprite ?? 'player';
        this.previewImage = this.add.image(width - 190, height / 2, activeSprite)
            .setOrigin(0.5)
            .setDisplaySize(300, 460);

        this.add.text(cx, height / 2 - 245, 'Przebrania', {
            fontSize: '30px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#553300'
        }).setOrigin(0.5);

        this.coinsText = this.add.text(cx, height / 2 - 207, `💵 ${this.coins}`, {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#553300'
        }).setOrigin(0.5);

        COSTUMES.forEach((costume, i) => {
            const rowY = height / 2 - 155 + i * 62;
            const owned = this.ownedCostumes.includes(costume.id);
            const active = this.activeCostume === costume.id;

            // Key badge (keyboard only)
            if (!isMobile()) this.add.image(cx - 220, rowY, `key_${i + 1}`).setDisplaySize(28, 26);

            // Small sprite preview
            if (costume.sprite) {
                this.add.image(cx - 185, rowY, costume.sprite)
                    .setDisplaySize(32, 46)
                    .setOrigin(0.5);
            } else {
                this.add.ellipse(cx - 185, rowY, 36, 36, costume.color)
                    .setStrokeStyle(2, 0xffffff);
            }

            // Name
            this.add.text(cx - 158, rowY, costume.namePL, {
                fontSize: '20px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#553300'
            }).setOrigin(0, 0.5);

            // Action button
            const btnLabel = active ? '✓ Ubrane' : (owned ? 'Ubierz' : `Kup (${costume.cost})`);
            const canAfford = !owned && this.coins >= costume.cost;
            const btnBg = active ? '#445544' : (owned ? '#334488' : (canAfford ? '#336633' : '#553333'));
            const btnColor = active ? '#88ff88' : '#ffffff';

            const btn = this.add.text(cx + 200, rowY, btnLabel, {
                fontSize: '17px',
                fontFamily: 'Arial, sans-serif',
                color: btnColor,
                backgroundColor: btnBg,
                padding: { x: 12, y: 7 },
                fixedWidth: 130,
                align: 'center'
            }).setOrigin(1, 0.5);

            if (!active && (owned || canAfford)) {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerover', () => btn.setStyle({ backgroundColor: owned ? '#4455aa' : '#44aa44' }));
                btn.on('pointerout', () => btn.setStyle({ backgroundColor: btnBg }));
                btn.on('pointerdown', () => this.selectCostume(costume.id, i));
            }

            this.buttons.push(btn);
        });

        const BTN_W = 360, BTN_H = 52;
        const backBg = this.add.rectangle(cx, height / 2 + 245, BTN_W, BTN_H, 0x883300)
            .setInteractive({ useHandCursor: true });
        if (!isMobile()) {
            this.add.image(cx - BTN_W / 2 + 55, height / 2 + 245, 'key_empty').setDisplaySize(28, 26);
            this.add.text(cx - BTN_W / 2 + 55, height / 2 + 245, 'Esc', {
                fontSize: '7px', fontFamily: 'Arial Black, sans-serif', color: '#333333'
            }).setOrigin(0.5);
        }
        this.add.text(cx + 15, height / 2 + 245, 'Wyjdź', {
            fontSize: '22px', fontFamily: 'Arial Black, sans-serif', color: '#ffffff'
        }).setOrigin(0.5);
        backBg.on('pointerover', () => backBg.setFillStyle(0xbb5500));
        backBg.on('pointerout', () => backBg.setFillStyle(0x883300));
        backBg.on('pointerdown', () => this.close());

        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                this.close();
            } else {
                const index = parseInt(event.key) - 1;
                if (index >= 0 && index < COSTUMES.length) {
                    this.selectCostume(COSTUMES[index].id, index);
                }
            }
        });
    }

    private selectCostume(id: string, index: number): void {
        const costume = COSTUMES[index];
        const owned = this.ownedCostumes.includes(id);

        if (!owned) {
            if (this.coins < costume.cost) return;
            this.coins -= costume.cost;
            this.ownedCostumes = [...this.ownedCostumes, id];
            this.registry.set('ownedCostumes', this.ownedCostumes);
            this.coinsText.setText(`💵 ${this.coins}`);
        }

        this.activeCostume = id;
        this.registry.set('activeCostume', id);
        const sprite = COSTUMES[index].sprite ?? 'player';
        this.previewImage.setTexture(sprite).setDisplaySize(300, 460);
        this.refreshButtons();
    }

    private refreshButtons(): void {
        COSTUMES.forEach((costume, i) => {
            const btn = this.buttons[i];
            const owned = this.ownedCostumes.includes(costume.id);
            const active = this.activeCostume === costume.id;
            const canAfford = !owned && this.coins >= costume.cost;

            const btnLabel = active ? '✓ Ubrane' : (owned ? 'Ubierz' : `Kup (${costume.cost})`);
            const btnBg = active ? '#445544' : (owned ? '#334488' : (canAfford ? '#336633' : '#553333'));
            const btnColor = active ? '#88ff88' : '#ffffff';

            btn.setText(btnLabel);
            btn.setStyle({ color: btnColor, backgroundColor: btnBg });
            btn.off('pointerover').off('pointerout').off('pointerdown');
            btn.disableInteractive();

            if (!active && (owned || canAfford)) {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerover', () => btn.setStyle({ backgroundColor: owned ? '#4455aa' : '#44aa44' }));
                btn.on('pointerout', () => btn.setStyle({ backgroundColor: btnBg }));
                btn.on('pointerdown', () => this.selectCostume(costume.id, i));
            }
        });
    }

    private close(): void {
        this.closeAndResume('GameScene', { coins: this.coins, costume: this.activeCostume });
    }
}
