// src/game_objects/Scoreboard.js
export class Scoreboard {
    /**
     * @param {Phaser.Scene} scene - Сцена, до якої належить цей об'єкт.
     */
    constructor(scene) {
        this.scene = scene;
        this.score = 0;

        this.scoreText = scene.add.text(16, 16, 'SCORE: 0', {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontFamily: '"Press Start 2P", cursive', // <-- НОВИЙ ШРИФТ
            stroke: '#000000', // Чорна обводка для контрасту
            strokeThickness: 4
        });

        // Закріплюємо текст, щоб він не рухався разом з камерою
        this.scoreText.setScrollFactor(0);
        // Поверх усього
        this.scoreText.setDepth(100);

        // --- ВАЖЛИВО: ПІДПИСКА НА ПОДІЇ ---
        // Ми слухаємо подію 'collectCoin', яку буде запускати монетка або гравець.
        // Коли подія стається, викликається метод this.addScore.
        // Ми перевіряємо, чи існує scene.events, щоб уникнути помилки, яку ти бачила.
        if (this.scene.events) {
            this.scene.events.on('collectCoin', this.addScore, this);
        }

        // Важливо: прибираємо слухача подій при знищенні сцени, щоб не було витоку пам'яті
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.scene.events) {
                this.scene.events.off('collectCoin', this.addScore, this);
            }
        });
    }

    getScore() {
        return this.score;
    }

    /**
     * Додає бали до поточного рахунку і оновлює текст.
     * @param {number} points - Кількість балів (за замовчуванням 10).
     */
    addScore(points = 10) {
        this.score += points;
        this.scoreText.setText('Score: ' + this.score);
    }
}