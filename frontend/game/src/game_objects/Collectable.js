/**
 * @file Collectable.js
 * @brief Базовий клас для всіх збираних предметів.
 * * Цей файл визначає батьківський клас Collectable, від якого успадковуються
 * конкретні предмети (наприклад, Coin). Він встановлює базову фізику та
 * інтерфейс взаємодії.
 */

/**
 * @class Collectable
 * @extends Phaser.Physics.Arcade.Sprite
 * @brief Абстракція предмета, який можна підібрати.
 * * Налаштовує об'єкт як нерухомий (immovable) і такий, що не піддається гравітації.
 * Надає метод interact(), який має бути перевизначений у нащадках.
 */
export class Collectable extends Phaser.Physics.Arcade.Sprite {

    /**
     * @brief Конструктор базового збираного об'єкта.
     * * Ініціалізує спрайт, додає його до сцени та налаштовує фізичне тіло.
     * * @param {Phaser.Scene} scene - Поточна сцена гри.
     * @param {number} x - Координата X появи.
     * @param {number} y - Координата Y появи.
     * @param {string} textureKey - Ключ текстури для спрайта.
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
     * @brief Метод взаємодії з гравцем.
     * * Викликається при колізії або перетині з гравцем.
     * Базова реалізація просто вимикає об'єкт (збирає його).
     * Цей метод демонструє поліморфізм, оскільки може бути змінений у класах-спадкоємцях.
     * * @param {Player} player - Екземпляр гравця, що взаємодіє з предметом.
     */
    interact(player) {
        // Базова логіка: зникнення предмета після збирання
        this.disableBody(true, true);
        console.log(`Collectable: ${this.texture.key} було зібрано.`);
    }
}