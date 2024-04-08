import { Vector, intersect } from "./vector.js";
import { cn, strokeToScore } from "./data.js";

var debug = false;


export class Hole {
    constructor (level, x, y, radius) {
        this.pos = new Vector(x, y);
        this.radius = radius;
        this.ctx = level.ctx;
        this.level = level;
        this.counter = 0;
    }

    draw() {
        this.counter++;

        let diff = this.level.ball.pos.difference(this.pos).length();
        diff = diff > 2 * this.radius ? 0 : diff;

        this.ctx.beginPath();
        this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = "black";
        this.ctx.fill();
        
        // Define a new path
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.fillStyle = "red";
        this.ctx.lineTo(this.pos.x + 1.5 * this.radius, this.pos.y - 1.5 * this.radius - diff);
        this.ctx.lineTo(this.pos.x, this.pos.y - this.radius - diff);
        this.ctx.lineTo(this.pos.x, this.pos.y - 2 * this.radius - diff);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(this.pos.x, this.pos.y - diff);
        this.ctx.lineTo(this.pos.x, this.pos.y - 2 * this.radius - diff);
        this.ctx.strokeStyle = "white";
        this.ctx.stroke();
    }

    // check collision with ball
    collision(other) {
        const diff = this.pos.difference(other.pos).length();
        return diff < this.radius + other.radius;
    };
}

export class SandTrap {
    constructor (level, color, func, rotation, x, y, width, height) {
        this.pos = new Vector(x, y);
        this.radii = new Vector((width)/2, (height)/2);
        this.color = color;
        this.rotation = !rotation ? 0 : rotation / 180 * Math.PI;
        this.ctx = level.ctx;
        this.level = level;
        this.func = func;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.color;
        this.ctx.ellipse(this.pos.x, this.pos.y, this.radii.x, this.radii.y, this.rotation, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    collision(pos1) {
        const diff = pos1.difference(this.pos);
        const term1 = Math.pow(diff.x * Math.cos(this.rotation) + diff.y * Math.sin(this.rotation), 2);
        const term2 = Math.pow(diff.x * Math.sin(this.rotation) - diff.y * Math.cos(this.rotation), 2);
        const total = (term1 / (this.radii.x*this.radii.x)) + (term2 / (this.radii.y*this.radii.y));
        return total < 1;
    }
}

export class Ball {
    constructor (level, x, y, radius, color) {
        this.pos = new Vector(x, y);
        this.speed = new Vector(0, 0);
        this.radius = radius;
        this.color = color;
        
        this.ctx = level.ctx;
        this.level = level;
    }

    update() {
        this.move();
        this.level.event(this.pos);
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
        if (this.level.mouseEnd !== undefined && this.level.mouseStart !== undefined && !this.level.won) {
            const end_point = this.level.mouseEnd.difference(this.level.mouseStart);
            end_point.clamp_length(cn.clamp_amount);
            
            this.ctx.strokeStyle  = this.speed.length() !== 0 ? "gray" : `hsl(${(1 - (end_point.length()-this.radius) / (60-this.radius)) * 100},100%,50%)`;
            
            // shadow math
            const perp = end_point.perpendicular();
            const end_angle = end_point.angle();
            if (end_angle > 90 || end_angle < -90) perp.scalar(-1);
            this.ctx.shadowColor = "black";
            this.ctx.lineWidth = 3;
            this.ctx.shadowOffsetX = perp.x * 2;
            this.ctx.shadowOffsetY = perp.y * 2;
            
            end_point.add(this.pos);

            this.ctx.beginPath();
            this.ctx.moveTo(this.pos.x, this.pos.y);
            this.ctx.lineTo(end_point.x, end_point.y);
            this.ctx.stroke();
            this.ctx.strokeStyle = "black";
        }

        // remove shadow
        this.ctx.shadowColor = "";
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        this.ctx.beginPath();
        this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = "white";
        this.ctx.fill();
    }

    move() {
        if (this.level.won) return;
        let collision = this.level.collision(this.pos, this.pos.sum(this.speed));
        if (collision) {
            while (!this.level.collision(this.pos, this.pos.sum(this.speed.normal()))) {
                this.pos.add(this.speed.normal());
            }
            collision = this.level.collision(this.pos, this.pos.sum(this.speed.normal()));
            this.speed.reflect(collision.normal);
            this.speed.scalar(collision.friction);
            this.speed.clamp_length(cn.clamp_amount);
        }
        else {
            this.pos.add(this.speed);
        }
    }

    checkWin() {
        // check win
        if (this.level.won) return;
        if (this.level.hole.collision(this) && this.speed.length()===0 && this.level.hole.pos.difference(this.pos).length() < cn.hole_diff) {
            this.level.finishLevel();
            this.speed.scalar(0);
            this.pos = this.level.hole.pos.copy();
        }
    }
}

export class Polygon {
    constructor (level, color, data, friction) {
        this.color = color;
        this.level = level;
        this.data = data;
        this.ctx = level.ctx;
        this.canvas = level.canvas;
        this.friction = friction===undefined ? cn.friction : friction;
    }

    draw(outside=false) {
        // if drawing outside of bound, i.e. the first polygon, set to delete
        this.ctx.fillStyle = this.color;
        if (outside) {
            
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

export class App {
    constructor (levels) {
        // canvas content
        this.canvas = undefined;
        this.ctx = undefined;
        this.highscore = Infinity;
        // $(this.canvas).hide();

        // total state
        this.level_number = 0;
        this.levels = levels;
        this.scores = [];
        
        // level state
        this.strokes = 0;
        this.won = false;
        this.par = 0;

        // mouse movement
        this.mouseEnd = undefined;
        this.mouseStart = undefined;

        // level items
        this.canvas = undefined;
        this.game = undefined;
        this.polygons = undefined;
        this.ball = undefined;
        this.hole = undefined;
    }

    increment_level() {
        if (this.level_number > -1) { this.scores.push(this.strokes - this.par); }
        // reset state variables
        this.game = undefined;
        this.polygons = undefined;
        this.ball = undefined;
        this.hole = undefined;
        this.strokes = 0;
        this.won = false;
        $("#next_level").prop("disabled", true);
       
        // increment number
        this.level_number++;
        if (this.level_number >= this.levels.length) {
            const from = { height: $(this.canvas).prop("height") };
            const to = { height: 0 };
            $(this.canvas).fadeOut(500);
            $(from).animate(to, {
                duration: 500,
                step: function() {
                    $("canvas").attr("height", this.height);
                }
            });
            
            this.load_table();
            this.scores.length = 0;
            this.level_number = -1;
        }
        else {
            this.load_level(this.level_number);
        }
    }

    load_level(level_number) {
        // load current level
        const level_data = this.levels[level_number];
        this.mouseEnd = undefined;
        this.mouseStart = undefined;
        $("#par_label").html(`Par: ${level_data.par}`);
        $("#stroke_label").html(`Strokes: 0`);
        $("#next_level").html(level_number + 1 === this.levels.length ? "See Results" : `Next Level`);
        $("#tip_label").html("tip" in level_data ? level_data.tip : "");
        $("table").remove();
        const ground_color = (level_data.game.color !== undefined) ? "#7ED348" : level_data.game.color;
        $(this.canvas).css("background-color", ground_color);

        // set canvas properties
        if ($(this.canvas).is(":hidden")) {
            $(this.canvas).fadeIn("slow");
            $(this.canvas).css("filter", "brightness(1)");
            $(this.canvas).prop("aspectRatio", level_data.game.width / level_data.game.height);
            $(this.canvas).prop("width", level_data.game.width);
            $(this.canvas).prop("height", level_data.game.height);
        }
        else {
            // attribute elements
            const from = { width: $(this.canvas).prop("width"), height: $(this.canvas).prop("height") };
            const to = { width: level_data.game.width, height: level_data.game.height };
            $(from).animate(to, {
                duration: 500,
                step: function() {
                    $("canvas").attr("width", this.width);
                    $("canvas").attr("height", this.height);
                },
                complete: () => { $("canvas").css( "filter", "brightness(1)"); }
            });
            $(this.canvas).prop("aspectRatio", level_data.game.width / level_data.game.height);
        }
        
        // set level items
        this.strokes = 0;
        this.par = level_data.par;
        this.won = false;

        // load in level items
        this.polygons = !("polygons" in level_data) ? [] : level_data.polygons.map(
            (polygon) => new Polygon(this, polygon.color, polygon.data.map((item) => new Vector(item[0], item[1]) ), polygon.friction)
        );
        this.hole = new Hole(this, level_data.hole.x, level_data.hole.y, level_data.hole.radius);
        this.ball = new Ball(this, level_data.ball.x, level_data.ball.y, level_data.ball.radius, level_data.ball.color);
        this.sand_traps = !("sand_traps" in level_data) ? [] : level_data.sand_traps.map(
            (sand_trap) => new SandTrap(this, sand_trap.color, sand_trap.func, sand_trap.rotation, ...sand_trap.dimensions)
        );
    }

    load_table() {
        // set highscore values
        const total = this.scores.reduce((a,b) => a + b, 0);
        this.highscore = Math.min(total, this.highscore);
        $("#stroke_label").html(`High Score: ${this.highscore}`);
        $("#par_label").html(`Total Score: ${total}`);
        $("#next_level").prop("disabled", false).html("Play Again");
        $("#tip_label").html("Thanks for playing!");

        // construct table
        const table = $("<table></table>");
        $("#content_div").prepend(table);
        
        const index_row = $("<tr><td>Hole</td></tr>");
        const score_row = $("<tr><td>Score</td></tr>");

        for (let i = 0; i < this.scores.length; i++) {
            index_row.append(`<td>${i+1}</td>`);
            score_row.append(`<td>${this.scores[i]}</td>`);
        }
        index_row.append(`<td>Total</td>`);
        score_row.append(`<td>${total}</td>`);

        $(table).append(index_row, score_row);
    }

    // components
    increment_stroke(amount) {
        amount = (amount === undefined) ? 1 : amount;
        this.strokes += amount;
        $("#stroke_label").html(`Strokes: ${this.strokes}`);
    }

    // what to do when game starts
    start() {
        // canvas stuff
        this.canvas = document.createElement("canvas");
        $(this.canvas).hide();
        this.ctx = this.canvas.getContext("2d");
        $("#content_div").append(this.canvas);

        this.load_level(this.level_number);
        
        // set game loop
        this.interval = setInterval(this.updateGameArea.bind(this), 20);

        // set event listeners
        $(document).on("mousemove", this.updateMouse.bind(this));
        $(document).on("mousedown", this.pressMouse.bind(this));
        $(document).on("mouseup", this.releaseMouse.bind(this));

        $("#next_level").on("click", this.increment_level.bind(this));
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw() {
        if (this.polygons) {
            for (let i = 0; i < this.polygons.length; i++) {
                let polygon = this.polygons[i];
                polygon.draw(i === 0);
        }}
        if (this.sand_traps) {
            for (let i = 0; i < this.sand_traps.length; i++) {
                let sand_trap = this.sand_traps[i];
                sand_trap.draw();
        }}  
    }

    updateGameArea() {
        this.clear();
        this.draw();
        this.ball.update();
        this.hole.draw();
        this.ball.draw();
        
    }

    // Mouse movement
    pressMouse(e) {
        const canvas_bound = this.canvas.getBoundingClientRect();
        this.mouseStart = new Vector(e.pageX - canvas_bound.left, e.pageY - canvas_bound.top);
        this.mouseEnd = new Vector(e.pageX - canvas_bound.left, e.pageY - canvas_bound.top);
    }
    updateMouse(e) {
        const canvas_bound = this.canvas.getBoundingClientRect();
        // const mouse_position = new Vector(e.pageX - canvas_bound.left, e.pageY - canvas_bound.top);
        // const color = this.friction(mouse_position) === 0.85 ? "red" : "black";
        // if (debug) $("body").css("background-color", color);

        if (this.mouseStart === undefined) return;
        this.mouseEnd.x = e.pageX - canvas_bound.left;
        this.mouseEnd.y = e.pageY - canvas_bound.top;
    }
    releaseMouse() {
        const diff = this.mouseEnd.difference(this.mouseStart);
        diff.clamp_length(cn.clamp_amount);
        diff.minus_scalar(this.ball.radius);
       
        if (this.ball.speed.length() === 0 && diff.length() > 0 && !this.won) {
            diff.scalar(cn.ball_force);
            this.ball.speed.add(diff);
            this.increment_stroke();
        }
        this.mouseStart = undefined;
        this.mouseEnd = undefined;
    }

    // when level won
    finishLevel() {
        this.won = true;
        $("#par_label").html(`Completed with a ${strokeToScore(this.strokes, this.par)}`);
        $(this.canvas).css( "filter", "brightness(0)");
        $("#next_level").prop("disabled", false);
    }

    collision(pos1, pos2) {
        for (const polygon of this.polygons) {
            let val = polygon.collision(pos1, pos2);
            if (val !== undefined) return val;
        }
    }
    
    event(pos1) {
        for (const sand_trap of this.sand_traps) {
            if (sand_trap.collision(pos1)) { sand_trap.func(this); return; }
        }
        this.ball.speed.scalar(cn.friction);
    }
}