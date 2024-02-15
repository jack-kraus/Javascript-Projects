import { Vector } from "./vector.js";
import { Hole, Ball, Polygon, GameArea } from "./components.js";
import { levels } from "./data.js";

var level_number = -1;
var scores = [];
var level;

export function startGame() {
    level_number++;
    const canvas = document.getElementsByTagName('canvas');
    if (canvas.length > 0) { canvas[0].remove(); scores.push(level.strokes - level.par); }
    const table = document.getElementsByTagName('table');
    if (table.length > 0) { table[0].remove(); }
    if (level_number >= levels.length) { showScores(); return; }
    
    level = data_to_level(levels[level_number]);
    
    // reset labels
    document.getElementById("next_level").innerText = `Next Level`;
    
    document.getElementById("stroke_label").innerText = `Strokes: 0`;
    document.getElementById("par_label").innerText = `Par: ${level.par}`;
    document.getElementById("next_level").disabled = true;


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

function showScores() {
    const score_table = document.createElement("table");
    const index_row = score_table.insertRow();
    const score_row = score_table.insertRow();

    index_row.insertCell().appendChild(document.createTextNode(`Hole #`));
    score_row.insertCell().appendChild(document.createTextNode(`Score`));

    for (let i = 0; i < scores.length; i++) {
        index_row.insertCell().appendChild(document.createTextNode(`${i+1}`));
        score_row.insertCell().appendChild(document.createTextNode(`${scores[i]}`));
    }


    document.body.append(score_table);

    document.getElementById("next_level").innerText = `Replay`;
    level_number = -1;
    scores = [];
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
    level.par = level_data.par;
    level.won = false;
    return level;
}
