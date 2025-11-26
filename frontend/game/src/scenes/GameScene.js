// src/scenes/GameScene.js
import { Player } from '../game_objects/Player.js';
import { Coin } from '../game_objects/Coin.js';
import { Obstacle } from '../game_objects/Obstacle.js';
import { Scoreboard } from '../game_objects/Scoreboard.js';
import { AssetsManager } from '../game_objects/AssetsManager.js';
import { SceneManager } from './SceneManager.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        const assets = AssetsManager.getAssetsMap();
        // Завантажуємо всі картинки
        this.load.image(assets.player.key, assets.player.path);
        this.load.image(assets.coin.key, assets.coin.path);
        this.load.image(assets.obstacle.key, assets.obstacle.path);
        this.load.image(assets.platform.key, assets.platform.path);

        // НОВЕ: Завантажуємо хмари
        this.load.image(assets.clouds.key, assets.clouds.path);
    }

    create() {
        // Отримуємо розміри екрану гри
        const { width, height } = this.game.config;

        // 1. ФОН (Колір + Хмари)
        // Встановлюємо блакитний колір на випадок, якщо картинка має прозорість
        this.cameras.main.setBackgroundColor('#87CEEB');
        this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 800);

        // --- СТВОРЕННЯ ХМАРНОГО ФОНУ ---
        // Створюємо tileSprite, який покриває весь екран
        this.cloudsBg = this.add.tileSprite(0, 0, width, height, 'clouds_bg');

        // Ставимо точку відліку в лівий верхній кут
        this.cloudsBg.setOrigin(0, 0);

        // Прив'язуємо до камери (щоб не рухався разом з гравцем, а був як шпалери)
        this.cloudsBg.setScrollFactor(0);

        // Відправляємо на найдальший задній план (глибина -10)
        this.cloudsBg.setDepth(-10);
        // -------------------------------

        // 2. Групи об'єктів
        this.platforms = this.add.group();
        this.coins = this.add.group();
        this.obstacles = this.add.group();

        // 3. Гравець
        this.player = new Player(this, 100, 200);
        // Гравець має бути поверх усього (глибина 10)
        this.player.setDepth(10);

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setFollowOffset(-200, 0);

        // 4. Інтерфейс (Рахунок)
        this.scoreboard = new Scoreboard(this);
        // Рахунок ще вище (глибина 20)
        this.scoreboard.scoreText.setDepth(20);

        // 5. Керування
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D');

        // 6. Генерація світу
        this.nextSpawnX = 0;
        this.spawnPlatform(400, 1200);
        this.nextSpawnX += 1200;

        for(let i = 0; i < 5; i++) {
            this.generateChunk();
        }

        // 7. Колізії
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.coins.getChildren(), this.handleCoinCollection, null, this);
        this.physics.add.overlap(this.player, this.obstacles.getChildren(), this.handleObstacleCollision, null, this);
    }

    generateChunk() {
        const chunkWidth = Phaser.Math.Between(600, 1000);
        const gap = Phaser.Math.Between(0, 50);
        const platformX = this.nextSpawnX + gap + (chunkWidth / 2);
        this.spawnPlatform(platformX, chunkWidth);
        this.spawnObjects(this.nextSpawnX + gap, chunkWidth);
        this.nextSpawnX += chunkWidth + gap;
    }

    spawnPlatform(x, width) {
        // Використовуємо tileSprite для платформи, щоб текстура повторювалась
        const platform = this.add.tileSprite(x, 600, width, 32, 'platform_sprite');
        this.physics.add.existing(platform, true);
        // Платформи на глибині 1 (перед фоном, за гравцем)
        platform.setDepth(1);
        this.platforms.add(platform);
    }

    spawnObjects(startX, width) {
        const steps = Math.floor(width / 100);
        const actualStartX = startX;

        for (let i = 1; i < steps; i++) {
            const spawnX = actualStartX + (i * 100);
            const chance = Phaser.Math.Between(0, 100);

            if (chance < 25) {
                const randomY = Phaser.Math.Between(450, 550);
                const coin = new Coin(this, spawnX, randomY);
                this.coins.add(coin);
                coin.setTint(0xffffff);
                coin.setDisplaySize(32, 32);
                // Монетки на глибині 2
                coin.setDepth(2);
            }
            else if (chance > 90) {
                if (i < steps - 1) {
                    const obstacle = new Obstacle(this, spawnX, 580);
                    this.obstacles.add(obstacle);
                    obstacle.setTint(0xffffff);
                    obstacle.setDisplaySize(40, 40);
                    // Перешкоди на глибині 2
                    obstacle.setDepth(2);
                }
            }
        }
    }

    handleCoinCollection(player, coin) {
        coin.interact(player);
        this.scoreboard.addScore(coin.scoreValue);
    }

    handleObstacleCollision(player, obstacle) {
        obstacle.interact(player);
        SceneManager.gameOver(this, this.scoreboard.getScore());
    }

    update() {
        // --- РУХ ХМАР ---
        // Прокручуємо текстуру фону. 0.5 - це швидкість.
        // Можеш збільшити, якщо хочеш швидші хмари.
        this.cloudsBg.tilePositionX += 0.5;
        // -----------------

        const isLeft = this.cursors.left.isDown || this.keys.A.isDown;
        const isRight = this.cursors.right.isDown || this.keys.D.isDown;
        const isJump = this.cursors.up.isDown || this.keys.W.isDown || this.cursors.space.isDown;

        if (isLeft) {
            this.player.move(-1);
            this.player.setFlipX(true);
        } else if (isRight) {
            this.player.move(1);
            this.player.setFlipX(false);
        } else {
            this.player.move(0);
        }

        if (isJump) {
            this.player.jump();
        }

        if (this.player.x > this.nextSpawnX - 800) {
            this.generateChunk();

            this.physics.add.collider(this.player, this.platforms);
            this.physics.add.overlap(this.player, this.coins.getChildren(), this.handleCoinCollection, null, this);
            this.physics.add.overlap(this.player, this.obstacles.getChildren(), this.handleObstacleCollision, null, this);
        }

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

        if (this.player.y > 800) {
            SceneManager.gameOver(this, this.scoreboard.getScore());
        }
    }
}