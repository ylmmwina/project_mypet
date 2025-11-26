// src/main.js
import { StartScene } from './scenes/StartScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// Конфігурація гри
const config = {
    type: Phaser.AUTO,
    width: 1280, // Використовуємо HD роздільну здатність
    height: 720,
    parent: 'phaser-game', // ID контейнера
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT, // Розтягувати, зберігаючи пропорції
        autoCenter: Phaser.Scale.CENTER_BOTH // Центрувати
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [StartScene, GameScene, GameOverScene]
};

// Глобальна змінна для гри
let game = null;

// --- ФУНКЦІЯ ЗАПУСКУ ---
// Ми робимо її глобальною, щоб script.js міг її викликати
window.launchGame = () => {
    // Якщо гра вже існує, просто повертаємось (або відновлюємо її)
    if (game) {
        return;
    }

    // Створюємо гру ТІЛЬКИ зараз
    game = new Phaser.Game(config);
    window.gameInstance = game; // Для дебагу
};

// --- ФУНКЦІЯ ЗНИЩЕННЯ ---
// Щоб очистити пам'ять, коли виходимо
window.destroyGame = () => {
    if (game) {
        game.destroy(true); // true = видалити також і Canvas
        game = null;
        window.gameInstance = null;
    }
};