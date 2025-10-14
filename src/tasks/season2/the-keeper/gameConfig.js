// Game Configuration for The Keeper
// This file contains all the settings that make this version unique

export const BOARD_SIZE = 10;

// Initial positions
export const INITIAL_PLAYER_POS = [0, 0];
export const INITIAL_KEEPER_POS = [6, 6];

// Exit position - bottom right corner (hidden until pressure plates are activated)
export const EXIT_POS = [9, 9];

// Pressure plates - players must step on specific combinations to reveal the exit
export const PRESSURE_PLATES = {
  A: [0, 7],
  B: [4, 5],
  C: [9, 2],
};

// Valid combinations to reveal the exit (B+C, A+C, A+B+C work, but A+B doesn't work)
export const VALID_COMBINATIONS = [
  ["B", "C"],
  ["A", "C"],
  ["A", "B", "C"],
];

// Obstacles on the board - designed to create multiple corridors and strategic choices
export const OBSTACLES = [
  // Small square left corner (1x1)
  [2, 1],

  // Horizontal line top middle (2x1)
  [4, 1],

  // Horizontal line top right corner (3x1)
  [7, 1],
  [7, 2],
  [7, 3],

  // Horizontal line 3 row with skips (1x1, 1x1, 1x1)
  [0, 3],
  [2, 3],

  // Horizontal line middle with skips (2x1, 1x1, 1x1)
  [2, 5],
  [3, 5],
  [5, 5],

  [1, 7],
  [1, 8],

  [9, 5],
  [7, 7],
  [5, 9],

  [3, 8],
  [4, 7],
];

// Keeper movement rules configuration
export const KEEPER_RULES = {
  // RULE 1: Repetitive movement - Keeper makes aggressive moves towards player
  repetitiveMovement: {
    numbers: [], // This rule doesn't depend on cell values, it's triggered by movement pattern
    behavior: "repetitiveMovement",
    priority: 1, // Highest priority
  },

  // RULE 2: Cornered keeper - Keeper becomes less aggressive when cornered by walls
  corneredKeeper: {
    numbers: [], // This rule doesn't depend on cell values, it's triggered by position
    behavior: "corneredKeeper",
    priority: 2, // Second highest priority
  },

  // RULE 3: Numbers that are multiples of 5 (0,5,10,15) - Keeper moves away from player
  multiplesOf5: {
    numbers: [0, 5, 10, 15],
    behavior: "moveAwayFromPlayer",
    steps: 1,
    priority: 3,
  },

  // RULE 4: Prime numbers (2,3,5,7,11,13,17,19) - Keeper moves directly towards player (2 steps)
  primeNumbers: {
    numbers: [2, 3, 5, 7, 11, 13, 17, 19],
    behavior: "moveTowardsPlayer",
    steps: 2,
    priority: 4,
  },

  // RULE 5: Perfect squares (0,1,4,9,16) - Keeper moves in a spiral pattern but prioritizes towards player
  perfectSquares: {
    numbers: [0, 1, 4, 9, 16],
    behavior: "spiralPattern",
    prioritizePlayer: true,
    priority: 5,
  },

  // RULE 6: Multiples of 3 (0,3,6,9,12,15,18) - Keeper moves in a chess knight pattern but towards player
  multiplesOf3: {
    numbers: [0, 3, 6, 9, 12, 15, 18],
    behavior: "knightPattern",
    prioritizePlayer: true,
    priority: 6,
  },

  // RULE 7: Even numbers (0,2,4,6,8,10,12,14,16,18) - Keeper moves towards player (1 step)
  evenNumbers: {
    numbers: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18],
    behavior: "moveTowardsPlayer",
    steps: 1,
    priority: 7,
  },

  // RULE 8: Odd numbers (1,3,5,7,9,11,13,15,17,19) - Keeper moves towards player (1 step)
  oddNumbers: {
    numbers: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
    behavior: "moveTowardsPlayer",
    steps: 1,
    priority: 8,
  },

  // RULE x: Multiples of 4 (0,4,8,12,16) - Keeper moves towards player (1 step)
  //   multiplesOf4: {
  //     numbers: [0, 4, 8, 12, 16],
  //     behavior: "moveTowardsPlayer",
  //     steps: 2,
  //     priority: 9,
  //   },

  // RULE x: Multiples of 7 (0,7,14) - Keeper and player swap positions (only on first visit)
  //   multiplesOf7: {
  //     numbers: [0, 6, 12, 18],
  //     behavior: "swapPositions",
  //     firstVisitOnly: true,
  //     priority: 10,
  //   },
};

// Game title and description
export const GAME_TITLE = "The Keeper's Maze";
export const GAME_DESCRIPTION =
  "A challenging puzzle game where players must discover the hidden rules governing the keeper's behavior to escape the maze.";

// UI Configuration
export const UI_CONFIG = {
  showCellValues: true, // Show x+y values on hover
  showMoveCounter: true,
  showAttemptCounter: true,
  showKeyboardInstructions: true,
};
