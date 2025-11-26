// src/game_objects/AssetsManager.js

export class AssetsManager {
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