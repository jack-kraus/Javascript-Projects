import { Vector, intersect } from "./vector.js";
import { cn, strokeToScore } from "./data.js";

// Determine whether user is on mobile by trying to register a touch event
function deviceType() {
    try {
        document.createEvent("TouchEvent");
        return "touch";
    }
    catch (e) {
        return "mouse";
    }
}

// events to handle input are dependent on whether user is on mobile
const events = {
    mouse : {
        down: "mousedown",
        move: "mousemove",
        up: "mouseup"
    },
    touch : {
        down: "touchstart",
        move: "touchmove",
        up: "touchend"
    }
}

export class Hole {
    constructor (level, x, y, radius) {
        this.pos = new Vector(x, y); // position: where the hole is located
        
        this.radius = radius; // size
        this.ctx = level.ctx; // get context of canvas
        this.level = level; // level data
    }

    draw() {
        let diff = this.level.ball.pos.difference(this.pos).length(); // distance between hole and ball, determines how high flag is up
        diff = diff > 2 * this.radius ? 0 : diff; // if more than 2 radius lengths away, flag is not raised

        // draw hole itself
        this.ctx.beginPath();
        this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = "black";
        this.ctx.fill();
        
        // Draw flag
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.fillStyle = "red";
        this.ctx.lineTo(this.pos.x + 1.5 * this.radius, this.pos.y - 1.5 * this.radius - diff);
        this.ctx.lineTo(this.pos.x, this.pos.y - this.radius - diff);
        this.ctx.lineTo(this.pos.x, this.pos.y - 2 * this.radius - diff);
        this.ctx.fill();

        // Draw flagpole
        this.ctx.beginPath();
        this.ctx.moveTo(this.pos.x, this.pos.y - diff);
        this.ctx.lineTo(this.pos.x, this.pos.y - 2 * this.radius - diff);
        this.ctx.strokeStyle = "white";
        this.ctx.stroke();
    }

    // check collision with ball, point-circle collision
    collision(other) {
        const diff = this.pos.difference(other.pos).length();
        return diff < this.radius + other.radius;
    };
}

// Elliptical hazards (Sand trap, water, ice)
export class SandTrap {
    constructor (level, color, func, rotation, x, y, width, height) {
        this.pos = new Vector(x, y); // position, center point of elliptical trap
        this.radii = new Vector((width)/2, (height)/2); // major and minor axis of ellipse
        this.color = color;
        this.rotation = !rotation ? 0 : rotation / 180 * Math.PI; // if rotation not passed in, assume 0 degrees, else convert to radians from degrees
        // get level data and context
        this.ctx = level.ctx;
        this.level = level;
        this.func = func; // function: what to do to ball on collision
    }

    // draw the ellipse at the position with the rotation and radii
    draw() {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.color;
        this.ctx.ellipse(this.pos.x, this.pos.y, this.radii.x, this.radii.y, this.rotation, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    // check ellipse-point collision (with ball)
    collision(pos1) {
        const diff = pos1.difference(this.pos);
        const term1 = Math.pow(diff.x * Math.cos(this.rotation) + diff.y * Math.sin(this.rotation), 2);
        const term2 = Math.pow(diff.x * Math.sin(this.rotation) - diff.y * Math.cos(this.rotation), 2);
        const total = (term1 / (this.radii.x*this.radii.x)) + (term2 / (this.radii.y*this.radii.y));
        return total < 1;
    }
}

// Represented with point collision
export class Ball {
    constructor (level, x, y, radius, color) {
        this.pos = new Vector(x, y); // position of the ball, starting at passed x and y
        this.speed = new Vector(0, 0);
        this.radius = radius;
        this.color = color;
        
        // get canvas ctx and level data
        this.ctx = level.ctx;
        this.level = level;
    }

    update() {
        // move based on speed
        this.move();

        // check for trap collisions
        this.level.event(this.pos);
        
        // if colliding with the hole, accelerate towards it
        if (this.level.hole.collision(this)) {
            const diff = this.level.hole.pos.difference(this.pos); // get vector to hole
            diff.scalar(cn.hole_force); // multiply by some force (a constant < 1)
            this.speed.add(diff); // add to speed to accelerate towards
        }

        // if close to stop, stop
        if (this.speed.length() <= cn.speed_clamp) {
            this.speed.scalar(0);
        }
        
        // check if in center of hole
        this.checkWin();
    }

    // draw 
    draw() {
        // draw pointer if we've stored a start and end point and the level isn't over
        if (this.level.mouseEnd !== undefined && this.level.mouseStart !== undefined && !this.level.won) {
            const end_point = this.level.mouseEnd.difference(this.level.mouseStart); // get vector pointing from start to end point
            end_point.clamp_length(cn.clamp_amount); // clamp to a certain speed
            
            // either should be gray if ball is still moving, or colored based on how far it's pulled
            this.ctx.strokeStyle  = this.speed.length() !== 0 ? "gray" : `hsl(${(1 - (end_point.length()-this.radius) / (60-this.radius)) * 100},100%,50%)`;
            
            // shadow math
            // get vector perpendicular to vector between start and end to move shadow in that direction
            const perp = end_point.perpendicular();
            const end_angle = end_point.angle();
            // if shadow facing left, shadow should be to left of vector (so it's below it)
            // else it should be to the right so it's below it
            if (end_angle > 90 || end_angle < -90) perp.scalar(-1);
            this.ctx.shadowColor = "black";
            this.ctx.lineWidth = 3;
            // set shadow offset in canvas context
            this.ctx.shadowOffsetX = perp.x * 2;
            this.ctx.shadowOffsetY = perp.y * 2;
            
            // get end point of vector by adding start point to difference between start and end of pull
            end_point.add(this.pos);

            // draw line
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
        
        // draw ball itself
        this.ctx.beginPath();
        this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = "white";
        this.ctx.fill();
    }

    move() {
        // don't move if level completed
        if (this.level.won) return; 

        // check collision with level in line between current position and end position
        let collision = this.level.collision(this.pos, this.pos.sum(this.speed));

        // if collision found, keep going forward by 1 pixel in movement direction until before collision occurs with polygons
        // current speed made to be length 1 through vector normalization
        if (collision) {
            while (!this.level.collision(this.pos, this.pos.sum(this.speed.normal()))) {
                this.pos.add(this.speed.normal());
            }
            collision = this.level.collision(this.pos, this.pos.sum(this.speed.normal())); // store collision

            // reflect on collision normal to bounce off wall
            this.speed.reflect(collision.normal);
            this.speed.scalar(collision.friction); // slow down
            this.speed.clamp_length(cn.clamp_amount); // clamp speed
        }
        else {
            this.pos.add(this.speed); // else just add speed to vector
        }
    }


    checkWin() {
        if (this.level.won) return; // if won no need to check again
        // else if we're colliding with the hole, we're not moving, and the distance is less than a small error factor we're done with the level
        if (this.level.hole.collision(this) && this.speed.length()===0 && this.level.hole.pos.difference(this.pos).length() < cn.hole_diff) {
            this.level.finishLevel(); // level complete logic
            this.speed.scalar(0); // stop moving
            this.pos = this.level.hole.pos.copy(); // set position to hole position
        }
    }
}

// Level Geometry
export class Polygon {
    constructor (level, color, data, friction) {
        this.color = color;
        
        // level and canvas details
        this.level = level;
        this.ctx = level.ctx;
        this.canvas = level.canvas;
        
        // point list
        this.data = data;
        
        // if friction not specified use default friction
        this.friction = friction===undefined ? cn.friction : friction;
    }

    draw(outside=false) {
        // if drawing outside of bound, i.e. the first polygon, set to delete (carve out geometry)
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

    // check collision between line between two points specified and polygon
    collision(pos1, pos2) {
        // check collision between line specified and each line within polygon
        for (let i = 0; i < this.data.length; i++) {
            let point1 = this.data[i]; // point specified by i index
            // next point either i+1 or wraparound if i is last point
            let point2 = i === this.data.length - 1 ? this.data[0] : this.data[i+1];
            
            // if intersection found, return data of collision
            if (intersect(pos1, pos2, point1, point2)) {
                return { normal : point2.difference(point1).perpendicular(), friction : this.friction };
            }
        }

        // if no collisions found return undefined
        return undefined;
    }
}

// Game Logic
export class App {
    constructor (levels) {
        // canvas content
        this.canvas = undefined;
        this.ctx = undefined;
        this.highscore = Infinity;

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
        this.device = undefined;

        // level items
        this.canvas = undefined;
        this.game = undefined;
        this.polygons = undefined;
        this.ball = undefined;
        this.hole = undefined;
    }

    increment_level() {
        // add score to list of scores (unless next hole is first hole)
        if (this.level_number > -1) { this.scores.push(this.strokes - this.par); }
        
        // reset state variables
        this.game = undefined;
        this.polygons = undefined;
        this.ball = undefined;
        this.hole = undefined;
        this.strokes = 0;
        this.won = false;
        
        // disable next level button
        $("#next_level").prop("disabled", true);
       
        // increment number
        this.level_number++;
        
        // if last hole, load the score table 
        if (this.level_number >= this.levels.length) {
            // fade out last level
            const from = { height: $(this.canvas).prop("height") };
            const to = { height: 0 };
            $(this.canvas).fadeOut(500);
            $(from).animate(to, {
                duration: 500,
                step: function() {
                    $("canvas").attr("height", this.height);
                }
            });
            
            // load table
            this.load_table();
            this.scores.length = 0;
            this.level_number = -1;
        }
        else {
            // else load next level
            this.load_level(this.level_number);
        }
    }

    load_level(level_number) {
        // load current level
        const level_data = this.levels[level_number];
        
        // reset drag variables
        this.mouseEnd = undefined;
        this.mouseStart = undefined;
        
        // reset labels
        $("#par_label").html(`Par: ${level_data.par}`);
        $("#stroke_label").html(`Strokes: 0`);
        $("#next_level").html(level_number + 1 === this.levels.length ? "See Results" : `Next Level`); // if last hole, set to "See results", else just next level
        $("#tip_label").html("tip" in level_data ? level_data.tip : ""); // Show tip bubble if tip exists on hole
        $("table").remove(); // remove score table if present
        
        // if ground color not specified, use default green color
        const ground_color = (level_data.game.color !== undefined) ? "#7ED348" : level_data.game.color;
        $(this.canvas).css("background-color", ground_color);

        // set canvas properties
        // if currently hidden (i.e. first hole) then expand size from nothing
        if ($(this.canvas).is(":hidden")) {
            $(this.canvas).fadeIn("slow");
            $(this.canvas).css("filter", "brightness(1)");
            $(this.canvas).prop("aspectRatio", level_data.game.width / level_data.game.height);
            $(this.canvas).prop("width", level_data.game.width);
            $(this.canvas).prop("height", level_data.game.height);
        }
        else {
            // animate from current canvas size to next level's canvas size
            const from = { width: $(this.canvas).prop("width"), height: $(this.canvas).prop("height") };
            const to = { width: level_data.game.width, height: level_data.game.height };
            
            // animate then make brightness 1
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
        // convert javascript items to classes with object values passed in
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

    // add "amount" to stroke then update 
    increment_stroke(amount) {
        amount = (amount === undefined) ? 1 : amount; // if amount not specified, increment by one
        this.strokes += amount;
        $("#stroke_label").html(`Strokes: ${this.strokes}`); // update stroke label
    }

    // what to do when game starts
    start() {
        // canvas stuff
        this.canvas = document.createElement("canvas");
        $(this.canvas).hide(); // hide canvas at start
        this.ctx = this.canvas.getContext("2d");
        $("#content_div").append(this.canvas);

        // load level
        this.load_level(this.level_number);
        
        // set game loop
        this.interval = setInterval(this.updateGameArea.bind(this), 20);

        // set event listeners
        this.device = deviceType();
        $(document).on(events[this.device].move, this.updateMouse.bind(this));
        $(this.canvas).on(events[this.device].down, this.pressMouse.bind(this));
        $(document).on(events[this.device].up, this.releaseMouse.bind(this));

        // make button go to next levels
        $("#next_level").on("click", this.increment_level.bind(this));
    }

    // clear canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // draw all
    draw() {
        // if we have polygons, iterate through them and draw them with their draw functions
        if (this.polygons) {
            for (let i = 0; i < this.polygons.length; i++) {
                let polygon = this.polygons[i];
                polygon.draw(i === 0);
        }}
        // if we have sand traps, iterate through them and draw them with their draw functions
        if (this.sand_traps) {
            for (let i = 0; i < this.sand_traps.length; i++) {
                let sand_trap = this.sand_traps[i];
                sand_trap.draw();
        }}  
    }

    // do per game step
    updateGameArea() {
        this.clear(); // reset
        this.draw(); // draw self
        this.ball.update(); // move balls
        this.hole.draw(); // draw hole
        this.ball.draw(); // draw ball
        
    }

    // Start drag
    pressMouse(e) {
        const canvas_bound = this.canvas.getBoundingClientRect();
        e.preventDefault();

        // get coordinates depending on mobile or not
        const coords = {
            x : this.device === "mouse" ? e.pageX : e.touches[0].pageX,
            y : this.device === "mouse" ? e.pageY : e.touches[0].pageY,
        }
      
        
        // set start and end coordinates of drag to event location relative to canvas corner
        this.mouseStart = new Vector(coords.x - canvas_bound.left, coords.y - canvas_bound.top);
        this.mouseEnd = new Vector(coords.x - canvas_bound.left, coords.y - canvas_bound.top);
    }

    // while dragging, update end point
    updateMouse(e) {
        if (this.mouseStart === undefined) return;
        
        const canvas_bound = this.canvas.getBoundingClientRect();
        e.preventDefault();
        
        // get coordinates depending on mobile or not
        const coords = {
            x : this.device === "mouse" ? e.pageX : e.touches[0].pageX,
            y : this.device === "mouse" ? e.pageY : e.touches[0].pageY,
        }

        // set end point of drag based on event coordinate compared to canvas top left corner
        this.mouseEnd.x = coords.x - canvas_bound.left;
        this.mouseEnd.y = coords.y - canvas_bound.top;
    }

    // release mouse
    releaseMouse() {
        const diff = this.mouseEnd.difference(this.mouseStart); // get difference vector between start and end
        diff.clamp_length(cn.clamp_amount); // clamp length to max amount
        diff.minus_scalar(this.ball.radius); // subtract the radius of the ball from the vector
       
        // if the ball is currently not moving and the difference is not 0 and the hole isn't over
        if (this.ball.speed.length() === 0 && diff.length() > 0 && !this.won) {
            diff.scalar(cn.ball_force); // multiply amount by a force to launch the ball
            this.ball.speed.add(diff); // add force to speed
            this.increment_stroke(); // add one stroke
        }

        // reset drag points
        this.mouseStart = undefined;
        this.mouseEnd = undefined;
    }

    // when level won
    finishLevel() {
        this.won = true;
        $("#par_label").html(`Completed with a ${strokeToScore(this.strokes, this.par)}`); // set
        $(this.canvas).css( "filter", "brightness(0)"); // darken stage
        $("#next_level").prop("disabled", false); // allow next level button to be pressed
    }

    // check collision in from point pos1 to pos2
    collision(pos1, pos2) {
        for (const polygon of this.polygons) {
            let val = polygon.collision(pos1, pos2);
            if (val !== undefined) return val;
        }
    }
    
    // if position is colliding with a sand trap, perform the function
    event(pos1) {
        for (const sand_trap of this.sand_traps) {
            if (sand_trap.collision(pos1)) { sand_trap.func(this); return; }
        }
        this.ball.speed.scalar(cn.friction); // apply friction to ball
    }
}