// constants
export const cn = {
    speed_clamp : 0.35,
    hole_diff : 1.5,
    hole_force : 0.3,
    friction : 0.85
}

const level_1 = {
    game : { width : 480, height : 270 },
    ball : { x : 50, y : 50, radius : 10, color : "white" },
    hole : { x : 250, y : 60, radius : 10 },
    polygons : [
        { color: "green", data: [
                [30, 30],
                [120, 30],
                [120, 100],
                [140, 100],
                [140, 30],
                [480 - 60, 30],
                [480 - 30, 60],
                [480 - 30, 270 - 30],
                [30, 270 - 30]
            ] 
        },
        { color: "green", data: [
                [350, 60],
                [375, 60],
                [375, 120],
                [350, 120],
            ] 
        }
    ],
    par : 3
}

const level_2 = {
    game : { width : 480, height : 480 },
    ball : { x : 50, y : 50, radius : 10, color : "red" },
    hole : { x : 250, y : 60, radius : 10 },
    polygons : [
        { color: "green", data: [
                [30, 30],
                [450, 30],
                [450, 450],
                [30, 450]
            ] 
        },
    ],
    par : 3
}

export const levels = [level_1, level_2];

export function strokeToScore(strokes, par) {
    if (strokes === 1) return "Hole in One"
    switch (strokes - par) {
        case -4: return "Condor";
        case -3: return "Albatross";
        case -2: return "Eagle";
        case -1: return "Birdie";
        case 0: return "Par";
        case 1: return "Bogey";
        case 2: return "Double Bogey";
        case 3: return "Triple Bogey";
        case 4: return "Quadruple Bogey";
        default:
            if (strokes - par > 0) return `+${strokes - par} Bogey`;
            else return `${strokes - par} under Par`;
    }
}