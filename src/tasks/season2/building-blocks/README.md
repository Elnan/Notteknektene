# Building Blocks Game

A word puzzle game where players solve anagrams and arrange them in a grid to reveal a famous building name.

## Game Mechanics

### Objective

Players must solve 7 anagrams of building-related words and place them in the correct order in a 7x7 grid. When arranged correctly, the letters reading diagonally from top-left to bottom-right will spell out a famous building name.

### Scoring System

- **Base Points**: 7 points for completing the puzzle correctly
- **Instructions Penalty**: -1 point if instructions are used
- **Hint Penalty**: -1 point if a hint is used
- **Maximum Score**: 7 points
- **Minimum Score**: 5 points (if both instructions and hint are used)

### Game Features

#### Anagram Solving

- 7 anagrams with letters arranged alphabetically
- Real-time validation of anagram solutions
- Visual feedback (green for correct, red for incorrect)

#### Grid Placement

- 7x7 grid for placing solved words horizontally
- Visual highlighting of diagonal cells
- Real-time display of current diagonal reading

#### Help System

- **Instructions Button**: Shows the original puzzle instructions (-1 point)
- **Hint Button**: Provides a random anagram solution and hint (-1 point)
- Confirmation modals before using help features
- Help can only be used once per game

### Anagrams

1. **EEELPST** → STEEPLE (A tall pointed structure on a church)
2. **AIMNNOS** → MANSION (A large, impressive house)
3. **CEHIMNY** → CHIMNEY (A structure that carries smoke from a fire)
4. **AACHRWY** → ARCHWAY (A passage under an arch)
5. **EEHKLOY** → KEYHOLE (A hole for inserting a key)
6. **BDIOORU** → DOORBUI (A door combined with a building structure)
7. **EELMPST** → TEMPLES (Places of worship)

### Final Answer

The diagonal reading reveals: **KREMLIN**

### Technical Implementation

#### Components Used

- `Button` - For all interactive buttons
- `Modal` - For instructions, hints, and confirmations
- Custom CSS modules for styling

#### State Management

- Anagram solutions tracking
- Grid word placement
- Game completion status
- Help usage tracking
- Scoring calculation

#### Validation

- Real-time anagram solution validation
- Grid completion checking
- Final answer verification

### File Structure

```
building-blocks/
├── index.jsx              # Main game component
├── gameConfig.js          # Game configuration and logic
├── BuildingBlocks.module.css # Styling
└── README.md              # This file
```

### Integration

This game replaces the "Why" game (sum-grid) in the investigation mystery game structure and integrates with the existing scoring and completion system.
