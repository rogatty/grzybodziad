import Phaser from 'phaser';
import { PLAYER_BASE_SPEED, COLLECTION_RADIUS } from '../data/constants';
import { COSTUMES, DEFAULT_COSTUME_ID } from '../data/costumes';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
    private wasd: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    } | null = null;

    speed: number = PLAYER_BASE_SPEED;
    collectionRadius: number = COLLECTION_RADIUS;

    // Touch movement
    private touchTarget: Phaser.Math.Vector2 | null = null;

    // Base scale used as reference for squish/stretch animation
    private baseScaleX = 1;
    private baseScaleY = 1;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        const costumeKey: string = scene.registry.get('activeCostume') ?? DEFAULT_COSTUME_ID;
        const costumeData = COSTUMES.find(c => c.id === costumeKey) ?? COSTUMES[0];
        super(scene, x, y, costumeData.sprite ?? 'player');
        scene.physics.add.existing(this);

        scene.add.existing(this);
        this.postFX.addShadow(1, 2, 0.99, 1, 0x000000, 4, 0.012);
        this.setCollideWorldBounds(true);
        this.setDepth(10);
        if (costumeData.sprite) this.setDisplaySize(56, 80);
        this.baseScaleX = this.scaleX;
        this.baseScaleY = this.scaleY;

        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.wasd = {
                up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
        }

        // Touch input: tap/drag to move (use world coordinates)
        scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Only handle if not clicking UI buttons (approximate: ignore top area)
            if (pointer.y < 60) return;
            this.touchTarget = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
        });
        scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown) {
                this.touchTarget = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
            }
        });
        scene.input.on('pointerup', () => {
            this.touchTarget = null;
        });
    }

    setCostume(costumeKey: string): void {
        const costumeData = COSTUMES.find(c => c.id === costumeKey) ?? COSTUMES[0];
        this.setTexture(costumeData.sprite ?? 'player');
        if (costumeData.sprite) {
            this.setDisplaySize(56, 80);
        } else {
            this.setScale(1);
        }
        this.baseScaleX = this.scaleX;
        this.baseScaleY = this.scaleY;
        this.scene.registry.set('activeCostume', costumeKey);
    }

    update(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        let vx = 0;
        let vy = 0;

        // Keyboard input
        if (this.cursors || this.wasd) {
            const left = this.cursors?.left.isDown || this.wasd?.left.isDown;
            const right = this.cursors?.right.isDown || this.wasd?.right.isDown;
            const up = this.cursors?.up.isDown || this.wasd?.up.isDown;
            const down = this.cursors?.down.isDown || this.wasd?.down.isDown;

            if (left) vx = -this.speed;
            else if (right) vx = this.speed;
            if (up) vy = -this.speed;
            else if (down) vy = this.speed;

            // Normalize diagonal keyboard movement
            if (vx !== 0 && vy !== 0) {
                vx *= 0.707;
                vy *= 0.707;
            }
        }

        // Touch/mouse input overrides keyboard when active
        if (this.touchTarget) {
            const dx = this.touchTarget.x - this.x;
            const dy = this.touchTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 8) {
                vx = (dx / dist) * this.speed;
                vy = (dy / dist) * this.speed;
            } else {
                this.touchTarget = null;
                vx = 0;
                vy = 0;
            }
        }

        body.setVelocity(vx, vy);

        // Flip sprite based on direction
        if (vx < 0) this.setFlipX(true);
        else if (vx > 0) this.setFlipX(false);

        // Squish & stretch animation
        const isMoving = vx !== 0 || vy !== 0;
        if (isMoving) {
            const t = this.scene.time.now / 1000;
            const squish = Math.sin(t * 12) * 0.05; // rytm kroków
            this.setScale(
                this.baseScaleX * (1 - squish * 0.5),
                this.baseScaleY * (1 + squish)
            );
        } else {
            // Płynny powrót do normalnego rozmiaru
            this.setScale(
                Phaser.Math.Linear(this.scaleX, this.baseScaleX, 0.15),
                Phaser.Math.Linear(this.scaleY, this.baseScaleY, 0.15)
            );
        }
    }
}
