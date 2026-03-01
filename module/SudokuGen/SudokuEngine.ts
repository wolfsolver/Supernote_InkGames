// module/SudokuGen/SudokuEngine.ts
import sudoku from './sudoku';

export interface SudokuPuzzle {
    puzzle: string;
    difficulty: string;
}

const DIFFICULTY_MAP = [
    { label: "Easy", value: 62 },
    { label: "Medium", value: 53 },
    { label: "Hard", value: 44 },
    { label: "Very Hard", value: 35 },
    { label: "Insane", value: 26 },
    { label: "Inhuman", value: 17 }
];

const getClosestLabel = (givens: number): string => {
    const closest = DIFFICULTY_MAP.reduce((prev, curr) => {
        return (Math.abs(curr.value - givens) < Math.abs(prev.value - givens) ? curr : prev);
    });
    return `${closest.label} (${givens})`;
};

export const generateSudoku = (difficulty: number): SudokuPuzzle => {
    // sudoku.js usa 'easy', 'medium', 'hard' ecc o un numero diretto di indizi
    const puzzleStr = sudoku.generate(difficulty);

    // Calcoliamo l'etichetta testuale più vicina
    const diffLabel = getClosestLabel(difficulty);

    return {
        puzzle: puzzleStr,
        difficulty: diffLabel
    };
};