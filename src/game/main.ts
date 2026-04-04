import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { GameScene } from './scenes/GameScene';
import { Shop } from './scenes/Shop';
import { CostumeShop } from './scenes/CostumeShop';
import { Depot } from './scenes/Depot';
import { TrashBin } from './scenes/TrashBin';
import { GameOver } from './scenes/GameOver';

export function StartGame(containerId: string): Phaser.Game {
    return new Phaser.Game({
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: containerId,
        fullscreenTarget: containerId,
        backgroundColor: '#2d5a27',
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: 0 },
                debug: false
            }
        },
        scene: [Boot, Preloader, MainMenu, GameScene, Shop, CostumeShop, Depot, TrashBin, GameOver]
    });
}
