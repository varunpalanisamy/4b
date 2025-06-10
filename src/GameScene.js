class GameScene extends Phaser.Scene {
    constructor() {
      super('GameScene');
      this.PLAYER_SPEED = 200;
      this.JUMP_SPEED = -350;
      this.canDoubleJump = true;
      this.score = 0;
      this.hasWon = false;
      this.isGameOver = false;

      this.totalGems = 0;
     this.gemsCollected = 0;

    }
  
    preload() {
      this.load.image('tiles', 'assets/tilemap_packed.png');
      this.load.tilemapTiledJSON('map', 'assets/Platformer.json');
  
      this.load.image('player', 'assets/platformChar_idle.png');
      this.load.image('walk', 'assets/platformChar_walk1.png');
      this.load.image('jump', 'assets/platformChar_jump.png');
      this.load.image('gem', 'assets/gem.png');
        this.load.image('flag', 'assets/flag.png');
      this.load.image('completed', 'assets/completed.png');
      this.load.image('gameover', 'assets/text_gameover.png');
      this.load.image('ready', 'assets/text_ready.png');

      this.load.image('spike', 'assets/spike.png');


  
      this.load.audio('jumpSnd', 'assets/jump.mp3');
      this.load.audio('coinSnd', 'assets/coin.mp3');
    }
  
    create() {

      this.isGameOver = false;

      const map = this.make.tilemap({ key: 'map' });
      const tiles = map.addTilesetImage('Platformer', 'tiles');
  
      this.groundLayer = map.createLayer('Ground', tiles);
      this.platformLayer = map.createLayer('Platform', tiles);
      // this.collectiblesLayer = map.createLayer('Collectibles', tiles);
      this.decorationsLayer = map.createLayer('Decorations', tiles);
      // this.collisionLayer = map.createLayer('Collisions', tiles);
  
      // this.collisionLayer.setCollisionByProperty({ collides: true });
      
      this.groundLayer.setCollisionByExclusion([-1]);
      this.platformLayer.setCollisionByExclusion([-1]);
  
      const spawn = map.getObjectLayer('Objects')?.objects.find(obj => obj.name === 'PlayerSpawn') || { x: 64, y: 64 };
  
      this.player = this.physics.add.sprite(spawn.x, spawn.y, 'player').setScale(0.25);
      this.player.setCollideWorldBounds(true);
  

      this.physics.add.collider(this.player, this.groundLayer);
      this.physics.add.collider(this.player, this.platformLayer);
  
      this.cameras.main.startFollow(this.player);
      this.cameras.main.setZoom(2);
      this.cameras.main.setFollowOffset(0, 50);
      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  
      this.anims.create({ key: 'idle', frames: [{ key: 'player' }], frameRate: 1 });
      this.anims.create({ key: 'walk', frames: [{ key: 'walk', frame: 0 }], frameRate: 10, repeat: -1 });
      this.anims.create({ key: 'jump', frames: [{ key: 'jump', frame: 0 }], frameRate: 10 });
  
      this.cursors = this.input.keyboard.createCursorKeys();


  
      // === Gems ===
      this.gems = this.physics.add.group();
      const gemsLayer = map.getObjectLayer('Gems');
      console.log("Gems Layer:", gemsLayer);
  
      if (gemsLayer) {
        this.totalGems = gemsLayer.objects.length;
        console.log("🔢 Total gems:", this.totalGems);
      
        gemsLayer.objects.forEach(obj => {
            const gem = this.gems.create(obj.x, obj.y - obj.height, 'gem')
            .setScale(1)
            .setOrigin(0, 0);
            gem.body.setAllowGravity(false);

          });
          
      }
      this.physics.add.overlap(this.player, this.gems, this.collectGem, null, this);

  
      

      // === Spikes ===

      this.spikes = this.physics.add.group();
      const spikeLayer = map.getObjectLayer('Spikes');
      console.log("Spikes Layer:", spikeLayer);

      if (spikeLayer) {
        spikeLayer.objects.forEach(obj => {
          const spike = this.spikes.create(obj.x, obj.y, 'spike')
          .setOrigin(0, 1);
          spike.body.setAllowGravity(false);
          spike.setImmovable(true);
        });

        this.physics.add.overlap(this.player, this.spikes, this.triggerGameOver, null, this);
      }

  
      // === Flag ===
        this.flags = this.physics.add.group();
        const flagLayer = map.getObjectLayer('Flag');
        console.log("Flag Layer:", flagLayer);

        if (flagLayer) {
            flagLayer.objects.forEach(obj => {
                const flagSprite = this.flags.create(obj.x, obj.y - obj.height, 'flag')
                .setScale(0.5)
                .setOrigin(0, 0);
                flagSprite.body.setAllowGravity(false);

              });
              

        this.physics.add.overlap(this.player, this.flags, (player, flag) => {
            console.log("✅ Flag overlap triggered!");
            if (this.gemsCollected >= this.totalGems) {
              flag.destroy(); // Optional
              this.reachFlag();
            } else {
              console.log("❌ You haven't collected all the gems yet!");
            }
        });
          
        }

  
      this.jumpSnd = this.sound.add('jumpSnd');
      this.coinSnd = this.sound.add('coinSnd');
    }
  
    update() {
      if (this.hasWon) return;
  
      const onGround = this.player.body.blocked.down;
  
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-this.PLAYER_SPEED);
        this.player.setFlipX(true);
        if (onGround) this.player.anims.play('walk', true);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(this.PLAYER_SPEED);
        this.player.setFlipX(false);
        if (onGround) this.player.anims.play('walk', true);
      } else {
        this.player.setVelocityX(0);
        if (onGround) this.player.anims.play('idle', true);
      }
  
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        if (onGround) {
          this.player.setVelocityY(this.JUMP_SPEED);
          this.canDoubleJump = true;
          this.jumpSnd.play();
        } else if (this.canDoubleJump) {
          this.player.setVelocityY(this.JUMP_SPEED);
          this.canDoubleJump = false;
          this.jumpSnd.play();
        }
        this.player.anims.play('jump');
      }
    }
  
    collectGem(player, gem) {
        gem.destroy();
        this.gemsCollected += 1;
        this.score += 10;
        this.coinSnd.play();
    }

    checkSpikeCollision(player, tile) {
      console.log("💥 Player hit spike tile index:", tile.index);
      this.triggerGameOver();
    }
    
    triggerGameOver() {
      if (this.hasWon || this.isGameOver) return;

      this.isGameOver = true;
      this.physics.pause();
      this.player.setVelocity(0, 0);
      this.player.anims.stop();

      const centerX = this.scale.width / 2;
      const centerY = this.scale.height / 2;

      this.add.image(centerX, centerY - 30, 'gameover')
        .setScrollFactor(0)
        .setOrigin(0.5)
        .setScale(0.5)
        .setDepth(1000);

      const readyImage = this.add.image(centerX, centerY + 30, 'ready')
        .setScrollFactor(0)
        .setOrigin(0.5)
        .setScale(0.5)
        .setDepth(1000)
        .setInteractive();  // Make it clickable

      readyImage.on('pointerdown', () => {
        console.log('🔁 Restarting game...');
        this.scene.restart();
      });
    }

      
  
    reachFlag() {
        console.log("🏁 Flag hit! Reached the flag!");
      
        this.hasWon = true;
        this.physics.pause();
        this.player.setVelocity(0, 0);
        this.player.anims.stop();
      
        // Use camera center in screen space, not scrollX/scrollY
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

      
        console.log("📍 Adjusted Center:", centerX, centerY);
      
        const completedImage = this.add.image(centerX, centerY, 'completed')
          .setScrollFactor(0)
          .setOrigin(0.5)
          .setScale(0.4)         // 🎯 Shrinks the image
          .setDepth(999);        // Ensures it's on top
      
        console.log("✅ Completed image displayed");
      }
      
      
  }
