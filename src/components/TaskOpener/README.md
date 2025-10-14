# TaskOpener Component

A reusable component that provides a cool animation when players first open a task, with a button to reveal the game content.

## Features

- **Cool Opening Animation**: Multi-step animation with button press effects, card opening, particle explosions, and smooth transitions
- **Task Tracking**: Records when players first open tasks (ready for database integration)
- **Reusable**: Easy to integrate with any game component
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Usage

### Basic Integration

```jsx
import TaskOpener from "../components/TaskOpener/TaskOpener";
import { useTaskOpener } from "../hooks/useTaskOpener";

const MyGame = () => {
  const { isOpened, handleTaskOpen } = useTaskOpener("my-game-id");

  const gameContent = <div>{/* Your game content here */}</div>;

  return (
    <TaskOpener
      taskName="My Game"
      taskDescription="Description of what the player needs to do in this game."
      onTaskOpen={handleTaskOpen}
      isOpened={isOpened}
    >
      {gameContent}
    </TaskOpener>
  );
};
```

### Props

| Prop              | Type      | Required | Description                                              |
| ----------------- | --------- | -------- | -------------------------------------------------------- |
| `children`        | ReactNode | Yes      | The game content to display after opening                |
| `taskName`        | string    | Yes      | The name of the task to display                          |
| `taskDescription` | string    | Yes      | Description of what the player needs to do               |
| `onTaskOpen`      | function  | Yes      | Callback function called when task is opened             |
| `isOpened`        | boolean   | No       | Whether the task has been opened before (default: false) |

### useTaskOpener Hook

The `useTaskOpener` hook manages the opening state and provides a callback for recording task openings.

```jsx
const { isOpened, handleTaskOpen } = useTaskOpener("unique-task-id");
```

#### Parameters

- `taskId` (string): Unique identifier for the task

#### Returns

- `isOpened` (boolean): Whether the task has been opened before
- `handleTaskOpen` (function): Callback to record task opening

## Animation Sequence

1. **Initial State**: Shows task card with icon, title, description, and "Open Task" button
2. **Button Press**: Button press effect with ripple animation
3. **Card Opening**: Animated lines growing from center
4. **Content Reveal**: Particle explosion effect
5. **Final Transition**: Fade out and reveal game content

## Database Integration

When you connect your database, the task opening data is automatically recorded. The system currently stores data in localStorage but is ready for API integration.

### Current Data Structure

```javascript
{
  "task-id": {
    "openedAt": "2024-01-01T12:00:00.000Z",
    "timestamp": 1704110400000
  }
}
```

### Future API Integration

Update the `recordTaskOpening` function in `src/Notteknektene/utils/taskTracking.js`:

```javascript
export const recordTaskOpening = async (taskId, data) => {
  const response = await fetch("/api/tasks/opened", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      taskId,
      openedAt: data.openedAt,
      timestamp: data.timestamp,
      userId: getCurrentUserId(),
    }),
  });

  return response.json();
};
```

## Styling

The component uses CSS modules and includes:

- Modern gradient backgrounds
- Glassmorphism effects
- Smooth animations and transitions
- Responsive design
- Hover effects

## Customization

You can customize the appearance by modifying `TaskOpener.module.css`:

- Change colors in the gradient backgrounds
- Adjust animation timings
- Modify the card design
- Update particle effects

## Example Implementation

See `src/Notteknektene/tasks/season2/sum-grid/index.jsx` for a complete implementation example.
