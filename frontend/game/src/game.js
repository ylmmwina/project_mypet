// src/game.js
import { SceneManager } from './scenes/SceneManager.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: document.body, // Важливо: додаємо канвас прямо в body, де працює flex
    backgroundColor: '#000000', // Чорний фон, поки нічого не завантажилось
    scale: {
        mode: Phaser.Scale.FIT, // Масштабування під розмір вікна
        autoCenter: Phaser.Scale.CENTER_BOTH // Центрування силами Phaser
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    render: {
        pixelArt: true
    },
    scene: [] // Сцени додаються через SceneManager
};

const game = new Phaser.Game(config);
SceneManager.startScenes(game);