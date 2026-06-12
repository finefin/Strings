import GameString from "./GameString.js";
import Target from "./Target.js";
import Faucet from "./Faucet.js";

export default class gameScene extends Phaser.Scene {
    constructor() {
        super({ key: "gameScene" });
    }

    preload() {
        this.load.audio('blip', 'assets/synth2.wav');
        this.load.json('levels', 'levels/levels.json');
    }

    init(data) {
        this.cleanup();
        this.strings = [];
        this.targets = [];
        this.particles = [];
        this.score = 0;
        this.totalTargets = 0;
        this.completedTargets = 0;
        this._levelComplete = false;
        this._levelCompleteOverlay = false;
        this.faucet = null;
        this.currentLevel = data?.level ?? 0;
    }

    cleanup() {
        if (this.faucet) this.faucet.destroy();
        if (this.targets) {
            for (const t of this.targets) t.destroy();
        }
        if (this.strings) {
            for (const s of this.strings) s.destroy();
        }
        if (this.particles) {
            for (const p of this.particles) p.destroy();
        }
        if (this.scoreText) this.scoreText.destroy();
        if (this.titleText) this.titleText.destroy();
        if (this.levelLabel) this.levelLabel.destroy();
        if (this.killZoneGraphics) this.killZoneGraphics.destroy();

        this.matter.world.off('collisionstart');
    }

    create() {
        log("STRING THEORY — Level " + (this.currentLevel + 1));

        const allLevels = this.cache.json.get('levels');
        if (!allLevels) {
            log("ERROR: No levels data found!");
            return;
        }

        const levelsArray = Array.isArray(allLevels) ? allLevels : [allLevels];

        if (this.currentLevel >= levelsArray.length) {
            this.showAllDone();
            return;
        }

        this.levelData = levelsArray[this.currentLevel];
        const levelData = this.levelData;

        if (levelData.gravity) {
            this.matter.world.setGravity(levelData.gravity.x, levelData.gravity.y);
        }
        this.colorTolerance = levelData.tolerance ?? 0;
        this.killWalls = levelData.killWalls ?? [];

        const wallLeft = !this.killWalls.includes('left');
        const wallRight = !this.killWalls.includes('right');
        const wallTop = !this.killWalls.includes('top');
        const wallBottom = !this.killWalls.includes('bottom');
        this.matter.world.setBounds(0, 0, width, height, 64, wallLeft, wallRight, wallTop, wallBottom);

        this.killZoneGraphics = this.add.graphics().setDepth(50);
        if (this.killWalls.includes('bottom')) {
            this.killZoneGraphics.fillStyle(0xff0000, 0.08);
            this.killZoneGraphics.fillRect(0, height - 20, width, 20);
            this.killZoneGraphics.fillStyle(0xff0000, 0.04);
            this.killZoneGraphics.fillRect(0, height - 40, width, 20);
        }
        if (this.killWalls.includes('top')) {
            this.killZoneGraphics.fillStyle(0xff0000, 0.04);
            this.killZoneGraphics.fillRect(0, 0, width, 40);
            this.killZoneGraphics.fillStyle(0xff0000, 0.08);
            this.killZoneGraphics.fillRect(0, 0, width, 20);
        }
        if (this.killWalls.includes('left')) {
            this.killZoneGraphics.fillStyle(0xff0000, 0.04);
            this.killZoneGraphics.fillRect(0, 0, 40, height);
            this.killZoneGraphics.fillStyle(0xff0000, 0.08);
            this.killZoneGraphics.fillRect(0, 0, 20, height);
        }
        if (this.killWalls.includes('right')) {
            this.killZoneGraphics.fillStyle(0xff0000, 0.04);
            this.killZoneGraphics.fillRect(width - 40, 0, 40, height);
            this.killZoneGraphics.fillStyle(0xff0000, 0.08);
            this.killZoneGraphics.fillRect(width - 20, 0, 20, height);
        }

        this.matter.world.on('collisionstart', (event) => {
            for (const pair of event.pairs) {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                if (!bodyA || !bodyB) continue;
                this.handleStringCollision(bodyA, bodyB);
                this.handleTargetCollision(bodyA, bodyB);
            }
        });

        for (const sData of levelData.strings) {
            const color = parseInt(sData.color.replace('#', ''), 16);
            const string = new GameString(this,
                sData.endA,
                sData.endB,
                {
                    color,
                    lineWidth: sData.lineWidth ?? 6,
                    frequency: sData.frequency ?? 5,
                    note: sData.note ?? 1,
                    pluckAmplitude: sData.pluckAmplitude ?? 25,
                    decayMs: sData.decayMs ?? 1500,
                }
            );
            this.strings.push(string);
        }

        for (const tData of levelData.targets) {
            const color = parseInt(tData.color.replace('#', ''), 16);
            const target = new Target(this, tData.x, tData.y, color, tData.radius ?? 30);
            this.targets.push(target);
            this.totalTargets++;
        }

        const fd = levelData.faucet;
        const faucetConfig = {
            interval: fd.interval ?? 2000,
            colors: fd.colors.map(c => parseInt(c.replace('#', ''), 16)),
            speed: fd.speed ?? 2.5,
            directionSpread: fd.directionSpread ?? 0.4,
        };
        if (fd.targetColor) faucetConfig.targetColor = parseInt(fd.targetColor.replace('#', ''), 16);
        this.faucet = new Faucet(this, fd.x, fd.y, faucetConfig);

        this.levelLabel = this.add.text(20, 20, `Level ${this.currentLevel + 1}`, {
            fontSize: '18px',
            fill: '#666666',
            fontFamily: 'monospace',
        }).setDepth(200);

        this.scoreText = this.add.text(20, 46, `Matched: 0 / ${this.totalTargets}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'monospace',
        }).setDepth(200);

        if (levelData.name) {
            this.titleText = this.add.text(centerX, 20, levelData.name, {
                fontSize: '20px',
                fill: '#888888',
                fontFamily: 'monospace',
            }).setOrigin(0.5, 0).setDepth(200);
        }

        this.events.on('postupdate', () => this.afterPhysics());
    }

    handleStringCollision(bodyA, bodyB) {
        let particleBody, stringBody;
        if (bodyA.label === 'gameString' && bodyB.label === 'noteParticle') {
            stringBody = bodyA;
            particleBody = bodyB;
        } else if (bodyB.label === 'gameString' && bodyA.label === 'noteParticle') {
            stringBody = bodyB;
            particleBody = bodyA;
        } else {
            return;
        }

        const distSq = (particleBody.position.x - particleBody.spawnX) ** 2
            + (particleBody.position.y - particleBody.spawnY) ** 2;
        const threshold = particleBody.spawnActivationDist || 60;
        if (distSq < threshold * threshold) return;

        const string = stringBody.gameStringRef;
        if (!string) return;

        const particle = particleBody.particleRef;
        if (particle) {
            particle._lastStringHit = string;
            if (particle.targetColor !== null) {
                if (particle.hitStrings.size === 0) {
                    particle.hitStrings.add(string);
                    particle.color = string.color;
                } else {
                    particle.color = string.blendColors(particle.color, string.color, 0.5);
                }
            } else {
                particle.color = string.blendColors(particle.color, string.color, 0.5);
            }
        }

        const point = string.closestPointOnString(particleBody.position.x, particleBody.position.y);
        string.vibrate(point.x, point.y, particleBody.velocity.x, particleBody.velocity.y);
    }

    handleTargetCollision(bodyA, bodyB) {
        let targetBody, particleBody;
        if (bodyA.label === 'target' && bodyB.label === 'noteParticle') {
            targetBody = bodyA;
            particleBody = bodyB;
        } else if (bodyB.label === 'target' && bodyA.label === 'noteParticle') {
            targetBody = bodyB;
            particleBody = bodyA;
        } else {
            return;
        }

        const target = targetBody.targetRef;
        const particle = particleBody.particleRef;
        if (!target || !particle || !target.alive) return;

        const tol = Math.round(255 * (this.colorTolerance ?? 0) / 100);
        const pr = (particle.color >> 16) & 0xff, pg = (particle.color >> 8) & 0xff, pb = particle.color & 0xff;
        const tr = (target.color >> 16) & 0xff, tg = (target.color >> 8) & 0xff, tb = target.color & 0xff;
        if (Math.abs(pr - tr) <= tol && Math.abs(pg - tg) <= tol && Math.abs(pb - tb) <= tol) {
            target.hit();
            this.time.delayedCall(0, () => {
                if (particle.alive) particle.destroy();
            });
            this.completedTargets++;
            this.score = this.completedTargets;
            this.scoreText.setText(`Matched: ${this.score} / ${this.totalTargets}`);

            if (this.completedTargets >= this.totalTargets && !this._levelComplete) {
                this._levelComplete = true;
                this.time.delayedCall(600, () => this.showLevelComplete());
            }
        }
    }

    showLevelComplete() {
        if (this._levelCompleteOverlay) return;
        this._levelCompleteOverlay = true;

        const allLevels = this.cache.json.get('levels');
        const levelsArray = Array.isArray(allLevels) ? allLevels : [allLevels];
        const isLastLevel = this.currentLevel >= levelsArray.length - 1;

        if (isLastLevel) {
            this.showAllDone();
            return;
        }

        this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.5)
            .setDepth(300);

        this.add.text(centerX, centerY - 40, `Level ${this.currentLevel + 1} Complete!`, {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(301);

        const btn = this.add.text(centerX, centerY + 40, '[ Next Level ]', {
            fontSize: '24px',
            fill: '#aaaaaa',
            fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(301)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setFill('#ffffff'))
            .on('pointerout', () => btn.setFill('#aaaaaa'))
            .on('pointerdown', () => {
                this.scene.restart({ level: this.currentLevel + 1 });
            });
    }

    showAllDone() {
        this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.6)
            .setDepth(300);

        this.add.text(centerX, centerY - 60, 'All Levels Complete!', {
            fontSize: '52px',
            fill: '#ffdd44',
            fontFamily: 'monospace',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(301);

        this.add.text(centerX, centerY + 10, 'Congratulations!', {
            fontSize: '28px',
            fill: '#ffffff',
            fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(301);

        const btn = this.add.text(centerX, centerY + 70, '[ Play from Level 1 ]', {
            fontSize: '24px',
            fill: '#aaaaaa',
            fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(301)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setFill('#ffffff'))
            .on('pointerout', () => btn.setFill('#aaaaaa'))
            .on('pointerdown', () => this.scene.restart({ level: 0 }));
    }

    update() {
        if (this.particles) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];

                if (p.body) {
                    p.prevX = p.body.position.x;
                    p.prevY = p.body.position.y;

                    const pos = p.body.position;
                    let killed = false;
                    if (this.killWalls.includes('bottom') && pos.y >= height) killed = true;
                    else if (this.killWalls.includes('top') && pos.y <= 0) killed = true;
                    else if (this.killWalls.includes('left') && pos.x <= 0) killed = true;
                    else if (this.killWalls.includes('right') && pos.x >= width) killed = true;
                    if (killed || pos.y > height + 150 || pos.x < -200 || pos.x > width + 200) {
                        p.destroy();
                    }
                }

                p.update();
                if (!p.alive) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    afterPhysics() {
        if (!this.particles || !this.strings) return;

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
                    if (p.targetColor !== null) {
                        if (p.hitStrings.size === 0) {
                            p.hitStrings.add(string);
                            p.color = string.color;
                        } else {
                            p.color = string.blendColors(p.color, string.color, 0.5);
                        }
                    } else {
                        p.color = string.blendColors(p.color, string.color, 0.45);
                    }
                    string.vibrate(hit.x, hit.y, dx, dy);
                }
            }
        }
    }
}
