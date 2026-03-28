import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Resource } from '../objects/Resource';
import {
    RESOURCE_SPAWN_INTERVAL,
    MAX_RESOURCES_ON_SCREEN,
    ROUND_DURATION,
    BASKET_BASE_CAPACITY,
    RESOURCE_TYPES,
    ResourceType,
    RESOURCE_NAMES_PL,
    CAMERA_INITIAL_ZOOM,
    WORLD_WIDTH,
    WORLD_HEIGHT
} from '../data/constants';
import { UPGRADES } from '../data/upgrades';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private resources: Resource[] = [];
    private stoneList: Array<{ x: number, y: number, radius: number }> = [];

    private score = 0;
    private timeLeft = ROUND_DURATION;
    private basketCount = 0;
    private basketPoints = 0;
    private basketCapacity = BASKET_BASE_CAPACITY;

    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private collectText!: Phaser.GameObjects.Text;
    private basketText!: Phaser.GameObjects.Text;

    private hut!: Phaser.GameObjects.Image;
    private hutEntered = false;
    private lastBasketFullWarning = 0;

    private spawnTimer!: Phaser.Time.TimerEvent;
    private roundTimer!: Phaser.Time.TimerEvent;

    private zoomStage = 0;
    private uiCamera!: Phaser.Cameras.Scene2D.Camera;
    private bgImage!: Phaser.GameObjects.TileSprite;
    private stoneImages: Phaser.GameObjects.Image[] = [];

    constructor() {
        super('GameScene');
    }

    init(): void {
        // Reset state for new round
        this.score = 0;
        this.timeLeft = this.registry.get('roundDuration') ?? ROUND_DURATION;
        this.resources = [];
        this.stoneImages = [];
        this.hutEntered = false;
        this.basketCount = 0;
        this.basketPoints = 0;
        this.zoomStage = 0;

        // Read upgrades from registry (set by Shop scene)
        const upgradeLevels: Record<string, number> = this.registry.get('upgradeLevels') ?? {};

        const speedLevel = upgradeLevels['speed'] ?? 0;
        const radiusLevel = upgradeLevels['radius'] ?? 0;
        const spawnsLevel = upgradeLevels['spawns'] ?? 0;
        const basketLevel = upgradeLevels['basket'] ?? 0;

        this.registry.set('speedBonus', UPGRADES[0].effect(speedLevel));
        this.registry.set('radiusBonus', UPGRADES[1].effect(radiusLevel));
        this.registry.set('maxResourcesBonus', UPGRADES[2].effect(spawnsLevel));
        this.basketCapacity = BASKET_BASE_CAPACITY + UPGRADES[3].effect(basketLevel);
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

        // Extend physics world to match the full world size
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

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

        this.collectText = this.add.text(width / 2, height / 2 - 80, '', {
            fontSize: '28px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(20).setAlpha(0);

        // Hut (shop entrance) — near player start, same relative offset as before
        this.hut = this.add.image(WORLD_WIDTH / 2 + 180, WORLD_HEIGHT / 2 - 120, 'hut').setDepth(5);

        // Listen for shop closing
        this.events.on('resume', (sys: Phaser.Scenes.Systems, data: { score?: number }) => {
            if (data?.score !== undefined) {
                this.score = data.score;
                this.scoreText.setText(`Punkty: ${this.score}`);
            }
            this.spawnTimer.paused = false;
            this.roundTimer.paused = false;

            // Re-apply upgrades
            const upgradeLevels: Record<string, number> = this.registry.get('upgradeLevels') ?? {};
            const speedLevel = upgradeLevels['speed'] ?? 0;
            const radiusLevel = upgradeLevels['radius'] ?? 0;
            const basketLevel = upgradeLevels['basket'] ?? 0;
            this.player.speed = 200 + UPGRADES[0].effect(speedLevel);
            this.player.collectionRadius = 40 + UPGRADES[1].effect(radiusLevel);
            this.basketCapacity = BASKET_BASE_CAPACITY + UPGRADES[3].effect(basketLevel);
            this.basketText.setText(`Koszyk: 0/${this.basketCapacity}`);

            // Cooldown so player must walk away before re-entering
            this.hutEntered = true;
        });

        // Camera setup: main camera follows player, UI camera fixed
        this.cameras.main.setZoom(CAMERA_INITIAL_ZOOM);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.setBackgroundColor('#4a8a2a');
        this.cameras.main.ignore([this.scoreText, this.timerText, this.basketText]);

        this.uiCamera = this.cameras.add(0, 0, width, height);
        this.uiCamera.ignore([this.bgImage, ...this.stoneImages, this.player, this.hut, this.collectText]);

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

        // Initial spawn burst near player
        for (let i = 0; i < 10; i++) {
            this.spawnResource(this.player.x, this.player.y);
        }
    }

    private spawnResource(nearX?: number, nearY?: number): void {
        const maxResources = MAX_RESOURCES_ON_SCREEN + (this.registry.get('maxResourcesBonus') ?? 0);
        if (this.resources.length >= maxResources) return;

        const margin = 60;
        let x = 0, y = 0;
        let attempts = 0;
        do {
            if (nearX !== undefined && nearY !== undefined) {
                x = Phaser.Math.Clamp(nearX + Phaser.Math.Between(-380, 380), margin, WORLD_WIDTH - margin);
                y = Phaser.Math.Clamp(nearY + Phaser.Math.Between(-280, 280), margin + 40, WORLD_HEIGHT - margin - 40);
            } else {
                x = Phaser.Math.Between(margin, WORLD_WIDTH - margin);
                y = Phaser.Math.Between(margin + 40, WORLD_HEIGHT - margin - 40);
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
        }

        if (this.timeLeft <= 0) {
            this.endRound();
        }
    }

    private showCollectText(text: string): void {
        this.collectText.setText(text).setAlpha(1).setPosition(this.player.x, this.player.y - 60);
        this.tweens.add({
            targets: this.collectText,
            y: this.player.y - 100,
            alpha: 0,
            duration: 800,
            ease: 'Quad.out'
        });
    }

    private endRound(): void {
        this.spawnTimer.remove();
        this.roundTimer.remove();
        this.score += this.basketPoints;
        this.scene.start('GameOver', { score: this.score });
    }

    update(): void {
        this.player.update();

        // Check if player enters the hut
        const hutDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.hut.x, this.hut.y);
        if (hutDist < 55) {
            if (!this.hutEntered) {
                this.hutEntered = true;
                this.spawnTimer.paused = true;
                this.roundTimer.paused = true;
                // Convert basket to points
                this.score += this.basketPoints;
                this.basketPoints = 0;
                this.basketCount = 0;
                this.basketText.setText(`Koszyk: 0/${this.basketCapacity}`);
                this.basketText.setColor('#ffcc44');
                this.scoreText.setText(`Punkty: ${this.score}`);
                this.scene.pause('GameScene');
                this.scene.launch('Shop', { score: this.score });
                this.scene.bringToTop('Shop');
            }
        } else {
            this.hutEntered = false;
        }

        // Check collection by distance
        const r = this.player.collectionRadius;
        const collected: Resource[] = [];
        const basketFull = this.basketCount >= this.basketCapacity;
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
                this.basketCount += 1;
                this.basketPoints += resource.points;
                const full = this.basketCount >= this.basketCapacity;
                this.basketText.setText(`Koszyk: ${this.basketCount}/${this.basketCapacity}`);
                this.basketText.setColor(full ? '#ff4444' : '#ffcc44');
                this.showCollectText(`+${resource.points} ${RESOURCE_NAMES_PL[resource.resourceType]}`);
                resource.collect();
                collected.push(resource);
            }
        });
        if (collected.length > 0) {
            this.resources = this.resources.filter(r => !collected.includes(r));
        }

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
