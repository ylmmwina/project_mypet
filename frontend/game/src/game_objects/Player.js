// src/game_objects/Player.js
export class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'player_sprite');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // ЗБІЛЬШЕНО: Швидкість і сила стрибка
        this.moveSpeed = 300;  // Було 250
        this.jumpForce = 550;  // Було 500

        // Примусовий розмір
        this.setDisplaySize(60, 60);
        this.setBodySize(60, 60);

        this.setGravityY(700); // Трохи швидше падіння для динаміки

        this.setCollideWorldBounds(false);
    }

    move(direction) {
        this.setVelocityX(direction * this.moveSpeed);
    }

    jump() {
        if (this.body.blocked.down || this.body.touching.down) {
            this.setVelocityY(-this.jumpForce);
        }
    }
}