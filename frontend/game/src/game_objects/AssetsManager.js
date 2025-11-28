/**
 * @file AssetsManager.js
 * @brief Менеджер ігрових ресурсів (асетів).
 * * Цей файл відповідає за централізоване зберігання шляхів до зображень
 * та ключів для їх завантаження у Phaser.
 */

/**
 * @class AssetsManager
 * @brief Статичний клас для управління ресурсами гри.
 * * Надає єдину точку доступу до мапи асетів, що спрощує їх завантаження
 * у сценах (Preload) та використання у грі.
 */
export class AssetsManager {

    /**
     * @brief Отримати мапу ресурсів.
     * * Повертає об'єкт, де ключами є логічні назви елементів (player, coin),
     * а значеннями — об'єкти з ключем для кешу Phaser та шляхом до файлу.
     * * @returns {Object} Об'єкт конфігурації асетів.
     * Структура поверненого об'єкта:
     * {
     * key: string, // Унікальний ключ для Phaser
     * path: string // Відносний шлях до файлу зображення
     * }
     */
    static getAssetsMap() {
        return {
            // Додаємо префікс 'game/', бо index.html лежить на рівень вище
            player: { key: 'player_sprite', path: 'game/assets/player_cat.png' },
            coin: { key: 'coin_sprite', path: 'game/assets/coin.png' },
            obstacle: { key: 'obstacle_sprite', path: 'game/assets/obstacle.png' },
            platform: { key: 'platform_sprite', path: 'game/assets/platform.png' },
            clouds: { key: 'clouds_bg', path: 'game/assets/clouds.png' }
        };
    }
}