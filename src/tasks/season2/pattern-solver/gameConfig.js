// Pattern Solver Game Configuration
// This file contains all the configurable values that make this game unique

export const PATTERN_SOLVER_CONFIG = {
  // Game metadata
  title: "Pattern Solver",
  description:
    "Use deduction and clues to find the pattern. Each color has exactly one of each shape.",

  // Game settings
  gridSize: { rows: 4, cols: 5 },
  maxRounds: 3,
  maxHints: 3,
  baseScore: 3, // 3 points per successful round
  instructionPenalty: 1,
  hintPenalty: 1,

  // Available colors
  colors: ["Red", "Blue", "Green", "Yellow", "Purple"],

  // Available shapes
  shapes: ["square", "circle", "triangle", "diamond"],

  // Game rounds with logical deduction puzzles
  rounds: [
    {
      id: 1,
      description:
        "Use deduction and clues to find the pattern. Each color has exactly one of each shape.",
      clues: [
        {
          id: 1,
          text: "All the blues are right of the greens and above the reds.",
        },
        {
          id: 2,
          text: "All the purples are left of the reds and under the greens.",
        },
        {
          id: 3,
          text: "The grid is mirrored horizontally, except for the center column.",
        },
        {
          id: 4,
          text: "Circles will always be closer to the horizontal center than the squares.",
        },
        {
          id: 5,
          text: "Diamonds will always be closer to the horizontal center than the triangles.",
        },
        {
          id: 6,
          text: "There is only one color in the center column.",
        },
        {
          id: 7,
          text: "Cicle will be closer to the vertical center than the diamonds.",
        },
        {
          id: 8,
          text: "Squares will always be closer to the vertical center than the triangles.",
        },
      ],
      solution: [
        [
          { color: "Green", shape: "triangle" },
          { color: "Green", shape: "square" },
          { color: "Yellow", shape: "square" },
          { color: "Blue", shape: "square" },
          { color: "Blue", shape: "triangle" },
        ],
        [
          { color: "Green", shape: "diamond" },
          { color: "Green", shape: "circle" },
          { color: "Yellow", shape: "circle" },
          { color: "Blue", shape: "circle" },
          { color: "Blue", shape: "diamond" },
        ],
        [
          { color: "Purple", shape: "diamond" },
          { color: "Purple", shape: "circle" },
          { color: "Yellow", shape: "diamond" },
          { color: "Red", shape: "circle" },
          { color: "Red", shape: "diamond" },
        ],
        [
          { color: "Purple", shape: "triangle" },
          { color: "Purple", shape: "square" },
          { color: "Yellow", shape: "triangle" },
          { color: "Red", shape: "square" },
          { color: "Red", shape: "triangle" },
        ],
      ],
      preFilled: [
        [
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
        ],
        [
          { color: null, shape: null },
          { color: null, shape: null },
          { color: "Yellow", shape: "circle" },
          { color: null, shape: null },
          { color: null, shape: null },
        ],
        [
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
        ],
        [
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
        ],
      ],
    },
    {
      id: 2,
      description:
        "Use deduction and clues to find the pattern. Each color has exactly one of each shape.",
      clues: [
        {
          id: 1,
          text: "All reds will have a direct contact with another red shape.",
        },
        {
          id: 2,
          text: "All the squares have another square diagonally adjacent.",
        },
        {
          id: 3,
          text: "All triangles are in the same row.",
        },
        {
          id: 4,
          text: "The yellow triangle has two purples adjecent and the purple circle has two yellows adjecent.",
        },
        {
          id: 5,
          text: "The lefttmost column only has two colors, but every shape.",
        },
        {
          id: 6,
          text: "There are three circles in the bottom row.",
        },
        {
          id: 7,
          text: "The yellow circle is in somewhere left of the green circle.",
        },
        {
          id: 8,
          text: "The top left 2x2 only has purple and red.",
        },
        {
          id: 9,
          text: "The green square has a red diamond above it.",
        },
        {
          id: 10,
          text: "The third column has three blues.",
        },
        {
          id: 11,
          text: "The purple triangle is left of the red triangle.",
        },
      ],
      solution: [
        [
          { color: "Purple", shape: "diamond" },
          { color: "Red", shape: "circle" },
          { color: "Blue", shape: "diamond" },
          { color: "Yellow", shape: "diamond" },
          { color: "Purple", shape: "circle" },
        ],
        [
          { color: "Purple", shape: "triangle" },
          { color: "Red", shape: "triangle" },
          { color: "Blue", shape: "triangle" },
          { color: "Green", shape: "triangle" },
          { color: "Yellow", shape: "triangle" },
        ],
        [
          { color: "Yellow", shape: "square" },
          { color: "Red", shape: "diamond" },
          { color: "Red", shape: "square" },
          { color: "Green", shape: "diamond" },
          { color: "Purple", shape: "square" },
        ],
        [
          { color: "Yellow", shape: "circle" },
          { color: "Green", shape: "square" },
          { color: "Blue", shape: "circle" },
          { color: "Blue", shape: "square" },
          { color: "Green", shape: "circle" },
        ],
      ],
      preFilled: [
        [
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
        ],
        [
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: "Yellow", shape: "triangle" },
        ],
        [
          { color: null, shape: null },
          { color: null, shape: null },
          { color: "Red", shape: "square" },
          { color: null, shape: null },
          { color: null, shape: null },
        ],
        [
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
        ],
      ],
    },
    {
      id: 3,
      description:
        "Use deduction and clues to find the pattern. Each color has exactly one of each shape.",
      clues: [
        {
          id: 1,
          text: "All the reds have a direct vertical or horizontal line to two other red shapes.",
        },
        {
          id: 2,
          text: "Each column contains exactly one square, one circle, one triangle, and one diamond.",
        },
        {
          id: 3,
          text: "The blue triangle is directly left of the red diamond.",
        },
        {
          id: 4,
          text: "The red circle is under a yellow shape.",
        },
        {
          id: 5,
          text: "The blue diamond is in the top row, with a triangle on its side.",
        },
        {
          id: 6,
          text: "The purple circle is in the bottom-left 2×2 corner of the grid and will have a yellow over it.",
        },
        {
          id: 7,
          text: "Four diamonds will be in a row (horizontal, diagonal or vertical).",
        },
        {
          id: 8,
          text: "The purple square is between the red diamond and the green triangle.",
        },
        {
          id: 9,
          text: "The yellow circle will be placed above the yellow diamond.",
        },
        {
          id: 10,
          text: "The top right 2x2 square will have only 2 colors, and 2 shapes.",
        },
        {
          id: 11,
          text: "Green and blue will never touch horizontally or vertically.",
        },
        {
          id: 12,
          text: "The bottom left corner is a square.",
        },
        {
          id: 13,
          text: "The red triangle is in the bottom row.",
        },
      ],
      solution: [
        [
          { color: "Yellow", shape: "triangle" },
          { color: "Blue", shape: "diamond" },
          { color: "Blue", shape: "circle" },
          { color: "Purple", shape: "triangle" },
          { color: "Green", shape: "square" },
        ],
        [
          { color: "Red", shape: "circle" },
          { color: "Blue", shape: "triangle" },
          { color: "Red", shape: "diamond" },
          { color: "Purple", shape: "square" },
          { color: "Green", shape: "triangle" },
        ],
        [
          { color: "Green", shape: "diamond" },
          { color: "Yellow", shape: "square" },
          { color: "Blue", shape: "square" },
          { color: "Purple", shape: "diamond" },
          { color: "Yellow", shape: "circle" },
        ],
        [
          { color: "Red", shape: "square" },
          { color: "Purple", shape: "circle" },
          { color: "Red", shape: "triangle" },
          { color: "Green", shape: "circle" },
          { color: "Yellow", shape: "diamond" },
        ],
      ],
      preFilled: [
        [
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
        ],
        [
          { color: null, shape: null },
          { color: "Blue", shape: "triangle" },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
        ],
        [
          { color: null, shape: null },
          { color: null, shape: null },
          { color: "Blue", shape: "square" },
          { color: null, shape: null },
          { color: null, shape: null },
        ],
        [
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
          { color: null, shape: null },
        ],
      ],
    },
  ],

  // Instructions text
  instructions: `Fill the grid with colored shapes following the logical clues provided. Each color must have exactly one of each shape (square, circle, triangle, diamond).

Game Rules:
• Grid Setup: Each color (Red, Blue, Green, Yellow, Purple) must have exactly one of each shape
• Clues: Use the logical clues to deduce the correct placement
• Pre-filled Cells: Some cells are already filled and cannot be changed
• Note Mode: Use note mode to track possible combinations without committing
• Hints: You have 3 hints total for the entire game (across all rounds)
• Scoring: 3 points per correct round, minus 1 point per hint used, minus 1 point for using instructions`,

  // Game hints
  hints: [
    "Start by reading all the clues carefully and looking for the most specific ones",
    "Use the pre-filled cells as anchor points for your deductions",
    "Remember that each color must have exactly one of each shape",
    "Use note mode to track possibilities without committing to answers",
  ],
};

// Helper function to validate if a color is fully used
export const isColorFullyUsed = (color, grid) => {
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    return false;
  }

  const colorCount = {};

  // Count how many of each shape for this color are placed
  for (let row = 0; row < PATTERN_SOLVER_CONFIG.gridSize.rows; row++) {
    if (!grid[row] || !Array.isArray(grid[row])) {
      continue;
    }
    for (let col = 0; col < PATTERN_SOLVER_CONFIG.gridSize.cols; col++) {
      const cell = grid[row][col];
      if (cell && cell.color === color && cell.shape) {
        colorCount[cell.shape] = (colorCount[cell.shape] || 0) + 1;
      }
    }
  }

  // Check if all shapes have been used for this color
  return PATTERN_SOLVER_CONFIG.shapes.every((shape) => colorCount[shape] >= 1);
};

// Helper function to validate if a shape is fully used
export const isShapeFullyUsed = (shape, grid) => {
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    return false;
  }

  const shapeCount = {};

  // Count how many of each color for this shape are placed
  for (let row = 0; row < PATTERN_SOLVER_CONFIG.gridSize.rows; row++) {
    if (!grid[row] || !Array.isArray(grid[row])) {
      continue;
    }
    for (let col = 0; col < PATTERN_SOLVER_CONFIG.gridSize.cols; col++) {
      const cell = grid[row][col];
      if (cell && cell.shape === shape && cell.color) {
        shapeCount[cell.color] = (shapeCount[cell.color] || 0) + 1;
      }
    }
  }

  // Check if all colors have been used for this shape
  return PATTERN_SOLVER_CONFIG.colors.every((color) => shapeCount[color] >= 1);
};

// Helper function to calculate mistakes by comparing player's solution with correct solution
export const calculateMistakes = (playerGrid, correctSolution) => {
  let mistakes = 0;
  for (let row = 0; row < PATTERN_SOLVER_CONFIG.gridSize.rows; row++) {
    for (let col = 0; col < PATTERN_SOLVER_CONFIG.gridSize.cols; col++) {
      const playerCell = playerGrid[row][col];
      const correctCell = correctSolution[row][col];

      // Count mistakes for color and shape
      if (playerCell.color !== correctCell.color) {
        mistakes++;
      }
      if (playerCell.shape !== correctCell.shape) {
        mistakes++;
      }
    }
  }
  return mistakes;
};

// Helper function to check if grid is correct
export const isGridCorrect = (grid, solution) => {
  for (let row = 0; row < PATTERN_SOLVER_CONFIG.gridSize.rows; row++) {
    for (let col = 0; col < PATTERN_SOLVER_CONFIG.gridSize.cols; col++) {
      const gridCell = grid[row][col];
      const solutionCell = solution[row][col];
      if (
        gridCell.color !== solutionCell.color ||
        gridCell.shape !== solutionCell.shape
      ) {
        return false;
      }
    }
  }
  return true;
};

// Helper function to check if grid is complete
export const isGridComplete = (grid) => {
  return grid.every((row) =>
    row.every((cell) => cell.color !== null && cell.shape !== null)
  );
};
