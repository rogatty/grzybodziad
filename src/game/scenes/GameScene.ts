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
    MAX_TRASH_ON_SCREEN,
    PLAYER_BASE_SPEED,
    COLLECTION_RADIUS,
    HUT_ENTRY_RADIUS,
    HUT_EXIT_RADIUS,
    HUT_AVOIDANCE_DISTANCE,
    RESOURCE_MIN_SPACING,
    TRASH_MIN_SPACING,
    BUILDING_SPAWN_CLEARANCE,
    BIN_SPACING,
    FOG_TRANSITION_START,
    FOG_SAFE_MARGIN
} from '../data/constants';
import { BasketItem } from '../data/types';
import { UPGRADES, upgradeCost } from '../data/upgrades';
import { COSTUMES, DEFAULT_COSTUME_ID } from '../data/costumes';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private resources: Resource[] = [];

    private score = 0;
    private coins = 0;
    private timeLeft = ROUND_DURATION;
    private basket: BasketItem[] = [];
    private basketCapacity = BASKET_BASE_CAPACITY;
    private trashBag: string[] = [];
    private trashBagCapacity = 0;

    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private basketText!: Phaser.GameObjects.Text;
    private coinsText!: Phaser.GameObjects.Text;
    private trashBagText!: Phaser.GameObjects.Text;
    private freshnessGraphics!: Phaser.GameObjects.Graphics;
    private basketSlotImages: Phaser.GameObjects.Image[] = [];
    private trashSlotImages: Phaser.GameObjects.Image[] = [];

    private lastBasketFullWarning = 0;
    private lastTrashBagFullWarning = 0;

    private hut!: Phaser.GameObjects.Image;
    private hutState = { entered: false, onCooldown: false };

    private costumeHut!: Phaser.GameObjects.Image;
    private costumeHutState = { entered: false, onCooldown: false };

    private depotHut!: Phaser.GameObjects.Image;
    private depotHutState = { entered: false, onCooldown: false };

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
    private fogOverlay!: Phaser.GameObjects.Image;

    constructor() {
        super('GameScene');
    }

    init(): void {
        // Reset state for new round
        this.score = 0;
        this.timeLeft = this.registry.get('roundDuration') ?? ROUND_DURATION;
        this.resources = [];
        this.basket = [];
        this.hutState = { entered: false, onCooldown: false };
        this.costumeHutState = { entered: false, onCooldown: false };
        this.depotHutState = { entered: false, onCooldown: false };
        this.coins = 0;
        this.zoomStage = 0;
        this.trashBag = [];
        this.trashes = [];
        this.trashBins = [];
        this.binEntered = false;
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


        // Extend physics world to match the current zone
        const zone0 = this.getZoneBounds(0);
        this.physics.world.setBounds(zone0.x, zone0.y, zone0.w, zone0.h);

        // Player
        this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        this.player.speed += this.registry.get('speedBonus') ?? 0;
        this.player.collectionRadius += this.registry.get('radiusBonus') ?? 0;

        this.resources = [];

        // UI
        this.scoreText = this.add.text(16, 16, '🏆 0', {
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

        this.basketText = this.add.text(12, 575, '🧺', {
            fontSize: '26px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffcc44',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0.5).setDepth(22);

        this.coinsText = this.add.text(16, 50, '💵 0', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffdd44',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(20);

        this.trashBagText = this.add.text(12, 530, '🗑', {
            fontSize: '26px',
            fontFamily: 'Arial, sans-serif',
            color: '#88cc88',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0.5).setDepth(22).setVisible(false);

        this.freshnessGraphics = this.add.graphics().setDepth(20);

        // Pre-allocate basket slot images (max capacity = 5 + 4*3 = 17)
        this.basketSlotImages = [];
        for (let i = 0; i < 17; i++) {
            const img = this.add.image(80 + i * 44, 575, 'mushroom1')
                .setDisplaySize(36, 36)
                .setDepth(21)
                .setVisible(false);
            this.basketSlotImages.push(img);
        }

        // Pre-allocate trash bag slot images (max capacity = 4*3 = 12)
        this.trashSlotImages = [];
        for (let i = 0; i < 12; i++) {
            const img = this.add.image(80 + i * 44, 530, 'trash_banana')
                .setDisplaySize(36, 36)
                .setDepth(21)
                .setVisible(false);
            this.trashSlotImages.push(img);
        }

        // Hut (shop entrance) — near player start, same relative offset as before
        this.hut = this.add.image(WORLD_WIDTH / 2 + 180, WORLD_HEIGHT / 2 - 120, 'hut').setDepth(5);
        this.hut.postFX.addShadow(1, 2, 0.99, 1, 0x000000, 4, 0.012);

        // Costume shop — on the other side of the player start
        this.costumeHut = this.add.image(WORLD_WIDTH / 2 - 180, WORLD_HEIGHT / 2 - 120, 'costume_hut').setDepth(5);
        this.costumeHut.postFX.addShadow(1, 2, 0.99, 1, 0x000000, 4, 0.012);

        // Depot (resource market) — below player start
        this.depotHut = this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 160, 'skup_hut').setDepth(5);
        this.depotHut.postFX.addShadow(1, 2, 0.99, 1, 0x000000, 4, 0.012);


        // Listen for modal scenes closing
        this.events.on('resume', (sys: Phaser.Scenes.Systems, data: {
            coins?: number; costume?: string;
            basket?: BasketItem[]; score?: number; fromDepot?: boolean;
            trashBag?: string[]; fromTrashBin?: boolean;
        }) => {
            if (data?.coins !== undefined) {
                this.coins = data.coins;
                this.coinsText.setText(`💵 ${this.coins}`);
            }

            if (data?.fromTrashBin) {
                // Returned from trash bin screen
                this.trashBag = data.trashBag ?? [];
                if (data.basket !== undefined) {
                    this.basket = data.basket;
                    this.updateBasketUI();
                }
                this.updateTrashBagUI();
                // Tint bin briefly so player has to leave before re-entering
                const nearBin = this.trashBins.find(bin =>
                    Phaser.Math.Distance.Between(this.player.x, this.player.y, bin.x, bin.y) < 55
                );
            } else if (data?.fromDepot) {
                // Returned from depot — update basket and score
                if (data.basket !== undefined) {
                    this.basket = data.basket;
                    this.updateBasketUI();
                }
                if (data.score !== undefined) {
                    this.score = data.score;
                    this.scoreText.setText(`🏆 ${this.score}`);
                }
                this.depotHutState.entered = true;
                this.depotHutState.onCooldown = true;
            } else if (data?.costume !== undefined) {
                // Returned from costume shop
                this.player.setCostume(data.costume);
                this.costumeHutState.entered = true;
                this.costumeHutState.onCooldown = true;
            } else {
                // Returned from main shop — re-apply upgrades
                const upgradeLevels: Record<string, number> = this.registry.get('upgradeLevels') ?? {};
                const speedLevel = upgradeLevels['speed'] ?? 0;
                const radiusLevel = upgradeLevels['radius'] ?? 0;
                const basketLevel = upgradeLevels['basket'] ?? 0;
                const trashbagLevel = upgradeLevels['trashbag'] ?? 0;
                this.player.speed = PLAYER_BASE_SPEED + UPGRADES[0].effect(speedLevel);
                this.player.collectionRadius = COLLECTION_RADIUS + UPGRADES[1].effect(radiusLevel);
                this.basketCapacity = BASKET_BASE_CAPACITY + UPGRADES[3].effect(basketLevel);
                this.trashBagCapacity = UPGRADES[4].effect(trashbagLevel);

                // Move trash from basket into trash bag (up to new capacity)
                const space = this.trashBagCapacity - this.trashBag.length;
                if (space > 0) {
                    const toMove = this.basket.filter(item => item.resourceType === 'trash').slice(0, space);
                    toMove.forEach(item => this.trashBag.push(item.textureKey ?? 'trash_banana'));
                    if (toMove.length > 0) {
                        this.basket = this.basket.filter(item => item.resourceType !== 'trash' || toMove.indexOf(item) === -1);
                    }
                }

                this.updateBasketUI();
                this.updateTrashBagUI();

                this.hutState.entered = true;
                this.hutState.onCooldown = true;
            }

            this.spawnTimer.paused = false;
            this.roundTimer.paused = false;
            this.trashSpawnTimer.paused = false;
        });

        // Camera setup: main camera follows player, UI camera fixed
        this.cameras.main.setZoom(CAMERA_INITIAL_ZOOM);
        this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        this.cameras.main.setBounds(zone0.x, zone0.y, zone0.w, zone0.h);
        this.cameras.main.setBackgroundColor('#6abf5e');
        this.uiCamera = this.cameras.add(0, 0, width, height);

        // Fog overlay — on UI camera (fixed, no zoom), depth below UI text
        this.createFogOverlay();
        this.fogOverlay = this.add.image(width / 2, height / 2, 'fog_overlay').setDepth(15);

        // Main camera ignores all UI elements (text + fog)
        this.cameras.main.ignore([this.scoreText, this.timerText, this.basketText, this.coinsText, this.trashBagText, this.freshnessGraphics, this.fogOverlay, ...this.basketSlotImages, ...this.trashSlotImages]);

        // UI camera ignores all game world objects (fog stays visible in UI camera)
        this.uiCamera.ignore([this.bgImage, this.player, this.hut, this.costumeHut, this.depotHut]);

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
        const grad = ctx.createRadialGradient(0, 0, r * FOG_TRANSITION_START, 0, 0, r);
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
            (
                this.resources.some(r => Phaser.Math.Distance.Between(x, y, r.x, r.y) < RESOURCE_MIN_SPACING) ||
                this.trashes.some(t => Phaser.Math.Distance.Between(x, y, t.x, t.y) < TRASH_MIN_SPACING) ||
                [this.hut, this.costumeHut, this.depotHut, ...this.trashBins].some(b => Phaser.Math.Distance.Between(x, y, b.x, b.y) < BUILDING_SPAWN_CLEARANCE)
            )
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

        // Stay within safe margin from center — inside fog boundary (fog starts at FOG_TRANSITION_START)
        // IMPORTANT: trash bins must never spawn in the fog area — players can't reach them there
        const safeX = zone.w * FOG_SAFE_MARGIN;
        const safeY = zone.h * FOG_SAFE_MARGIN;
        const xMin = cx - safeX;
        const xMax = cx + safeX;
        const yMin = cy - safeY;
        const yMax = cy + safeY;

        let x = 0, y = 0;
        let attempts = 0;
        do {
            x = Phaser.Math.Between(xMin, xMax);
            y = Phaser.Math.Between(yMin, yMax);
            attempts++;

            if ([this.hut, this.costumeHut, this.depotHut].some(b => Phaser.Math.Distance.Between(x, y, b.x, b.y) < HUT_AVOIDANCE_DISTANCE)) continue;
            if (Phaser.Math.Distance.Between(x, y, cx, cy) < 120) continue;
            if (this.trashBins.some(b => Phaser.Math.Distance.Between(x, y, b.x, b.y) < BIN_SPACING)) continue;

            break;
        } while (attempts < 100);

        if ([this.hut, this.costumeHut, this.depotHut].some(b => Phaser.Math.Distance.Between(x, y, b.x, b.y) < HUT_AVOIDANCE_DISTANCE)) return;

        const bin = this.add.image(x, y, 'trashbin').setDepth(5);
        bin.postFX.addShadow(1, 2, 0.99, 1, 0x000000, 4, 0.012);
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
            (
                this.resources.some(r => Phaser.Math.Distance.Between(x, y, r.x, r.y) < TRASH_MIN_SPACING) ||
                this.trashes.some(t => Phaser.Math.Distance.Between(x, y, t.x, t.y) < RESOURCE_MIN_SPACING) ||
                [this.hut, this.costumeHut, this.depotHut, ...this.trashBins].some(b => Phaser.Math.Distance.Between(x, y, b.x, b.y) < BUILDING_SPAWN_CLEARANCE)
            )
        );
        if (attempts >= 20) return;

        const trash = new Trash(this, x, y);
        this.trashes.push(trash);
        this.uiCamera.ignore(trash);
    }

    private updateBuildingTints(): void {
        const upgradeLevels: Record<string, number> = this.registry.get('upgradeLevels') ?? {};
        const canEnterShop = !this.hutState.onCooldown && UPGRADES.some(u => {
            const level = upgradeLevels[u.id] ?? 0;
            return level < u.maxLevel && this.coins >= upgradeCost(u, level);
        });
        if (canEnterShop) this.hut.clearTint(); else this.hut.setTint(0x888888);

        const ownedCostumes: string[] = this.registry.get('ownedCostumes') ?? [DEFAULT_COSTUME_ID];
        const canEnterCostume = !this.costumeHutState.onCooldown && (
            ownedCostumes.length > 1 || COSTUMES.some(c => !ownedCostumes.includes(c.id) && this.coins >= c.cost)
        );
        if (canEnterCostume) this.costumeHut.clearTint(); else this.costumeHut.setTint(0x888888);

        const canEnterDepot = !this.depotHutState.onCooldown && this.basket.some(i => i.resourceType !== 'trash');
        if (canEnterDepot) this.depotHut.clearTint(); else this.depotHut.setTint(0x888888);

        const hasTrash = this.trashBag.length > 0 || this.basket.some(i => i.resourceType === 'trash');
        this.trashBins.forEach(bin => hasTrash ? bin.clearTint() : bin.setTint(0x888888));
    }

    private updateTrashBagUI(): void {
        const hasBag = this.trashBagCapacity > 0;
        this.trashBagText.setVisible(hasBag);
        for (let i = 0; i < this.trashSlotImages.length; i++) {
            const img = this.trashSlotImages[i];
            if (hasBag && i < this.trashBag.length) {
                img.setTexture(this.trashBag[i]).setVisible(true);
            } else {
                img.setVisible(false);
            }
        }
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

    private flyToUI(textureKey: string, worldX: number, worldY: number, targetX: number, targetY: number): void {
        const cam = this.cameras.main;
        const screenX = (worldX - cam.worldView.x) * cam.zoom;
        const screenY = (worldY - cam.worldView.y) * cam.zoom;
        if (screenX < -40 || screenX > this.scale.width + 40 || screenY < -40 || screenY > this.scale.height + 40) return;

        const img = this.add.image(screenX, screenY, textureKey)
            .setDisplaySize(30, 30)
            .setDepth(25);
        this.cameras.main.ignore(img);

        this.tweens.add({
            targets: img,
            x: targetX,
            y: targetY,
            displayWidth: 10,
            displayHeight: 10,
            alpha: 0.7,
            duration: 400,
            ease: 'Quad.in',
            onComplete: () => img.destroy()
        });
    }

    private flyToBasket(textureKey: string, worldX: number, worldY: number): void {
        const slot = Math.min(this.basket.length - 1, 16);
        this.flyToUI(textureKey, worldX, worldY, 80 + slot * 44, 575);
    }

    private flyToTrashBag(textureKey: string, worldX: number, worldY: number): void {
        const slot = Math.min(this.trashBag.length - 1, 11);
        this.flyToUI(textureKey, worldX, worldY, 80 + slot * 44, 530);
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

    private playDisintegration(x: number, y: number, textureKey: string): void {
        const tmp = this.add.image(x, y, textureKey).setDisplaySize(36, 36).setDepth(22);
        this.cameras.main.ignore(tmp);
        this.tweens.add({
            targets: tmp,
            scaleX: 0, scaleY: 0,
            angle: 180,
            alpha: 0,
            duration: 400,
            ease: 'Quad.in',
            onComplete: () => tmp.destroy()
        });
    }

    private updateBasketBounce(): void {
        const now = this.time.now;
        const BOUNCE_START = 6000;
        const BASE_Y = 575;
        for (let i = 0; i < this.basketSlotImages.length; i++) {
            const img = this.basketSlotImages[i];
            if (!img.visible || i >= this.basket.length) { img.y = BASE_Y; continue; }
            const item = this.basket[i];
            if (item.spoilAt === Infinity) { img.y = BASE_Y; continue; }
            const remaining = item.spoilAt - now;
            if (remaining > 0 && remaining < BOUNCE_START) {
                const progress = 1 - remaining / BOUNCE_START;
                const frequency = 3 + progress * 9;
                img.y = BASE_Y + Math.sin(now * frequency * 0.001 * Math.PI * 2) * 5;
            } else {
                img.y = BASE_Y;
            }
        }
    }

    private updateBasketUI(): void {
        for (let i = 0; i < this.basketSlotImages.length; i++) {
            const img = this.basketSlotImages[i];
            if (i < this.basket.length) {
                img.setTexture(this.basket[i].textureKey ?? 'mushroom1').setVisible(true);
            } else {
                img.setVisible(false);
            }
        }
        const full = this.basket.length >= this.basketCapacity;
        this.basketText.setColor(full ? '#ff4444' : '#ffcc44');
    }

    private drawFreshnessBars(now: number): void {
        this.freshnessGraphics.clear();

        const slotSize = 36;
        const slotStep = 44;
        const slotsStartX = 80;
        const basketY = 575;
        const trashY = 530;
        const hasBag = this.trashBagCapacity > 0;
        const panelTop = hasBag ? 506 : 551;

        // Panel background
        this.freshnessGraphics.fillStyle(0x000000, 0.45);
        this.freshnessGraphics.fillRect(0, panelTop, this.scale.width, 600 - panelTop);

        // Basket slots
        for (let i = 0; i < this.basketCapacity; i++) {
            const x = slotsStartX + i * slotStep - slotSize / 2;
            const y = basketY - slotSize / 2;
            this.freshnessGraphics.fillStyle(0x444444, 0.7);
            this.freshnessGraphics.fillRect(x, y, slotSize, slotSize);

            // Spoil bar background
            const barY = basketY + slotSize / 2 + 2;
            this.freshnessGraphics.fillStyle(0x222222, 0.9);
            this.freshnessGraphics.fillRect(x, barY, slotSize, 4);

            if (i < this.basket.length) {
                if (this.basket[i].resourceType === 'trash') {
                    this.freshnessGraphics.fillStyle(0x886633, 1);
                    this.freshnessGraphics.fillRect(x, barY, slotSize, 4);
                } else {
                    const rem = (this.basket[i].spoilAt - now) / BASKET_SPOIL_TIME;
                    const fill = Math.max(0, Math.min(1, rem));
                    const color = fill > 0.5 ? 0x44dd44 : fill > 0.25 ? 0xffdd00 : 0xff4444;
                    this.freshnessGraphics.fillStyle(color, 1);
                    this.freshnessGraphics.fillRect(x, barY, Math.round(slotSize * fill), 4);
                }
            }
        }

        // Trash bag row
        if (hasBag) {
            for (let i = 0; i < this.trashBagCapacity; i++) {
                const x = slotsStartX + i * slotStep - slotSize / 2;
                const y = trashY - slotSize / 2;
                this.freshnessGraphics.fillStyle(i < this.trashBag.length ? 0x886633 : 0x444444, 0.7);
                this.freshnessGraphics.fillRect(x, y, slotSize, slotSize);
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
        const fogStart = FOG_TRANSITION_START;
        if (d <= fogStart) return 1;
        return Math.max(0, 1 - (d - fogStart) / (1 - fogStart));
    }

    update(): void {
        this.player.update();
        this.updateFogPhysics();
        this.updateBuildingProximity();
        const now = this.time.now;
        this.updateItemExpiration(now);
        this.updateCollections(now);
        this.drawFreshnessBars(now);
        this.updateBasketBounce();
        this.updateBuildingTints();
    }

    private updateFogPhysics(): void {
        const safeness = this.getFogSafeness();
        if (safeness >= 1) return;
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

    private pauseTimersAndScene(): void {
        this.spawnTimer.paused = true;
        this.roundTimer.paused = true;
        this.trashSpawnTimer.paused = true;
        this.scene.pause('GameScene');
    }

    private checkHutEntry(
        hut: Phaser.GameObjects.Image,
        state: { entered: boolean; onCooldown: boolean },
        shouldOpen: () => boolean,
        launchScene: () => void
    ): void {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, hut.x, hut.y);
        if (dist < HUT_ENTRY_RADIUS) {
            if (!state.entered && !state.onCooldown) {
                state.entered = true;
                if (shouldOpen()) {
                    this.pauseTimersAndScene();
                    launchScene();
                }
            }
        } else {
            state.entered = false;
            if (dist > HUT_EXIT_RADIUS) state.onCooldown = false;
        }
    }

    private updateBuildingProximity(): void {
        this.checkHutEntry(
            this.hut, this.hutState,
            () => {
                const upgradeLevels: Record<string, number> = this.registry.get('upgradeLevels') ?? {};
                return UPGRADES.some(u => {
                    const level = upgradeLevels[u.id] ?? 0;
                    return level < u.maxLevel && this.coins >= upgradeCost(u, level);
                });
            },
            () => { this.scene.launch('Shop', { coins: this.coins }); this.scene.bringToTop('Shop'); }
        );

        this.checkHutEntry(
            this.costumeHut, this.costumeHutState,
            () => {
                const ownedCostumes: string[] = this.registry.get('ownedCostumes') ?? [DEFAULT_COSTUME_ID];
                return ownedCostumes.length > 1 || COSTUMES.some(c => !ownedCostumes.includes(c.id) && this.coins >= c.cost);
            },
            () => { this.scene.launch('CostumeShop', { coins: this.coins }); this.scene.bringToTop('CostumeShop'); }
        );

        this.checkHutEntry(
            this.depotHut, this.depotHutState,
            () => this.basket.some(item => item.resourceType !== 'trash'),
            () => { this.scene.launch('Depot', { basket: this.basket, coins: this.coins, score: this.score }); this.scene.bringToTop('Depot'); }
        );

        // Trash bin — multiple bins, no cooldown, no timer pause needed
        const nearBin = this.trashBins.find(bin =>
            Phaser.Math.Distance.Between(this.player.x, this.player.y, bin.x, bin.y) < HUT_ENTRY_RADIUS
        );
        if (nearBin) {
            if (!this.binEntered) {
                this.binEntered = true;
                const hasAnyTrash = this.trashBag.length > 0 || this.basket.some(i => i.resourceType === 'trash');
                if (!hasAnyTrash) return;
                this.scene.pause('GameScene');
                this.scene.launch('TrashBin', { trashBag: this.trashBag, basket: this.basket, coins: this.coins });
                this.scene.bringToTop('TrashBin');
            }
        } else {
            this.binEntered = false;
        }
    }

    private updateItemExpiration(now: number): void {
        const expired = this.basket.filter(item => item.spoilAt <= now);
        if (expired.length === 0) return;
        expired.forEach(item => {
            const i = this.basket.indexOf(item);
            const img = this.basketSlotImages[i];
            if (img?.visible) this.playDisintegration(80 + i * 44, 575, img.texture.key);
        });
        this.basket = this.basket.filter(item => item.spoilAt > now);
        this.updateBasketUI();
    }

    private updateCollections(now: number): void {
        const r = this.player.collectionRadius;
        const basketFull = this.basket.length >= this.basketCapacity;
        let nearResourceWhileFull = false;

        const collected: Resource[] = [];
        this.resources.forEach((resource) => {
            if (!resource.active) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, resource.x, resource.y);
            if (dist > r) return;
            if (basketFull) { nearResourceWhileFull = true; return; }
            this.basket.push({ points: resource.points, spoilAt: now + BASKET_SPOIL_TIME, resourceType: resource.resourceType, textureKey: resource.texture.key });
            this.updateBasketUI();
            this.flyToBasket(resource.texture.key, resource.x, resource.y);
            resource.collect();
            collected.push(resource);
        });
        if (collected.length > 0) this.resources = this.resources.filter(r => !collected.includes(r));

        const collectedTrash: Trash[] = [];
        this.trashes.forEach((trash) => {
            if (!trash.active) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, trash.x, trash.y);
            if (dist > r) return;
            if (this.trashBagCapacity > 0 && this.trashBag.length < this.trashBagCapacity) {
                this.trashBag.push(trash.texture.key);
                this.updateTrashBagUI();
                this.flyToTrashBag(trash.texture.key, trash.x, trash.y);
            } else if (this.basket.length < this.basketCapacity) {
                this.basket.push({ points: 0, spoilAt: Infinity, resourceType: 'trash', textureKey: trash.texture.key });
                this.updateBasketUI();
                this.flyToBasket(trash.texture.key, trash.x, trash.y);
            } else {
                // Both full — shake both icons
                if (this.time.now - this.lastTrashBagFullWarning > 2000) {
                    this.lastTrashBagFullWarning = this.time.now;
                    const shakeIcon = (target: Phaser.GameObjects.Text) => {
                        const origX = target.x;
                        this.tweens.add({ targets: target, x: origX + 10, duration: 55, yoyo: true, repeat: 3, ease: 'Sine.inOut', onComplete: () => target.setX(origX) });
                    };
                    if (this.trashBagCapacity > 0) shakeIcon(this.trashBagText);
                    shakeIcon(this.basketText);
                }
                return;
            }
            trash.collect();
            collectedTrash.push(trash);
        });
        if (collectedTrash.length > 0) this.trashes = this.trashes.filter(t => !collectedTrash.includes(t));

        if (nearResourceWhileFull && this.time.now - this.lastBasketFullWarning > 2000) {
            this.lastBasketFullWarning = this.time.now;
            const origX = this.basketText.x;
            this.tweens.add({ targets: this.basketText, x: origX + 10, duration: 55, yoyo: true, repeat: 3, ease: 'Sine.inOut', onComplete: () => this.basketText.setX(origX) });
        }
    }
}
