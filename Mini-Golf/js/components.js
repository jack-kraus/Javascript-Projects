import { Vector, intersect } from "./vector.js";
import { cn, strokeToScore } from "./data.js";

export class Hole {
    constructor (level, x, y, radius) {
        this.pos = new Vector(x, y);
        this.radius = radius;
        this.ctx = level.game.ctx;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = "black";
        this.ctx.fill();
        this.ctx.stroke();
    }

    // check collision with ball
    collision(other) {
        const diff = this.pos.difference(other.pos).length();
        return diff < this.radius + other.radius;
    };
}

export class Ball {
    constructor (level, x, y, radius, color, finishLevel) {
        this.pos = new Vector(x, y);
        this.speed = new Vector(0, 0);
        this.radius = radius;
        this.color = color;
        
        this.finishLevel = finishLevel;
        this.ctx = level.game.ctx;
        this.level = level;
    }

    update() {
        this.move();
        this.speed.scalar(cn.friction); // friction
        if (this.level.hole.collision(this)) {
            const diff = this.level.hole.pos.difference(this.pos);
            diff.scalar(cn.hole_force);
            this.speed.add(diff);
        }
        // if close to stop, stop
        if (this.speed.length() <= cn.speed_clamp) {
            this.speed.scalar(0);
        }
        
        this.checkWin();
    }

    draw() {
        // draw pointer
        if (this.level.game.mouseStart !== undefined && !this.level.won) {
            const end_point = this.level.game.mouseEnd.difference(this.level.game.mouseStart);
            end_point.clamp_length(60);
            end_point.add(this.pos);
            
            this.ctx.strokeStyle  = this.speed.length() !== 0 ? "red" : "black";
            this.ctx.beginPath();
            this.ctx.moveTo(this.pos.x, this.pos.y);
            this.ctx.lineTo(end_point.x, end_point.y);
            this.ctx.stroke();
            this.ctx.strokeStyle = "black";
        }
        
        this.ctx.beginPath();
        this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        const color = document.getElementById("color_picker").value;
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    move() {
        if (this.level.won) return;
        let collision = this.level.game.collision(this.pos, this.pos.sum(this.speed));
        if (collision) {
            while (!this.level.game.collision(this.pos, this.pos.sum(this.speed.normal()))) {
                this.pos.add(this.speed.normal());
            }
            collision = this.level.game.collision(this.pos, this.pos.sum(this.speed.normal()));
            this.speed.reflect(collision.normal);
            this.speed.scalar(collision.friction);
        }
        else {
            this.pos.add(this.speed);
        }
    }

    checkWin() {
        // check win
        if (this.level.won) return;
        if (this.level.hole.collision(this) && this.speed.length()===0 && this.level.hole.pos.difference(this.pos).length() < cn.hole_diff) {
            this.finishLevel(this.level);
            this.speed.scalar(0);
            this.pos = this.level.hole.pos.copy();
        }
    }
}

export class Polygon {
    constructor (level, color, data, friction=0.8) {
        this.color = color;
        this.level = level;
        this.data = data;
        this.ctx = level.game.ctx;
        this.canvas = level.game.canvas;
        this.friction = friction;
    }

    draw(outside=false) {
        // if drawing outside of bound, i.e. the first polygon, set to delete
        if (outside) {
            this.ctx.fillStyle = this.color;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalCompositeOperation='destination-out';
        }

        // move to first point
        let point = this.data[0];
        this.ctx.moveTo(point.x, point.y);

        // draw from first onward
        this.ctx.beginPath();
        for (let i = 1; i <= this.data.length; i++) {
            let point = this.data[i % this.data.length];
            this.ctx.lineTo(point.x, point.y);
        }
        this.ctx.fill(); // fill the space

        // convert to refular draw
        this.ctx.globalCompositeOperation='source-over';
    }

    collision(pos1, pos2) {
        for (let i = 0; i < this.data.length; i++) {
            let point1 = this.data[i];
            let point2 = i === this.data.length - 1 ? this.data[0] : this.data[i+1];
            if (intersect(pos1, pos2, point1, point2)) {
                return { normal : point2.difference(point1).perpendicular(), friction : this.friction };
            }
        }
        return undefined;
    }
}

export class GameArea {
    constructor (level, width, height) {
        this.mouseStart = undefined;
        this.mouseEnd = undefined;
        this.level = level;
        
        // set canavs content
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext("2d");
        

        // fade
        this.fade = 0;
    }

    start() {
        document.getElementById("content_div").append(this.canvas);
        this.interval = setInterval(this.updateGameArea.bind(this), 20);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw() {
        for (let i = 0; i < this.level.polygons.length; i++) {
            let polygon = this.level.polygons[i];
            polygon.draw(i === 0);
        }
    }

    drawFade() {
        if (this.level.won) {
            this.fade = Math.min(this.fade + 0.05, 1);
        }
        this.ctx.fillStyle = `rgba(0,0,0,${this.fade})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Mouse movement
    pressMouse(e) {
        const canvas_bound = this.canvas.getBoundingClientRect();
        this.mouseStart = new Vector(e.pageX - canvas_bound.left, e.pageY - canvas_bound.top);
        this.mouseEnd = new Vector(e.pageX - canvas_bound.left, e.pageY - canvas_bound.top);
    }
    updateMouse(e) {
        if (this.mouseStart === undefined) return;
        const canvas_bound = this.canvas.getBoundingClientRect();
        this.mouseEnd.x = e.pageX - canvas_bound.left;
        this.mouseEnd.y = e.pageY - canvas_bound.top;
    }
    releaseMouse() {
        const diff = this.mouseEnd.difference(this.mouseStart);
        if (this.level.ball.speed.length() === 0 && diff.length() > this.level.ball.radius && !this.level.won) {
            diff.scalar(0.3);
            this.level.ball.speed.add(diff);
            this.level.strokes++;
            const stroke_label = document.getElementById("stroke_label");
            stroke_label.innerHTML = `Strokes: ${this.level.strokes}`;
        }
        this.mouseStart = undefined;
        this.mouseEnd = undefined;
    }

    // collision

    collision(pos1, pos2) {
        for (const polygon of this.level.polygons) {
            let val = polygon.collision(pos1, pos2);
            if (val !== undefined) return val;
        }
    }

    updateGameArea() {
        this.clear();
        this.draw();
        this.level.ball.update();
        this.level.hole.draw();
        this.level.ball.draw();
        this.drawFade();        
    }
}