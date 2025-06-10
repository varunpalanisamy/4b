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

      this.load.image('completed', 'assets/completed.png');
      this.load.image('text_score', 'assets/text_score.png');
      this.load.image('text_dots', 'assets/text_dots.png');
      for (let i = 0; i <= 9; i++) {
        this.load.image(`text_${i}`, `assets/text_${i}.png`);
      }


  
      this.load.audio('jumpSnd', 'assets/jump.mp3');
      this.load.audio('coinSnd', 'assets/coin.mp3');
      this.load.image('flame', 'assets/flame_03.png');

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
      this.spawnPoint = { x: spawn.x, y: spawn.y };     

  
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
          .setOrigin(0, 0.7);
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
            console.log("Flag overlap triggered!");
            if (this.gemsCollected >= this.totalGems) {
              flag.destroy(); 
              this.reachFlag();
            } else {
              console.log("You haven't collected all the gems yet!");
            }
        });
          
        }

  
      this.jumpSnd = this.sound.add('jumpSnd');
      this.coinSnd = this.sound.add('coinSnd');



      this.startTime = this.time.now;




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


      const moving = this.cursors.left.isDown || this.cursors.right.isDown;
      if (moving) {
      console.log('🔥 Trail!'); 
        const trail = this.add.image(this.player.x, this.player.y, 'flame')
        .setScale(0.05)
        .setAlpha(1);
        this.tweens.add({
        targets: trail,
        alpha: { from: 1, to: 0 },
        duration: 300,
        onComplete: () => trail.destroy()
      });

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
              
        console.log('💥 Jump burst!');  
          for (let i = 0; i < 6; i++) {
            const fx = this.add.image(this.player.x, this.player.y, 'flame')
              .setScale(0.1)
              .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
              this.tweens.add({
              targets: fx,
              x: fx.x + Phaser.Math.Between(-20, 20),
              y: fx.y + Phaser.Math.Between(-20, 20),
              alpha: { from: 1, to: 0 },
              duration: 400,
              onComplete: () => fx.destroy()
            });
         }

      }
    }
  
    collectGem(player, gem) {
        gem.destroy();
        this.gemsCollected += 1;
        this.score += 10;
        this.coinSnd.play();
    }

    checkSpikeCollision(player, tile) {
      console.log("Player hit spike tile index:", tile.index);
      this.triggerGameOver();
    }
    
      triggerGameOver() {
    if (this.hasWon || this.isGameOver) return;
    this.isGameOver = true;

    this.physics.pause();
    this.player.setVelocity(0, 0);
    this.player.anims.stop();

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.gameOverImage = this.add.image(cx, cy - 30, 'gameover')
      .setScrollFactor(0).setOrigin(0.5).setScale(0.5).setDepth(1000);

    this.readyImage = this.add.image(cx, cy + 30, 'ready')
      .setScrollFactor(0).setOrigin(0.5).setScale(0.5).setDepth(1000)
      .setInteractive();

    this.readyImage.once('pointerdown', () => {

      this.readyImage.destroy();
      this.gameOverImage.destroy();

      this.cameras.main.stopFollow();

      this.cameras.main.pan(
        this.spawnPoint.x, 
        this.spawnPoint.y, 
        1000,            
        'Linear',     
        true              
      );

      this.cameras.main.once('camerapancomplete', () => {
        this.scene.restart();
      });
    });
  }

      
  
    reachFlag() {
  if (this.hasWon) return;
  this.hasWon = true;
  this.physics.pause();
  this.player.setVelocity(0, 0);
  this.player.anims.stop();

  const cx = this.scale.width / 2;
  const cy = this.scale.height / 2;

  const completed = this.add.image(cx, cy, 'completed')
    .setScrollFactor(0)
    .setOrigin(0.5)
    .setScale(0.4)
    .setDepth(999);

  const elapsedMS = this.time.now - this.startTime;
  const totalSec = Math.floor(elapsedMS / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;

  const mm = `${minutes}`;
  const ss = seconds < 10 ? `0${seconds}` : `${seconds}`;
  const timeStr = `${mm}:${ss}`; 

  console.log(`Final time: ${timeStr}`);


  const labelY = cy+60;

  this.add.image(cx, labelY, 'text_score')
    .setScrollFactor(0)
    .setOrigin(0.5)
    .setScale(0.5)
    .setDepth(999);


  const charSpacing = 20;  // tweak as needed
  const charImages = timeStr.split('').map(ch => {
    const key = ch === ':' ? 'text_dots' : `text_${ch}`;
    return this.textures.exists(key) ? key : null;
  });

  const totalWidth = charImages.length * charSpacing;
  let startX = cx - totalWidth / 2 + charSpacing / 2;

  charImages.forEach(key => {
    if (!key) return;
    this.add.image(startX, labelY + 30, key)  
      .setScrollFactor(0)
      .setOrigin(0.5)
      .setScale(0.5)
      .setDepth(999);
    startX += charSpacing;
  });
}

      
      
  }
