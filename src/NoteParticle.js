export default class NoteParticle {
    constructor(scene, x, y, config = {}) {
        const {
            radius = 10,
            color = 0xffffff,
            minLifetime = 2000,
            maxLifetime = 2000,
            minSpeed = 3,
            maxSpeed = 4,
            direction = null,
            directionSpread = Math.PI * 2,
            spawnActivationDist = 60,
        } = config;

        this.scene = scene;
        this.radius = radius;
        this.color = color;
        this.lifetime = minLifetime + Math.random() * (maxLifetime - minLifetime);
        this.born = scene.time.now;
        this.alive = true;

        let angle;
        if (direction !== null) {
            angle = direction + (Math.random() - 0.5) * directionSpread;
        } else {
            angle = Math.random() * Math.PI * 2;
        }
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

        this.body = scene.matter.add.circle(x, y, radius, {
            restitution: 0.95,
            friction: 0,
            frictionAir: 0.001,
            frictionStatic: 0,
            collisionFilter: {
                group: -1,
            },
            label: 'noteParticle',
        });
        this.body.spawnX = x;
        this.body.spawnY = y;
        this.body.spawnActivationDist = spawnActivationDist;
        this.body.particleRef = this;
        this.body.isBullet = true;

        this.prevX = x;
        this.prevY = y;
        this.hitStrings = new Set();
        this.targetColor = config.targetColor ?? null;

        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        scene.matter.body.setVelocity(this.body, { x: vx, y: vy });

        this.graphics = scene.add.graphics();

        if (!scene.particles) {
            scene.particles = [];
        }
        scene.particles.push(this);
    }

    update() {
        if (!this.alive) return;

        const elapsed = this.scene.time.now - this.born;
        const progress = elapsed / this.lifetime;

        if (progress >= 1) {
            this.destroy();
            return;
        }

        const pos = this.body.position;

        this.graphics.clear();

        const glowSize = this.radius + 4;
        this.graphics.fillStyle(this.color, 0.15);
        this.graphics.fillCircle(pos.x, pos.y, glowSize);

        this.graphics.fillStyle(this.color, 0.9);
        this.graphics.fillCircle(pos.x, pos.y, this.radius);
    }

    destroy() {
        if (!this.alive) return;
        this.alive = false;
        if (this.body) {
            this.scene.matter.world.remove(this.body);
            this.body = null;
        }
        if (this.graphics) {
            this.graphics.destroy();
            this.graphics = null;
        }
    }
}
