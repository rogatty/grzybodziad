import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Resource } from '../objects/Resource';
import { Trash } from '../objects/Trash';
import {
    RESOURCE_SPAWN_INTERVAL,
    MAX_RESOURCES_ON_SCREEN,
    ROUND_DURATION,
    BASKET_BASE_CAPACITY,
    BASKET_SPOIL_TIME,
    RESOURCE_TYPES,
    ResourceType,
    RESOURCE_NAMES_PL,
    CAMERA_INITIAL_ZOOM,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    TRASH_SPAWN_INTERVAL,
    MAX_TRASH_ON_SCREEN
} from '../data/constants';
import { UPGRADES } from '../data/upgrades';
import { COSTUMES, DEFAULT_COSTUME_ID } from '../data/costumes';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private resources: Resource[] = [];
    private stoneList: Array<{ x: number, y: number, radius: number }> = [];

    private score = 0;
    private coins = 0;
    private timeLeft = ROUND_DURATION;
    private basket: Array<{ points: number; spoilAt: number; resourceType: ResourceType | 'trash' }> = [];
    private basketCapacity = BASKET_BASE_CAPACITY;
    private trashBag = 0;
    private trashBagCapacity = 0;

    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private basketText!: Phaser.GameObjects.Text;
    private coinsText!: Phaser.GameObjects.Text;
    private trashBagText!: Phaser.GameObjects.Text;
    private freshnessGraphics!: Phaser.GameObjects.Graphics;

    private lastBasketFullWarning = 0;

    private hut!: Phaser.GameObjects.Image;
    private hutEntered = false;
    private hutOnCooldown = false;

    private costumeHut!: Phaser.GameObjects.Image;
    private costumeHutEntered = false;
    private costumeHutOnCooldown = false;

    private skupHut!: Phaser.GameObjects.Image;
    private skupHutEntered = false;
    private skupHutOnCooldown = false;

    private trashBins: Phaser.GameObjects.Image[] = [];
    private binQuadrants: number[] = [];
    private binEntered = false;
    private trashes: Trash[] = [];
    private trashSpawnTimer!: Phaser.Time.TimerEvent;

    private spawnTimer!: Phaser.Time.TimerEvent;
    private roundTimer!: Phaser.Time.TimerEvent;

    private zoomStage = 0;
    private uiCamera!: Phaser.Cameras.Scene2D.Camera;
    private bgImage!: Phaser.GameObjects.TileSprite;
    private stoneImages: Phaser.GameObjects.Image[] = [];
    private fogOverlay!: Phaser.GameObjects.Image;

    constructor() {
        super('GameScene');
    }

    init(): void {
        // Reset state for new round
        this.score = 0;
        this.timeLeft = this.registry.get('roundDuration') ?? ROUND_DURATION;
        this.resources = [];
        this.stoneImages = [];
        this.basket = [];
        this.hutEntered = false;
        this.hutOnCooldown = false;
        this.coins = 0;
        this.zoomStage = 0;
        this.trashBag = 0;
        this.trashes = [];
        this.trashBins = [];
        this.binEntered = false;
        this.costumeHutEntered = false;
        this.costumeHutOnCooldown = false;
        this.skupHutEntered = false;
        this.skupHutOnCooldown = false;
        // Shuffle quadrants so each game puts bins in different corners
        this.binQuadrants = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]);

        // Reset upgrades each round
        this.registry.set('upgradeLevels', {});
        this.registry.set('sellSpeedLevel', 0);

        // Read upgrades from registry (set by Shop scene)
        const upgradeLevels: Record<string, number> = this.registry.get('upgradeLevels') ?? {};

        const speedLevel = upgradeLevels['speed'] ?? 0;
        const radiusLevel = upgradeLevels['radius'] ?? 0;
        const spawnsLevel = upgradeLevels['spawns'] ?? 0;
        const basketLevel = upgradeLevels['basket'] ?? 0;
        const trashbagLevel = upgradeLevels['trashbag'] ?? 0;

        this.registry.set('speedBonus', UPGRADES[0].effect(speedLevel));
        this.registry.set('radiusBonus', UPGRADES[1].effect(radiusLevel));
        this.registry.set('maxResourcesBonus', UPGRADES[2].effect(spawnsLevel));
        this.basketCapacity = BASKET_BASE_CAPACITY + UPGRADES[3].effect(basketLevel);
        this.trashBagCapacity = UPGRADES[4].effect(trashbagLevel);
    }

    create(): void {
        const { width, height } = this.scale;

        // Background — tiled across the full world
        this.bgImage = this.add.tileSprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 'background');

        // Stones — no physics bodies, manual circle collision in update()
        this.stoneList = [];
        const stoneCount = 28; // ~4x more stones for 4x larger world
        const forbiddenZones = [
            { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, r: 100 },
            { x: WORLD_WIDTH / 2 + 180, y: WORLD_HEIGHT / 2 - 120, r: 90 },
        ];
        let placed = 0;
        let attempts = 0;
        while (placed < stoneCount && attempts < 800) {
            attempts++;
            const margin = 70;
            const sx = Phaser.Math.Between(margin, WORLD_WIDTH - margin);
            const sy = Phaser.Math.Between(margin + 40, WORLD_HEIGHT - margin - 40);
            const tooClose = forbiddenZones.some(z =>
                Phaser.Math.Distance.Between(sx, sy, z.x, z.y) < z.r
            );
            if (tooClose) continue;
            const scale = Phaser.Math.FloatBetween(0.5, 1.6);
            const stoneImg = this.add.image(sx, sy, 'stone').setScale(scale).setDepth(3);
            this.stoneImages.push(stoneImg);
            this.stoneList.push({ x: sx, y: sy, radius: 20 * scale });
            placed++;
        }

        // Extend physics world to match the current zone
        const zone0 = this.getZoneBounds(0);
        this.physics.world.setBounds(zone0.x, zone0.y, zone0.w, zone0.h);

        // Player
        this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        this.player.speed += this.registry.get('speedBonus') ?? 0;
        this.player.collectionRadius += this.registry.get('radiusBonus') ?? 0;

        this.resources = [];

        // UI
        this.scoreText = this.add.text(16, 16, 'Punkty: 0', {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(20);

        this.timerText = this.add.text(width - 16, 16, `Czas: ${ROUND_DURATION}`, {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0).setDepth(20);

        this.basketText = this.add.text(16, 50, `Koszyk: 0/${this.basketCapacity}`, {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffcc44',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(20);

        this.coinsText = this.add.text(16, 80, 'Monety: 0', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffdd44',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(20);

        this.trashBagText = this.add.text(16, 122, '', {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#88cc88',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(20).setVisible(false);

        this.freshnessGraphics = this.add.graphics().setDepth(20);


        // Hut (shop entrance) — near player start, same relative offset as before
        this.hut = this.add.image(WORLD_WIDTH / 2 + 180, WORLD_HEIGHT / 2 - 120, 'hut').setDepth(5);

        // Costume shop — on the other side of the player start
        this.costumeHut = this.add.image(WORLD_WIDTH / 2 - 180, WORLD_HEIGHT / 2 - 120, 'costume_hut').setDepth(5);

        // Skup (resource market) — below player start
        this.skupHut = this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 160, 'skup_hut').setDepth(5);


        // Listen for shop/costume-shop/skup closing
        type BasketItem = { points: number; spoilAt: number; resourceType: ResourceType | 'trash' };
        this.events.on('resume', (sys: Phaser.Scenes.Systems, data: {
            coins?: number; costume?: string;
            basket?: BasketItem[]; score?: number; fromSkup?: boolean;
        }) => {
            if (data?.coins !== undefined) {
                this.coins = data.coins;
                this.coinsText.setText(`Monety: ${this.coins}`);
            }

            if (data?.fromSkup) {
                // Returned from skup — update basket and score
                if (data.basket !== undefined) {
                    this.basket = data.basket;
                    this.updateBasketUI();
                }
                if (data.score !== undefined) {
                    this.score = data.score;
                    this.scoreText.setText(`Punkty: ${this.score}`);
                }
                this.skupHutEntered = true;
                this.skupHutOnCooldown = true;
                this.skupHut.setTint(0x888888);
                this.time.delayedCall(3000, () => {
                    this.skupHutOnCooldown = false;
                    this.skupHut.clearTint();
                });
            } else if (data?.costume !== undefined) {
                // Returned from costume shop
                this.player.setCostume(data.costume);
                this.costumeHutEntered = true;
                this.costumeHutOnCooldown = true;
                this.costumeHut.setTint(0x888888);
                this.time.delayedCall(3000, () => {
                    this.costumeHutOnCooldown = false;
                    this.costumeHut.clearTint();
                });
            } else {
                // Returned from main shop — re-apply upgrades
                const upgradeLevels: Record<string, number> = this.registry.get('upgradeLevels') ?? {};
                const speedLevel = upgradeLevels['speed'] ?? 0;
                const radiusLevel = upgradeLevels['radius'] ?? 0;
                const basketLevel = upgradeLevels['basket'] ?? 0;
                const trashbagLevel = upgradeLevels['trashbag'] ?? 0;
                this.player.speed = 200 + UPGRADES[0].effect(speedLevel);
                this.player.collectionRadius = 40 + UPGRADES[1].effect(radiusLevel);
                this.basketCapacity = BASKET_BASE_CAPACITY + UPGRADES[3].effect(basketLevel);
                this.trashBagCapacity = UPGRADES[4].effect(trashbagLevel);
                this.updateBasketUI();
                this.updateTrashBagUI();

                this.hutEntered = true;
                this.hutOnCooldown = true;
                this.hut.setTint(0x888888);
                this.time.delayedCall(3000, () => {
                    this.hutOnCooldown = false;
                    this.hut.clearTint();
                });
            }

            this.spawnTimer.paused = false;
            this.roundTimer.paused = false;
            this.trashSpawnTimer.paused = false;
        });

        // Camera setup: main camera follows player, UI camera fixed
        this.cameras.main.setZoom(CAMERA_INITIAL_ZOOM);
        this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        this.cameras.main.setBounds(zone0.x, zone0.y, zone0.w, zone0.h);
        this.cameras.main.setBackgroundColor('#4a8a2a');
        this.uiCamera = this.cameras.add(0, 0, width, height);

        // Fog overlay — on UI camera (fixed, no zoom), depth below UI text
        this.createFogOverlay();
        this.fogOverlay = this.add.image(width / 2, height / 2, 'fog_overlay').setDepth(15);

        // Main camera ignores all UI elements (text + fog)
        this.cameras.main.ignore([this.scoreText, this.timerText, this.basketText, this.coinsText, this.trashBagText, this.freshnessGraphics, this.fogOverlay]);

        // UI camera ignores all game world objects (fog stays visible in UI camera)
        this.uiCamera.ignore([this.bgImage, ...this.stoneImages, this.player, this.player.bodyFill, this.hut, this.costumeHut, this.skupHut]);

        // Add first bin after cameras are set up (so uiCamera.ignore works)
        this.addTrashBin(0);

        // Spawn resources periodically
        this.spawnTimer = this.time.addEvent({
            delay: RESOURCE_SPAWN_INTERVAL,
            callback: this.spawnResource,
            callbackScope: this,
            loop: true
        });

        // Round countdown
        this.roundTimer = this.time.addEvent({
            delay: 1000,
            callback: this.tickTimer,
            callbackScope: this,
            loop: true
        });

        // Trash spawn
        this.trashSpawnTimer = this.time.addEvent({
            delay: TRASH_SPAWN_INTERVAL,
            callback: this.spawnTrash,
            callbackScope: this,
            loop: true
        });

        // Initial spawn burst near player
        for (let i = 0; i < 10; i++) {
            this.spawnResource(this.player.x, this.player.y);
        }
    }

    private createFogOverlay(): void {
        const w = this.scale.width;
        const h = this.scale.height;
        const key = 'fog_overlay';

        if (this.textures.exists(key)) this.textures.remove(key);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;

        // Dark green fog covering whole screen
        ctx.fillStyle = '#0f2206';
        ctx.fillRect(0, 0, w, h);

        // Punch a soft elliptical window using destination-out
        ctx.globalCompositeOperation = 'destination-out';
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(w / h, 1); // stretch x axis to match screen aspect ratio → circle becomes ellipse

        const r = h * 0.52; // radius in scaled space — larger = less dark corners
        const grad = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r); // 0.8 = shorter transition (~half)
        grad.addColorStop(0, 'rgba(0,0,0,1)'); // fully clear in center
        grad.addColorStop(1, 'rgba(0,0,0,0)'); // opaque fog at edge

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        this.textures.addCanvas(key, canvas);
    }

    private getZoneBounds(stage: number): { x: number; y: number; w: number; h: number } {
        const cx = WORLD_WIDTH / 2;
        const cy = WORLD_HEIGHT / 2;
        const w = Math.round(800 * Math.pow(1.5, stage));
        const h = Math.round(600 * Math.pow(1.5, stage));
        return { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h };
    }

    private spawnResource(nearX?: number, nearY?: number): void {
        const maxResources = MAX_RESOURCES_ON_SCREEN + (this.registry.get('maxResourcesBonus') ?? 0);
        if (this.resources.length >= maxResources) return;

        const margin = 60;
        const zone = this.getZoneBounds(this.zoomStage);
        let x = 0, y = 0;
        let attempts = 0;
        do {
            if (nearX !== undefined && nearY !== undefined) {
                x = Phaser.Math.Clamp(nearX + Phaser.Math.Between(-380, 380), zone.x + margin, zone.x + zone.w - margin);
                y = Phaser.Math.Clamp(nearY + Phaser.Math.Between(-280, 280), zone.y + margin + 40, zone.y + zone.h - margin - 40);
            } else {
                x = Phaser.Math.Between(zone.x + margin, zone.x + zone.w - margin);
                y = Phaser.Math.Between(zone.y + margin + 40, zone.y + zone.h - margin - 40);
            }
            attempts++;
        } while (
            attempts < 20 &&
            this.stoneList.some(s => Phaser.Math.Distance.Between(x, y, s.x, s.y) < s.radius + 30)
        );
        if (attempts >= 20) return;

        // Weighted random: mushrooms most common, flowers rarest
        const roll = Math.random();
        let type: ResourceType;
        if (roll < 0.55) type = 'mushroom';
        else if (roll < 0.85) type = 'berry';
        else type = 'flower';

        const resource = new Resource(this, x, y, type);
        this.resources.push(resource);
        this.uiCamera.ignore(resource);
    }

    private addTrashBin(stage: number): void {
        const zone = this.getZoneBounds(stage);
        const cx = zone.x + zone.w / 2;
        const cy = zone.y + zone.h / 2;

        // Stay within 55% of zone half-size from center — safely inside fog boundary (fog starts at 80%)
        // At corner (both axes at 55%): normalized distance = sqrt(0.55²+0.55²) ≈ 0.78 < 0.80 ✓
        const safeX = zone.w * 0.275; // 55% of half-width
        const safeY = zone.h * 0.275; // 55% of half-height
        const innerX = zone.w * 0.10; // keep some distance from center
        const innerY = zone.h * 0.10;

        // Each quadrant is a corner of the safe area: 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
        const quadrant = this.binQuadrants[stage];
        const xRange = quadrant % 2 === 0
            ? { min: cx - safeX, max: cx - innerX }
            : { min: cx + innerX, max: cx + safeX };
        const yRange = quadrant < 2
            ? { min: cy - safeY, max: cy - innerY }
            : { min: cy + innerY, max: cy + safeY };

        let x = 0, y = 0;
        let attempts = 0;
        do {
            x = Phaser.Math.Between(xRange.min, xRange.max);
            y = Phaser.Math.Between(yRange.min, yRange.max);
            attempts++;

            if (Phaser.Math.Distance.Between(x, y, this.hut.x, this.hut.y) < 160) continue;
            if (Phaser.Math.Distance.Between(x, y, WORLD_WIDTH / 2, WORLD_HEIGHT / 2) < 160) continue;
            if (this.trashBins.some(b => Phaser.Math.Distance.Between(x, y, b.x, b.y) < 350)) continue;

            break;
        } while (attempts < 100);

        const bin = this.add.image(x, y, 'trashbin').setDepth(5);
        this.trashBins.push(bin);
        this.uiCamera.ignore(bin);
    }

    private spawnTrash(): void {
        if (this.trashes.length >= MAX_TRASH_ON_SCREEN) return;

        const margin = 60;
        const zone = this.getZoneBounds(this.zoomStage);
        let x = 0, y = 0;
        let attempts = 0;
        do {
            x = Phaser.Math.Between(zone.x + margin, zone.x + zone.w - margin);
            y = Phaser.Math.Between(zone.y + margin + 40, zone.y + zone.h - margin - 40);
            attempts++;
        } while (
            attempts < 20 &&
            this.stoneList.some(s => Phaser.Math.Distance.Between(x, y, s.x, s.y) < s.radius + 30)
        );
        if (attempts >= 20) return;

        const trash = new Trash(this, x, y);
        this.trashes.push(trash);
        this.uiCamera.ignore(trash);
    }

    private updateTrashBagUI(): void {
        if (this.trashBagCapacity <= 0) {
            this.trashBagText.setVisible(false);
            return;
        }
        this.trashBagText.setText(`🗑 Worek: ${this.trashBag}/${this.trashBagCapacity}`);
        this.trashBagText.setVisible(true);
    }

    private tickTimer(): void {
        this.timeLeft -= 1;
        this.timerText.setText(`Czas: ${this.timeLeft}`);

        if (this.timeLeft <= 10) {
            this.timerText.setColor('#ff4444');
        }

        // Zoom out at 1/6, 1/3, 2/3 of round elapsed (= 5/6, 2/3, 1/3 remaining)
        const duration = this.registry.get('roundDuration') ?? ROUND_DURATION;
        const zoomThresholds = [
            Math.round(duration * 5 / 6),
            Math.round(duration * 2 / 3),
            Math.round(duration * 1 / 3),
        ];
        if (this.zoomStage < 3 && this.timeLeft <= zoomThresholds[this.zoomStage]) {
            this.zoomStage++;
            const newZoom = CAMERA_INITIAL_ZOOM / Math.pow(1.5, this.zoomStage);
            this.tweens.add({
                targets: this.cameras.main,
                zoom: newZoom,
                duration: 1500,
                ease: 'Sine.easeInOut'
            });
            const zone = this.getZoneBounds(this.zoomStage);
            this.physics.world.setBounds(zone.x, zone.y, zone.w, zone.h);
            this.cameras.main.setBounds(zone.x, zone.y, zone.w, zone.h);
            this.addTrashBin(this.zoomStage);
        }

        if (this.timeLeft <= 0) {
            this.endRound();
        }
    }

    private showCollectText(text: string): void {
        const offsetX = Phaser.Math.Between(-30, 30);
        const label = this.add.text(this.player.x + offsetX, this.player.y - 60, text, {
            fontSize: '26px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(20);
        this.uiCamera.ignore(label);
        this.tweens.add({
            targets: label,
            y: label.y - 50,
            alpha: 0,
            duration: 900,
            ease: 'Quad.out',
            onComplete: () => label.destroy()
        });
    }

    private endRound(): void {
        this.spawnTimer.remove();
        this.roundTimer.remove();
        this.trashSpawnTimer.remove();
        // Add whatever is still fresh in basket to score
        const remaining = this.basket.filter(item => item.spoilAt > this.time.now);
        this.score += remaining.reduce((sum, item) => sum + item.points, 0);
        this.scene.start('GameOver', { score: this.score });
    }

    private updateBasketUI(): void {
        const count = this.basket.length;
        const full = count >= this.basketCapacity;
        this.basketText.setText(`Koszyk: ${count}/${this.basketCapacity}`);
        this.basketText.setColor(full ? '#ff4444' : '#ffcc44');
    }

    private drawFreshnessBars(now: number): void {
        this.freshnessGraphics.clear();
        const barW = 24;
        const barH = 10;
        const gap = 3;
        const startX = 16;
        const startY = 106;

        for (let i = 0; i < this.basketCapacity; i++) {
            const x = startX + i * (barW + gap);
            // Background slot
            this.freshnessGraphics.fillStyle(0x333333, 0.7);
            this.freshnessGraphics.fillRect(x, startY, barW, barH);

            if (i < this.basket.length) {
                if (this.basket[i].resourceType === 'trash') {
                    // Trash: solid brown, full width
                    this.freshnessGraphics.fillStyle(0x886633, 1);
                    this.freshnessGraphics.fillRect(x, startY, barW, barH);
                } else {
                    const remaining = (this.basket[i].spoilAt - now) / BASKET_SPOIL_TIME;
                    const fill = Math.max(0, Math.min(1, remaining));
                    const color = fill > 0.5 ? 0x44dd44 : fill > 0.25 ? 0xffdd00 : 0xff4444;
                    this.freshnessGraphics.fillStyle(color, 1);
                    this.freshnessGraphics.fillRect(x, startY, Math.round(barW * fill), barH);
                }
            }
        }
    }

    private getFogSafeness(): number {
        // Returns 1.0 inside safe zone, 0.0 at zone edge — elliptical, matches fog overlay
        const zone = this.getZoneBounds(this.zoomStage);
        const cx = zone.x + zone.w / 2;
        const cy = zone.y + zone.h / 2;
        const nx = (this.player.x - cx) / (zone.w / 2);
        const ny = (this.player.y - cy) / (zone.h / 2);
        const d = Math.sqrt(nx * nx + ny * ny);
        const fogStart = 0.8; // fog begins at 80% of zone radius (matching overlay)
        if (d <= fogStart) return 1;
        return Math.max(0, 1 - (d - fogStart) / (1 - fogStart));
    }

    update(): void {
        this.player.update();

        // Slow down only the outward velocity component in fog (tangential movement stays fast)
        const safeness = this.getFogSafeness();
        if (safeness < 1) {
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            const zone = this.getZoneBounds(this.zoomStage);
            const toCenterX = (zone.x + zone.w / 2) - this.player.x;
            const toCenterY = (zone.y + zone.h / 2) - this.player.y;
            const dist = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
            if (dist > 0) {
                // Unit vector pointing away from center
                const outX = -toCenterX / dist;
                const outY = -toCenterY / dist;
                // How much of the velocity goes outward (positive = deeper into fog)
                const outwardSpeed = body.velocity.x * outX + body.velocity.y * outY;
                if (outwardSpeed > 0) {
                    const slowFactor = safeness * safeness;
                    const reduction = outwardSpeed * (1 - slowFactor);
                    body.velocity.x -= reduction * outX;
                    body.velocity.y -= reduction * outY;
                }
            }
        }

        // Check if player enters the hut
        const hutDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.hut.x, this.hut.y);
        if (hutDist < 55) {
            if (!this.hutEntered && !this.hutOnCooldown) {
                this.hutEntered = true;
                this.spawnTimer.paused = true;
                this.roundTimer.paused = true;
                this.trashSpawnTimer.paused = true;
                this.scene.pause('GameScene');
                this.scene.launch('Shop', { coins: this.coins });
                this.scene.bringToTop('Shop');
            }
        } else {
            this.hutEntered = false;
        }

        // Check if player enters the costume shop
        const costumeDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.costumeHut.x, this.costumeHut.y);
        if (costumeDist < 55) {
            if (!this.costumeHutEntered && !this.costumeHutOnCooldown) {
                this.costumeHutEntered = true;
                this.spawnTimer.paused = true;
                this.roundTimer.paused = true;
                this.trashSpawnTimer.paused = true;
                this.scene.pause('GameScene');
                this.scene.launch('CostumeShop', { coins: this.coins });
                this.scene.bringToTop('CostumeShop');
            }
        } else {
            this.costumeHutEntered = false;
        }

        // Check if player enters the skup (resource market)
        const skupDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.skupHut.x, this.skupHut.y);
        if (skupDist < 55) {
            if (!this.skupHutEntered && !this.skupHutOnCooldown) {
                this.skupHutEntered = true;
                this.spawnTimer.paused = true;
                this.roundTimer.paused = true;
                this.trashSpawnTimer.paused = true;
                this.scene.pause('GameScene');
                this.scene.launch('Skup', { basket: this.basket, coins: this.coins, score: this.score });
                this.scene.bringToTop('Skup');
            }
        } else {
            this.skupHutEntered = false;
        }

        // Check if player reaches any trash bin
        const nearBin = this.trashBins.some(bin =>
            Phaser.Math.Distance.Between(this.player.x, this.player.y, bin.x, bin.y) < 55
        );
        if (nearBin) {
            if (!this.binEntered) {
                this.binEntered = true;
                const trashInBasket = this.basket.filter(item => item.resourceType === 'trash').length;
                const totalTrash = this.trashBag + trashInBasket;
                if (totalTrash > 0) {
                    const upgradeLevels: Record<string, number> = this.registry.get('upgradeLevels') ?? {};
                    const recyclingLevel = upgradeLevels['recycling'] ?? 0;
                    const coinsPerTrash = UPGRADES[5].effect(recyclingLevel);
                    const earned = totalTrash * coinsPerTrash;
                    this.trashBag = 0;
                    this.basket = this.basket.filter(item => item.resourceType !== 'trash');
                    this.updateBasketUI();
                    this.updateTrashBagUI();
                    if (earned > 0) {
                        this.coins += earned;
                        this.coinsText.setText(`Monety: ${this.coins}`);
                        this.showCollectText(`♻️ +${earned} monet!`);
                    } else {
                        this.showCollectText('♻️ Śmieci wyrzucone!');
                    }
                }
            }
        } else {
            this.binEntered = false;
        }

        // Spoil check — remove expired basket items
        const now = this.time.now;
        const beforeSpoil = this.basket.length;
        this.basket = this.basket.filter(item => item.spoilAt > now);
        if (this.basket.length < beforeSpoil) {
            this.updateBasketUI();
            this.showCollectText('🍂 Zepsuło się!');
        }

        // Check collection by distance
        const r = this.player.collectionRadius;
        const collected: Resource[] = [];
        const basketFull = this.basket.length >= this.basketCapacity;
        let nearResourceWhileFull = false;
        this.resources.forEach((resource) => {
            if (!resource.active) return;
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                resource.x, resource.y
            );
            if (dist <= r && basketFull) {
                nearResourceWhileFull = true;
                return;
            }
            if (dist <= r && !basketFull) {
                this.basket.push({ points: resource.points, spoilAt: now + BASKET_SPOIL_TIME, resourceType: resource.resourceType });
                this.updateBasketUI();
                this.showCollectText(`+${resource.points} ${RESOURCE_NAMES_PL[resource.resourceType]}`);
                resource.collect();
                collected.push(resource);
            }
        });
        if (collected.length > 0) {
            this.resources = this.resources.filter(r => !collected.includes(r));
        }

        // Collect trash by proximity
        const collectedTrash: Trash[] = [];
        this.trashes.forEach((trash) => {
            if (!trash.active) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, trash.x, trash.y);
            if (dist <= r) {
                if (this.trashBagCapacity > 0 && this.trashBag < this.trashBagCapacity) {
                    this.trashBag++;
                    this.updateTrashBagUI();
                    this.showCollectText('🗑 Śmieć w worku!');
                } else if (this.basket.length < this.basketCapacity) {
                    this.basket.push({ points: 0, spoilAt: Infinity, resourceType: 'trash' });
                    this.updateBasketUI();
                    this.showCollectText('🗑 Śmieć w koszyku!');
                } else {
                    return; // basket and bag full — skip
                }
                trash.collect();
                collectedTrash.push(trash);
            }
        });
        if (collectedTrash.length > 0) {
            this.trashes = this.trashes.filter(t => !collectedTrash.includes(t));
        }

        // Draw freshness bars
        this.drawFreshnessBars(now);

        // Manual circle collision with stones
        const playerR = 12;
        for (const stone of this.stoneList) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, stone.x, stone.y);
            const minDist = playerR + stone.radius;
            if (dist < minDist && dist > 0) {
                const angle = Phaser.Math.Angle.Between(stone.x, stone.y, this.player.x, this.player.y);
                this.player.x = stone.x + Math.cos(angle) * minDist;
                this.player.y = stone.y + Math.sin(angle) * minDist;
            }
        }

        if (nearResourceWhileFull && this.time.now - this.lastBasketFullWarning > 2000) {
            this.lastBasketFullWarning = this.time.now;
            this.showCollectText('🧺 Koszyk pełny!\nIdź do chatki!');
        }
    }
}
