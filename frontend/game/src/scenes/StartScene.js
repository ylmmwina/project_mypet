// src/scenes/StartScene.js
import { SceneManager } from './SceneManager.js';

export class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        const { width, height } = this.game.config;

        // Чорний фон
        this.cameras.main.setBackgroundColor('#000000');

        // 1. ЗАГОЛОВОК
        this.add.text(width / 2, height / 2 - 80, 'COIN RUSH', {
            fontSize: '48px',
            fill: '#FFD700', // Золотий
            fontFamily: '"Press Start 2P", cursive', // Піксельний шрифт
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // 2. ЛОГІКА РЕКОРДУ (HIGH SCORE)
        const highScore = localStorage.getItem('coin_rush_highscore') || 0;

        this.add.text(width / 2, height / 2, `РЕКОРД: ${highScore}`, {
            fontSize: '20px',
            fill: '#00FF00', // Зелений
            fontFamily: '"Press Start 2P", cursive',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 3. ІНСТРУКЦІЯ
        const startText = this.add.text(width / 2, height / 2 + 80, 'НАТИСНИ ЩОБ ПОЧАТИ', {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: '"Press Start 2P", cursive'
        }).setOrigin(0.5);

        // Анімація миготіння тексту
        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // 4. ОБРОБКА СТАРТУ
        // Клік мишкою або тач
        this.input.on('pointerdown', () => {
            SceneManager.startGame(this);
        });

        // Клавіша Пробіл
        this.input.keyboard.on('keydown-SPACE', () => {
            SceneManager.startGame(this);
        });
    }
}