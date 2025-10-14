export const BUILDING_BLOCKS_CONFIG = {
  title: "Building Blocks",
  description:
    "Solve the anagrams and place them in the correct order to reveal a famous building.",

  // Anagrams with their solutions
  anagrams: [
    {
      id: 1,
      scrambled: "EEELPST",
      solution: "STEEPLE",
    },
    {
      id: 2,
      scrambled: "AIMNNOS",
      solution: "MANSION",
    },
    {
      id: 3,
      scrambled: "CEHIMNY",
      solution: "CHIMNEY",
    },
    {
      id: 4,
      scrambled: "AACHRWY",
      solution: "ARCHWAY",
    },
    {
      id: 5,
      scrambled: "EEHKLOY",
      solution: "KEYHOLE",
    },
    {
      id: 6,
      scrambled: "BDIOORU",
      solution: "BOUDOIR",
    },
    {
      id: 7,
      scrambled: "EELMPST",
      solution: "TEMPLES",
    },
  ],

  // Final answer
  finalAnswer: "KREMLIN",

  // Grid configuration
  gridSize: 7,

  // Scoring
  basePoints: 8,
  instructionPenalty: 1,
  hintPenalty: 1,

  // Instructions text
  instructions: `In this puzzle, the letters in the names of buildings or 
  parts of buildings have been mixed up and rearranged alphabetically. 
  The names themselves are in no particular order. 
  Solve the anagrams and place the answers horizontally in the grid so that the letters in the squares reading diagonally from top left to bottom right reveal a famous building.`,

  // Game hints
  hints: [
    "Try solving the anagrams first - each is a building or part of a building",
    "When you have the words, think about which order they should go in the grid",
    "The diagonal reading from top-left to bottom-right will spell the final answer",
    "Each word goes in its own row, horizontally across the grid",
  ],
};

// Helper function to validate anagram solution
export const validateAnagramSolution = (scrambled, solution) => {
  const sortedScrambled = scrambled.split("").sort().join("");
  const sortedSolution = solution.split("").sort().join("");
  return sortedScrambled === sortedSolution;
};

// Helper function to check if grid is correctly filled
export const checkGridSolution = (gridWords) => {
  if (gridWords.length !== BUILDING_BLOCKS_CONFIG.gridSize) {
    return false;
  }

  // Check if all words are correct
  const correctWords = BUILDING_BLOCKS_CONFIG.anagrams.map((a) => a.solution);
  for (let i = 0; i < gridWords.length; i++) {
    if (!correctWords.includes(gridWords[i])) {
      return false;
    }
  }

  // Check if diagonal spells KREMLIN
  let diagonal = "";
  for (let i = 0; i < BUILDING_BLOCKS_CONFIG.gridSize; i++) {
    if (gridWords[i] && gridWords[i].length > i) {
      diagonal += gridWords[i][i];
    }
  }

  return diagonal === BUILDING_BLOCKS_CONFIG.finalAnswer;
};

// Helper function to get diagonal reading from grid
export const getDiagonalReading = (gridWords) => {
  let diagonal = "";
  for (let i = 0; i < BUILDING_BLOCKS_CONFIG.gridSize; i++) {
    if (gridWords[i] && gridWords[i].length > i) {
      diagonal += gridWords[i][i];
    }
  }
  return diagonal;
};
