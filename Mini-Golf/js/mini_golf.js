import { Vector } from "./vector.js";
import { Hole, Ball, Polygon, GameArea } from "./components.js";
import { level_1 } from "./data.js";

export function startGame() {
    var level = data_to_level(level_1);
    
    document.addEventListener("mousemove", 
        level.game.updateMouse.bind(level.game),
        false);

    document.addEventListener("mousedown", 
        level.game.pressMouse.bind(level.game),
        false);
    document.addEventListener("mouseup", 
        level.game.releaseMouse.bind(level.game),
        false);
}

function data_to_level(level_data) {
    const level = {};
    level.game = new GameArea(level, level_data.game.width, level_data.game.height);
    level.game.start();

    level.ball = new Ball(level, level_data.ball.x, level_data.ball.y, level_data.ball.radius, level_data.ball.color);
    level.hole = new Hole(level, level_data.hole.x, level_data.hole.y, level_data.hole.radius);
    level.polygons = level_data.polygons.map(
        (polygon) => new Polygon(level, polygon.color, polygon.data.map((item) => new Vector(item[0], item[1]) ))
    );

    level.strokes = 0;
    return level;
}
