import { App } from "./components.js";
import { levels } from "./data.js";

var app = new App(levels);

export function startGame() {
    app.start();
}