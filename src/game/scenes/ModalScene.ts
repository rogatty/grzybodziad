import Phaser from 'phaser';

export abstract class ModalScene extends Phaser.Scene {
    protected closeAndResume(resumeKey: string, data?: object): void {
        this.scene.resume(resumeKey, data ?? {});
        this.scene.stop();
    }
}
