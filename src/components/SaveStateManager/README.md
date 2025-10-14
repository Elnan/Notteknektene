# Save State System

This document explains how to use the save state system for games in the Notteknektene application.

## Overview

The save state system allows players to save their progress in games and resume where they left off. It automatically saves progress and provides manual save/load functionality.

## Features

- **Automatic Saving**: Games automatically save progress every 30 seconds (configurable)
- **Manual Save/Load**: Players can manually save and load their progress
- **Round-based Saving**: For multi-round games, progress is saved after each round
- **Complex State Support**: Handles Sets, Maps, Dates, and other complex objects
- **Error Handling**: Robust error handling with user-friendly messages
- **Save Management UI**: Built-in UI for managing save states

## Quick Start

### 1. Add SaveStateProvider to your app

The SaveStateProvider is already added to `App.jsx`. Make sure it wraps your game components:

```jsx
import { SaveStateProvider } from "./context/SaveStateContext";

function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <SaveStateProvider>{/* Your app content */}</SaveStateProvider>
      </TaskProvider>
    </AuthProvider>
  );
}
```

### 2. Use the save state hook in your game

```jsx
import { useGameSaveState } from "../../hooks/useGameSaveState";

const MyGame = () => {
  // Define your initial state
  const initialState = {
    score: 0,
    level: 1,
    playerPosition: { x: 0, y: 0 },
    inventory: new Set(),
    completed: false,
  };

  // Use the save state hook
  const {
    gameState,
    updateGameState,
    saveState,
    isLoading,
    hasLoadedSave,
    lastSaveTime,
  } = useGameSaveState("myGame", initialState, {
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    saveOnUnload: true,
  });

  // Extract state from gameState
  const { score, level, playerPosition, inventory, completed } = gameState;

  // Update game state (automatically triggers auto-save)
  const updateScore = (newScore) => {
    updateGameState((prevState) => ({
      ...prevState,
      score: newScore,
    }));
  };

  // Manual save
  const handleManualSave = async () => {
    await saveState({
      score: score,
      completed: completed,
    });
  };

  return (
    <div>
      <h1>My Game</h1>
      <p>Score: {score}</p>
      <p>Level: {level}</p>
      <button onClick={handleManualSave}>Save Game</button>
    </div>
  );
};
```

### 3. For round-based games

```jsx
import { useRoundBasedSaveState } from "../../hooks/useGameSaveState";

const RoundBasedGame = () => {
  const { gameState, updateGameState, completeRound } = useRoundBasedSaveState(
    "roundGame",
    initialState,
    {
      saveAfterEachRound: true,
    }
  );

  const handleRoundComplete = async (roundData) => {
    await completeRound({
      score: 100,
      timeSpent: 120,
      hintsUsed: 2,
    });
  };

  return <div>{/* Game content */}</div>;
};
```

## API Reference

### useGameSaveState(gameId, initialState, options)

#### Parameters

- `gameId` (string): Unique identifier for the game
- `initialState` (object): Initial state for the game
- `options` (object): Configuration options
  - `autoSave` (boolean): Whether to auto-save (default: true)
  - `autoSaveInterval` (number): Auto-save interval in milliseconds (default: 30000)
  - `saveOnUnload` (boolean): Save when component unmounts (default: true)
  - `onLoad` (function): Callback when save state is loaded
  - `onSave` (function): Callback when save state is saved
  - `onError` (function): Callback when an error occurs

#### Returns

- `gameState` (object): Current game state
- `updateGameState` (function): Update game state
- `saveState` (function): Manual save function
- `isLoading` (boolean): Whether save state is loading
- `hasLoadedSave` (boolean): Whether a save state was loaded
- `lastSaveTime` (Date): Last save time
- `saveError` (Error): Any save error
- `saveInfo` (object): Save state information
- `getTimeSpent` (function): Get time spent in game
- `hasSaveState` (function): Check if save state exists

### useRoundBasedSaveState(gameId, initialState, options)

Similar to `useGameSaveState` but with additional round-based functionality:

#### Additional Returns

- `completeRound` (function): Complete a round and save progress

### SaveStateManager Component

```jsx
import SaveStateManager from "../../components/SaveStateManager/SaveStateManager";

<SaveStateManager
  gameId="myGame"
  onLoadSave={handleLoadSave}
  onDeleteSave={handleDeleteSave}
  showSaveInfo={true}
/>;
```

#### Props

- `gameId` (string): Game identifier
- `onLoadSave` (function): Callback when save is loaded
- `onDeleteSave` (function): Callback when save is deleted
- `showSaveInfo` (boolean): Whether to show save information (default: true)

## State Serialization

The system automatically handles serialization of complex objects:

- **Sets**: Converted to arrays and back
- **Maps**: Converted to arrays of entries and back
- **Dates**: Converted to ISO strings and back
- **Arrays**: Recursively processed
- **Objects**: Recursively processed

## Database Structure

Save states are stored in Firebase with this structure:

```
/seasons/{seasonId}/games/{gameId}/users/{userId}
  - userId: string
  - userName: string
  - userEmail: string
  - gameId: string
  - seasonId: string
  - gameState: object (serialized)
  - lastModified: timestamp
  - openedAt: timestamp
  - timeSpent: number
  - hintsUsed: number
  - attempts: number
  - completed: boolean
  - score: number
  - answer: string
  - submittedAt: timestamp
  - autoSave: boolean
```

## Best Practices

### 1. Define a clear initial state

```jsx
const initialState = {
  // Game progress
  currentLevel: 1,
  score: 0,
  completed: false,

  // Game state
  playerPosition: { x: 0, y: 0 },
  inventory: new Set(),
  visitedAreas: new Set(),

  // Game settings
  difficulty: "normal",
  soundEnabled: true,

  // Metadata
  startTime: new Date(),
  lastPlayed: new Date(),
};
```

### 2. Use updateGameState for state changes

```jsx
// Good: Use updateGameState
updateGameState((prevState) => ({
  ...prevState,
  score: prevState.score + 100,
}));

// Bad: Direct state mutation
setScore(score + 100);
```

### 3. Handle loading states

```jsx
if (isLoading) {
  return <div>Loading game...</div>;
}

if (saveError) {
  return <div>Error loading game: {saveError.message}</div>;
}
```

### 4. Save important events

```jsx
const handleLevelComplete = async () => {
  await saveState({
    levelCompleted: true,
    levelNumber: currentLevel,
    completionTime: new Date(),
  });
};
```

### 5. Use appropriate game IDs

```jsx
// Good: Descriptive and unique
useGameSaveState("patternSolver", initialState);

// Bad: Generic
useGameSaveState("game1", initialState);
```

## Error Handling

The system provides comprehensive error handling:

```jsx
const { saveError, onError } = useGameSaveState("myGame", initialState, {
  onError: (error) => {
    console.error("Save error:", error);
    // Show user-friendly error message
    showNotification("Failed to save game progress");
  },
});

if (saveError) {
  return (
    <div className="error">
      <h2>Save Error</h2>
      <p>{saveError.message}</p>
      <button onClick={() => window.location.reload()}>Reload Game</button>
    </div>
  );
}
```

## Migration from Existing Games

To add save state functionality to an existing game:

1. **Identify state variables**: List all state variables that need to be saved
2. **Create initial state**: Define the initial state object
3. **Replace useState with updateGameState**: Update state management
4. **Add save state hook**: Integrate the save state hook
5. **Test save/load functionality**: Verify that save states work correctly

## Example Migration

### Before (without save states)

```jsx
const MyGame = () => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [completed, setCompleted] = useState(false);

  const handleScoreUpdate = (newScore) => {
    setScore(newScore);
  };

  return (
    <div>
      <p>Score: {score}</p>
      <p>Level: {level}</p>
    </div>
  );
};
```

### After (with save states)

```jsx
const MyGame = () => {
  const initialState = {
    score: 0,
    level: 1,
    completed: false,
  };

  const { gameState, updateGameState, saveState } = useGameSaveState(
    "myGame",
    initialState
  );

  const { score, level, completed } = gameState;

  const handleScoreUpdate = (newScore) => {
    updateGameState((prevState) => ({
      ...prevState,
      score: newScore,
    }));
  };

  return (
    <div>
      <p>Score: {score}</p>
      <p>Level: {level}</p>
      <SaveStateManager gameId="myGame" />
    </div>
  );
};
```

## Troubleshooting

### Common Issues

1. **Save state not loading**: Check if the game ID matches between save and load
2. **Complex objects not saving**: Ensure they're properly serialized (Sets, Maps, etc.)
3. **Auto-save not working**: Check if autoSave is enabled and autoSaveInterval is set
4. **Save errors**: Check Firebase permissions and network connectivity

### Debug Tips

```jsx
const { gameState, saveState, saveError } = useGameSaveState(
  "myGame",
  initialState,
  {
    onLoad: (state) => console.log("Loaded state:", state),
    onSave: (state) => console.log("Saved state:", state),
    onError: (error) => console.error("Save error:", error),
  }
);

// Log state changes
useEffect(() => {
  console.log("Game state changed:", gameState);
}, [gameState]);
```
