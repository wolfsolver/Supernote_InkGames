/**
 * module/Nonogram/NonogramLogic.ts
 */

export class Utility {
    static removeFromArray(array: any[], value: any) {
        const index = array.indexOf(value);
        if (index !== -1) {
            array.splice(index, 1);
        }
        return array;
    }
    static getZeroFilledArray(length: number) {
        return new Array(length).fill(0);
    }
    static cloneArray(array: any[]) {
        return array.slice(0);
    }
    static getRandomIntBetween(min: number, max: number) {
        const minCeil = Math.ceil(min);
        const maxFloor = Math.floor(max);
        return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
    }
}

export class PuzzleCell {
    index: number = -1;
    column: number = -1;
    row: number = -1;
    solution: number | null = null;
    userSolution: number | null = null;
    aiSolution: number | null = null;
    constructor(params: Partial<PuzzleCell>) {
        Object.assign(this, params);
    }
}

export class PuzzleLine {
    type: 'row' | 'column' | '' = '';
    index: number = -1;
    length: number = 0;
    minimumSectionLength: number = 0;
    sections: any[] = [];
    cells: PuzzleCell[] = [];
    solved: boolean = false;
    constructor(params: Partial<PuzzleLine>) {
        Object.assign(this, params);
    }
}

export class Puzzle {
    width: number;
    height: number;
    totalCells: number;
    creator: any = null;
    cells: PuzzleCell[] = [];
    rowHints: number[][] = [];
    columnHints: number[][] = [];
    grid: number[][] = [];

    constructor(width: number, height: number) {
        if (typeof width === 'undefined' || typeof height === 'undefined') {
            throw new Error('width and height are required constructor parameters.');
        } else if (width <= 0 || height <= 0 || (width === 1 && height === 1)) {
            throw new Error(`invalid dimensions: ${width} x ${height}`);
        }
        this.width = width;
        this.height = height;
        this.totalCells = this.width * this.height;
        this.reset();
    }

    reset() {
        this.creator = null;
        this.cells = [];
        this.rowHints = [];
        this.columnHints = [];
        this.grid = Utility.getZeroFilledArray(this.height).map(() => Utility.getZeroFilledArray(this.width));
    }

    checkUserSolution() {
        return this.cells.every((cell) => {
            const userValue = cell.userSolution === 1 ? 1 : 0;
            return cell.solution === userValue;
        });
    }

    getRowCells(row: number) {
        const cells = [];
        const start = row * this.width;
        const end = start + this.width;
        for (let i = start; i < end; i++) {
            cells.push(this.cells[i]);
        }
        return cells.length > 0 ? cells : false;
    }

    getColumnCells(column: number) {
        const cells = [];
        for (let i = column; i < this.cells.length; i += this.width) {
            cells.push(this.cells[i]);
        }
        return cells.length > 0 ? cells : false;
    }

    getCellByIndex(index: number | string) {
        const indexInt = typeof index !== 'number' ? parseInt(index, 10) : index;
        return this.cells[indexInt] || false;
    }
}

export class Solver {
    puzzle: Puzzle;
    elapsedTime: number = 0;
    isReset: boolean = false;
    lines: PuzzleLine[] = [];
    solutionLog: any[] = [];

    constructor(puzzle: Puzzle) {
        this.puzzle = puzzle;
        this._reset();
    }

    solve() {
        const start = new Date().getTime();
        let lastProgress = -1;
        let pass = 1;
        if (!this.isReset) {
            this._reset();
        }
        this.isReset = false;
        this._log('Starting solve algorithm', 'info');

        while (this._getProgress() > lastProgress && this._getTotalSolved() < this.puzzle.cells.length) {
            const passStart = new Date().getTime();
            lastProgress = this._getProgress();

            for (let lineKey = 0; lineKey < this.lines.length; lineKey++) {
                const line = this.lines[lineKey];
                if (!line.solved) { this.eliminateImpossibleFits(line); }
                if (!line.solved) { this.findKnownPositivesAndNegatives(line); }
                if (!line.solved) { this.findSectionDefiningChains(line); }
                if (!line.solved) { this.findAnchoredSections(line); }
                if (!line.solved) { this.findCompletedSections(line); }
                if (!line.solved) { this.findCompletedLines(line); }
            }

            const passEnd = new Date().getTime();
            const passElapsedTime = (passEnd - passStart) / 1000;
            this._log(`Pass ${pass} completed in ${passElapsedTime} seconds :: ${this._getTotalSolved()}/${this.puzzle.cells.length} cells solved`, 'info');
            pass++;
        }

        const solved = this._getTotalSolved() === this.puzzle.cells.length;
        const end = new Date().getTime();
        const totalElapsedTime = (end - start) / 1000;
        this._log(`Solve algorithm finished in ${totalElapsedTime} seconds.`, 'info');
        this._log(solved ? 'Solution Found.' : 'Could not find solution.', solved ? 'success' : 'failure');
        this.elapsedTime = totalElapsedTime;
        return solved;
    }

    eliminateImpossibleFits(line: PuzzleLine) {
        let minimumStartIndex = 0;
        let maximumStartIndex = line.length - line.minimumSectionLength;

        if (line.sections.length === 0) {
            for (let lineCellKey = 0; lineCellKey < line.cells.length; lineCellKey++) {
                this._setCellSolution(line.cells[lineCellKey], 0);
            }
        }

        for (let lineKey = 0; lineKey < line.length; lineKey++) {
            if (line.cells[lineKey].aiSolution === 0) {
                minimumStartIndex++;
            } else { break; }
        }
        for (let lineKey = line.length - 1; lineKey >= 0; lineKey--) {
            if (line.cells[lineKey].aiSolution === 0) {
                maximumStartIndex--;
            } else { break; }
        }

        for (let lineSectionKey = 0; lineSectionKey < line.sections.length; lineSectionKey++) {
            const section = line.sections[lineSectionKey];
            let newPossibleStartIndexes = Utility.cloneArray(section.possibleStartIndexes);

            for (let startIndexKey = 0; startIndexKey < section.possibleStartIndexes.length; startIndexKey++) {
                const possibleStartIndex = section.possibleStartIndexes[startIndexKey];
                const testCell = line.cells[possibleStartIndex + section.length];

                if (possibleStartIndex < minimumStartIndex || possibleStartIndex > maximumStartIndex) {
                    newPossibleStartIndexes = Utility.removeFromArray(newPossibleStartIndexes, possibleStartIndex);
                }
                if (testCell && testCell.aiSolution === 1) {
                    newPossibleStartIndexes = Utility.removeFromArray(newPossibleStartIndexes, possibleStartIndex);
                }

                let end = possibleStartIndex + section.length - 1;
                end = end > line.length - 1 ? line.length - 1 : end;
                for (let i = possibleStartIndex; i <= end; i++) {
                    if (i > line.length - 1 || line.cells[i].aiSolution === 0) {
                        newPossibleStartIndexes = Utility.removeFromArray(newPossibleStartIndexes, possibleStartIndex);
                        break;
                    }
                }
            }
            minimumStartIndex += section.length + 1;
            maximumStartIndex += section.length + 1;
            section.possibleStartIndexes = newPossibleStartIndexes;
        }
    }

    findKnownPositivesAndNegatives(line: PuzzleLine) {
        const totalCellCounts = Utility.getZeroFilledArray(line.length);
        for (let sectionKey = 0; sectionKey < line.sections.length; sectionKey++) {
            const section = line.sections[sectionKey];
            const cellCounts = Utility.getZeroFilledArray(line.length);
            for (let startIndexKey = 0; startIndexKey < section.possibleStartIndexes.length; startIndexKey++) {
                const possibleStartIndex = section.possibleStartIndexes[startIndexKey];
                const start = possibleStartIndex;
                const end = start + section.length - 1;
                for (let i = start; i <= end; i++) {
                    cellCounts[i]++;
                    totalCellCounts[i]++;
                }
            }
            for (let cellCountKey = 0; cellCountKey < cellCounts.length; cellCountKey++) {
                const cellCount = cellCounts[cellCountKey];
                const cell = line.cells[cellCountKey];
                if (cell && cell.aiSolution === null && cellCount === section.possibleStartIndexes.length && section.possibleStartIndexes.length > 0) {
                    this._setCellSolution(cell, 1);
                }
            }
        }
        for (let cellCountKey = 0; cellCountKey < totalCellCounts.length; cellCountKey++) {
            const cellCount = totalCellCounts[cellCountKey];
            const cell = line.cells[cellCountKey];
            if (cell && cell.aiSolution === null && cellCount === 0) {
                this._setCellSolution(cell, 0);
            }
        }
    }

    findAnchoredSections(line: PuzzleLine) {
        if (line.sections.length > 0) {
            const firstSection = line.sections[0];
            const lastSection = line.sections[line.sections.length - 1];
            let fillRange = null;

            for (let i = 0; i < line.cells.length; i++) {
                if (line.cells[i].aiSolution === null) { break; }
                else if (line.cells[i].aiSolution === 1) {
                    fillRange = [i, i + firstSection.length - 1];
                    break;
                }
            }
            if (fillRange !== null) {
                for (let i = fillRange[0]; i <= fillRange[1]; i++) {
                    if (line.cells[i]) { this._setCellSolution(line.cells[i], 1); }
                }
                if (line.cells[fillRange[1] + 1]) { this._setCellSolution(line.cells[fillRange[1] + 1], 0); }
            }

            fillRange = null;
            for (let i = line.cells.length - 1; i >= 0; i--) {
                if (line.cells[i].aiSolution === null) { break; }
                else if (line.cells[i].aiSolution === 1) {
                    fillRange = [i - lastSection.length + 1, i];
                    break;
                }
            }
            if (fillRange !== null) {
                for (let i = fillRange[0]; i <= fillRange[1]; i++) {
                    if (line.cells[i]) { this._setCellSolution(line.cells[i], 1); }
                }
                if (line.cells[fillRange[0] - 1]) { this._setCellSolution(line.cells[fillRange[0] - 1], 0); }
            }
        }
    }

    findSectionDefiningChains(line: PuzzleLine) {
        const chains = [];
        let lastValue = 0;
        const sectionsSorted = Utility.cloneArray(line.sections).sort((a, b) => (a.length > b.length ? -1 : 1));
        const firstSortedSection = sectionsSorted[0];
        if (!firstSortedSection) return;

        let chain = null;
        for (let cellKey = 0; cellKey < line.cells.length; cellKey++) {
            const cell = line.cells[cellKey];
            if (cell.aiSolution === 1) {
                if (lastValue !== 1) {
                    chain = { start: cellKey, length: 1 };
                    chains.push(chain);
                } else if (chain) {
                    chain.length++;
                }
            }
            lastValue = cell.aiSolution || 0;
        }

        for (let chainKey = 0; chainKey < chains.length; chainKey++) {
            const c = chains[chainKey];
            if (c.length === firstSortedSection.length) {
                if (line.cells[c.start - 1]) { this._setCellSolution(line.cells[c.start - 1], 0); }
                if (line.cells[c.start + firstSortedSection.length]) { this._setCellSolution(line.cells[c.start + firstSortedSection.length], 0); }
                firstSortedSection.solved = true;
            }
        }
    }

    findCompletedSections(line: PuzzleLine) {
        for (let sectionKey = 0; sectionKey < line.sections.length; sectionKey++) {
            const section = line.sections[sectionKey];
            if (!section.solved && section.possibleStartIndexes.length === 1) {
                const firstNegative = section.possibleStartIndexes[0] - 1;
                const lastNegative = section.possibleStartIndexes[0] + section.length;
                if (line.cells[firstNegative] && line.cells[firstNegative].aiSolution === null) { this._setCellSolution(line.cells[firstNegative], 0); }
                if (line.cells[lastNegative] && line.cells[lastNegative].aiSolution === null) { this._setCellSolution(line.cells[lastNegative], 0); }
                section.solved = true;
            }
        }
    }

    findCompletedLines(line: PuzzleLine) {
        let totalSectionLength = 0;
        let totalPositiveSolved = 0;
        for (let sectionKey = 0; sectionKey < line.sections.length; sectionKey++) {
            totalSectionLength += line.sections[sectionKey].length;
        }
        for (let cellKey = 0; cellKey < line.cells.length; cellKey++) {
            totalPositiveSolved += (line.cells[cellKey].aiSolution === 1 ? 1 : 0);
        }
        if (totalSectionLength === totalPositiveSolved) {
            for (let cellKey = 0; cellKey < line.cells.length; cellKey++) {
                if (line.cells[cellKey].aiSolution === null) { this._setCellSolution(line.cells[cellKey], 0); }
            }
        }
    }

    _reset() {
        const possibleRowIndexes: number[] = [];
        const possibleColumnIndexes: number[] = [];
        this.isReset = true;
        this.elapsedTime = 0;
        this.solutionLog = [];
        this.lines = [];

        this._log('Resetting variables', 'info');
        for (let cellKey = 0; cellKey < this.puzzle.cells.length; cellKey++) {
            this.puzzle.cells[cellKey].aiSolution = null;
        }
        for (let i = 0; i < this.puzzle.width; i++) { possibleRowIndexes.push(i); }
        for (let i = 0; i < this.puzzle.height; i++) { possibleColumnIndexes.push(i); }

        for (let rowNumber = 0; rowNumber < this.puzzle.rowHints.length; rowNumber++) {
            const rowHints = this.puzzle.rowHints[rowNumber];
            const rowCells = this.puzzle.getRowCells(rowNumber);
            if (rowCells) {
                const line = new PuzzleLine({ type: 'row', index: rowNumber, length: this.puzzle.width, cells: rowCells });
                for (let index = 0; index < rowHints.length; index++) {
                    const len = rowHints[index];
                    line.sections.push({ index, length: len, possibleStartIndexes: possibleRowIndexes.filter(i => i <= this.puzzle.width - len), knownIndexes: [], solved: false });
                    line.minimumSectionLength += (len + 1);
                }
                line.minimumSectionLength--;
                this.lines.push(line);
            }
        }
        for (let columnKey = 0; columnKey < this.puzzle.columnHints.length; columnKey++) {
            const colHints = this.puzzle.columnHints[columnKey];
            const colCells = this.puzzle.getColumnCells(columnKey);
            if (colCells) {
                const line = new PuzzleLine({ type: 'column', index: columnKey, length: this.puzzle.height, cells: colCells });
                for (let index = 0; index < colHints.length; index++) {
                    const len = colHints[index];
                    line.sections.push({ index, length: len, possibleStartIndexes: possibleColumnIndexes.filter(i => i <= this.puzzle.height - len), knownIndexes: [], solved: false });
                    line.minimumSectionLength += (len + 1);
                }
                line.minimumSectionLength--;
                this.lines.push(line);
            }
        }
    }

    _setCellSolution(puzzleCell: PuzzleCell, value: number) {
        if (puzzleCell.aiSolution !== null) return;
        for (let lineKey = 0; lineKey < this.lines.length; lineKey++) {
            const line = this.lines[lineKey];
            const isRow = line.type === 'row' && line.index === puzzleCell.row;
            const isCol = line.type === 'column' && line.index === puzzleCell.column;
            let cellsSolved = 0;
            if (isRow || isCol) {
                for (let cellKey = 0; cellKey < line.cells.length; cellKey++) {
                    const cell = line.cells[cellKey];
                    if (cell.index === puzzleCell.index) {
                        cell.aiSolution = value;
                        cellsSolved++;
                    } else if (cell.aiSolution !== null) {
                        cellsSolved++;
                    }
                }
                if (cellsSolved === line.length) { line.solved = true; }
            }
        }
    }

    _log(html: string, cssClass: string = 'info') {
        this.solutionLog.push({ html, cssClass });
    }

    _getTotalSolved() {
        let total = 0;
        for (let cellKey = 0; cellKey < this.puzzle.cells.length; cellKey++) {
            total += (this.puzzle.cells[cellKey].aiSolution !== null ? 1 : 0);
        }
        return total;
    }

    _getProgress() {
        let maxPossibilities = 0;
        let totalPossibilities = 0;
        for (let lineKey = 0; lineKey < this.lines.length; lineKey++) {
            const line = this.lines[lineKey];
            maxPossibilities += line.sections.length * (line.type === 'row' ? this.puzzle.width : this.puzzle.height);
            for (let sectionKey = 0; sectionKey < line.sections.length; sectionKey++) {
                totalPossibilities += line.sections[sectionKey].possibleStartIndexes.length;
            }
        }
        return maxPossibilities - totalPossibilities;
    }
}

export class Creator {
    puzzle: Puzzle | null = null;
    log: string[] = [];
    creationTime: number = 0;
    solvingTime: number = 0;

    createRandom(width: number, height: number, density: number | null = null): Puzzle {
        const start = new Date().getTime();
        let puzzleValid = false;
        const densityValid = typeof density === 'number' && density >= 0 && density <= 1;
        this.puzzle = new Puzzle(width, height);
        this._reset();

        while (!puzzleValid) {
            const chanceOfCellFill = densityValid ? density! : Utility.getRandomIntBetween(200, 800) / 1000;
            const solutionGrid: number[][] = [];
            let rowArray: number[] = [];
            let cellsFilled = 0;
            this._log(`Creating random ${this.puzzle.width}x${this.puzzle.height} puzzle with density of ${chanceOfCellFill}...`);

            for (let i = 0; i < this.puzzle.totalCells; i++) {
                const cellValue = Math.random() < chanceOfCellFill ? 1 : 0;
                cellsFilled += cellValue;
                if (i % this.puzzle.width === 0 && i > 0) {
                    solutionGrid.push(rowArray);
                    rowArray = [];
                }
                rowArray.push(cellValue);
            }
            solutionGrid.push(rowArray);

            if (cellsFilled === 0 || cellsFilled === this.puzzle.totalCells) {
                this._log(cellsFilled === 0 ? 'Generated puzzle has no cells filled. Trying again...' : 'Generated puzzle has all cells filled. Trying again...');
                continue;
            }

            this.puzzle = Creator._populatePuzzleFromGrid(new Puzzle(width, height), solutionGrid);
            const solver = new Solver(this.puzzle);
            if (solver.solve()) {
                puzzleValid = true;
                const elapsed = (new Date().getTime() - start) / 1000;
                this._log(`Puzzle is solvable - solved in ${solver.elapsedTime} seconds`);
                this._logLine();
                this._log(`Puzzle generated in ${elapsed} seconds.`);
                this.creationTime = elapsed;
                this.solvingTime = solver.elapsedTime;
            } else {
                this._log('Puzzle cannot be solved. Trying again...');
            }
            this._logLine();
        }
        this.puzzle.creator = this;
        return this.puzzle;
    }

    createFromGrid(grid: number[][]): Puzzle | boolean {
        const start = new Date().getTime();
        let width = 0;
        let height = 0;
        this._reset();
        this._log('creating puzzle from grid array.');
        if (!(grid instanceof Array)) throw new Error('grid is not an array');
        grid.forEach((row, rowKey) => {
            if (!(row instanceof Array)) throw new Error('grid is not a multi-dimensional array');
            if (width === 0) width = row.length;
            else if (row.length !== width) throw new Error(`row ${rowKey} has an invalid length (${row.length}) - expecting ${width}`);
            height++;
        });
        const puzzle = new Puzzle(width, height);
        this.puzzle = Creator._populatePuzzleFromGrid(puzzle, grid);
        this.puzzle.creator = this;
        const solver = new Solver(this.puzzle);
        if (solver.solve()) { this._log('Puzzle is solvable.'); }
        else { this._log('Puzzle cannot be solved.'); return false; }
        const elapsed = (new Date().getTime() - start) / 1000;
        this._log(`Puzzle built and solved in ${elapsed} seconds.`);
        return this.puzzle;
    }

    createFromHints(hints: { row: number[][], column: number[][] }): Puzzle | boolean {
        const start = new Date().getTime();
        this._reset();
        this._log('creating puzzle from hints');
        if (typeof hints !== 'object' || !hints.row || !hints.column) throw new Error('hints must be an object with row and column arrays');
        const width = hints.column.length;
        const height = hints.row.length;
        const puzzle = new Puzzle(width, height);
        puzzle.rowHints = hints.row;
        puzzle.columnHints = hints.column;
        puzzle.creator = this;
        puzzle.grid.forEach((row, rowKey) => {
            row.forEach((_, columnKey) => {
                puzzle.cells.push(new PuzzleCell({ index: rowKey * puzzle.width + columnKey, column: columnKey, row: rowKey }));
            });
        });
        this.puzzle = puzzle;
        const solver = new Solver(this.puzzle);
        if (solver.solve()) { this._log('Puzzle is solvable.'); }
        else { this._log('Puzzle cannot be solved.'); return false; }

        solver.puzzle.cells.forEach((solvedCell, cellIndex) => {
            const pCell = this.puzzle!.getCellByIndex(cellIndex) as PuzzleCell;
            pCell.aiSolution = solvedCell.aiSolution;
            pCell.solution = solvedCell.aiSolution;
        });

        const elapsed = (new Date().getTime() - start) / 1000;
        this._log(`Puzzle built and solved in ${elapsed} seconds.`);
        return this.puzzle;
    }

    _log(msg: string) { this.log.push(msg); }
    _logLine() { this.log.push('-----------------------------------'); }
    _reset() { this.log = []; this.creationTime = 0; this.solvingTime = 0; }

    static _populatePuzzleFromGrid(puzzle: Puzzle, grid: number[][]) {
        puzzle.reset();
        puzzle.grid = grid;
        for (let rowKey = 0; rowKey < puzzle.grid.length; rowKey++) {
            const row = puzzle.grid[rowKey];
            const rowHints: number[] = [];
            puzzle.rowHints[rowKey] = [];
            for (let columnKey = 0; columnKey < row.length; columnKey++) {
                const currentVal = row[columnKey];
                const lastVal = columnKey > 0 ? row[columnKey - 1] : 0;
                puzzle.cells.push(new PuzzleCell({ index: rowKey * puzzle.width + columnKey, column: columnKey, row: rowKey, solution: currentVal }));
                if (currentVal === 1 && lastVal === 0) rowHints.push(1);
                else if (currentVal === 1 && lastVal === 1) rowHints[rowHints.length - 1]++;
            }
            puzzle.rowHints[rowKey] = rowHints.filter(h => h > 0);
        }
        for (let columnKey = 0; columnKey < puzzle.width; columnKey++) {
            const colHints: number[] = [];
            for (let rowKey = 0; rowKey < puzzle.height; rowKey++) {
                const currentVal = puzzle.grid[rowKey][columnKey];
                const lastVal = rowKey > 0 ? puzzle.grid[rowKey - 1][columnKey] : 0;
                if (currentVal === 1 && lastVal === 0) colHints.push(1);
                else if (currentVal === 1 && lastVal === 1) colHints[colHints.length - 1]++;
            }
            puzzle.columnHints[columnKey] = colHints.filter(h => h > 0);
        }
        return puzzle;
    }
}
