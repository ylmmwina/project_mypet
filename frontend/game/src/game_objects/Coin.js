// src/game_objects/Coin.js
import { AssetsManager } from './AssetsManager.js';

export class Coin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        const textureKey = AssetsManager.getAssetsMap().coin.key;
        super(scene, x, y, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBounce(0.5);
        this.body.allowGravity = true;
    }

    /**
     * interact(): Перевизначення (поліморфізм) батьківського методу.
     * Викликається при контакті з гравцем.
     * @param {Player} player - Екземпляр нашого класу Player (тут не використовується).
     */
    interact(player) {
        // --- ЦІ ТРИ РЯДКИ НЕОБХІДНІ ДЛЯ ПРОХОДЖЕННЯ ТЕСТУ ---
        // Вони "вимикають" монетку у світі гри.
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        // ----------------------------------------------------
    }
}