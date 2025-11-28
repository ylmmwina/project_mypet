// src/main.js
import { StartScene } from './scenes/StartScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { UIScene } from './scenes/UIScene.js'; // Додав на всяк випадок

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'phaser-game',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [StartScene, GameScene, UIScene, GameOverScene]
};

let game = null;

// Приймаємо petType як аргумент!
window.launchGame = (petType = 'cat') => {
    if (game) return;

    game = new Phaser.Game(config);

    // Зберігаємо тип тварини в глобальному реєстрі гри
    game.registry.set('petType', petType);

    window.gameInstance = game;
};

window.destroyGame = () => {
    if (game) {
        game.destroy(true);
        game = null;
        window.gameInstance = null;
    }
};