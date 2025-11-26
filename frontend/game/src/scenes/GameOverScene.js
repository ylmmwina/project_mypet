// src/scenes/GameOverScene.js
export class GameOverScene extends Phaser.Scene {
    init(data) {
        // Отримуємо рахунок, переданий з GameScene
        this.finalScore = data.score || 0;
    }

    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const { width, height } = this.game.config;

        // Напівпрозорий чорний фон поверх гри
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

        // 1. ЗАГОЛОВОК "GAME OVER"
        this.add.text(width / 2, height / 2 - 100, 'GAME OVER', {
            fontSize: '48px',
            fill: '#FF0000', // Червоний
            fontFamily: '"Press Start 2P", cursive',
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 2. ЛОГІКА ЗБЕРЕЖЕННЯ РЕКОРДУ
        let highScore = localStorage.getItem('coin_rush_highscore') || 0;
        let isNewRecord = false;

        if (this.finalScore > highScore) {
            highScore = this.finalScore;
            localStorage.setItem('coin_rush_highscore', highScore);
            isNewRecord = true;
        }

        // 3. ВІДОБРАЖЕННЯ ПОТОЧНОГО РАХУНКУ
        this.add.text(width / 2, height / 2, `РАХУНОК: ${this.finalScore}`, {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontFamily: '"Press Start 2P", cursive'
        }).setOrigin(0.5);

        // 4. ВІДОБРАЖЕННЯ СТАТУСУ РЕКОРДУ
        if (isNewRecord) {
            this.add.text(width / 2, height / 2 + 50, `НОВИЙ РЕКОРД! 🏆`, {
                fontSize: '20px',
                fill: '#FFD700', // Золотий
                fontFamily: '"Press Start 2P", cursive'
            }).setOrigin(0.5);
        } else {
            this.add.text(width / 2, height / 2 + 50, `НАЙКРАЩИЙ: ${highScore}`, {
                fontSize: '16px',
                fill: '#AAAAAA', // Сірий
                fontFamily: '"Press Start 2P", cursive'
            }).setOrigin(0.5);
        }

        // 5. КНОПКА ПЕРЕЗАПУСКУ
        const restartButton = this.add.text(width / 2, height / 2 + 120, '> СПРОБУВАТИ ЩЕ <', {
            fontSize: '20px',
            fill: '#00FF00',
            fontFamily: '"Press Start 2P", cursive',
            backgroundColor: '#111111',
            padding: { x: 10, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Ефект при наведенні миші
        restartButton.on('pointerover', () => restartButton.setStyle({ fill: '#ffff00' }));
        restartButton.on('pointerout', () => restartButton.setStyle({ fill: '#00ff00' }));

        // Логіка натискання
        restartButton.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            // Повертаємось у меню, щоб побачити оновлений рекорд на головній
            this.scene.start('StartScene');
        });
    }
}