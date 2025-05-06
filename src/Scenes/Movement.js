class Movement extends Phaser.Scene {
    constructor() {
        super("movementScene");

        this.speed = 5;
        this.bulletSpeed = 10;
        this.poopSpeed = 5;
    }

    preload() {
        // Load images
        this.load.setPath("./assets/");
        this.load.image("player", "Player.png");
        this.load.image("bullet", "Bullet.png");
        this.load.image("duck", "Duck.png");
        this.load.image("redDuck", "RedDuck.png");
        this.load.image("poop", "Poop.png");
        this.load.image("explosion", "Explosion.png");
        this.load.image("heart", "Heart.png");

        // Load sounds
        this.load.audio("explosionSound", "explosionCrunch_000.ogg");
        this.load.audio("laserSound", "laserLarge_000.ogg");
        this.load.audio("roundClearSound", "confirmation_004.ogg");
        this.load.audio("backSound", "back_004.ogg");
    }
    create() {
        // Set up keys
        this.AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.RKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        // Set up sounds
        this.explosionSound = this.sound.add("explosionSound");
        this.laserSound = this.sound.add("laserSound");
        this.roundClearSound = this.sound.add("roundClearSound");
        this.backSound = this.sound.add("backSound");

        this.initGame();
    }

    initGame() {
        // Set up all variables
        this.ducks = [];
        this.bullets = [];
        this.poops = [];
        this.health = 3;
        this.score = 0;
        this.round = 1;
        this.lastShotTime = 0;
        this.shootCooldown = 500;
        this.gameOver = false;

        // Player sprite
        this.player = this.add.sprite(this.scale.width / 2, this.scale.height - 50, 'player');

        // Score text
        this.scoreText = this.add.text(20, 20, "Score: 0", { fontSize: "20px", fill: "#fff" });

        // Hearts
        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            let heart = this.add.image(this.scale.width - 100 - i * 80, 40, 'heart').setScale(0.1).setOrigin(0.5, 0);
            this.hearts.push(heart);
        }

        this.spawnRound();
    }
    spawnRound() {
        let duckCount = Math.min(8, 5 + this.round);
        let redCount = Math.min(6, Math.max(1, duckCount - 2));
        let padding = 50;
        let spacing = (this.scale.width - padding * 2) / (duckCount - 1);
        // Ducks
        for (let i = 0; i < duckCount; i++) {
            let x = padding + spacing * i;
            let d = this.add.sprite(x, 180, 'duck').setScale(0.2);
            this.ducks.push(d);

            // Poop timer
            this.time.addEvent({
                delay: Phaser.Math.Between(1500, 3000),
                loop: true,
                callback: () => {
                    if (!d.active) return;
                    let poop = this.add.sprite(d.x, d.y, 'poop').setScale(0.3);
                    this.poops.push(poop);
                }
            });
          // Move side to side
            this.tweens.add({
                targets: d,
                x: { from: x - 40, to: x + 40 },
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        // Red ducks
        for (let i = 0; i < redCount; i++) {
            let x = padding + spacing * (i + 0.5);
            let r = this.add.sprite(x, 130, 'redDuck').setScale(0.15);
            r.state = 'waiting';
            this.ducks.push(r);

            this.tweens.add({
                targets: r,
                x: { from: x + 40, to: x - 40 },
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Dive attack after delay
            this.time.delayedCall(Phaser.Math.Between(0, 10000), () => {
                if (r.active) {
                    r.state = 'diving';
                    let dx = this.player.x - r.x;
                    let dy = this.player.y - r.y;
                    let mag = Math.hypot(dx, dy) || 1;
                    r.vx = (dx / mag) * 200;
                    r.vy = (dy / mag) * 200;
                }
            });
        }
    }
    takeDamage() {
        if (this.health > 0) {
            this.backSound.play();
            this.health--;
            this.hearts[this.health].setVisible(false);

            if (this.health <= 0) {
                // Explosion
                let ex = this.add.sprite(this.player.x, this.player.y, 'explosion').setScale(0.1);
                this.explosionSound.play();
                this.time.delayedCall(500, () => ex.destroy());

                
                this.player.destroy();

                // Clear all objects
                this.ducks.forEach(d => d.destroy());
                this.bullets.forEach(b => b.destroy());
                this.poops.forEach(p => p.destroy());
                this.ducks = [];
                this.bullets = [];
                this.poops = [];
                this.gameOver = true;

                // Show game over
                this.add.text(this.scale.width / 2, this.scale.height / 2, "Game Over\nPress R to Restart", {
                    fontSize: "32px",
                    fill: "#fff",
                    align: "center"
                }).setOrigin(0.5);

                this.input.keyboard.once('keydown-R', () => {
                    this.scene.restart();
                });
            }
        }
    }



    update(time, delta) {
        if (this.gameOver) return;

        // Move player
        if (this.AKey.isDown) this.player.x -= this.speed;
        if (this.DKey.isDown) this.player.x += this.speed;
        this.player.x = Phaser.Math.Clamp(this.player.x, 0, this.scale.width);

        // Shoot
        if (this.spaceKey.isDown && time > this.lastShotTime + this.shootCooldown) {
            let b = this.add.sprite(this.player.x, this.player.y, 'bullet');
            this.bullets.push(b);
            this.laserSound.play();
            this.lastShotTime = time;
        }

        // Move bullets and check hit
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.y -= this.bulletSpeed;

            for (let j = this.ducks.length - 1; j >= 0; j--) {
                let d = this.ducks[j];
                if (Phaser.Geom.Intersects.RectangleToRectangle(b.getBounds(), d.getBounds())) {
                    let ex = this.add.sprite(d.x, d.y, 'explosion').setScale(d.scaleX);
                    this.explosionSound.play();
                    this.time.delayedCall(500, () => ex.destroy());
                    d.destroy();
                    b.destroy();
                    this.ducks.splice(j, 1);
                    this.bullets.splice(i, 1);
                    this.score += d.texture.key === 'redDuck' ? 200 : 100;
                    this.scoreText.setText("Score: " + this.score);
                    break;
                }
            }

            if (b.y < -10) {
                b.destroy();
                this.bullets.splice(i, 1);
            }
        }
        // Red ducks dive and can hit player
        for (let d of this.ducks) {
            if (d.texture.key === 'redDuck' && d.state === 'diving') {
                d.x += d.vx * (delta / 1000);
                d.y += d.vy * (delta / 1000);

                if (this.player.active && Phaser.Geom.Intersects.RectangleToRectangle(d.getBounds(), this.player.getBounds())) {
                    let ex = this.add.sprite(d.x, d.y, 'explosion').setScale(d.scaleX);
                    this.explosionSound.play();
                    this.time.delayedCall(500, () => ex.destroy());
                    d.destroy();
                    this.ducks.splice(this.ducks.indexOf(d), 1);
                    this.takeDamage();
                    break;
                }
                if (d.y > this.scale.height + d.displayHeight / 2) {
                    let ex = this.add.sprite(d.x, this.scale.height, 'explosion').setScale(d.scaleX);
                    this.explosionSound.play();
                    this.time.delayedCall(500, () => ex.destroy());
                    d.destroy();
                    this.ducks.splice(this.ducks.indexOf(d), 1);
                    this.score += 200;
                    this.scoreText.setText("Score: " + this.score);
                }
            }
        }

        // Poop falls and can hit player
        for (let i = this.poops.length - 1; i >= 0; i--) {
            let p = this.poops[i];
            p.y += this.poopSpeed;
            if (p.y > this.scale.height + 10) {
                p.destroy();
                this.poops.splice(i, 1);
            } else if (Phaser.Geom.Intersects.RectangleToRectangle(p.getBounds(), this.player.getBounds())) {
                p.destroy();
                this.poops.splice(i, 1);
                this.takeDamage();
            }
        }
        // If round cleared
        if (!this.gameOver && this.ducks.length === 0 && !this.waitingForNextRound) {
            this.waitingForNextRound = true;
            this.round++;
            this.roundClearSound.play();
            let msg = this.add.text(this.scale.width / 2, this.scale.height / 2, "Round " + (this.round - 1) + " Cleared!", {
                fontSize: "28px",
                fill: "#0f0"
            }).setOrigin(0.5);

            this.time.delayedCall(2000, () => {
                msg.destroy();
                this.spawnRound();
                this.waitingForNextRound = false;
            });
        }
    }
}

// My wrists hurt.