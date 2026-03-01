/**
 * module/WordFind/WordFindEngine.ts
 */
import { wordfind } from './wordfind';
import { DICTIONARY } from './dictionary';

export interface WordFindPuzzle {
    grid: string[][];
    words: string[];
    foundWords: {
        word: string;
        x: number;
        y: number;
        orientation: string;
    }[];
}

export const generateWordFind = (
    numWords: number = 10,
    width: number = 15,
    height: number = 15
): WordFindPuzzle => {
    // 1. Pick random words from dictionary
    const shuffled = [...DICTIONARY].sort(() => 0.5 - Math.random());
    // Filter words that fit in the grid (at least one dimension <= grid size)
    const candidates = shuffled.filter(w => w.length <= Math.max(width, height)).slice(0, numWords);

    // 2. Generate puzzle
    try {
        const grid = wordfind.newPuzzle(candidates as any, {
            width,
            height,
            orientations: wordfind.validOrientations as any,
            fillBlanks: true,
            maxAttempts: 10,
            preferOverlap: true
        });

        // 3. Solve to get positions (optional but good for debugging/solution)
        const solution = wordfind.solve(grid as any, candidates as any);

        return {
            grid,
            words: candidates,
            foundWords: solution.found
        };
    } catch (e) {
        console.error("WordFind generation failed, retrying with fewer words...", e);
        if (numWords > 5) {
            return generateWordFind(numWords - 2, width, height);
        }
        throw e;
    }
};
