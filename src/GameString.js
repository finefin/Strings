import NoteParticle from "./NoteParticle.js";

export default class GameString {
    constructor(scene, x, y, length, config = {}) {
        const {
            color = 0xffffff,
            lineWidth = 4,
            angle = 0,
            pluckAmplitude = 30,
            frequency = 6,
            decayMs = 1200,
            particleConfig = {},
            note,
        } = config;

        this.scene = scene;
        this.x = x;
        this.y = y;
        this.length = length;
        this.color = color;
        this.lineWidth = lineWidth;
        this.angle = angle;
        this.pluckAmplitude = pluckAmplitude;
        this.frequency = frequency;
        this.decayMs = decayMs;
        this.particleConfig = particleConfig;
        this.note = note ?? 1;

        this.plucks = [];

        this.graphics = scene.add.graphics();
        this.graphics.setPosition(x, y);

        if (angle !== 0) {
            this.graphics.setAngle(angle);
        }

        this.drawString();

        const hitWidth = Math.max(20, lineWidth * 6);
        this.hitArea = scene.add.rectangle(x, y, length, hitWidth)
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.001);

        if (angle !== 0) {
            this.hitArea.setAngle(angle);
        }

        this.hitArea.on('pointerover', (pointer) => {
            const point = this.closestPointOnString(pointer.worldX, pointer.worldY);
            const dx = pointer.worldX - (this.scene.prevPointerX ?? pointer.worldX);
            const dy = pointer.worldY - (this.scene.prevPointerY ?? pointer.worldY);
            this.pluck(point.x, point.y, dx, dy);
        });

        const bodyOptions = {
            isStatic: true,
            isSensor: true,
            label: 'gameString',
        };
        if (angle !== 0) {
            bodyOptions.angle = angle * Math.PI / 180;
        }
        this.body = scene.matter.add.rectangle(x, y, length, 6, bodyOptions);
        this.body.gameStringRef = this;

        if (!this.scene.strings) this.scene.strings = [];
        this.scene.strings.push(this);
    }

    playNote() {
        this.scene.sound.play('blip', { rate: this.note, volume: 0.3 });
    }

    blendColors(c1, c2, t) {
        const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
        const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
        return (Math.round(r1 + (r2 - r1) * t) << 16)
             | (Math.round(g1 + (g2 - g1) * t) << 8)
             | Math.round(b1 + (b2 - b1) * t);
    }

    pluck(spawnX, spawnY, dirX, dirY, sourceColor) {
        if (spawnX === undefined) spawnX = this.x;
        if (spawnY === undefined) spawnY = this.y;

        const pluckT = this.closestPointOnString(spawnX, spawnY).t;

        let dirSign = 1;
        if (dirX !== undefined && dirY !== undefined && (dirX !== 0 || dirY !== 0)) {
            const rad = this.angle * Math.PI / 180;
            const perpX = -Math.sin(rad);
            const perpY = Math.cos(rad);
            dirSign = Math.sign(dirX * perpX + dirY * perpY) || 1;
        }

        this.plucks.push({ t: pluckT, elapsed: 0, dirSign });

        const spawnColor = sourceColor !== undefined
            ? this.blendColors(this.color, sourceColor, 0.5)
            : this.color;

        let directionAngle;
        if (dirX !== undefined && dirY !== undefined && (dirX !== 0 || dirY !== 0)) {
            directionAngle = Math.atan2(dirY, dirX);
        } else {
            const radians = this.angle * Math.PI / 180;
            directionAngle = radians + Math.PI / 2;
        }
        new NoteParticle(this.scene, spawnX, spawnY, {
            ...this.particleConfig,
            color: spawnColor,
            direction: directionAngle,
            directionSpread: Math.PI / 2,
        });

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

        const halfLen = this.length / 2;

        this.graphics.beginPath();
        this.graphics.moveTo(-halfLen, 0);

        const steps = 30;

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const px = halfLen * (2 * t - 1);
            let py = 0;
            for (const pluck of this.plucks) {
                if (pluck.elapsed >= this.decayMs) continue;
                const envelope = 1 - pluck.elapsed / this.decayMs;
                const pt = pluck.t;
                const tri = t <= pt
                    ? (pt > 0 ? t / pt : 0)
                    : (pt < 1 ? (1 - t) / (1 - pt) : 0);
                const oscillation = pluck.dirSign * Math.cos(pluck.elapsed * 0.001 * this.frequency * Math.PI * 2);
                py += this.pluckAmplitude * envelope * oscillation * tri;
            }
            this.graphics.lineTo(px, py);
        }

        this.graphics.strokePath();
    }

    checkParticleCrossing(prevX, prevY, currX, currY) {
        const rad = this.angle * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const halfLen = this.length / 2;
        const sx = this.x - cos * halfLen;
        const sy = this.y - sin * halfLen;
        const ex = this.x + cos * halfLen;
        const ey = this.y + sin * halfLen;
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
        const rad = this.angle * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const halfLen = this.length / 2;
        const sx = this.x - cos * halfLen;
        const sy = this.y - sin * halfLen;
        const ex = this.x + cos * halfLen;
        const ey = this.y + sin * halfLen;
        const dx = ex - sx;
        const dy = ey - sy;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return { x: this.x, y: this.y };
        const t = Math.max(0, Math.min(1, ((worldX - sx) * dx + (worldY - sy) * dy) / lenSq));
        return { x: sx + t * dx, y: sy + t * dy, t };
    }

    destroy() {
        this.stopVibration();
        if (this.body) {
            this.scene.matter.world.remove(this.body);
            this.body = null;
        }
        const idx = this.scene.strings ? this.scene.strings.indexOf(this) : -1;
        if (idx !== -1) this.scene.strings.splice(idx, 1);
        this.graphics.destroy();
        this.hitArea.destroy();
    }
}
