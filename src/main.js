// src/main.js
"use strict";

const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 450,
  parent: 'phaser-game',
  physics: { default: 'arcade', arcade: { gravity: { y: 600 }, debug: false } },
  scene: [ GameScene ]
};

new Phaser.Game(config);
