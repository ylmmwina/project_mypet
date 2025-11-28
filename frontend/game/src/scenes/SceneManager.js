/**
 * @file SceneManager.js
 * @brief Менеджер сцен (переходів) у грі.
 * * Цей файл відповідає за реєстрацію всіх сцен у грі та управління переходами
 * між ними (Старт -> Гра -> Game Over).
 */

import { StartScene } from './StartScene.js';
import { GameScene } from './GameScene.js';
import { UIScene } from './UIScene.js';
import { GameOverScene } from './GameOverScene.js';

/**
 * @class SceneManager
 * @brief Статичний клас для управління сценами.
 * * Надає методи для ініціалізації гри, запуску ігрового процесу
 * та обробки завершення гри (Game Over). Дозволяє централізовано керувати
 * потоком гри.
 */
export class SceneManager {

    /**
     * @brief Реєстрація та запуск початкових сцен.
     * * Додає всі класи сцен у менеджер сцен Phaser'а та запускає стартове меню.
     * Цей метод викликається лише один раз при ініціалізації гри (`main.js` або `game.js`).
     * * @param {Phaser.Game} game - Екземпляр гри Phaser.
     */
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

    /**
     * @brief Перехід зі стартового меню до гри.
     * * Зупиняє меню та сцену Game Over (якщо була), запускає основну гру та UI.
     * * @param {Phaser.Scene} scene - Поточна активна сцена (зазвичай StartScene або GameOverScene),
     * з якої здійснюється виклик.
     */
    static startGame(scene) {
        scene.scene.stop('StartScene');
        scene.scene.stop('GameOverScene'); // На випадок перезапуску

        scene.scene.start('GameScene');
        scene.scene.start('UIScene');
    }

    /**
     * @brief Обробка програшу (Game Over).
     * * Зупиняє UI, ставить гру на паузу (для ефекту завмирання, щоб гравець бачив, де помилився)
     * та запускає сцену Game Over поверх гри, передаючи їй фінальний рахунок.
     * * @param {Phaser.Scene} scene - Поточна ігрова сцена (GameScene).
     * @param {number} score - Фінальний рахунок гравця.
     */
    static gameOver(scene, score) {
        scene.scene.stop('UIScene');
        scene.scene.pause('GameScene'); // Пауза замість стоп, щоб видно було, де програв

        // Запускаємо Game Over поверх гри, передаючи рахунок через об'єкт даних
        scene.scene.start('GameOverScene', { score: score });
    }
}