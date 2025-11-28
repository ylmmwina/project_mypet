/**
 * @file Coin.js
 * @brief Клас для монетки (Coin).
 * * Цей файл описує поведінку монетки, яку гравець може збирати у грі.
 */

import { AssetsManager } from './AssetsManager.js';

/**
 * @class Coin
 * @extends Phaser.Physics.Arcade.Sprite
 * @brief Предмет, який гравець може збирати для отримання очок.
 * * Монетка має фізичне тіло, стикається з платформами, але не рухається сама по собі
 * (окрім падіння, якщо гравітація увімкнена, хоча тут вона часто статична).
 */
export class Coin extends Phaser.Physics.Arcade.Sprite {

    /**
     * @brief Створює нову монетку.
     * * @param {Phaser.Scene} scene - Сцена, до якої належить об'єкт.
     * @param {number} x - Координата X.
     * @param {number} y - Координата Y.
     */
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
     * @brief Взаємодія з гравцем.
     * * Викликається, коли гравець перетинається (overlap) з монеткою.
     * Метод "вимикає" монетку, роблячи її неактивною та невидимою,
     * що імітує її збір.
     * * @param {Player} player - Об'єкт гравця (не використовується прямо, але передається Phaser'ом).
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