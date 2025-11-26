// src/game_objects/Obstacle.js

export class Obstacle extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'obstacle_sprite');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setAllowGravity(false);
        this.setImmovable(true);
        this.setDisplaySize(32, 32);

        console.log("Obstacle: Об'єкт успішно ініціалізовано.");
    }

    /**
     * interact(): Метод взаємодії з гравцем.
     * Просто змінює вигляд гравця, логіка зупинки сцени делегована GameScene/SceneManager.
     */
    interact(player) {
        console.log("Obstacle: Game Over! Гравець зіткнувся з перешкодою.");

        // Робимо гравця сірим, щоб показати, що він "програв"
        player.setTint(0x999999);
        player.anims.stop();
    }
}