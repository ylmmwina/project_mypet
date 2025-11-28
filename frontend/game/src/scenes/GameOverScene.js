// src/scenes/GameOverScene.js
export class GameOverScene extends Phaser.Scene {
    init(data) {
        this.finalScore = data.score || 0;
        this.resultsSent = false; // Прапорець, щоб не відправляти двічі
    }

    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const { width, height } = this.game.config;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

        this.add.text(width / 2, height / 2 - 100, 'GAME OVER', {
            fontSize: '48px',
            fill: '#FF0000',
            fontFamily: '"Press Start 2P", cursive',
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5);

        let highScore = localStorage.getItem('coin_rush_highscore') || 0;
        let isNewRecord = false;

        if (this.finalScore > highScore) {
            highScore = this.finalScore;
            localStorage.setItem('coin_rush_highscore', highScore);
            isNewRecord = true;
        }

        this.add.text(width / 2, height / 2, `РАХУНОК: ${this.finalScore}`, {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontFamily: '"Press Start 2P", cursive'
        }).setOrigin(0.5);

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

        const restartButton = this.add.text(width / 2, height / 2 + 120, '> СПРОБУВАТИ ЩЕ <', {
            fontSize: '20px',
            fill: '#00FF00',
            fontFamily: '"Press Start 2P", cursive',
            backgroundColor: '#111111',
            padding: { x: 10, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        restartButton.on('pointerover', () => restartButton.setStyle({ fill: '#ffff00' }));
        restartButton.on('pointerout', () => restartButton.setStyle({ fill: '#00ff00' }));

        restartButton.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
        });

        // --- ВІДПРАВКА РЕЗУЛЬТАТІВ (ТІЛЬКИ 1 РАЗ) ---
        if (!this.resultsSent) {
            this.resultsSent = true; // Блокуємо повторний виклик

            console.log("Game Over Scene. Sending results ONCE...");

            if (window.finishGameAndSendResults) {
                window.finishGameAndSendResults(this.finalScore, this.finalScore);
            } else {
                console.error("❌ Функція window.finishGameAndSendResults не знайдена!");
            }
        }
    }
}