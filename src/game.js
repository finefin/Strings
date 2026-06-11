import gameScene from "./gameScene.js";


var config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'gameCanvas',
        width: width,
        height: height
    },
    backgroundColor: '#000000',
    scene: [gameScene],
    physics: {
        default: 'matter',
        matter: {
            debug: false,
            gravity: { y: 0 } // No default gravity, we'll apply custom black hole gravity
        }
    }
};

var game = new Phaser.Game(config);

// Expose game instance globally for save system
window.game = game;
