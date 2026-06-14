export default class GameString {
    constructor(scene, endA, endB, config = {}) {
        const {
            color = 0xffffff,
            lineWidth = 4,
            pluckAmplitude = 30,
            frequency = 6,
            decayMs = 1200,
            note = 1,
            hideHandles = false,
        } = config;

        this.scene = scene;
        this.endA = { x: endA.x, y: endA.y };
        this.endB = { x: endB.x, y: endB.y };
        this.color = color;
        this.lineWidth = lineWidth;
        this.pluckAmplitude = pluckAmplitude;
        this.frequency = frequency;
        this.decayMs = decayMs;
        this.note = note;

        this.plucks = [];
        this._handleRadius = Math.max(10, lineWidth + 4);

        this.graphics = scene.add.graphics();
        this.drawString();

        if (!hideHandles) {
            this.handleA = this.createHandle(scene, this.endA.x, this.endA.y, 'A', endA.fixed ?? false);
            this.handleB = this.createHandle(scene, this.endB.x, this.endB.y, 'B', endB.fixed ?? false);
        }

        this.createBody(scene);

        if (!this.scene.strings) this.scene.strings = [];
        this.scene.strings.push(this);
    }

    createHandle(scene, x, y, label, fixed = false) {
        if (fixed) {
            const handle = scene.add.circle(x, y, this._handleRadius)
                .setStrokeStyle(2, 0xff4444, 0.9)
                .setFillStyle(0xff0000, 0.25)
                .setDepth(100);

            const cross = scene.add.text(x, y, '\u2716', {
                fontSize: Math.round(this._handleRadius * 1.4) + 'px',
                fill: '#ff4444',
                fontFamily: 'monospace',
            }).setOrigin(0.5).setDepth(101);

            handle._fixedCross = cross;
            return handle;
        }

        const handle = scene.add.circle(x, y, this._handleRadius)
            .setStrokeStyle(2, 0xffffff, 0.9)
            .setFillStyle(this.color, 0.4)
            .setDepth(100)
            .setInteractive({ draggable: true, useHandCursor: true });

        handle.on('drag', (pointer, dragX, dragY) => {
            handle.x = dragX;
            handle.y = dragY;
            if (label === 'A') {
                this.endA.x = dragX;
                this.endA.y = dragY;
                console.log (Math.floor(this.endA.x), Math.floor(this.endA.y))
            } else {
                this.endB.x = dragX;
                this.endB.y = dragY;
                console.log (Math.floor(this.endB.x), Math.floor(this.endB.y))
            }
            this.updateBody();
            this.drawString();
        });

        return handle;
    }

    createBody() {
        const cx = (this.endA.x + this.endB.x) / 2;
        const cy = (this.endA.y + this.endB.y) / 2;
        const dx = this.endB.x - this.endA.x;
        const dy = this.endB.y - this.endA.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const bodyOptions = {
            isStatic: true,
            label: 'gameString',
            restitution: 0.6,
            friction: 0,
            frictionAir: 0,
        };
        if (angle !== 0) {
            bodyOptions.angle = angle;
        }

        if (this.body) {
            this.scene.matter.world.remove(this.body);
        }
        this.body = this.scene.matter.add.rectangle(cx, cy, len, Math.max(18, this.lineWidth * 3), bodyOptions);
        this.body.gameStringRef = this;
    }

    updateBody() {
        this.createBody();
    }

    get length() {
        const dx = this.endB.x - this.endA.x;
        const dy = this.endB.y - this.endA.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    playNote() {
        try {
            this.scene.sound.play('blip', { rate: this.note, volume: 0.3 });
        } catch (e) {
            // sound might not be loaded yet
        }
    }

    blendColors(c1, c2, t) {
        const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
        const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
        return (Math.round(r1 + (r2 - r1) * t) << 16)
             | (Math.round(g1 + (g2 - g1) * t) << 8)
             | Math.round(b1 + (b2 - b1) * t);
    }

    vibrate(spawnX, spawnY, dirX, dirY) {
        if (spawnX === undefined) spawnX = (this.endA.x + this.endB.x) / 2;
        if (spawnY === undefined) spawnY = (this.endA.y + this.endB.y) / 2;

        const pluckT = this.closestPointOnString(spawnX, spawnY).t;

        let dirSign = 1;
        if (dirX !== undefined && dirY !== undefined && (dirX !== 0 || dirY !== 0)) {
            const dx = this.endB.x - this.endA.x;
            const dy = this.endB.y - this.endA.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                const perpX = -dy / len;
                const perpY = dx / len;
                dirSign = Math.sign(dirX * perpX + dirY * perpY) || 1;
            }
        }

        this.plucks.push({ t: pluckT, elapsed: 0, dirSign });
        this.playNote();

        if (!this.vibrationTimer) {
            this.vibrationTimer = this.scene.time.addEvent({
                delay: 16,
                loop: true,
                callback: () => this.updateVibration(),
            });
        }
    }

    updateVibration() {
        const dt = 16;
        let anyAlive = false;
        for (const pluck of this.plucks) {
            pluck.elapsed += dt;
            if (pluck.elapsed < this.decayMs) anyAlive = true;
        }

        if (!anyAlive) {
            this.stopVibration();
            return;
        }

        this.drawString();
    }

    stopVibration() {
        this.plucks = [];
        this.drawString();
        if (this.vibrationTimer) {
            this.vibrationTimer.remove();
            this.vibrationTimer = null;
        }
    }

    drawString() {
        this.graphics.clear();
        this.graphics.lineStyle(this.lineWidth, this.color, 1);

        const dx = this.endB.x - this.endA.x;
        const dy = this.endB.y - this.endA.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = len > 0 ? -dy / len : 0;
        const perpY = len > 0 ? dx / len : 0;

        const steps = 30;

        this.graphics.beginPath();

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const bx = this.endA.x + dx * t;
            const by = this.endA.y + dy * t;

            let displacement = 0;
            for (const pluck of this.plucks) {
                if (pluck.elapsed >= this.decayMs) continue;
                const envelope = 1 - pluck.elapsed / this.decayMs;
                const pt = pluck.t;
                const tri = t <= pt
                    ? (pt > 0 ? t / pt : 0)
                    : (pt < 1 ? (1 - t) / (1 - pt) : 0);
                const oscillation = pluck.dirSign * Math.cos(pluck.elapsed * 0.001 * this.frequency * Math.PI * 2);
                displacement += this.pluckAmplitude * envelope * oscillation * tri;
            }

            const px = bx + perpX * displacement;
            const py = by + perpY * displacement;

            if (i === 0) this.graphics.moveTo(px, py);
            else this.graphics.lineTo(px, py);
        }

        this.graphics.strokePath();
    }

    checkParticleCrossing(prevX, prevY, currX, currY) {
        const sx = this.endA.x;
        const sy = this.endA.y;
        const ex = this.endB.x;
        const ey = this.endB.y;
        const pdx = currX - prevX;
        const pdy = currY - prevY;
        const sdx = ex - sx;
        const sdy = ey - sy;
        const denom = pdx * sdy - pdy * sdx;
        if (Math.abs(denom) < 1e-9) return null;
        const t1 = ((sx - prevX) * sdy - (sy - prevY) * sdx) / denom;
        const t2 = ((sx - prevX) * pdy - (sy - prevY) * pdx) / denom;
        if (t1 < 0 || t1 > 1 || t2 < 0 || t2 > 1) return null;
        return { x: prevX + t1 * pdx, y: prevY + t1 * pdy };
    }

    closestPointOnString(worldX, worldY) {
        const dx = this.endB.x - this.endA.x;
        const dy = this.endB.y - this.endA.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return { x: this.endA.x, y: this.endA.y, t: 0 };
        const t = Math.max(0, Math.min(1, ((worldX - this.endA.x) * dx + (worldY - this.endA.y) * dy) / lenSq));
        return { x: this.endA.x + t * dx, y: this.endA.y + t * dy, t };
    }

    destroy() {
        this.stopVibration();
        if (this.body) {
            this.scene.matter.world.remove(this.body);
            this.body = null;
        }
        if (this.handleA) {
            if (this.handleA._fixedCross) this.handleA._fixedCross.destroy();
            this.handleA.destroy();
            this.handleA = null;
        }
        if (this.handleB) {
            if (this.handleB._fixedCross) this.handleB._fixedCross.destroy();
            this.handleB.destroy();
            this.handleB = null;
        }
        const idx = this.scene.strings ? this.scene.strings.indexOf(this) : -1;
        if (idx !== -1) this.scene.strings.splice(idx, 1);
        this.graphics.destroy();
    }
}
