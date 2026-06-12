import gameScene from "./gameScene.js";

var config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'gameCanvas',
        width: width,
        height: height
    },
    backgroundColor: '#0a0a0a',
    scene: [gameScene],
    physics: {
        default: 'matter',
        matter: {
            debug: false,
            gravity: { y: 0 }
        }
    }
};

var game = new Phaser.Game(config);
window.game = game;
