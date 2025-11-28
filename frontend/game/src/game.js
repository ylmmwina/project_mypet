/**
 * @file game.js
 * @brief Основний файл конфігурації та запуску Phaser гри.
 * * Цей файл визначає параметри гри (розмір, тип рендера, фізика)
 * та ініціює створення екземпляра гри Phaser.
 */

import { SceneManager } from './scenes/SceneManager.js';

/**
 * @brief Об'єкт конфігурації гри Phaser.
 * @type {Object}
 * @property {number} width - Ширина полотна (canvas) гри.
 * @property {number} height - Висота полотна (canvas) гри.
 * @property {string} parent - Елемент, в який буде вставлений canvas (в даному випадку document.body).
 * @property {string} backgroundColor - Колір фону перед завантаженням сцен.
 * @property {Object} scale - Налаштування масштабування.
 * @property {Object} physics - Налаштування фізичного рушія (Arcade Physics).
 * @property {Object} render - Налаштування рендера (pixelArt для стилізації).
 * @property {Array<Phaser.Scene>} scene - Список сцен, які будуть додані в гру.
 */
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
            debug: false // Вимкнено дебаг фізики
        }
    },
    render: {
        pixelArt: true // Вмикаємо піксельний арт
    },
    scene: [] // Сцени додаються через SceneManager
};

/**
 * @brief Створення головного екземпляра гри Phaser.
 * @type {Phaser.Game}
 */
const game = new Phaser.Game(config);

/**
 * @brief Запуск менеджеру сцен.
 * * Ініціює процес додавання всіх сцен та запуск першої (StartScene).
 */
SceneManager.startScenes(game);