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
    RESOURCE_NAMES_PL
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

    constructor() {
        super('GameScene');
    }

    init(): void {
        // Reset state for new round
        this.score = 0;
        this.timeLeft = this.registry.get('roundDuration') ?? ROUND_DURATION;
        this.resources = [];
        this.hutEntered = false;
        this.basketCount = 0;
        this.basketPoints = 0;

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

        // Background
        this.add.image(width / 2, height / 2, 'background');

        // Stones — no physics bodies, manual circle collision in update()
        this.stoneList = [];
        const stoneCount = 7;
        const forbiddenZones = [
            { x: width / 2, y: height / 2, r: 100 },
            { x: 580, y: 180, r: 90 },
        ];
        let placed = 0;
        let attempts = 0;
        while (placed < stoneCount && attempts < 200) {
            attempts++;
            const margin = 70;
            const sx = Phaser.Math.Between(margin, width - margin);
            const sy = Phaser.Math.Between(margin + 40, height - margin - 40);
            const tooClose = forbiddenZones.some(z =>
                Phaser.Math.Distance.Between(sx, sy, z.x, z.y) < z.r
            );
            if (tooClose) continue;
            const scale = Phaser.Math.FloatBetween(0.5, 1.6);
            this.add.image(sx, sy, 'stone').setScale(scale).setDepth(3);
            this.stoneList.push({ x: sx, y: sy, radius: 20 * scale });
            placed++;
        }

        // Player
        this.player = new Player(this, width / 2, height / 2);
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

        // Hut (shop entrance)
        this.hut = this.add.image(580, 180, 'hut').setDepth(5);

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

        // Initial spawn burst
        for (let i = 0; i < 5; i++) {
            this.spawnResource();
        }
    }

    private spawnResource(): void {
        const maxResources = MAX_RESOURCES_ON_SCREEN + (this.registry.get('maxResourcesBonus') ?? 0);
        if (this.resources.length >= maxResources) return;

        const { width, height } = this.scale;
        const margin = 60;
        let x = 0, y = 0;
        let attempts = 0;
        do {
            x = Phaser.Math.Between(margin, width - margin);
            y = Phaser.Math.Between(margin + 40, height - margin - 40);
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
    }

    private tickTimer(): void {
        this.timeLeft -= 1;
        this.timerText.setText(`Czas: ${this.timeLeft}`);

        if (this.timeLeft <= 10) {
            this.timerText.setColor('#ff4444');
        }

        if (this.timeLeft <= 0) {
            this.endRound();
        }
    }

    private showCollectText(text: string): void {
        this.collectText.setText(text).setAlpha(1).setY(this.player.y - 60);
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
