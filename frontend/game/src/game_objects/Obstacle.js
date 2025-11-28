/**
 * @file Obstacle.js
 * @brief Клас для перешкод у грі.
 * * Цей файл описує статичні об'єкти (перешкоди), зіткнення з якими
 * призводить до завершення гри.
 */

/**
 * @class Obstacle
 * @extends Phaser.Physics.Arcade.Sprite
 * @brief Предмет, що становить небезпеку для гравця.
 * * Перешкоди є нерухомими об'єктами, які не піддаються гравітації.
 * При контакті з гравцем вони ініціюють стан Game Over (через візуальну зміну
 * гравця та логіку сцени).
 */
export class Obstacle extends Phaser.Physics.Arcade.Sprite {

    /**
     * @brief Створює нову перешкоду.
     * * Налаштовує фізичні властивості: нерухомість (immovable) та відсутність гравітації.
     * * @param {Phaser.Scene} scene - Поточна сцена гри.
     * @param {number} x - Координата X.
     * @param {number} y - Координата Y.
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'obstacle_sprite');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setAllowGravity(false);
        this.setImmovable(true);
        this.setDisplaySize(32, 32);

        console.log("Obstacle: Об'єкт успішно ініціалізовано.");
    }

    /**
     * @brief Обробка зіткнення з гравцем.
     * * Викликається, коли гравець потрапляє на перешкоду.
     * Візуально змінює гравця (сірий колір, зупинка анімації), щоб показати програш.
     * * @note Фактична зупинка гри та перехід на сцену Game Over зазвичай обробляється
     * у `GameScene` через колайдер, але цей метод відповідає за візуальний ефект на самому об'єкті.
     * * @param {Player} player - Об'єкт гравця.
     */
    interact(player) {
        console.log("Obstacle: Game Over! Гравець зіткнувся з перешкодою.");

        // Робимо гравця сірим, щоб показати, що він "програв"
        player.setTint(0x999999);
        player.anims.stop();
    }
}