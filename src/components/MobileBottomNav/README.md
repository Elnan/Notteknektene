# MobileBottomNav Component

A mobile-responsive bottom navigation component that replaces the header and progress bar on mobile devices (≤768px).

## Features

- **Responsive Design**: Automatically shows on mobile devices (≤768px screen width)
- **Half-Circle Game Selector**: Center button with animated game selection overlay
- **Navigation Links**: Left (Scoreboard/Table) and Right (Rules) navigation buttons
- **Haptic Feedback**: Vibration feedback on touch devices when available
- **Accessibility**: Keyboard navigation support (Escape key to close)
- **Touch Optimized**: Optimized for touch interactions with proper touch targets

## Usage

The component is automatically integrated into the MainLayout and will show/hide based on screen size.

### Props

- `games` (Array): Array of game objects with status information
- `onGameSelect` (Function): Callback function when a game is selected

### Game Object Structure

```javascript
{
  name: "Game Name",
  status: "current" | "completed" | "upcoming",
  id: "game-id",
  description: "Game description"
}
```

## Design

- **Left Button**: Scoreboard/Table link with list icon
- **Center Button**: Half-circle shape showing current game number or "NK" when not in a game
- **Right Button**: Rules link with book icon
- **Game Selector**: Overlay with 5x2 grid of game options (10 total games)

## Animations

- Smooth fade-in/out for overlay
- Scale animations for buttons
- Pulse animation for live games
- Blink animation for live badges

## Mobile Breakpoints

- **≤768px**: Mobile bottom navigation active
- **≤480px**: Smaller touch targets and spacing
- **≤360px**: Compact layout for very small screens

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Proper focus management
- Touch-friendly minimum sizes (44px minimum)

## Browser Support

- Modern browsers with CSS Grid support
- Backdrop filter support for blur effects
- Vibration API support for haptic feedback (optional)
