import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create(): void {
        // Generate placeholder textures as colored shapes
        // These will be replaced by real hand-drawn art later

        // Player: green circle
        const playerGfx = this.make.graphics({ x: 0, y: 0 });
        playerGfx.fillStyle(0x44aa44);
        playerGfx.fillCircle(32, 32, 28);
        playerGfx.fillStyle(0x88ff88);
        playerGfx.fillCircle(24, 20, 8); // head highlight
        playerGfx.generateTexture('player', 64, 64);
        playerGfx.destroy();

        // Mushroom: red cap with white dots
        const mushroomGfx = this.make.graphics({ x: 0, y: 0 });
        mushroomGfx.fillStyle(0xdd2222);
        mushroomGfx.fillCircle(16, 12, 14);
        mushroomGfx.fillStyle(0xffffff);
        mushroomGfx.fillCircle(10, 10, 4);
        mushroomGfx.fillCircle(20, 7, 3);
        mushroomGfx.fillStyle(0xf5deb3);
        mushroomGfx.fillRect(10, 20, 12, 10);
        mushroomGfx.generateTexture('mushroom', 32, 32);
        mushroomGfx.destroy();

        // Berry: blue circle with shine
        const berryGfx = this.make.graphics({ x: 0, y: 0 });
        berryGfx.fillStyle(0x3355cc);
        berryGfx.fillCircle(12, 12, 11);
        berryGfx.fillStyle(0x88aaff);
        berryGfx.fillCircle(8, 8, 4);
        berryGfx.generateTexture('berry', 24, 24);
        berryGfx.destroy();

        // Flower: yellow petals
        const flowerGfx = this.make.graphics({ x: 0, y: 0 });
        flowerGfx.fillStyle(0xffdd00);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            flowerGfx.fillCircle(14 + Math.cos(angle) * 8, 14 + Math.sin(angle) * 8, 5);
        }
        flowerGfx.fillStyle(0xff8800);
        flowerGfx.fillCircle(14, 14, 5);
        flowerGfx.generateTexture('flower', 28, 28);
        flowerGfx.destroy();

        // Upgrade icon: speed — boot with jetpack
        const speedGfx = this.make.graphics({ x: 0, y: 0 });
        // Boot
        speedGfx.fillStyle(0x8b4513);
        speedGfx.fillRoundedRect(14, 30, 28, 18, 4);
        speedGfx.fillRoundedRect(20, 18, 18, 16, 4);
        // Sole
        speedGfx.fillStyle(0x333333);
        speedGfx.fillRoundedRect(12, 44, 32, 6, 3);
        // Jetpack (rocket on the back)
        speedGfx.fillStyle(0xcc2222);
        speedGfx.fillRoundedRect(38, 14, 14, 26, 4);
        speedGfx.fillStyle(0xaaaaaa);
        speedGfx.fillTriangle(38, 14, 52, 14, 45, 6);
        // Flame
        speedGfx.fillStyle(0xff8800);
        speedGfx.fillTriangle(40, 40, 50, 40, 45, 54);
        speedGfx.fillStyle(0xffee00);
        speedGfx.fillTriangle(42, 40, 48, 40, 45, 50);
        speedGfx.generateTexture('upgrade-speed', 64, 64);
        speedGfx.destroy();

        // Upgrade icon: radius — basket with mushroom inside
        const radiusGfx = this.make.graphics({ x: 0, y: 0 });
        // Handle (two thick rectangles forming arch)
        radiusGfx.fillStyle(0x8b6030);
        radiusGfx.fillRect(14, 10, 6, 20);
        radiusGfx.fillRect(44, 10, 6, 20);
        radiusGfx.fillRect(14, 10, 36, 6);
        // Basket body
        radiusGfx.fillStyle(0xc8a060);
        radiusGfx.fillRoundedRect(8, 28, 48, 30, 6);
        // Weave stripes (darker)
        radiusGfx.fillStyle(0x9a7040);
        radiusGfx.fillRect(8, 38, 48, 4);
        radiusGfx.fillRect(22, 28, 4, 30);
        radiusGfx.fillRect(38, 28, 4, 30);
        // Mushroom inside
        radiusGfx.fillStyle(0xdd2222);
        radiusGfx.fillCircle(32, 26, 10);
        radiusGfx.fillStyle(0xffffff);
        radiusGfx.fillCircle(28, 24, 3);
        radiusGfx.fillStyle(0xf5deb3);
        radiusGfx.fillRect(28, 30, 8, 6);
        radiusGfx.generateTexture('upgrade-radius', 64, 64);
        radiusGfx.destroy();

        // Upgrade icon: spawns — happy meadow with flowers and mushroom
        const spawnsGfx = this.make.graphics({ x: 0, y: 0 });
        // Ground
        spawnsGfx.fillStyle(0x44aa44);
        spawnsGfx.fillRoundedRect(4, 44, 56, 16, 4);
        // Flower left
        spawnsGfx.fillStyle(0xffdd00);
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            spawnsGfx.fillCircle(14 + Math.cos(a) * 6, 36 + Math.sin(a) * 6, 4);
        }
        spawnsGfx.fillStyle(0xff8800);
        spawnsGfx.fillCircle(14, 36, 4);
        // Mushroom center
        spawnsGfx.fillStyle(0xdd2222);
        spawnsGfx.fillCircle(32, 28, 10);
        spawnsGfx.fillStyle(0xffffff);
        spawnsGfx.fillCircle(28, 26, 2);
        spawnsGfx.fillCircle(34, 24, 2);
        spawnsGfx.fillStyle(0xf5deb3);
        spawnsGfx.fillRect(28, 34, 8, 8);
        // Flower right
        spawnsGfx.fillStyle(0xff88cc);
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            spawnsGfx.fillCircle(50 + Math.cos(a) * 6, 36 + Math.sin(a) * 6, 4);
        }
        spawnsGfx.fillStyle(0xffff00);
        spawnsGfx.fillCircle(50, 36, 4);
        spawnsGfx.generateTexture('upgrade-spawns', 64, 64);
        spawnsGfx.destroy();

        // Hut: simple house with roof and door
        const hutGfx = this.make.graphics({ x: 0, y: 0 });
        // Walls
        hutGfx.fillStyle(0xc8a060);
        hutGfx.fillRect(8, 36, 56, 36);
        // Roof
        hutGfx.fillStyle(0x8b3a1a);
        hutGfx.fillTriangle(4, 38, 36, 4, 68, 38);
        // Door
        hutGfx.fillStyle(0x5a2d0c);
        hutGfx.fillRect(26, 52, 16, 20);
        // Window
        hutGfx.fillStyle(0xaaddff);
        hutGfx.fillRect(12, 46, 10, 10);
        hutGfx.fillStyle(0x8b3a1a);
        hutGfx.fillRect(16, 46, 2, 10);
        hutGfx.fillRect(12, 51, 10, 2);
        hutGfx.generateTexture('hut', 72, 72);
        hutGfx.destroy();

        // Background tile: green meadow
        const bgGfx = this.make.graphics({ x: 0, y: 0 });
        bgGfx.fillStyle(0x3a7d35);
        bgGfx.fillRect(0, 0, 800, 600);
        bgGfx.fillStyle(0x2d6028);
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 600;
            bgGfx.fillRect(x, y, 3, 8);
            bgGfx.fillRect(x + 4, y + 2, 3, 6);
        }
        bgGfx.generateTexture('background', 800, 600);
        bgGfx.destroy();

        this.scene.start('Preloader');
    }
}
