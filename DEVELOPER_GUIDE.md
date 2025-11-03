# Developer Guide: Creating Games for Notteknektene

This guide provides comprehensive instructions for developers to create games that are compatible with the Notteknektene platform.

## Table of Contents

1. [Game Architecture Overview](#game-architecture-overview)
2. [Required Game Interface](#required-game-interface)
3. [Game Component Structure](#game-component-structure)
4. [Scoring and Submission System](#scoring-and-submission-system)
5. [Save State Management](#save-state-management)
6. [Integration with GameWrapper](#integration-with-gamewrapper)
7. [File Structure and Organization](#file-structure-and-organization)
8. [Styling Guidelines](#styling-guidelines)
9. [Testing and Validation](#testing-and-validation)
10. [Example Game Implementation](#example-game-implementation)

## Game Architecture Overview

The Notteknektene platform uses a modular game system where each game is a React component that integrates with:

- **GameWrapper**: Handles task opening, completion tracking, and submission
- **TaskOpener**: Provides the initial game interface with opening animations
- **Save State System**: Automatic game state persistence
- **Submission System**: Standardized data collection and scoring

## Required Game Interface

Every game component must implement the following interface:

```jsx
const MyGame = ({ onComplete, currentGameId }) => {
  // Game implementation
};
```

### Required Props

| Prop            | Type     | Required | Description                                     |
| --------------- | -------- | -------- | ----------------------------------------------- |
| `onComplete`    | Function | Yes      | Callback to submit game completion              |
| `currentGameId` | String   | Yes      | Unique identifier for the current game instance |

### onComplete Function

The `onComplete` function must be called when the game ends (win or lose) with the following signature:

```jsx
onComplete(gameId, submissionData);
```

**Parameters:**

- `gameId` (string): The game identifier (usually `currentGameId`)
- `submissionData` (object): Game completion data (see [Submission Data Format](#submission-data-format))

## Game Component Structure

### Basic Structure

```jsx
import React, { useState, useEffect } from "react";
import styles from "./MyGame.module.css";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

const MyGame = ({ onComplete, currentGameId }) => {
  // Game state
  const [gameState, setGameState] = useState(initialState);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Track game start time
  useEffect(() => {
    window.gameStartTime = Date.now();
  }, []);

  // Game logic here...

  const handleGameComplete = () => {
    const timeSpent = Date.now() - (window.gameStartTime || Date.now());

    const submissionData = {
      score: calculateScore(),
      timeSpent: timeSpent,
      // Add game-specific data
    };

    setGameCompleted(true);
    onComplete(currentGameId || "my-game", submissionData);
  };

  if (gameCompleted) {
    return <ResultsScreen score={score} />;
  }

  return <div className={styles.gameContainer}>{/* Game content */}</div>;
};

export default MyGame;
```

## Scoring and Submission System

### Submission Data Format

Games must provide data in this standardized format:

```jsx
const submissionData = {
  // Required common fields
  score: number, // Final score (0 or positive)
  timeSpent: number, // Time in milliseconds
  hintsUsed: number, // Number of hints used (0 or 1)
  instructionsUsed: number, // Number of instruction views (0 or 1)

  // Game-specific fields (optional)
  // Add any additional data your game needs to track
};
```

### Common Scoring Patterns

1. **Base Points System**: Start with base points, deduct for help usage
2. **Time-based Scoring**: Bonus points for faster completion
3. **Accuracy Scoring**: Points based on correct answers/actions
4. **Efficiency Scoring**: Points based on optimal solutions

Example scoring implementation:

```jsx
const calculateScore = () => {
  let points = BASE_POINTS;

  if (instructionsUsed) points -= INSTRUCTION_PENALTY;
  if (hintUsed) points -= HINT_PENALTY;

  // Time bonus (optional)
  const timeBonus = Math.max(0, TIME_BONUS_THRESHOLD - timeSpent);
  points += timeBonus;

  return Math.max(0, points);
};
```

## Save State Management

### Using Game-Specific Save Hooks

For complex games, create a custom save hook:

```jsx
// hooks/useMyGameSaveState.js
import { useState, useCallback, useRef } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { notteknekteneDb } from "../firebase/firebase-config-notteknektene.js";
import { useAuth } from "../context/authContext";

export const useMyGameSaveState = (gameId) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveGameState = useCallback(
    async (gameState) => {
      // Implementation for saving game state
    },
    [currentUser, gameId]
  );

  const loadGameState = useCallback(async () => {
    // Implementation for loading game state
  }, [currentUser, gameId]);

  const clearSaveState = useCallback(async () => {
    // Implementation for clearing save state
  }, [currentUser, gameId]);

  return {
    saveGameState,
    loadGameState,
    clearSaveState,
    isLoading,
    error,
  };
};
```

### Using Universal Save State

For simpler games, use the universal save hook:

```jsx
import { useUniversalSaveState } from "../../../hooks/useUniversalSaveState";

const MyGame = ({ onComplete, currentGameId }) => {
  const {
    saveGameState,
    loadGameState,
    clearSaveState,
    isLoading: saveLoading,
    error: saveError,
  } = useUniversalSaveState(currentGameId, "my-game");

  // Use saveGameState(gameState) to save
  // Use loadGameState() to load
};
```

## Integration with GameWrapper

### Game Registration

Add your game to `src/utils/gamesConfig.js`:

```jsx
import MyGame from "../tasks/season2/my-game/index";

const gameDefinitions = [
  // ... existing games
  {
    id: "my-game",
    name: "My Game",
    component: MyGame,
    description: "A brief description of your game.",
  },
];
```

### GameWrapper Integration

Your game will automatically be wrapped with GameWrapper, which provides:

- Task opening interface
- Completion tracking
- Submission handling
- User authentication
- Season management

## File Structure and Organization

### Recommended Structure

```
src/tasks/season2/my-game/
├── index.jsx                 # Main game component
├── gameConfig.js            # Game configuration and constants
├── MyGame.module.css        # Game-specific styles
├── README.md               # Game documentation
└── hooks/                  # Game-specific hooks (optional)
    └── useMyGameSaveState.js
```

### File Naming Conventions

- **Component files**: `index.jsx` (main component)
- **Configuration**: `gameConfig.js`
- **Styles**: `MyGame.module.css`
- **Hooks**: `useMyGameSaveState.js`
- **Documentation**: `README.md`

## Styling Guidelines

### CSS Modules

Use CSS modules for component-specific styles:

```css
/* MyGame.module.css */
.gameContainer {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.gameGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.gameButton {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
```

### Responsive Design

Ensure your game works on both desktop and mobile:

```css
@media (max-width: 768px) {
  .gameContainer {
    padding: 10px;
  }

  .gameGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### Using Existing Components

Leverage existing UI components:

```jsx
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

// Use Button component for consistency
<Button
  variant="primary"
  size="small"
  onClick={handleAction}
>
  Action
</Button>

// Use Modal for instructions/hints
<Modal
  isOpen={showInstructions}
  onClose={() => setShowInstructions(false)}
  title="Instructions"
>
  <p>Game instructions here...</p>
</Modal>
```

## Testing and Validation

### Game Testing Checklist

- [ ] Game loads without errors
- [ ] Save state works correctly
- [ ] Game completion triggers onComplete
- [ ] Scoring system works as expected
- [ ] Responsive design on mobile
- [ ] Instructions and hints work properly
- [ ] Game can be completed and shows results

### Validation Functions

Add validation for game-specific data:

```jsx
const validateGameData = (gameData) => {
  const errors = [];

  if (gameData.score < 0) {
    errors.push("Score cannot be negative");
  }

  if (gameData.timeSpent < 0) {
    errors.push("Time spent cannot be negative");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

## Example Game Implementation

### Simple Puzzle Game

```jsx
import React, { useState, useEffect } from "react";
import styles from "./PuzzleGame.module.css";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

const PUZZLE_CONFIG = {
  gridSize: 3,
  basePoints: 10,
  hintPenalty: 2,
  instructionPenalty: 1,
  targetPattern: [1, 2, 3, 4, 5, 6, 7, 8, 0], // 0 = empty space
};

const PuzzleGame = ({ onComplete, currentGameId }) => {
  const [grid, setGrid] = useState([1, 2, 3, 4, 5, 6, 7, 8, 0]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [instructionsUsed, setInstructionsUsed] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Track game start time
  useEffect(() => {
    window.gameStartTime = Date.now();
  }, []);

  const handleTileClick = (index) => {
    const emptyIndex = grid.indexOf(0);
    const newGrid = [...grid];

    // Check if tile is adjacent to empty space
    if (isAdjacent(index, emptyIndex)) {
      // Swap tiles
      [newGrid[index], newGrid[emptyIndex]] = [
        newGrid[emptyIndex],
        newGrid[index],
      ];
      setGrid(newGrid);
      setMoves(moves + 1);

      // Check for win condition
      if (isSolved(newGrid)) {
        setGameWon(true);
        handleGameComplete();
      }
    }
  };

  const isAdjacent = (index1, index2) => {
    const row1 = Math.floor(index1 / PUZZLE_CONFIG.gridSize);
    const col1 = index1 % PUZZLE_CONFIG.gridSize;
    const row2 = Math.floor(index2 / PUZZLE_CONFIG.gridSize);
    const col2 = index2 % PUZZLE_CONFIG.gridSize;

    return (
      (Math.abs(row1 - row2) === 1 && col1 === col2) ||
      (Math.abs(col1 - col2) === 1 && row1 === row2)
    );
  };

  const isSolved = (currentGrid) => {
    return currentGrid.every(
      (tile, index) => tile === PUZZLE_CONFIG.targetPattern[index]
    );
  };

  const calculateScore = () => {
    let points = PUZZLE_CONFIG.basePoints;
    if (instructionsUsed) points -= PUZZLE_CONFIG.instructionPenalty;
    if (hintUsed) points -= PUZZLE_CONFIG.hintPenalty;
    return Math.max(0, points);
  };

  const handleGameComplete = () => {
    const timeSpent = Date.now() - (window.gameStartTime || Date.now());

    const submissionData = {
      score: calculateScore(),
      timeSpent: timeSpent,
      moves: moves,
      hintsUsed: hintUsed ? 1 : 0,
      instructionsUsed: instructionsUsed ? 1 : 0,
    };

    onComplete(currentGameId || "puzzle-game", submissionData);
  };

  const handleHint = () => {
    if (!hintUsed) {
      setHintUsed(true);
      setShowHintModal(true);
    }
  };

  const handleInstructions = () => {
    if (!instructionsUsed) {
      setInstructionsUsed(true);
      setShowInstructionsModal(true);
    }
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <h3>Puzzle Game</h3>
        <div className={styles.headerButtons}>
          <Button
            variant="secondary"
            size="small"
            onClick={handleInstructions}
            className={instructionsUsed ? styles.used : ""}
          >
            Instructions {!instructionsUsed && "(-1 point)"}
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={handleHint}
            className={hintUsed ? styles.used : ""}
          >
            Hint {!hintUsed && "(-2 points)"}
          </Button>
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.puzzleGrid}>
          {grid.map((tile, index) => (
            <div
              key={index}
              className={`${styles.tile} ${tile === 0 ? styles.empty : ""}`}
              onClick={() => handleTileClick(index)}
            >
              {tile !== 0 && tile}
            </div>
          ))}
        </div>

        <div className={styles.gameInfo}>
          <p>Moves: {moves}</p>
          <p>Score: {calculateScore()}</p>
        </div>
      </div>

      {/* Instructions Modal */}
      <Modal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        title="Instructions"
      >
        <p>
          Arrange the tiles in numerical order from 1 to 8 with the empty space
          at the end.
        </p>
        <p>Click on tiles adjacent to the empty space to move them.</p>
      </Modal>

      {/* Hint Modal */}
      <Modal
        isOpen={showHintModal}
        onClose={() => setShowHintModal(false)}
        title="Hint"
      >
        <p>
          Try to solve the puzzle by working with one row at a time, starting
          from the top.
        </p>
      </Modal>
    </div>
  );
};

export default PuzzleGame;
```

## Best Practices

### Code Organization

1. **Separate concerns**: Keep game logic, UI, and data separate
2. **Use constants**: Define game configuration in a separate file
3. **Modular components**: Break complex games into smaller components
4. **Error handling**: Always handle edge cases and errors gracefully

### Performance

1. **Debounce saves**: Don't save on every state change
2. **Optimize renders**: Use React.memo for expensive components
3. **Lazy loading**: Load game assets only when needed
4. **Memory management**: Clean up event listeners and timeouts

### User Experience

1. **Clear instructions**: Provide helpful instructions and hints
2. **Visual feedback**: Show progress and state changes clearly
3. **Mobile support**: Ensure touch-friendly interactions
4. **Accessibility**: Use semantic HTML and proper ARIA labels

### Testing

1. **Unit tests**: Test individual game functions
2. **Integration tests**: Test game completion flow
3. **User testing**: Get feedback from actual players
4. **Cross-browser testing**: Ensure compatibility across browsers

## Conclusion

This guide provides the foundation for creating games compatible with the Notteknektene platform. Follow these patterns and conventions to ensure your games integrate seamlessly with the existing system.

For questions or support, refer to the existing game implementations in `src/tasks/season2/` or contact the development team.
