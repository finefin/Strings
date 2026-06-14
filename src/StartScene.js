import GameString from "./GameString.js";

const LETTERS = {
    S: [[0,0,4,0],[4,0,4,1],[4,1,0,2],[0,2,0,4],[0,4,4,5],[4,5,4,6],[4,6,0,6]],
    T: [[0,0,4,0],[2,0,2,6]],
    R: [[0,0,0,6],[0,0,4,0],[4,0,4,2],[4,2,0,2],[3,2,5,6]],
    I: [[0,0,4,0],[2,0,2,6],[0,6,4,6]],
    N: [[0,0,0,6],[0,0,4,6],[4,0,4,6]],
    G: [[4,0,0,0],[0,0,0,6],[0,6,4,6],[4,6,4,3],[4,3,2,3]],
    H: [[0,0,0,6],[0,3,4,3],[4,0,4,6]],
    E: [[0,0,4,0],[0,0,0,6],[0,3,3,3],[0,6,4,6]],
    O: [[0,0,4,0],[4,0,4,6],[4,6,0,6],[0,6,0,0]],
    Y: [[0,0,2,3],[4,0,2,3],[2,3,2,6]],
};

const COLORS = [0xff6b6b, 0xffa94d, 0xffd43b, 0x69db7c, 0x4dabf7, 0x9775fa, 0xf783ac];

const Matter = Phaser.Physics.Matter.Matter;

export default class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        this.particles = [];
        this.strings = [];

        this.matter.world.setGravity(0, 0.5);
        this.matter.world.setBounds(0, 0, width, height, 64, true, true, true, false);

        this.createTitleStrings();
        this.createParticleSystem();
        this.createStartButton();

        this.matter.world.on('collisionstart', (event) => {
            for (const pair of event.pairs) {
                const bA = pair.bodyA;
                const bB = pair.bodyB;
                let particleBody, stringBody;
                if (bA.label === 'gameString' && bB.label === 'startParticle') {
                    stringBody = bA;
                    particleBody = bB;
                } else if (bB.label === 'gameString' && bA.label === 'startParticle') {
                    stringBody = bB;
                    particleBody = bA;
                } else {
                    continue;
                }
                const gs = stringBody.gameStringRef;
                if (gs) {
                    gs.vibrate(
                        particleBody.position.x,
                        particleBody.position.y,
                        particleBody.velocity.x,
                        particleBody.velocity.y
                    );
                }
            }
        });
    }

    createTitleStrings() {
        const unit = 14;
        const ls = 24;
        const ws = 48;
        const lw = 5 * unit;

        const word1 = 'STRING';
        const word2 = 'THEORY';
        const w1 = word1.length * (lw + ls) - ls;
        const w2 = word2.length * (lw + ls) - ls;
        const total = w1 + ws + w2;
        let x = (width - total) / 2;
        const y = 200;

        let ci = 0;
        const drawWord = (word) => {
            for (const ch of word) {
                const segs = LETTERS[ch];
                if (!segs) { x += lw + ls; continue; }
                const col = COLORS[ci++ % COLORS.length];
                for (const s of segs) {
                    const x1 = x + s[0] * unit;
                    const y1 = y + s[1] * unit;
                    const x2 = x + s[2] * unit;
                    const y2 = y + s[3] * unit;

                    new GameString(this,
                        { x: x1, y: y1, fixed: true },
                        { x: x2, y: y2, fixed: true },
                        { color: col, lineWidth: 6, hideHandles: true, pluckAmplitude: 20, frequency: 8, decayMs: 1500 }
                    );
                }
                x += lw + ls;
            }
        };
        drawWord(word1);
        x += ws;
        drawWord(word2);
    }

    createParticleSystem() {
        this.particleTimer = this.time.addEvent({
            delay: 280,
            callback: () => this.spawnParticle(),
            loop: true,
        });
    }

    spawnParticle() {
        const col = Phaser.Math.RND.pick(COLORS);
        const r = Phaser.Math.Between(4, 7);
        const x = Phaser.Math.Between(60, width - 60);

        const body = Matter.Bodies.circle(x, -20, r, {
            restitution: 0.5,
            friction: 0,
            frictionAir: 0.002,
            label: 'startParticle',
        });
        this.matter.world.add(body);
        Matter.Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 1.5,
            y: Math.random() * 2 + 1,
        });

        const gfx = this.add.graphics();
        this.particles.push({ body, gfx, col, r });
    }

    createStartButton() {
        const btn = this.add.text(width / 2, 540, '[ Start ]', {
            fontSize: '28px',
            fill: '#aaaaaa',
            fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(10)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setFill('#ffffff'))
            .on('pointerout', () => btn.setFill('#aaaaaa'))
            .on('pointerdown', () => this.scene.start('gameScene', { level: 0 }));
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            const pos = p.body.position;
            if (pos.y > height + 50 || pos.x < -100 || pos.x > width + 100) {
                this.matter.world.remove(p.body);
                p.gfx.destroy();
                this.particles.splice(i, 1);
                continue;
            }
            p.gfx.clear();
            p.gfx.fillStyle(p.col, 0.12);
            p.gfx.fillCircle(pos.x, pos.y, p.r + 4);
            p.gfx.fillStyle(p.col, 0.9);
            p.gfx.fillCircle(pos.x, pos.y, p.r);
        }
    }
}
