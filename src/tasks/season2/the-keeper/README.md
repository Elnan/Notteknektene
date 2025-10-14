# The Keeper's Maze

A challenging puzzle game where players must discover the hidden rules governing the keeper's behavior to escape the maze.

## Game Design Philosophy

This game is designed for **learning by doing**. Players start immediately in the game without any rules explanation. The keeper will catch them in the first few attempts, forcing them to observe and understand the keeper's movement patterns through experimentation.

## Game Mechanics

### Hidden Rules (For discussion after players have tried)

1. **Cell Values**: Each cell has a hidden value = x + y (e.g., position (2,4) has value 6)

2. **Keeper Movement Rules** (in order of priority):

   - **Prime numbers** (2,3,5,7,11,13,17,19): Keeper moves directly towards player (2 steps)
   - **Perfect squares** (0,1,4,9,16): Keeper moves in a spiral pattern but prioritizes towards player
   - **Multiples of 3** (0,3,6,9,12,15,18): Keeper moves in a chess knight pattern but towards player
   - **Multiples of 4** (0,4,8,12,16): Keeper moves directly towards player (1 step)
   - **Multiples of 7** (0,7,14): On first visit, keeper and player swap positions
   - **Even numbers** (0,2,4,6,8,10,12,14,16,18): Keeper moves towards player (1 step)
   - **Odd numbers** (1,3,5,7,9,11,13,15,17,19): Keeper moves towards player (1 step)

3. **Win Condition**: Reach the exit at position (9,9)

4. **Lose Condition**: Keeper catches the player

### What Opens the Door?

The exit door is **always open** - it requires no special activation. The player simply needs to reach position (9,9) to win.

### Discussion Points

After players have attempted the game, discuss:

- What patterns did they notice in the keeper's behavior?
- Which cells seemed to make the keeper move differently?
- Did they notice the teleportation effect on certain cells?
- How did they handle the position swapping mechanic?
- What strategies did they develop for different cell types?
- How did they use the obstacles to their advantage?
- Which rules were the hardest to figure out?
- How did the priority system affect their strategy?

### Board Design

- **10x10 grid** with open corridors and strategic obstacles
- **Exit**: Visible at bottom-right corner (9,9) with subtle visual hint (missing borders)
- **Obstacles**: Create multiple pathways and strategic choices:
  - Small corner blocks (2x2 each)
  - Horizontal corridor dividers (4-cell lines)
  - Vertical corridor dividers (4-cell lines)
  - Individual strategic obstacles scattered
  - Partial top and bottom borders
  - Multiple open corridors with tactical decisions

### Learning Curve

1. **Initial attempts**: Players get caught quickly, learning that the keeper is dangerous
2. **Pattern observation**: Players notice keeper reacts differently to different cells
3. **Strategy development**: Understanding how to manipulate keeper's movement
4. **Path planning**: Using obstacles and keeper behavior to create escape routes
5. **Solution execution**: Successfully navigating to the exit

## Implementation Details

### Files Structure

- `index.jsx` - Main game component with logic
- `TheKeeper.module.css` - Styling
- `README.md` - This file

### Key Functions

- `getCellValue(x, y)` - Calculates hidden cell value
- `moveKeeper(playerNewPos)` - Implements keeper AI movement
- `manhattanDistance(pos1, pos2)` - Calculates distance for pathfinding
- `handlePlayerMove(x, y)` - Processes player moves (click and keyboard)
- `handleCellClick(x, y)` - Handles cell clicks

### Controls

- **Arrow keys** or **WASD** for movement
- **Click** on adjacent cells to move
- **Reset** button to start over

### Board Layout

10x10 grid with obstacles creating a maze-like structure:

- Player starts at (1,1)
- Keeper starts at (8,8)
- Exit at (9,9) - visible but subtle
- Obstacles strategically placed to allow for solution

## Solution Strategy

The board and keeper behavior are designed to allow for a solution once players understand the mechanics:

1. **Understand keeper patterns** through repeated attempts
2. **Use obstacles** to block keeper's path
3. **Manipulate keeper movement** using cell values
4. **Plan route** to exit using keeper behavior knowledge
5. **Execute escape** with precise timing and positioning

## Styling

Follows the project's color scheme:

- Green theme for player and UI elements
- Red for keeper
- Gold for visited cells and exit
- Responsive design for mobile devices
- Subtle exit indication (missing borders)
