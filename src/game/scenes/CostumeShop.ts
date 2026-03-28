import Phaser from 'phaser';
import { COSTUMES, DEFAULT_COSTUME_ID } from '../data/costumes';

interface CostumeShopData {
    coins: number;
}

export class CostumeShop extends Phaser.Scene {
    private coins = 0;
    private ownedCostumes: string[] = [];
    private activeCostume = DEFAULT_COSTUME_ID;
    private coinsText!: Phaser.GameObjects.Text;
    private buttons: Phaser.GameObjects.Text[] = [];

    constructor() {
        super('CostumeShop');
    }

    init(data: CostumeShopData): void {
        this.coins = data.coins ?? 0;
        this.ownedCostumes = this.registry.get('ownedCostumes') ?? [DEFAULT_COSTUME_ID];
        this.activeCostume = this.registry.get('activeCostume') ?? DEFAULT_COSTUME_ID;
        this.buttons = [];
    }

    create(): void {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        this.add.rectangle(width / 2, height / 2, 520, 560, 0xfff5e0, 1)
            .setStrokeStyle(3, 0xffcc44);

        this.add.text(width / 2, height / 2 - 250, 'Przebrania', {
            fontSize: '30px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#553300'
        }).setOrigin(0.5);

        this.coinsText = this.add.text(width / 2, height / 2 - 212, `💵 ${this.coins}`, {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#553300'
        }).setOrigin(0.5);

        COSTUMES.forEach((costume, i) => {
            const rowY = height / 2 - 160 + i * 62;
            const owned = this.ownedCostumes.includes(costume.id);
            const active = this.activeCostume === costume.id;

            // Podgląd przebrania
            if (costume.sprite) {
                this.add.image(width / 2 - 210, rowY, costume.sprite)
                    .setDisplaySize(32, 46)
                    .setOrigin(0.5);
            } else {
                this.add.ellipse(width / 2 - 210, rowY, 36, 36, costume.color)
                    .setStrokeStyle(2, 0xffffff);
            }

            // Name
            this.add.text(width / 2 - 184, rowY, costume.namePL, {
                fontSize: '20px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#553300'
            }).setOrigin(0, 0.5);

            // Action button
            const btnLabel = active ? '✓ Ubrane' : (owned ? 'Ubierz' : `Kup (${costume.cost})`);
            const canAfford = !owned && this.coins >= costume.cost;
            const btnBg = active ? '#445544' : (owned ? '#334488' : (canAfford ? '#336633' : '#553333'));
            const btnColor = active ? '#88ff88' : '#ffffff';

            const btn = this.add.text(width / 2 + 210, rowY, btnLabel, {
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

        const backBtn = this.add.text(width / 2, height / 2 + 252, '← Wróć do gry', {
            fontSize: '22px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            backgroundColor: '#883300',
            padding: { x: 22, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setStyle({ backgroundColor: '#bb5500' }));
        backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: '#883300' }));
        backBtn.on('pointerdown', () => this.close());

        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape') this.close();
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
        this.scene.resume('GameScene', { coins: this.coins, costume: this.activeCostume });
        this.scene.stop('CostumeShop');
    }
}
