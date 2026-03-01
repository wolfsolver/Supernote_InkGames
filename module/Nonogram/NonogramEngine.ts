/**
 * module/Nonogram/NonogramEngine.ts
 */
import { Creator } from './NonogramLogic';

export interface NonogramPuzzle {
    width: number;
    height: number;
    rowHints: number[][];
    columnHints: number[][];
    grid: number[][]; // Solution grid
}

export const generateNonogram = (width: number = 10, height: number = 10): NonogramPuzzle => {
    const creator = new Creator();
    // createRandom(width, height, density)
    const puzzle = creator.createRandom(width, height, 0.5);

    return {
        width: puzzle.width,
        height: puzzle.height,
        rowHints: puzzle.rowHints,
        columnHints: puzzle.columnHints,
        grid: puzzle.grid
    };
};
