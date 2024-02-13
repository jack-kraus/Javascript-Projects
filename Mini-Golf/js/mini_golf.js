var myGamePiece;

function Vector(x, y) {
    this.x = x;
    this.y = y;

    this.add = function(other) {
        this.x += other.x;
        this.y += other.y;
    }

    this.sum = function(other) {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    this.difference = function(other) {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    this.clamp_length = function(length) {
        const current_length = Math.sqrt(this.x ** 2 + this.y ** 2);
        if (current_length > length) {
            this.x *= (length / current_length);
            this.y *= (length / current_length);
        }
    }

    this.normalize = function() {
        const current_length = Math.sqrt(this.x ** 2 + this.y ** 2);
        this.x /= current_length;
        this.y /= current_length;
    }

    this.scalar = function(amount) {
        this.x *= amount;
        this.y *= amount;
    }
}


function startGame() {
    myGameArea.start();
    myGamePiece = new Ball(30, 30, 10, "white");
    myGamePiece.draw();
}

/* var myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 480;
        this.canvas.height = 270;
        this.context = this.canvas.getContext("2d");
        document.body.append(this.canvas);
        this.interval = setInterval(updateGameArea, 20);
    },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
} */

function GameArea() {
    this.mouseStart = undefined;
    this.mouseEnd = undefined;

    this.canvas = document.createElement("canvas");
    this.start = function() {
        this.canvas.width = 480;
        this.canvas.height = 270;
        this.ctx = this.canvas.getContext("2d");
        document.body.append(this.canvas);
        this.interval = setInterval(updateGameArea, 20);
    }
    this.clear = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // draw line
        if (this.mouseStart === undefined) return;
        const end_point = this.mouseEnd.difference(this.mouseStart)
        end_point.clamp_length(60);
        end_point.add(myGamePiece.pos);

        this.ctx.beginPath();
        this.ctx.moveTo(myGamePiece.pos.x, myGamePiece.pos.y);
        this.ctx.lineTo(end_point.x, end_point.y);
        this.ctx.stroke();
    }
    
    // Mouse movement
    this.pressMouse = function(e) {
        const canvas_bound = this.canvas.getBoundingClientRect();
        this.mouseStart = new Vector(e.pageX - canvas_bound.left, e.pageY - canvas_bound.top);
        this.mouseEnd = new Vector(e.pageX - canvas_bound.left, e.pageY - canvas_bound.top);
    }
    this.updateMouse = function(e) {
        if (this.mouseStart === undefined) return;
        const canvas_bound = this.canvas.getBoundingClientRect();
        this.mouseEnd.x = e.pageX - canvas_bound.left;
        this.mouseEnd.y = e.pageY - canvas_bound.top;
    }
    this.releaseMouse = function() {
        const diff = this.mouseEnd.difference(this.mouseStart)
        diff.scalar(0.3);
        myGamePiece.speed.add(diff);

        this.mouseStart = undefined;
        this.mouseEnd = undefined;
    }

    // collision
    this.collision = function(x, y, radius) {
        const canvas_bound = this.canvas.getBoundingClientRect();

        if (x > canvas_bound.right - canvas_bound.left - radius) return new Vector(-1, 0);
        else if (x < radius) return new Vector(1, 0);
        else if (y < radius) return new Vector(0, 1);
        else if (y > canvas_bound.bottom - canvas_bound.top - radius) return new Vector(0, -1);
        else return undefined;
    }
}

var myGameArea = new GameArea();

function updateGameArea() {
    myGameArea.clear();
    myGamePiece.update();
    myGamePiece.draw();
}

function Ball(x, y, radius, color) {
    this.pos = new Vector(x, y);
    this.speed = new Vector(0, 0);
    this.radius = radius;
    this.color = color;
    
    this.ctx = myGameArea.ctx;

    this.update = function() {
        this.move();
        this.speed.scalar(0.9);
    }

    this.draw = function() {
        this.ctx.beginPath();
        this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
        this.ctx.stroke();
    }

    this.move = function() {
        let newXCollision = myGameArea.collision(this.pos.x + this.speed, this.pos.y, this.radius);
        if (newXCollision !== undefined) {
            console.log("hello");
            newXCollision = myGameArea.collision(this.pos.x + Math.sign(this.speed.x), this.pos.y, this.radius);
            while (newXCollision === undefined) {
                this.pos.x += Math.sign(this.speed.x);
                newXCollision = myGameArea.collision(this.pos.x + Math.sign(this.speed.x), this.pos.y, this.radius);
            }
            this.speed.x = 0;
        }
        this.pos.x += this.speed.x;

        this.pos.y += this.speed.y;
    }
}

function isKeyDown(key) {
    if (key in keysDown) return keysDown[key];
    return false;
}

var keysDown = {"a" : false, "d" : false};

document.addEventListener('keydown', function(event) {
    if (event.defaultPrevented) {
    return; // Do nothing if the event was already processed
  }

  if (event.key in keysDown) keysDown[event.key] = true;
});

document.addEventListener('keyup', function(event) {
    if (event.defaultPrevented) {
    return; // Do nothing if the event was already processed
  }

  if (event.key in keysDown) keysDown[event.key] = false;
});

var mouseLocation = [0,0];
document.addEventListener("mousemove", 
    myGameArea.updateMouse.bind(myGameArea),
    false);

document.addEventListener("mousedown", 
    myGameArea.pressMouse.bind(myGameArea),
    false);
document.addEventListener("mouseup", 
    myGameArea.releaseMouse.bind(myGameArea),
    false);