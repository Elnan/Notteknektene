# Logic Grid Game

A logic puzzle game where players must determine connections between different categories using provided clues.

## Game Overview

Players are presented with a grid showing different categories (e.g., names, mission, country) and must use logical reasoning and the provided clues to determine the correct connections between items in different categories.

## How to Play

1. **Read the clues** in the right panel
2. **Click on grid cells** to mark them:
   - First click: Mark with ✗ (impossible connection)
   - Second click: Mark with ✓ (correct connection)
   - Third click: Clear the cell
3. **Use hints** if needed (limited to 3)
4. **Submit your solution** when you think you've solved the puzzle

## Creating New Game Variations

To create a new logic grid game, simply modify the `gameConfig.js` file:

### 1. Basic Configuration

```javascript
export const GAME_CONFIG = {
  title: "YOUR GAME TITLE",
  description: "Your game description",
  maxHints: 3,
  baseScore: 10,
  // ... rest of config
};
```

### 2. Categories and Items

Define your categories and their items:

```javascript
categories: {
  people: ["Alice", "Bob", "Charlie", "Diana", "Eve"],
  foods: ["Apple", "Banana", "Cherry", "Date", "Elderberry"],
  colors: ["Red", "Blue", "Green", "Yellow", "Purple"],
  // Add more categories as needed
},
```

**Important**: All categories must have the same number of items (typically 5).

### 3. Grid Layout

Configure which categories appear on the left column and top row:

```javascript
leftColumnCategories: [
  { name: "PEOPLE", items: "people" },
  { name: "FOODS", items: "foods" },
  { name: "COLORS", items: "colors" },
],

topRowCategories: [
  { name: "ANIMALS", items: "animals" },
  { name: "SPORTS", items: "sports" },
  { name: "CITIES", items: "cities" },
],
```

### 4. Grid Pattern

Define which 5x5 sub-grids are visible:

```javascript
gridPattern: [
  [true, true, true],   // Row 0: all three 5x5 grids filled
  [true, true, false],  // Row 1: first two 5x5 grids filled
  [true, false, false], // Row 2: only first 5x5 grid filled
],
```

### 5. Clues

Write logical clues that help players solve the puzzle:

```javascript
clues: [
  "Alice's favorite food is not Apple.",
  "Bob's favorite color is Blue.",
  "Charlie doesn't like Red.",
  // Add more clues...
],
```

### 6. Solution

Define the correct connections:

```javascript
solution: {
  Alice: {
    food: "Banana",
    color: "Red",
  },
  Bob: {
    food: "Apple",
    color: "Blue",
  },
  // ... for all people
},
```

## Example: Creating a "Pets and Hobbies" Game

```javascript
export const GAME_CONFIG = {
  title: "PETS AND HOBBIES",
  description: "Match each person with their pet and favorite hobby.",

  categories: {
    people: ["Amy", "Ben", "Cara", "Dan", "Eva"],
    pets: ["Cat", "Dog", "Fish", "Bird", "Hamster"],
    hobbies: ["Reading", "Gaming", "Cooking", "Gardening", "Painting"],
  },

  leftColumnCategories: [
    { name: "PEOPLE", items: "people" },
    { name: "PETS", items: "pets" },
    { name: "HOBBIES", items: "hobbies" },
  ],

  topRowCategories: [
    { name: "PETS", items: "pets" },
    { name: "HOBBIES", items: "hobbies" },
    { name: "PEOPLE", items: "people" },
  ],

  gridPattern: [
    [true, true, true],
    [true, true, false],
    [true, false, false],
  ],

  clues: [
    "Amy doesn't have a cat.",
    "Ben's hobby is gaming.",
    "Cara has a fish.",
    "Dan doesn't like reading.",
    "Eva's pet is a bird.",
  ],

  solution: {
    Amy: { pet: "Dog", hobby: "Reading" },
    Ben: { pet: "Cat", hobby: "Gaming" },
    Cara: { pet: "Fish", hobby: "Cooking" },
    Dan: { pet: "Hamster", hobby: "Gardening" },
    Eva: { pet: "Bird", hobby: "Painting" },
  },
};
```

## Validation

The game automatically validates your configuration and will log errors to the console if there are issues:

- All categories must have the same number of items
- Grid pattern must match the number of categories
- All category references must be valid

## File Structure

```
logic-grid/
├── index.jsx              # Main game component
├── LogicGrid.module.css   # Game styles
├── gameConfig.js          # Game configuration (modify this!)
└── README.md             # This file
```

## Tips for Creating Good Puzzles

1. **Start with the solution** - Define the correct connections first
2. **Write logical clues** - Each clue should eliminate possibilities
3. **Test your puzzle** - Make sure it has a unique solution
4. **Balance difficulty** - Too few clues = too hard, too many = too easy
5. **Use variety** - Mix positive and negative clues

## Technical Notes

- The game uses CSS Grid for precise alignment
- Grid cells are positioned dynamically based on the pattern
- State is managed with React hooks
- The configuration is validated on component mount
