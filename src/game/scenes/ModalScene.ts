import Phaser from 'phaser';

export abstract class ModalScene extends Phaser.Scene {
    // Call at the top of create() — zooms the camera so the modal fits in landscape mobile.
    // Modals are designed for ~580px height; scale down proportionally on shorter screens.
    protected fitToScreen(): void {
        const scale = Math.min(1, this.scale.height / 580);
        this.cameras.main.setZoom(scale);
    }

    protected closeAndResume(resumeKey: string, data?: object): void {
        this.scene.resume(resumeKey, data ?? {});
        this.scene.stop();
    }
}
