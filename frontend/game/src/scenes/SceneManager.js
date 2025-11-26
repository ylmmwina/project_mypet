// src/scenes/SceneManager.js
import { StartScene } from './StartScene.js'; // <-- Додали імпорт
import { GameScene } from './GameScene.js';
import { UIScene } from './UIScene.js';
import { GameOverScene } from './GameOverScene.js';

export class SceneManager {
    static startScenes(game) {
        // Додаємо всі сцени в гру
        game.scene.add('StartScene', StartScene);
        game.scene.add('GameScene', GameScene);
        game.scene.add('UIScene', UIScene);
        game.scene.add('GameOverScene', GameOverScene);

        // ЗАПУСКАЄМО ТІЛЬКИ СТАРТОВУ СЦЕНУ
        game.scene.start('StartScene');
        console.log("SceneManager: Запущено StartScene.");
    }

    // Метод переходу з меню в гру
    static startGame(scene) {
        scene.scene.stop('StartScene');
        scene.scene.stop('GameOverScene'); // На випадок перезапуску

        scene.scene.start('GameScene');
        scene.scene.start('UIScene');
    }

    // Метод переходу в Game Over
    static gameOver(scene, score) {
        scene.scene.stop('UIScene');
        scene.scene.pause('GameScene'); // Пауза замість стоп, щоб видно було, де програв

        // Запускаємо Game Over поверх гри
        scene.scene.start('GameOverScene', { score: score });
    }
}