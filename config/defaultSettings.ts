/**
 * config/defaultSettings.ts
 * This file defines the "Source of Truth" for the app settings.
 * Modify this object to add new features to the template.
 */

export interface Settings {
    theme: 'light' | 'dark' | 'system';

    SudokuGen: boolean;
    SudokuGen_DefaultDifficulty: number;
    SudokuOnLine: boolean;
    AMazeJs: boolean;
    AMazeJs_DefaultSize: { rows: number, cols: number };
    GenerateMaze: boolean;
    WordFind: boolean;
    WordFind_Dictionaty: string;
    Nonogram: boolean
}

export const DEFAULT_SETTINGS: Settings = {
    theme: 'light',

    SudokuGen: true,
    SudokuGen_DefaultDifficulty: 53,
    SudokuOnLine: true,
    AMazeJs: true,
    AMazeJs_DefaultSize: { rows: 35, cols: 35 },
    GenerateMaze: true,
    WordFind: true,
    WordFind_Dictionaty: './asset/en-common.txt',
    Nonogram: true
};

export const GAMES_CONFIG = {
    SudokuGen: {
        title: 'Sudoku (via Sudoku.js)',
        icon: '🔢',
    },
    SudokuOnLine: {
        title: 'Sudoku (via dosuku API)',
        icon: '🔢',
    },
    AMazeJs: {
        title: 'Maze (via AMazeJs)',
        icon: '🌀',
    },
    GenerateMaze: {
        title: 'Maze (via GenerateMaze)',
        icon: '🕸️',
    },
    WordFind: {
        title: 'Word Search (via WordFind',
        icon: '🔍',
    },
    Nonogram: {
        title: 'Nonogram (via Nonogram)',
        icon: '⬛',
    },
} as const;