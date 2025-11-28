/**
 * @file Scoreboard.js
 * @brief Клас для управління рахунком гри.
 * * Цей файл відповідає за підрахунок очок, відображення тексту з рахунком на екрані
 * та обробку подій збору монет.
 */

/**
 * @class Scoreboard
 * @brief Табло рахунку.
 * * Клас створює текстовий об'єкт Phaser, закріплює його на екрані (щоб не рухався за камерою)
 * та слухає події гри для оновлення очок.
 */
export class Scoreboard {

    /**
     * @brief Створює нове табло.
     * * Ініціалізує текст, налаштовує стилі (шрифт, колір, обводка) та підписується
     * на подію 'collectCoin'.
     * * @param {Phaser.Scene} scene - Сцена, до якої додається табло.
     */
    constructor(scene) {
        /** @property {Phaser.Scene} scene - Посилання на сцену. */
        this.scene = scene;
        /** @property {number} score - Поточний рахунок гравця. */
        this.score = 0;

        // Створення тексту
        this.scoreText = scene.add.text(16, 16, 'SCORE: 0', {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontFamily: '"Press Start 2P", cursive', // Піксельний шрифт
            stroke: '#000000', // Чорна обводка для контрасту
            strokeThickness: 4
        });

        // Закріплюємо текст, щоб він не рухався разом з камерою (HUD)
        this.scoreText.setScrollFactor(0);
        // Поверх усього
        this.scoreText.setDepth(100);

        // --- ПІДПИСКА НА ПОДІЇ ---
        // Слухаємо подію 'collectCoin', яку емітить сцена або об'єкти
        if (this.scene.events) {
            this.scene.events.on('collectCoin', this.addScore, this);
        }

        // Очищення: прибираємо слухача подій при знищенні сцени, щоб не було витоку пам'яті
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.scene.events) {
                this.scene.events.off('collectCoin', this.addScore, this);
            }
        });
    }

    /**
     * @brief Отримати поточний рахунок.
     * * @returns {number} Кількість набраних очок.
     */
    getScore() {
        return this.score;
    }

    /**
     * @brief Додає бали до поточного рахунку.
     * * Оновлює числове значення та перемальовує текст на екрані.
     * * @param {number} [points=10] - Кількість балів для додавання (за замовчуванням 10).
     */
    addScore(points = 10) {
        this.score += points;
        this.scoreText.setText('Score: ' + this.score);
    }
}