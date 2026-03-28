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

        // Upgrade icon: radius — long arms reaching for a mushroom
        const radiusGfx = this.make.graphics({ x: 0, y: 0 });
        // Body (torso)
        radiusGfx.fillStyle(0x44aa44);
        radiusGfx.fillCircle(32, 18, 9); // head
        radiusGfx.fillRect(27, 26, 10, 14); // torso
        // Left arm (long, reaching left)
        radiusGfx.fillStyle(0x44aa44);
        radiusGfx.fillRect(4, 28, 24, 6); // arm
        radiusGfx.fillRect(2, 25, 8, 10); // hand
        // Right arm (long, reaching right)
        radiusGfx.fillRect(36, 28, 24, 6); // arm
        radiusGfx.fillRect(54, 25, 8, 10); // hand
        // Mushroom on the right (being grabbed)
        radiusGfx.fillStyle(0xdd2222);
        radiusGfx.fillCircle(56, 18, 8);
        radiusGfx.fillStyle(0xffffff);
        radiusGfx.fillCircle(52, 16, 2);
        radiusGfx.fillStyle(0xf5deb3);
        radiusGfx.fillRect(52, 22, 6, 6);
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

        // Stone: gray rock shape — tight texture, no padding
        const stoneGfx = this.make.graphics({ x: 0, y: 0 });
        stoneGfx.fillStyle(0x888888);
        stoneGfx.fillEllipse(26, 20, 50, 38);
        stoneGfx.fillStyle(0xaaaaaa);
        stoneGfx.fillEllipse(18, 13, 22, 13);
        stoneGfx.fillStyle(0x666666);
        stoneGfx.fillEllipse(34, 28, 14, 9);
        stoneGfx.generateTexture('stone', 52, 40);
        stoneGfx.destroy();

        // Upgrade icon: basket — big basket with stars
        const basketGfx = this.make.graphics({ x: 0, y: 0 });
        basketGfx.fillStyle(0x8b6030);
        basketGfx.fillRect(10, 8, 6, 18);
        basketGfx.fillRect(48, 8, 6, 18);
        basketGfx.fillRect(10, 8, 44, 6);
        basketGfx.fillStyle(0xd4a055);
        basketGfx.fillRoundedRect(4, 24, 56, 34, 6);
        basketGfx.fillStyle(0xb07835);
        basketGfx.fillRect(4, 35, 56, 5);
        basketGfx.fillRect(18, 24, 5, 34);
        basketGfx.fillRect(41, 24, 5, 34);
        // Stars inside basket
        basketGfx.fillStyle(0xffee00);
        basketGfx.fillCircle(20, 44, 4);
        basketGfx.fillCircle(32, 38, 5);
        basketGfx.fillCircle(44, 44, 4);
        basketGfx.generateTexture('upgrade-basket', 64, 64);
        basketGfx.destroy();

        // Trash: crumpled gray-brown ball
        const trashGfx = this.make.graphics({ x: 0, y: 0 });
        trashGfx.fillStyle(0x998866);
        trashGfx.fillCircle(14, 14, 11);
        trashGfx.fillStyle(0x776644);
        trashGfx.fillRect(10, 12, 4, 3);
        trashGfx.fillRect(16, 10, 3, 5);
        trashGfx.fillRect(12, 17, 5, 3);
        trashGfx.generateTexture('trash', 28, 28);
        trashGfx.destroy();

        // Trash bin: green bin with lid
        const binGfx = this.make.graphics({ x: 0, y: 0 });
        // Body
        binGfx.fillStyle(0x228822);
        binGfx.fillRect(10, 28, 44, 38);
        // Lid
        binGfx.fillStyle(0x116611);
        binGfx.fillRect(6, 20, 52, 10);
        // Handle
        binGfx.fillStyle(0x116611);
        binGfx.fillRect(26, 12, 12, 10);
        // Recycling arrows (simplified)
        binGfx.fillStyle(0xffffff);
        binGfx.fillTriangle(32, 34, 24, 46, 40, 46);
        binGfx.generateTexture('trashbin', 64, 68);
        binGfx.destroy();

        // Upgrade icon: trashbag — bag shape
        const trashbagGfx = this.make.graphics({ x: 0, y: 0 });
        // Bag body
        trashbagGfx.fillStyle(0x44aa44);
        trashbagGfx.fillRoundedRect(10, 22, 44, 36, 8);
        // Bag top/tie
        trashbagGfx.fillStyle(0x228822);
        trashbagGfx.fillRect(22, 12, 20, 12);
        trashbagGfx.fillStyle(0x116611);
        trashbagGfx.fillRect(28, 6, 8, 8);
        // Trash symbol inside
        trashbagGfx.fillStyle(0x998866);
        trashbagGfx.fillCircle(32, 38, 8);
        trashbagGfx.generateTexture('upgrade-trashbag', 64, 64);
        trashbagGfx.destroy();

        // Upgrade icon: recycling — arrows in triangle
        const recyclingGfx = this.make.graphics({ x: 0, y: 0 });
        recyclingGfx.fillStyle(0x228822);
        recyclingGfx.fillCircle(32, 32, 28);
        recyclingGfx.fillStyle(0xffffff);
        // Three arrows forming recycling symbol (simplified as triangles)
        recyclingGfx.fillTriangle(32, 10, 20, 30, 44, 30);
        recyclingGfx.fillStyle(0x228822);
        recyclingGfx.fillCircle(32, 28, 10);
        // Coin
        recyclingGfx.fillStyle(0xffdd00);
        recyclingGfx.fillCircle(32, 32, 8);
        recyclingGfx.generateTexture('upgrade-recycling', 64, 64);
        recyclingGfx.destroy();

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
