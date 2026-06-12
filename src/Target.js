export default class Target {
    constructor(scene, x, y, color, radius = 30) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = radius;
        this.alive = true;
        this.hitAnimTimer = 0;

        this.graphics = scene.add.graphics();
        this.draw();

        this.body = scene.matter.add.circle(x, y, radius, {
            isStatic: true,
            isSensor: true,
            label: 'target',
        });
        this.body.targetRef = this;
    }

    draw() {
        this.graphics.clear();
        if (!this.alive) return;

        const pulse = 1 + 0.05 * Math.sin(this.scene.time.now * 0.003);

        this.graphics.fillStyle(0x333333, 0.6);
        this.graphics.fillCircle(this.x, this.y, this.radius * pulse);

        this.graphics.lineStyle(4, 0xffffff, 0.9);
        this.graphics.strokeCircle(this.x, this.y, this.radius * pulse);

        this.graphics.lineStyle(2, this.color, 0.7);
        this.graphics.strokeCircle(this.x, this.y, (this.radius - 6) * pulse);

        this.graphics.fillStyle(this.color, 0.3);
        this.graphics.fillCircle(this.x, this.y, (this.radius - 6) * pulse);
    }

    hit() {
        if (!this.alive) return false;
        this.alive = false;

        this.graphics.clear();
        this.graphics.fillStyle(0xffffff, 0.8);
        this.graphics.fillCircle(this.x, this.y, this.radius * 1.5);

        this.scene.time.delayedCall(400, () => {
            this.graphics.clear();
        });

        return true;
    }

    destroy() {
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
