# Strings

A Phaser 3 browser game (WIP).

## Status

Early prototype. The project has a basic Phaser 3 scene initialized with Matter.js physics (zero gravity — custom gravity planned). No gameplay logic, assets, or sprites are loaded in the game scene yet.

## Tech Stack

- **Engine:** Phaser 3.80 (Matter physics)
- **3D:** Three.js (loaded, unused)
- **Bundler:** None — bare script tags; only `src/game.js` uses ES modules

## Project Structure

```
Strings/
├── index.html           # Entry point, inline save-on-close handler
├── css/main.css         # Fullscreen dark canvas styling
├── assets/
│   ├── ButtonGrey.png
│   ├── Coin/            # 8 coin sprite sheets
│   ├── spr01.png
│   └── spr011.ase       # Aseprite source
├── src/
│   ├── GameConfig.js    # Config globals (2000x1000 resolution)
│   ├── game.js          # Phaser bootstrap (module)
│   ├── gameScene.js     # Empty scene skeleton
│   ├── manager/
│   │   └── helpers.js   # Utility functions (739 lines)
│   └── framework/
│       ├── phaser.3.80.min.js
│       └── three.min.js
└── README.md
```

## Config

- Resolution: 2000×1000
- Physics: Matter.js with `gravity.y = 0`
- Title: GameTitle (v0.1b)
