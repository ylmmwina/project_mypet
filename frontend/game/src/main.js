/**
 * @file main.js
 * @brief Основний лаунчер міні-гри Phaser.
 * * Цей файл відповідає за конфігурацію екземпляра гри Phaser.Game,
 * а також надає глобальні функції `launchGame` та `destroyGame`
 * для керування грою з основного інтерфейсу (script.js).
 */

import { StartScene } from './scenes/StartScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { UIScene } from './scenes/UIScene.js'; // Додав на всяк випадок

/**
 * @brief Об'єкт конфігурації гри Phaser.
 * * Налаштовує розмір, фізичний рушій (Arcade) та список усіх сцен.
 * @type {Object}
 */
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'phaser-game', // ID div-елемента в index.html, куди буде вбудовано canvas
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Гравітація відсутня на рівні конфігурації, щоб сцени могли встановлювати її самі
            debug: false
        }
    },
    scene: [StartScene, GameScene, UIScene, GameOverScene]
};

/** @property {Phaser.Game|null} game - Змінна для зберігання активного екземпляра гри Phaser. */
let game = null;

/**
 * @brief Запускає гру Phaser.
 * * Створює новий екземпляр гри та зберігає тип улюбленця (для вибору спрайта)
 * у глобальному реєстрі Phaser.
 * * @global
 * @param {string} [petType='cat'] - Тип улюбленця ('cat', 'dog', 'monkey').
 */
window.launchGame = (petType = 'cat') => {
    if (game) return; // Запобігання подвійному запуску

    game = new Phaser.Game(config);

    // Зберігаємо тип тварини в глобальному реєстрі гри
    game.registry.set('petType', petType);

    /** @property {Phaser.Game} window.gameInstance - Глобальний доступ до екземпляра гри. */
    window.gameInstance = game;
};

/**
 * @brief Знищує активний екземпляр гри Phaser.
 * * Викликається після завершення гри (або при натисканні кнопки "Вихід")
 * для очищення пам'яті та закриття Canvas.
 * * @global
 */
window.destroyGame = () => {
    if (game) {
        game.destroy(true); // true означає, що canvas також буде видалено
        game = null;
        window.gameInstance = null;
    }
};