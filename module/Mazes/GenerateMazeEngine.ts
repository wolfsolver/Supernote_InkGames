import { buildSquareGrid, buildTriangularGrid, buildHexagonalGrid } from './maze';
import { algorithms } from './algorithms';
import { buildRandom } from './random';
import {
    ALGORITHM_RECURSIVE_BACKTRACK,
    EXITS_VERTICAL,
    SHAPE_SQUARE,
    SHAPE_TRIANGLE,
    SHAPE_HEXAGON,
    DIRECTION_NORTH,
    DIRECTION_SOUTH,
    DIRECTION_EAST,
    DIRECTION_WEST
} from './constants';

// Mock drawing surface per evitare dipendenze dal DOM del browser
const createMockDrawingSurface = () => ({
    clear: () => { },
    setSpaceRequirements: () => { },
    setColour: () => { },
    line: () => { },
    fillPolygon: () => { },
    fillSegment: () => { },
    arc: () => { },
    on: () => { },
    convertCoords: (x: number, y: number) => [x, y],
    dispose: () => { },
});

export interface MazeCell {
    x: number;
    y: number;
    links: string[]; // Direzioni collegate (n, s, e, w, ecc.)
    isStart?: boolean;
    isEnd?: boolean;
    exitDir?: string; // Direzione dell'uscita (n, s, e, w)
}

export interface GeneratedMaze {
    cells: MazeCell[];
    width: number;
    height: number;
    shape: string;
    algorithm: string;
}

export const generateMaze = (
    width: number,
    height: number,
    shape: string = SHAPE_SQUARE,
    algorithmId: string = ALGORITHM_RECURSIVE_BACKTRACK,
    exitConfig: string = EXITS_VERTICAL
): GeneratedMaze => {
    const random = buildRandom(Date.now());
    const drawingSurface = createMockDrawingSurface();

    let grid: any;
    const config = {
        width,
        height,
        random,
        drawingSurface,
        exitConfig
    };

    if (shape === SHAPE_SQUARE) {
        grid = buildSquareGrid(config);
    } else if (shape === SHAPE_TRIANGLE) {
        grid = buildTriangularGrid(config);
    } else if (shape === SHAPE_HEXAGON) {
        grid = buildHexagonalGrid(config);
    } else {
        grid = buildSquareGrid(config);
    }

    grid.initialise();

    const algorithm = (algorithms as any)[algorithmId];
    if (algorithm) {
        // Eseguiamo l'algoritmo fino al completamento
        const iterator = algorithm.fn(grid, { random });
        let result = iterator.next();
        while (!result.done) {
            result = iterator.next();
        }
        grid.placeExits();
    }

    const cells: MazeCell[] = [];
    grid.forEachCell((cell: any) => {
        const mazeCell: MazeCell = {
            x: cell.coords[0],
            y: cell.coords[1],
            links: cell.neighbours.linkedDirections(),
        };

        if (cell.metadata.startCell) {
            mazeCell.isStart = true;
            mazeCell.exitDir = cell.metadata.startCell;
        }
        if (cell.metadata.endCell) {
            mazeCell.isEnd = true;
            mazeCell.exitDir = cell.metadata.endCell;
        }

        cells.push(mazeCell);
    });

    return {
        cells,
        width,
        height,
        shape,
        algorithm: algorithm?.metadata.description || algorithmId
    };
};
