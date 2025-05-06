// Arvin Arbabi
// Created: 4/14/2024
// Phaser: 3.70.0
//
// 1D
//
// An example of 1D movement on the screen using Phaser
// 
// Art assets from Kenny Assets "Shape Characters" set:
// https://kenney.nl/assets/shape-characters

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    
    fps: { 
        forceSetTimeOut: true, target: 30 
    },

    width: 800,
    height: 600,
    scene: [Movement]
    
}

const game = new Phaser.Game(config);
