

import GameString from "./GameString.js";

export default class gameScene extends Phaser.Scene {
    constructor() {
        super({
            key: "gameScene",
        });
    }

    preload() {
        this.load.audio('blip', 'assets/synth2.wav');
    }

    init() {
    }

    create() {
        log("GAME SCENE!");
        this.camera = this.cameras.main;

        this.matter.world.setBounds(0, 0, width, height);

        this.matter.world.on('collisionstart', (event) => {
            for (const pair of event.pairs) {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                let particleBody, stringBody;
                if (bodyA.label === 'gameString' && bodyB.label === 'noteParticle') {
                    stringBody = bodyA;
                    particleBody = bodyB;
                } else if (bodyB.label === 'gameString' && bodyA.label === 'noteParticle') {
                    stringBody = bodyB;
                    particleBody = bodyA;
                } else {
                    continue;
                }
                const distSq = (particleBody.position.x - particleBody.spawnX) ** 2
                    + (particleBody.position.y - particleBody.spawnY) ** 2;
                const threshold = particleBody.spawnActivationDist || 60;
                if (distSq < threshold * threshold) continue;
                const string = stringBody.gameStringRef;
                if (!string) continue;
                const particle = particleBody.particleRef;
                if (particle) particle._lastStringHit = string;
                const point = string.closestPointOnString(particleBody.position.x, particleBody.position.y);
                string.pluck(point.x, point.y, particleBody.velocity.x, particleBody.velocity.y, particle?.color);
            }
        });

        this.particles = [];

        this.events.on('postupdate', () => this.afterPhysics());

        const string1 = new GameString(this, centerX, centerY-300, 1200, {
            color: 0x0000ff,
            lineWidth: 8,
            frequency: 5,
            note: 1,
            particleConfig: {
                color: 0x0000ff,
                radius: 10,
            },
        });

        const string2 = new GameString(this, centerX, centerY-100, 1200, {
            color: 0x00ff00,
            lineWidth: 8,
            frequency: 10,
            note: 1.5,
            particleConfig: {
                color: 0x00ff00,
                radius: 8,
            },
        });

        const string3 = new GameString(this, centerX, centerY+100, 1200, {
            color: 0xff0000,
            lineWidth: 8,
            frequency: 15,
            note: 2,
            particleConfig: {
                color: 0xff0000,
                radius: 6,
            },
        });

        const string5 = new GameString(this, centerX, centerY+300, 1200, {
            color: 0xff00ff,
            lineWidth: 8,
            frequency: 20,
            note: 2.5,
            particleConfig: {
                color: 0xff00ff,
                radius: 4,
            },
        });
    }

    update() {
        const pointer = this.input.activePointer;
        this.prevPointerX = pointer.worldX;
        this.prevPointerY = pointer.worldY;

        if (this.particles) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];

                if (p.body) {
                    p.prevX = p.body.position.x;
                    p.prevY = p.body.position.y;
                }

                p.update();
                if (!p.alive) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    afterPhysics() {
        if (this.particles && this.strings) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                if (!p.body || p.prevX === undefined) continue;

                const currPos = p.body.position;
                for (const string of this.strings) {
                    if (string === p._lastStringHit) continue;
                    const hit = string.checkParticleCrossing(p.prevX, p.prevY, currPos.x, currPos.y);
                    if (!hit) continue;
                    const dx = currPos.x - p.prevX;
                    const dy = currPos.y - p.prevY;
                    const distSq = (currPos.x - p.body.spawnX) ** 2
                        + (currPos.y - p.body.spawnY) ** 2;
                    const threshold = p.body.spawnActivationDist || 60;
                    if (distSq >= threshold * threshold) {
                        p._lastStringHit = string;
                        string.pluck(hit.x, hit.y, dx, dy, p.color);
                    }
                }
            }
        }
    }
}