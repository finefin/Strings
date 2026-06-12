import NoteParticle from "./NoteParticle.js";

export default class Faucet {
    constructor(scene, x, y, config = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.interval = config.interval || 200;
        this.colors = config.colors || [0xffffff];
        this.speed = config.speed || 2;
        this.directionSpread = config.directionSpread || 0.3;
        this.targetColor = config.targetColor ?? null;

        this.graphics = scene.add.graphics();
        this.nextColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.draw();

        this.timer = scene.time.addEvent({
            delay: this.interval,
            loop: true,
            callback: () => this.spawn(),
        });

        this.spawn();
    }

    draw() {
        this.graphics.clear();
        this.graphics.fillStyle(0x666666, 1);
        this.graphics.fillRect(this.x - 24, this.y - 10, 48, 14);
        this.graphics.fillStyle(0x888888, 1);
        this.graphics.fillRect(this.x - 12, this.y + 4, 24, 18);
        this.graphics.fillStyle(this.nextColor, 0.9);
        this.graphics.fillTriangle(
            this.x - 8, this.y + 22,
            this.x + 8, this.y + 22,
            this.x, this.y + 32
        );
    }

    spawn() {
        const color = this.nextColor;
        this.nextColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.draw();
        const pConfig = {
            color: color,
            radius: 20,
            direction: Math.PI / 2,
            directionSpread: this.directionSpread,
            minSpeed: this.speed,
            maxSpeed: this.speed * 1.3,
            minLifetime: 12000,
            maxLifetime: 18000,
        };
        if (this.targetColor !== null) pConfig.targetColor = this.targetColor;
        const particle = new NoteParticle(this.scene, this.x, this.y + 32, pConfig);
        return particle;
    }

    destroy() {
        if (this.timer) {
            this.timer.remove();
            this.timer = null;
        }
        if (this.graphics) {
            this.graphics.destroy();
            this.graphics = null;
        }
    }
}
