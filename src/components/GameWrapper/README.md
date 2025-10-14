# GameWrapper Component

A higher-order component that makes it easy to wrap any game with TaskOpener functionality.

## Usage

### Simple Wrapping

```jsx
import GameWrapper from "../components/GameWrapper/GameWrapper";
import MyGame from "./MyGame";

// In your gamesConfig.js
export const games = [
  {
    name: "My Game",
    component: (props) => (
      <GameWrapper
        gameComponent={MyGame}
        taskId="my-game"
        taskName="My Game"
        taskDescription="Complete the puzzle by solving the mystery."
        gameProps={props}
      />
    ),
    status: "current",
  },
];
```

### Direct Component Wrapping

```jsx
import GameWrapper from "../components/GameWrapper/GameWrapper";
import MyGame from "./MyGame";

const WrappedMyGame = (props) => (
  <GameWrapper
    gameComponent={MyGame}
    taskId="my-game"
    taskName="My Game"
    taskDescription="Complete the puzzle by solving the mystery."
    gameProps={props}
  />
);

export default WrappedMyGame;
```

## Props

| Prop              | Type            | Required | Description                                |
| ----------------- | --------------- | -------- | ------------------------------------------ |
| `gameComponent`   | React.Component | Yes      | The game component to wrap                 |
| `taskId`          | string          | Yes      | Unique identifier for the task             |
| `taskName`        | string          | Yes      | Display name for the task                  |
| `taskDescription` | string          | Yes      | Description of what the player needs to do |
| `gameProps`       | Object          | No       | Props to pass to the game component        |

## Benefits

- **Simplified Integration**: No need to manually import and use TaskOpener in each game
- **Consistent Interface**: All games get the same task opening experience
- **Easy Maintenance**: Centralized task opening logic
- **Reusable**: Can be applied to any game component

## Example Integration

Instead of manually wrapping each game like this:

```jsx
// Manual approach
import TaskOpener from "../components/TaskOpener/TaskOpener";
import { useTaskOpener } from "../hooks/useTaskOpener";

const MyGame = () => {
  const { isOpened, handleTaskOpen } = useTaskOpener("my-game");

  return (
    <TaskOpener
      taskName="My Game"
      taskDescription="Description..."
      onTaskOpen={handleTaskOpen}
      isOpened={isOpened}
    >
      {/* Game content */}
    </TaskOpener>
  );
};
```

You can simply use the GameWrapper:

```jsx
// Using GameWrapper
import GameWrapper from '../components/GameWrapper/GameWrapper';

const MyGame = () => {
  return (
    <div>
      {/* Game content */}
    </div>
  );
};

// In gamesConfig.js
{
  name: "My Game",
  component: (props) => (
    <GameWrapper
      gameComponent={MyGame}
      taskId="my-game"
      taskName="My Game"
      taskDescription="Description..."
      gameProps={props}
    />
  ),
  status: "current",
}
```

This makes it much easier to add task opening functionality to new games!
