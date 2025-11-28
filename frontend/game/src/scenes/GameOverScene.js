/**
 * @file GameOverScene.js
 * @brief Сцена завершення гри.
 * * Цей файл відповідає за відображення екрану "Game Over", показ фінального рахунку,
 * рекорду, кнопки перезапуску, а також за відправку результатів на сервер.
 */

/**
 * @class GameOverScene
 * @extends Phaser.Scene
 * @brief Сцена, що активується після програшу.
 * * Зупиняє ігровий процес, показує статистику і дозволяє почати гру заново.
 * Важлива функція: викликає глобальний метод `window.finishGameAndSendResults`
 * для збереження прогресу на бекенді.
 */
export class GameOverScene extends Phaser.Scene {

    /**
     * @brief Ініціалізація сцени даними.
     * * Викликається автоматично при старті сцени. Отримує дані, передані з `GameScene`.
     * * @param {Object} data - Об'єкт з даними.
     * @param {number} [data.score=0] - Фінальний рахунок гравця.
     */
    init(data) {
        /** @property {number} finalScore - Збережений фінальний рахунок. */
        this.finalScore = data.score || 0;
        /** @property {boolean} resultsSent - Прапорець для запобігання подвійній відправці результатів. */
        this.resultsSent = false;
    }

    /**
     * @brief Конструктор сцени.
     * * Встановлює ключ сцени як 'GameOverScene'.
     */
    constructor() {
        super({ key: 'GameOverScene' });
    }

    /**
     * @brief Створення об'єктів сцени.
     * * Малює фон, тексти (Game Over, рахунок, рекорд), кнопку рестарту
     * та ініціює відправку результатів на сервер.
     */
    create() {
        const { width, height } = this.game.config;

        // Напівпрозорий чорний фон
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

        // Заголовок
        this.add.text(width / 2, height / 2 - 100, 'GAME OVER', {
            fontSize: '48px',
            fill: '#FF0000',
            fontFamily: '"Press Start 2P", cursive',
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Логіка High Score (Local Storage)
        let highScore = localStorage.getItem('coin_rush_highscore') || 0;
        let isNewRecord = false;

        if (this.finalScore > highScore) {
            highScore = this.finalScore;
            localStorage.setItem('coin_rush_highscore', highScore);
            isNewRecord = true;
        }

        // Відображення рахунку
        this.add.text(width / 2, height / 2, `РАХУНОК: ${this.finalScore}`, {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontFamily: '"Press Start 2P", cursive'
        }).setOrigin(0.5);

        // Відображення рекорду
        if (isNewRecord) {
            this.add.text(width / 2, height / 2 + 50, `НОВИЙ РЕКОРД! 🏆`, {
                fontSize: '20px',
                fill: '#FFD700',
                fontFamily: '"Press Start 2P", cursive'
            }).setOrigin(0.5);
        } else {
            this.add.text(width / 2, height / 2 + 50, `НАЙКРАЩИЙ: ${highScore}`, {
                fontSize: '16px',
                fill: '#AAAAAA',
                fontFamily: '"Press Start 2P", cursive'
            }).setOrigin(0.5);
        }

        // Кнопка рестарту
        const restartButton = this.add.text(width / 2, height / 2 + 120, '> СПРОБУВАТИ ЩЕ <', {
            fontSize: '20px',
            fill: '#00FF00',
            fontFamily: '"Press Start 2P", cursive',
            backgroundColor: '#111111',
            padding: { x: 10, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Інтерактивність кнопки
        restartButton.on('pointerover', () => restartButton.setStyle({ fill: '#ffff00' }));
        restartButton.on('pointerout', () => restartButton.setStyle({ fill: '#00ff00' }));

        restartButton.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
        });

        // --- ВІДПРАВКА РЕЗУЛЬТАТІВ (ТІЛЬКИ 1 РАЗ) ---
        // Викликає зовнішню функцію у script.js для зв'язку з бекендом
        if (!this.resultsSent) {
            this.resultsSent = true; // Блокуємо повторний виклик

            console.log("Game Over Scene. Sending results ONCE...");

            if (window.finishGameAndSendResults) {
                // Передаємо рахунок як очки і як монети (1 до 1)
                window.finishGameAndSendResults(this.finalScore, this.finalScore);
            } else {
                console.error("❌ Функція window.finishGameAndSendResults не знайдена!");
            }
        }
    }
}