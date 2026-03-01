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
    GenerateMaze: true,
    WordFind: true,
    WordFind_Dictionaty: './asset/en-common.txt',
    Nonogram: true
};

export const GAMES_CONFIG = {
    SudokuGen: {
        title: 'Sudoku (via SudokuGen Engine)',
        icon: '🔢',
    },
    SudokuOnLine: {
        title: 'Sudoku (via https://sudoku-api.vercel.app/api/dosuku)',
        icon: '🔢',
    },
    AMazeJs: {
        title: 'Maze (via AMazeJs Engine)',
        icon: '🌀',
    },
    GenerateMaze: {
        title: 'Maze (via GenerateMaze Engine)',
        icon: '🕸️',
    },
    WordFind: {
        title: 'Word Search (via WordFind Engine)',
        icon: '🔍',
    },
    Nonogram: {
        title: 'Nonogram (via Nonogram Engine)',
        icon: '⬛',
    },
} as const