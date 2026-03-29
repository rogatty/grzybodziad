import Phaser from 'phaser';
import { TRASH_TEXTURES } from '../data/constants';
import { Collectible } from './Collectible';

export class Trash extends Collectible {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        const key = TRASH_TEXTURES[Math.floor(Math.random() * TRASH_TEXTURES.length)];
        super(scene, x, y, key);

        // Gentle wobble
        scene.tweens.add({
            targets: this,
            angle: 15,
            duration: 900 + Math.random() * 300,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }
}
