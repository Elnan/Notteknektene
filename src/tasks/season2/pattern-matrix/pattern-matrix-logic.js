// Modular pattern logic for Pattern Matrix game

// 0 = none, 1 = primary (green), 2 = secondary (gold)

// --- MAIN ROUNDS ---
// Each round: grid (3x3, one null), missing (the answer), missingIndex ([row, col])
export const MAIN_ROUNDS = [
  // Round 1: Diagonal green segments
  {
    grid: [
      [
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 0, 0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 0, 0, 0],
        [1, 0, 1, 1, 0, 0, 0, 0],
      ],
      [[0, 0, 0, 1, 0, 0, 0, 0], [1, 0, 0, 1, 0, 0, 0, 0], null],
    ],
    missing: [1, 1, 0, 1, 0, 0, 0, 0],
    missingIndex: [2, 2],
  },
  // Round 2: All squares gold, circle empty
  {
    grid: [
      [
        [0, 0, 0, 0, 2, 0, 0, 0],
        [0, 0, 0, 0, 0, 2, 0, 0],
        [0, 0, 0, 0, 0, 0, 2, 0],
      ],
      [[0, 0, 0, 0, 2, 2, 0, 0], null, [0, 0, 0, 0, 0, 0, 2, 2]],
      [
        [0, 0, 0, 0, 2, 2, 2, 0],
        [0, 0, 0, 0, 0, 2, 2, 2],
        [0, 0, 0, 0, 2, 0, 2, 2],
      ],
    ],
    missing: [0, 0, 0, 0, 0, 2, 2, 0],
    missingIndex: [1, 1],
  },
  // Round 3: Column 3 = Column 1 + Column 2
  {
    grid: [
      [
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 0, 0, 0, 0, 0, 0],
        [1, 1, 0, 0, 0, 0, 0, 0],
      ],
      [[0, 2, 2, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0, 0, 0], null],
      [
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0],
      ],
    ],
    missing: [2, 2, 2, 0, 0, 0, 0, 0],
    missingIndex: [1, 2],
  },
  // Round 4: Alternating gold/green squares, Column 1 minus Column 2
  {
    grid: [
      [
        [0, 0, 0, 0, 2, 2, 0, 2],
        [0, 0, 0, 0, 1, 0, 0, 1],
        [0, 0, 0, 0, 0, 2, 0, 0],
      ],
      [[0, 0, 0, 0, 1, 1, 1, 1], null, [0, 0, 0, 0, 1, 0, 0, 1]],
      [
        [0, 0, 0, 0, 0, 2, 0, 2],
        [0, 0, 0, 0, 0, 1, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
      ],
    ],
    missing: [0, 0, 0, 0, 0, 2, 2, 0],
    missingIndex: [1, 1],
  },
  // Round 5: Circles anit-clock, squares loses one, start from top
  {
    grid: [
      [[2, 1, 2, 0, 2, 2, 2, 0], [2, 2, 1, 1, 1, 1, 1, 1], null],
      [
        [1, 2, 0, 2, 0, 2, 2, 0],
        [2, 1, 1, 2, 0, 1, 1, 1],
        [2, 1, 2, 1, 0, 0, 2, 0],
      ],
      [
        [2, 0, 2, 1, 0, 0, 2, 0],
        [1, 1, 2, 2, 0, 0, 1, 1],
        [1, 2, 1, 2, 0, 0, 0, 0],
      ],
    ],
    missing: [1, 2, 1, 2, 0, 2, 2, 0],
    missingIndex: [0, 2],
  },
  // Round 6: Column + Column =, Row - Row =
  {
    grid: [
      [
        [2, 2, 1, 0, 0, 2, 1, 0],
        [0, 0, 1, 0, 2, 0, 0, 1],
        [2, 2, 1, 0, 2, 2, 1, 1],
      ],
      [[2, 2, 0, 0, 0, 0, 0, 0], null, [2, 2, 1, 0, 2, 0, 0, 0]],
      [
        [0, 0, 1, 0, 0, 2, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 2, 1, 1],
      ],
    ],
    missing: [0, 0, 1, 0, 2, 0, 0, 0],
    missingIndex: [1, 1],
  },
  // Round 7: Segments alternate green/gold, adds one circle per row and square per column
  {
    grid: [
      [
        [0, 2, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0, 1, 2, 0],
        [0, 2, 0, 0, 0, 1, 2, 1],
      ],
      [
        [0, 1, 1, 0, 0, 2, 0, 0],
        [0, 2, 2, 0, 0, 2, 1, 0],
        [0, 1, 1, 0, 0, 2, 1, 2],
      ],
      [null, [0, 1, 1, 1, 0, 1, 2, 0], [0, 2, 2, 2, 0, 1, 2, 1]],
    ],
    missing: [0, 2, 2, 2, 0, 1, 0, 0],
    missingIndex: [2, 0],
  },
  // Round 8: Squares rotate gold clockwise, circles alternate color in columns, loses one starting from the top in row
  {
    grid: [
      [
        [2, 1, 2, 0, 2, 1, 0, 1],
        [1, 2, 1, 0, 1, 2, 1, 0],
        [2, 1, 2, 0, 0, 1, 2, 1],
      ],
      [null, [0, 2, 1, 0, 2, 1, 0, 1], [0, 1, 2, 0, 1, 2, 1, 0]],
      [
        [0, 0, 2, 0, 1, 2, 1, 0],
        [0, 0, 1, 0, 0, 1, 2, 1],
        [0, 0, 2, 0, 1, 0, 1, 2],
      ],
    ],
    missing: [0, 1, 2, 0, 1, 0, 1, 2],

    missingIndex: [1, 0],
  },
  // Round 9: Alternate color diagonally
  {
    grid: [
      [null, [1, 1, 2, 0, 1, 2, 1, 2], [1, 2, 1, 2, 2, 1, 2, 0]],
      [
        [2, 0, 2, 1, 1, 2, 1, 2],
        [2, 1, 2, 1, 1, 0, 1, 2],
        [2, 2, 1, 0, 2, 1, 2, 1],
      ],
      [
        [1, 2, 1, 2, 2, 1, 2, 0],
        [1, 0, 1, 2, 2, 1, 2, 1],
        [1, 2, 1, 2, 2, 0, 2, 1],
      ],
    ],
    missing: [1, 2, 1, 2, 2, 0, 2, 1],
    missingIndex: [0, 0],
  },
  // Round 10: Column 1 + 2 = Column 3, but opposite colors
  {
    grid: [
      [
        [0, 0, 1, 2, 2, 1, 0, 0],
        [2, 1, 0, 0, 0, 0, 2, 0],
        [1, 2, 2, 1, 1, 2, 1, 0],
      ],
      [[0, 1, 2, 0, 1, 0, 2, 0], null, [1, 2, 1, 1, 2, 2, 1, 0]],
      [
        [1, 0, 2, 0, 2, 0, 2, 0],
        [0, 1, 0, 2, 0, 1, 0, 2],
        [2, 2, 1, 1, 1, 2, 1, 1],
      ],
    ],
    missing: [2, 0, 0, 2, 0, 1, 0, 0],
    missingIndex: [1, 1],
  },
];

export function generatePattern(round, isPractice = false) {
  if (isPractice) {
    // Simple, hardcoded patterns for practice rounds
    if (round === 0) {
      return {
        grid: [
          [
            [1, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 0, 0, 0, 0, 0],
          ],
          [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0, 0, 0, 0],
          ],
          [[2, 0, 0, 0, 0, 0, 0, 0], [2, 2, 0, 0, 0, 0, 0, 0], null], // null = missing
        ],
        missing: [2, 2, 2, 0, 0, 0, 0, 0],
        missingIndex: [2, 2],
        explanation:
          "Look at the first row: each figure has one more green segment than the previous. The new segment is added to the right of the previous segment. The pattern continues in the second row. For the missing figure, continue this pattern with the same color as the previous figures in the row.",
      };
    }
    if (round === 1) {
      return {
        grid: [
          [
            [0, 0, 0, 0, 2, 0, 0, 0],
            [0, 0, 0, 0, 0, 2, 0, 0],
            [0, 0, 0, 0, 0, 0, 2, 0],
          ],
          [[0, 0, 0, 0, 2, 2, 0, 0], null, [0, 0, 0, 0, 0, 0, 2, 2]],
          [
            [0, 0, 0, 0, 2, 2, 2, 0],
            [0, 0, 0, 0, 0, 2, 2, 2],
            [0, 0, 0, 0, 2, 0, 2, 2],
          ],
        ],
        missing: [0, 0, 0, 0, 0, 2, 2, 0],
        missingIndex: [1, 1],
        explanation:
          "Each row adds a gold square, so row 1 has 1 gold square, row 2 has 2, and row 3 has 3. For every column, the squares shift one position clockwise. ",
      };
    }
    // Add more simple patterns for practice
  }
  // Main rounds: return from MAIN_ROUNDS
  if (round >= 0 && round < MAIN_ROUNDS.length) {
    return MAIN_ROUNDS[round];
  }
  // fallback
  return {
    grid: [],
    missing: [],
    missingIndex: [2, 2],
  };
}

export function checkSolution(playerInput, correct) {
  // Compare arrays
  return (
    Array.isArray(playerInput) &&
    Array.isArray(correct) &&
    playerInput.length === correct.length &&
    playerInput.every((v, i) => v === correct[i])
  );
}

// ---
// To add or edit a round:
// 1. Add/edit an object in the MAIN_ROUNDS array above.
// 2. Each grid is a 3x3 array, with one null for the missing figure.
// 3. Each figure is an array of 8 numbers: [top, right, bottom, left, N, E, S, W]
//    (circle segments, then squares: North, East, South, West)
// 4. Set 'missing' to the correct answer for the missing spot.
// 5. Set 'missingIndex' to the [row, col] of the missing spot.
