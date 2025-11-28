/**
 * @file GameScene.js
 * @brief Головна ігрова сцена (Endless Runner).
 * * Цей файл містить основну логіку гри: процедурну генерацію рівня,
 * управління персонажем, фізику, збір монет та обробку програшу.
 */

import { Player } from '../game_objects/Player.js';
import { Coin } from '../game_objects/Coin.js';
import { Obstacle } from '../game_objects/Obstacle.js';
import { Scoreboard } from '../game_objects/Scoreboard.js';
import { AssetsManager } from '../game_objects/AssetsManager.js';
import { SceneManager } from './SceneManager.js';

/**
 * @class GameScene
 * @extends Phaser.Scene
 * @brief Основна сцена геймплею.
 * * Реалізує механіку нескінченного раннера. Світ генерується "чанками" (шматками)
 * по мірі просування гравця вправо. Також відповідає за камеру та очищення
 * об'єктів, що вийшли за межі екрану.
 */
export class GameScene extends Phaser.Scene {

    /**
     * @brief Конструктор сцени.
     */
    constructor() {
        super({key: 'GameScene'});
    }

    /**
     * @brief Попереднє завантаження ресурсів.
     * * Особливість: динамічно вибирає спрайт гравця залежно від обраного улюбленця
     * (зчитує `petType` з реєстру гри).
     */
    preload() {
        const assets = AssetsManager.getAssetsMap();

        // --- ДИНАМІЧНЕ ЗАВАНТАЖЕННЯ СПРАЙТА ---
        // Дістаємо тип з реєстру (cat, dog, monkey), який ми передали з main.js
        const petType = this.registry.get('petType') || 'cat';

        // Формуємо шлях: assets/dog_normal.png
        const spritePath = `assets/${petType}_normal.png`;

        console.log(`Loading player sprite: ${spritePath}`);

        // Завантажуємо саме цей файл під ключем 'player_sprite'
        this.load.image(assets.player.key, spritePath);
        // ---------------------------------------

        this.load.image(assets.coin.key, assets.coin.path);
        this.load.image(assets.obstacle.key, assets.obstacle.path);
        this.load.image(assets.platform.key, assets.platform.path);
        this.load.image(assets.clouds.key, assets.clouds.path);
    }

    /**
     * @brief Ініціалізація ігрового світу.
     * * Створює фон, гравця, групи об'єктів, камеру та стартові платформи.
     * Налаштовує колізії (зіткнення) та управління.
     */
    create() {
        const {width, height} = this.game.config;

        this.cameras.main.setBackgroundColor('#87CEEB');
        // Встановлюємо межі світу "нескінченними" по осі X
        this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 800);

        // Паралакс фон (хмари)
        this.cloudsBg = this.add.tileSprite(0, 0, width, height, 'clouds_bg');
        this.cloudsBg.setOrigin(0, 0);
        this.cloudsBg.setScrollFactor(0); // Фон зафіксований відносно камери
        this.cloudsBg.setDepth(-10);

        // Групи фізичних об'єктів
        this.platforms = this.add.group();
        this.coins = this.add.group();
        this.obstacles = this.add.group();

        // Створення гравця
        this.player = new Player(this, 100, 200);
        this.player.setDepth(10);

        // Налаштування камери (слідкує за гравцем)
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setFollowOffset(-200, 0); // Зміщуємо камеру, щоб гравець був зліва

        this.scoreboard = new Scoreboard(this);
        this.scoreboard.scoreText.setDepth(20);

        // Управління
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D');

        // Генерація стартової платформи
        this.nextSpawnX = 0;
        this.spawnPlatform(400, 1200);
        this.nextSpawnX += 1200;

        // Генерація перших чанків світу
        for (let i = 0; i < 5; i++) {
            this.generateChunk();
        }

        // Налаштування фізики
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.coins.getChildren(), this.handleCoinCollection, null, this);
        this.physics.add.overlap(this.player, this.obstacles.getChildren(), this.handleObstacleCollision, null, this);
    }

    /**
     * @brief Генерація нового шматка рівня (чанка).
     * * Вираховує випадкову ширину платформи та розрив між ними.
     * Викликає спавн платформи та об'єктів на ній.
     */
    generateChunk() {
        const chunkWidth = Phaser.Math.Between(600, 1000);
        const gap = Phaser.Math.Between(0, 50); // Розрив між платформами
        const platformX = this.nextSpawnX + gap + (chunkWidth / 2);

        this.spawnPlatform(platformX, chunkWidth);
        this.spawnObjects(this.nextSpawnX + gap, chunkWidth);

        this.nextSpawnX += chunkWidth + gap;
    }

    /**
     * @brief Створення спрайта платформи.
     * * @param {number} x - Центр платформи по X.
     * @param {number} width - Ширина платформи.
     */
    spawnPlatform(x, width) {
        const platform = this.add.tileSprite(x, 600, width, 32, 'platform_sprite');
        this.physics.add.existing(platform, true); // true = статичне тіло
        platform.setDepth(1);
        this.platforms.add(platform);
    }

    /**
     * @brief Розміщення монет та перешкод на платформі.
     * * Проходить по ширині платформи і з певною ймовірністю ставить об'єкти.
     * * @param {number} startX - Початок платформи.
     * @param {number} width - Ширина платформи.
     */
    spawnObjects(startX, width) {
        const steps = Math.floor(width / 100);
        const actualStartX = startX;

        for (let i = 1; i < steps; i++) {
            const spawnX = actualStartX + (i * 100);
            const chance = Phaser.Math.Between(0, 100);

            if (chance < 25) { // 25% шанс монетки
                const randomY = Phaser.Math.Between(450, 550);
                const coin = new Coin(this, spawnX, randomY);
                this.coins.add(coin);
                coin.setTint(0xffffff);
                coin.setDisplaySize(32, 32);
                coin.setDepth(2);
            } else if (chance > 90) { // 10% шанс перешкоди
                if (i < steps - 1) { // Не ставити на самому краю
                    const obstacle = new Obstacle(this, spawnX, 580);
                    this.obstacles.add(obstacle);
                    obstacle.setTint(0xffffff);
                    obstacle.setDisplaySize(40, 40);
                    obstacle.setDepth(2);
                }
            }
        }
    }

    /**
     * @brief Обробка збору монети.
     * * @param {Player} player - Гравець.
     * @param {Coin} coin - Монетка.
     */
    handleCoinCollection(player, coin) {
        coin.interact(player);
        this.scoreboard.addScore(coin.scoreValue);
    }

    /**
     * @brief Обробка зіткнення з перешкодою.
     * * Викликає Game Over.
     * * @param {Player} player - Гравець.
     * @param {Obstacle} obstacle - Перешкода.
     */
    handleObstacleCollision(player, obstacle) {
        obstacle.interact(player);
        SceneManager.gameOver(this, this.scoreboard.getScore());
    }

    /**
     * @brief Ігровий цикл (викликається кожен кадр).
     * * Відповідає за:
     * - Рух фону.
     * - Обробку введення (рух гравця).
     * - Поворот спрайта гравця (Flip X).
     * - Генерацію нових чанків (нескінченний рівень).
     * - Видалення об'єктів, що залишилися позаду (оптимізація).
     * - Перевірку падіння у прірву.
     */
    update() {
        this.cloudsBg.tilePositionX += 0.5; // Анімація фону

        const isLeft = this.cursors.left.isDown || this.keys.A.isDown;
        const isRight = this.cursors.right.isDown || this.keys.D.isDown;
        const isJump = this.cursors.up.isDown || this.keys.W.isDown || this.cursors.space.isDown;

        // --- ЛОГІКА РУХУ ТА ПОВОРОТУ СПРАЙТА ---
        if (isLeft) {
            this.player.move(-1);
            // Якщо йдемо вліво і спрайт дивиться вліво (default), flip не треба
            this.player.setFlipX(false);
        } else if (isRight) {
            this.player.move(1);
            // Якщо йдемо вправо, дзеркалимо спрайт
            this.player.setFlipX(true);
        } else {
            this.player.move(0);
        }

        if (isJump) {
            this.player.jump();
        }

        // Генерація нових платформ попереду
        if (this.player.x > this.nextSpawnX - 800) {
            this.generateChunk();
            // Оновлюємо колайдери для нових об'єктів
            this.physics.add.collider(this.player, this.platforms);
            this.physics.add.overlap(this.player, this.coins.getChildren(), this.handleCoinCollection, null, this);
            this.physics.add.overlap(this.player, this.obstacles.getChildren(), this.handleObstacleCollision, null, this);
        }

        // Очищення старих об'єктів (Garbage Collection)
        const deleteThreshold = this.player.x - 1000;
        this.platforms.children.each(plat => {
            if (plat.x + plat.width < deleteThreshold) plat.destroy();
        });
        this.coins.children.each(c => {
            if (c.x < deleteThreshold) c.destroy();
        });
        this.obstacles.children.each(o => {
            if (o.x < deleteThreshold) o.destroy();
        });

        // Перевірка падіння (Game Over)
        if (this.player.y > 800) {
            SceneManager.gameOver(this, this.scoreboard.getScore());
        }
    }
}