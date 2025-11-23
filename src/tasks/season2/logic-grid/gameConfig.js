// Logic Grid Game Configuration
// This file contains all the configurable values that make this game unique

export const GAME_CONFIG = {
  // Game metadata
  title: "Legends Extraction",
  description:
    "Sensitive information is out, and we need to bring our legendary agents back to safety. Use the clues to determine who is where and what they are doing.",

  // Game settings
  maxHints: 3,
  baseScore: 7,

  // Grid configuration
  gridConfig: {
    cellSize: 40,
    // Pattern: [1][1][1], [1][1][0], [1][0][0]
    // Each sub-array represents a row, each boolean represents if that 5x5 sub-grid should be shown
    gridPattern: [
      [true, true, true], // Row 0: all three 5x5 grids filled
      [true, true, false], // Row 1: first two 5x5 grids filled
      [true, false, false], // Row 2: only first 5x5 grid filled
    ],
  },

  // Categories and their items (generic names that work for any theme)
  categories: {
    categoryA: ["Astrid", "Bjørn", "Elise", "Thea", "Håkon"],
    categoryB: ["Germany ", "Italy", "England", "Spain", "Hungary"],
    categoryC: ["Sparrow", "Hawk", "Eagle", "Falcon", "Osprey"],
    categoryD: ["Assasination", "Surveillance", "Sabotage", "Theft", "Raid"],
  },

  // Left column configuration (order matters!)
  leftColumnCategories: [
    { name: "FIRST NAME", items: "categoryA" },
    { name: "CODENAMES", items: "categoryC" },
    { name: "MISSIONS", items: "categoryD" },
  ],

  // Top row configuration (order matters!)
  topRowCategories: [
    { name: "COUNTRIES", items: "categoryB" },
    { name: "MISSIONS", items: "categoryD" },
    { name: "CODENAMES", items: "categoryC" },
  ],

  // Clues for solving the puzzle
  clues: [
    "Håkon is not the person codenamed Osprey, whose mission is Surveillance.",
    "The person with the mission Sabotage is in Germany and uses the codename Falcon.",
    "Astrid - Codename Sparrow - chose Italy. Her mission is not Raid.",
    "None of the ladies are in England. None of the gentlemen have the codename Eagle.",
    "Spain is the country where the lady with mission Assasination is. This is not Elise.",
    "Hawk is the codename of Bjørn.",
  ],

  // Solution - the correct connections
  solution: {
    // FIRST NAME vs COUNTRIES (row 0, col 0)
    "Astrid-Germany ": false,
    "Astrid-Italy": true,
    "Astrid-England": false,
    "Astrid-Spain": false,
    "Astrid-Hungary": false,

    "Bjørn-Germany ": false,
    "Bjørn-Italy": false,
    "Bjørn-England": true,
    "Bjørn-Spain": false,
    "Bjørn-Hungary": false,

    "Elise-Germany ": false,
    "Elise-Italy": false,
    "Elise-England": false,
    "Elise-Spain": false,
    "Elise-Hungary": true,

    "Thea-Germany ": false,
    "Thea-Italy": false,
    "Thea-England": false,
    "Thea-Spain": true,
    "Thea-Hungary": false,

    "Håkon-Germany ": true,
    "Håkon-Italy": false,
    "Håkon-England": false,
    "Håkon-Spain": false,
    "Håkon-Hungary": false,

    // FIRST NAME vs MISSIONS (row 0, col 1)
    "Astrid-Assasination": false,
    "Astrid-Surveillance": false,
    "Astrid-Sabotage": false,
    "Astrid-Theft": true,
    "Astrid-Raid": false,

    "Bjørn-Assasination": false,
    "Bjørn-Surveillance": false,
    "Bjørn-Sabotage": false,
    "Bjørn-Theft": false,
    "Bjørn-Raid": true,

    "Elise-Assasination": false,
    "Elise-Surveillance": true,
    "Elise-Sabotage": false,
    "Elise-Theft": false,
    "Elise-Raid": false,

    "Thea-Assasination": true,
    "Thea-Surveillance": false,
    "Thea-Sabotage": false,
    "Thea-Theft": false,
    "Thea-Raid": false,

    "Håkon-Assasination": false,
    "Håkon-Surveillance": false,
    "Håkon-Sabotage": true,
    "Håkon-Theft": false,
    "Håkon-Raid": false,

    // FIRST NAME vs CODENAMES (row 0, col 2)
    "Astrid-Sparrow": true,
    "Astrid-Hawk": false,
    "Astrid-Eagle": false,
    "Astrid-Falcon": false,
    "Astrid-Osprey": false,

    "Bjørn-Sparrow": false,
    "Bjørn-Hawk": true,
    "Bjørn-Eagle": false,
    "Bjørn-Falcon": false,
    "Bjørn-Osprey": false,

    "Elise-Sparrow": false,
    "Elise-Hawk": false,
    "Elise-Eagle": false,
    "Elise-Falcon": false,
    "Elise-Osprey": true,

    "Thea-Sparrow": false,
    "Thea-Hawk": false,
    "Thea-Eagle": true,
    "Thea-Falcon": false,
    "Thea-Osprey": false,

    "Håkon-Sparrow": false,
    "Håkon-Hawk": false,
    "Håkon-Eagle": false,
    "Håkon-Falcon": true,
    "Håkon-Osprey": false,

    // CODENAMES vs COUNTRIES (row 1, col 0)
    "Sparrow-Germany ": false,
    "Sparrow-Italy": true,
    "Sparrow-England": false,
    "Sparrow-Spain": false,
    "Sparrow-Hungary": false,

    "Hawk-Germany ": false,
    "Hawk-Italy": false,
    "Hawk-England": true,
    "Hawk-Spain": false,
    "Hawk-Hungary": false,

    "Eagle-Germany ": false,
    "Eagle-Italy": false,
    "Eagle-England": false,
    "Eagle-Spain": true,
    "Eagle-Hungary": false,

    "Falcon-Germany ": true,
    "Falcon-Italy": false,
    "Falcon-England": false,
    "Falcon-Spain": false,
    "Falcon-Hungary": false,

    "Osprey-Germany ": false,
    "Osprey-Italy": false,
    "Osprey-England": false,
    "Osprey-Spain": false,
    "Osprey-Hungary": true,

    // CODENAMES vs MISSIONS (row 1, col 1)
    "Sparrow-Assasination": false,
    "Sparrow-Surveillance": false,
    "Sparrow-Sabotage": false,
    "Sparrow-Theft": true,
    "Sparrow-Raid": false,

    "Hawk-Assasination": false,
    "Hawk-Surveillance": false,
    "Hawk-Sabotage": false,
    "Hawk-Theft": false,
    "Hawk-Raid": true,

    "Eagle-Assasination": true,
    "Eagle-Surveillance": false,
    "Eagle-Sabotage": false,
    "Eagle-Theft": false,
    "Eagle-Raid": false,

    "Falcon-Assasination": false,
    "Falcon-Surveillance": false,
    "Falcon-Sabotage": true,
    "Falcon-Theft": false,
    "Falcon-Raid": false,

    "Osprey-Assasination": false,
    "Osprey-Surveillance": true,
    "Osprey-Sabotage": false,
    "Osprey-Theft": false,
    "Osprey-Raid": false,

    // MISSIONS vs COUNTRIES (row 2, col 0)
    "Assasination-Germany ": false,
    "Assasination-Italy": false,
    "Assasination-England": false,
    "Assasination-Spain": true,
    "Assasination-Hungary": false,

    "Surveillance-Germany ": false,
    "Surveillance-Italy": false,
    "Surveillance-England": false,
    "Surveillance-Spain": false,
    "Surveillance-Hungary": true,

    "Sabotage-Germany ": true,
    "Sabotage-Italy": false,
    "Sabotage-England": false,
    "Sabotage-Spain": false,
    "Sabotage-Hungary": false,

    "Theft-Germany ": false,
    "Theft-Italy": true,
    "Theft-England": false,
    "Theft-Spain": false,
    "Theft-Hungary": false,

    "Raid-Germany ": false,
    "Raid-Italy": false,
    "Raid-England": true,
    "Raid-Spain": false,
    "Raid-Hungary": false,
  },
};

// Helper function to get category items by reference
export const getCategoryItems = (categoryRef) => {
  return GAME_CONFIG.categories[categoryRef];
};

// Helper function to get all correct solutions for hints
export const getCorrectSolutions = () => {
  const correctSolutions = [];

  Object.entries(GAME_CONFIG.solution).forEach(([key, value]) => {
    if (value === true) {
      correctSolutions.push(key);
    }
  });

  return correctSolutions;
};

// Helper function to get a random correct solution for hints
export const getRandomCorrectSolution = () => {
  const correctSolutions = getCorrectSolutions();
  if (correctSolutions.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * correctSolutions.length);
  return correctSolutions[randomIndex];
};

// Helper function to validate the configuration
export const validateConfig = () => {
  const errors = [];

  // Check that all categories have the same number of items
  const itemCounts = Object.values(GAME_CONFIG.categories).map(
    (items) => items.length
  );
  const uniqueCounts = new Set(itemCounts);
  if (uniqueCounts.size > 1) {
    errors.push("All categories must have the same number of items");
  }

  // Check that grid pattern matches the number of categories
  const expectedRows = GAME_CONFIG.leftColumnCategories.length;
  const expectedCols = GAME_CONFIG.topRowCategories.length;

  if (GAME_CONFIG.gridConfig.gridPattern.length !== expectedRows) {
    errors.push(
      `Grid pattern should have ${expectedRows} rows to match left column categories`
    );
  }

  GAME_CONFIG.gridConfig.gridPattern.forEach((row, index) => {
    if (row.length !== expectedCols) {
      errors.push(
        `Grid pattern row ${index} should have ${expectedCols} columns to match top row categories`
      );
    }
  });

  // Check that all category references are valid
  const validCategories = Object.keys(GAME_CONFIG.categories);

  GAME_CONFIG.leftColumnCategories.forEach((cat) => {
    if (!validCategories.includes(cat.items)) {
      errors.push(`Invalid category reference in left column: ${cat.items}`);
    }
  });

  GAME_CONFIG.topRowCategories.forEach((cat) => {
    if (!validCategories.includes(cat.items)) {
      errors.push(`Invalid category reference in top row: ${cat.items}`);
    }
  });

  return errors;
};

export default GAME_CONFIG;
