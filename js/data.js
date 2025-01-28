
// constants
export const cn = {
    speed_clamp : 0.35,
    hole_diff : 1.5,
    hole_force : 0.55,
    friction : 0.85,
    clamp_amount : 75,
    ball_force : 0.6
}

// function to apply friction to the ball
const fric_func = function(friction) {
    return (level) => { level.ball.speed.scalar(friction); }
}

// function to return ball to original position with penalty
const reset_func = function(penalty) {
    penalty = (penalty === undefined) ? 0 : penalty;
    return (level) => {
        level.increment_stroke(penalty);
        level.ball.pos.x = level.levels[level.level_number].ball.x;
        level.ball.pos.y = level.levels[level.level_number].ball.y;
        level.ball.speed.scalar(0);
    };
}

// returns array representing a diamond with (x, y) center and (w, h) dimensions
const diamond = function (x, y, w, h) {
    const hw = w / 2;
    const hh = h / 2;
    return [
        [x, y-hh],
        [x+hw, y],
        [x, y+hh],
        [x-hw, y]
    ];
}

// returns array representing a rectangle with (x, y) corner point and (w, h) dimensions
const rectangle = function(x, y, w, h) {
    return [
        [x, y],
        [x+w, y],
        [x+w, y+h],
        [x, y+h]
    ];
}

// Level data
const level_1 = {
    game : { width : 270, height : 270 },
    ball : { x : 83, y : 188, radius : 10 },
    hole : { x : 188, y : 83, radius : 10 },
    polygons : [
        { color: "#2e855c", data: [
            [240, 30],
            [240, 135],
            [135, 135],
            [135, 240],
            [30, 240],
            [30, 135],
            [135, 30],
            
        ]}
    ],
    par : 2,
    tip : "Get the ball in the hole in as few strokes as possible, drag and release to shoot"
}

const level_2 = {
    game : { width : 270, height : 360 },
    ball : { x : 83, y : 285, radius : 10},
    hole : { x : 187, y : 83, radius : 10 },
    polygons : [
        { color: "#2e855c", data: [
                [30, 30],
                [240, 30],
                [240, 135],
                [135, 135],
                [240, 240],
                [240, 330],
                [30, 330],
                [30, 240],
                [135, 240],
                [30, 135],
            ] 
        }
    ],
    sand_traps : [
        {
            color: "#d4d090", dimensions: [105, 180, 110, 40], func: fric_func(0.3), rotation:45
        }
    ],
    par : 3,
    tip : "Avoid the sand trap, it will slow you down"
}

const level_3 = {
    game : { width : 480, height : 270 },
    ball : { x : 100, y : 220, radius : 10},
    hole : { x : 420, y : 100, radius : 10 },
    polygons : [
        { color: "#2e855c", data: [
            [30, 30],
            [170, 30],
            // arch
            [170, 80],
            [310, 50],
            [450, 80],
            [450, 190],
            [310, 160],
            [170, 190],
            // end
            [170, 240],
            [30, 240],
        ]},

        { color: "#2e855c", data: [
            [230, 105],
            [230, 270],
            [250, 270],
            [250, 105],
        ]},
        { color: "#2e855c", data: [
            [370, 0],
            [370, 135],
            [390, 135],
            [390, 0],
        ]},
    ],
    par : 3,
    tip : "Line up your shots carefully"
}

const level_4 = {
    game : { width : 360, height : 240 },
    ball : { x : 60, y : 180, radius : 10},
    hole : { x : 300, y : 180, radius : 10 },
    polygons : [
        { color: "#2e855c", data: [
            [30, 150],
            [100, 150],
            [150, 100],
            [150, 30],
            
            [210, 30],
            [210, 100],
            [260, 150],
            [330, 150],
            
            [330, 210],
            [30, 210]
        ]},
    ],
    sand_traps : [
        {
            color: "#3663c5", dimensions: [180, 180, 100, 100], func: reset_func(0), rotation:0
        }
    ],
    par : 2,
    tip : "Avoid the water or you'll have to start over!"
}

const level_5 = {
    game : { width : 360, height : 360 },
    ball : { x : 80, y : 280, radius : 10},
    hole : { x : 280, y : 80, radius : 10 },
    polygons : [
        { color: "#2e855c", data: [
            [30, 330],
            [130, 330],
            [130, 230],
            [330, 230],
            [330, 30],
            [130, 30],
            [230, 30],
            [230, 130],
            [130, 130],
            [30, 130]
        ]},

        { color: "#852e2e", friction: 1.5, data: [
            [30, 130],
            [80, 130],
            [30, 180],
        ]},
        { color: "#852e2e", friction: 1.5, data: [
            [330, 230],
            [280, 230],
            [330, 180],
        ]},
        { color: "#2e855c", data: rectangle(130, 180, 50, 50)},
        { color: "#2e855c", data: rectangle(230, 130, 50, 50)},
        { color: "#852e2e", friction: 1.5, data: [
            [180, 130],
            [230, 180],
            [230, 130]
        ]},
    ],
    par : 3,
    tip : "Hit the red blocks and you'll go flying!"
}

const level_6 = {
    game : { width : 360, height : 270 },
    ball : { x : 70, y : 193, radius : 10},
    hole : { x : 180, y : 193, radius : 10 },
    polygons : [
        { color: "#2e855c", data: [
            [30,30],
            [250,30],
            [330,100],
            [330,170],
            [250,240],
            [130,240],
            [130,145],
            [230,145],
            [230,125],
            [110,125],
            [110,240],
            [30,240],
        ]},
    ],
    par : 3,
    sand_traps : [
        { color: "#9cecf7", dimensions: [250, 135, 60, 110], func: fric_func(1), rotation:0 },
        { color: "#9cecf7", dimensions: [135, 50, 110, 40], func: fric_func(1), rotation:0 }
    ],
    tip : "Ice patches have no friction"
};

const level_7 = {
    game : { width : 360, height : 400 },
    ball : { x : 75, y : 340, radius : 10},
    hole : { x : 75, y : 60, radius : 10 },
    polygons : [
        { color: "#2e855c", data: [
            [30, 30],
            [330, 30],
            [330, 370],
            [30, 370]
        ]},
        { color: "#2e855c", data: rectangle(30, 100, 200, 30)},
        { color: "#9b46b4", friction: 0, data: rectangle(230, 60, 50, 70)},
        { color: "#9b46b4", friction: 0, data: rectangle(50, 250, 100, 30)},
        { color: "#9b46b4", friction: 0, data: rectangle(210, 250, 100, 30)},
        { color: "#852e2e", friction: 2.5, data: diamond(180, 190, 80, 80)},
    ],
    par : 4,
    tip : "Purple walls are sticky"
}

// array of all levels
export const levels = [level_1, level_2, level_3, level_4, level_5, level_6, level_7];

// convert number of strokes to a score
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