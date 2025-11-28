/**
 * @file UIScene.js
 * @brief Сцена інтерфейсу користувача (HUD).
 * * Ця сцена працює паралельно з GameScene (основною грою).
 * Вона відповідає за відображення елементів, які повинні бути
 * зафіксовані на екрані (наприклад, кнопка паузи, рахунок, якщо він
 * не інтегрований безпосередньо у Scoreboard).
 */

/**
 * @class UIScene
 * @extends Phaser.Scene
 * @brief Сцена, що містить елементи користувацького інтерфейсу.
 * * Основна функціональність: обробка логіки паузи.
 */
export class UIScene extends Phaser.Scene {

    /**
     * @brief Конструктор сцени.
     */
    constructor() {
        super({ key: 'UIScene' });
    }

    /**
     * @brief Створення об'єктів сцени UI.
     * * Створює кнопку "Пауза" та налаштовує її інтерактивність для
     * керування станом основної гри.
     */
    create() {
        console.log("UIScene: Сцена UI запущена.");

        // Отримуємо посилання на головну сцену гри
        /** @property {Phaser.Scene} gameScene - Посилання на GameScene для управління паузою. */
        this.gameScene = this.scene.get('GameScene');

        // Додавання кнопки "Пауза"
        const pauseButton = this.add.text(
            this.game.config.width - 100, 16,
            'ПАУЗА',
            { fontSize: '20px', fill: '#FFFFFF', backgroundColor: '#333333' }
        )
            .setInteractive() // Робимо текст клікабельним
            .setScrollFactor(0); // Фіксуємо на екрані (не рухається за камерою)

        // Логіка для кнопки "Пауза"
        pauseButton.on('pointerdown', () => {
            if (this.gameScene.scene.isPaused()) {
                this.gameScene.scene.resume();
                pauseButton.setText('ПАУЗА');
            } else {
                this.gameScene.scene.pause();
                pauseButton.setText('ПРОДОВЖИТИ');
            }
        });

    }
}