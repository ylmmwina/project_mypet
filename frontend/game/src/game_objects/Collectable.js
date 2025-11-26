// src/game_objects/Collectable.js
// Базовий ООП-клас для всіх збираних предметів.
// Демонструє наслідування (якщо Coin успадковує від нього).

export class Collectable extends Phaser.Physics.Arcade.Sprite {
    /**
     * Конструктор базового збираного об'єкта.
     */
    constructor(scene, x, y, textureKey) {
        super(scene, x, y, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Налаштовуємо фізику: збирані предмети не мають падати
        this.body.setAllowGravity(false);
        this.setImmovable(true);

        // Для піксельної графіки setCircle може допомогти з точністю
        this.body.setCircle(this.width / 2);

        console.log(`Collectable: Об'єкт ${textureKey} ініціалізовано.`);
    }

    /**
     * interact(): Загальний метод взаємодії.
     * Його буде перевизначено (поліморфізм) у класах-нащадках.
     */
    interact(player) {
        // Базова логіка: зникнення предмета після збирання
        this.disableBody(true, true);
        console.log(`Collectable: ${this.texture.key} було зібрано.`);
    }
}