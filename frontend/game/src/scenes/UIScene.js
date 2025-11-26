// src/scenes/UIScene.js
// Сцена для відображення елементів UI (кнопок, меню).
// Працює паралельно з GameScene.

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        console.log("UIScene: Сцена UI запущена.");

        // Отримуємо посилання на головну сцену гри
        this.gameScene = this.scene.get('GameScene');

        // Додавання кнопки "Пауза"
        const pauseButton = this.add.text(
            this.game.config.width - 100, 16,
            'ПАУЗА',
            { fontSize: '20px', fill: '#FFFFFF', backgroundColor: '#333333' }
        )
            .setInteractive() // Робимо текст клікабельним
            .setScrollFactor(0); // Фіксуємо на екрані

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

        // TODO: Пізніше тут буде відображення рахунку, якщо ми вирішимо розділити UI.
    }
}