/**
 * @file Player.js
 * @brief Клас гравця (персонажа).
 * * Цей файл описує сутність гравця, яким керує користувач.
 * Включає логіку переміщення, стрибків та налаштування фізики.
 */

/**
 * @class Player
 * @extends Phaser.Physics.Arcade.Sprite
 * @brief Головний персонаж гри.
 * * Відповідає за відображення спрайта гравця, обробку фізики (гравітація, колізії)
 * та реакцію на введення користувача (рух вліво/вправо, стрибок).
 */
export class Player extends Phaser.Physics.Arcade.Sprite {

    /**
     * @brief Створює нового гравця.
     * * Ініціалізує фізичне тіло, встановлює розміри хідбокса, гравітацію
     * та параметри руху.
     * * @param {Phaser.Scene} scene - Поточна сцена гри.
     * @param {number} x - Початкова координата X.
     * @param {number} y - Початкова координата Y.
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'player_sprite');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // ЗБІЛЬШЕНО: Швидкість і сила стрибка
        /** @property {number} moveSpeed - Швидкість горизонтального руху. */
        this.moveSpeed = 300;  // Було 250

        /** @property {number} jumpForce - Сила стрибка (імпульс вгору). */
        this.jumpForce = 550;  // Було 500

        // Примусовий розмір
        this.setDisplaySize(60, 60);
        this.setBodySize(60, 60);

        this.setGravityY(700); // Трохи швидше падіння для динаміки

        this.setCollideWorldBounds(false);
    }

    /**
     * @brief Переміщення гравця по горизонталі.
     * * Встановлює швидкість по осі X залежно від напрямку.
     * * @param {number} direction - Напрямок руху:
     * - `-1`: Вліво.
     * - `1`: Вправо.
     * - `0`: Стояти на місці.
     */
    move(direction) {
        this.setVelocityX(direction * this.moveSpeed);
    }

    /**
     * @brief Стрибок гравця.
     * * Дозволяє стрибнути лише якщо гравець стоїть на землі (body.blocked.down або body.touching.down).
     * Застосовує вертикальну швидкість `jumpForce`.
     */
    jump() {
        if (this.body.blocked.down || this.body.touching.down) {
            this.setVelocityY(-this.jumpForce);
        }
    }
}