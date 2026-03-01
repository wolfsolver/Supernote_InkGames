// module/SudokuOnLine/SudokuAPI.ts
import { log } from '../../utils/ConsoleLog';

export interface SudokuOnlinePuzzle {
    puzzle: string;
    difficulty: string;
}

export const fetchSudokuOnline = async (): Promise<SudokuOnlinePuzzle | null> => {
    try {
        log("SudokuAPI", "Fetching puzzle from Dosuku...");
        const response = await fetch('https://sudoku-api.vercel.app/api/dosuku');
        const data = await response.json();

        if (data && data.newboard && data.newboard.grids && data.newboard.grids.length > 0) {
            const grid = data.newboard.grids[0];
            const difficulty = grid.difficulty;

            // Convertiamo la matrice 9x9 in una stringa di 81 caratteri (con '.' per gli 0)
            let puzzleStr = "";
            grid.value.forEach((row: number[]) => {
                row.forEach((cell: number) => {
                    puzzleStr += (cell === 0 ? "." : cell.toString());
                });
            });

            log("SudokuAPI", `Fetched ${difficulty} puzzle successfully`);
            return {
                puzzle: puzzleStr,
                difficulty: difficulty
            };
        }
        return null;
    } catch (e) {
        log("SudokuAPI", "Error fetching from API: " + e);
        return null;
    }
};
