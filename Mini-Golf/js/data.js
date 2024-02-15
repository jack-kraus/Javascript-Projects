// constants
export const cn = {
    speed_clamp : 0.35,
    hole_diff : 1.5,
    hole_force : 0.3,
    friction : 0.85
}

export const level_1 = {
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
}