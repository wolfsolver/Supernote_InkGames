// module/AMazeJs/AMazeEngine.ts
const maze = require('./maze');

export interface MazeData {
    grid: number[][]; // 1 = path, 0 = wall
    width: number;
    height: number;
}

export const generateMaze = (rows: number, cols: number): MazeData => {
    // maze.js Backtracker expects (width, height)
    // Se l'utente pensa a rows/cols, rows = height, cols = width.
    const m = new maze.Backtracker(cols, rows);
    m.generate();

    const grid: number[][] = [];
    for (let r = 0; r < rows; r++) {
        const row: number[] = [];
        for (let c = 0; c < cols; c++) {
            row.push(m.get(r, c));
        }
        grid.push(row);
    }

    return {
        grid,
        width: cols,
        height: rows
    };
};
