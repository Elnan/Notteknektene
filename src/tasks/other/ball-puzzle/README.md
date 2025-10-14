# Ball Puzzle Game

A triangular grid puzzle game where players must fill the entire grid with unique ball-based shapes.

## Game Concept

The game features a triangular grid made up of circular indents where players must place unique ball-based shapes (similar to Tetris pieces but made of connected balls) to completely fill the triangle.

## How to Play

1. **Drag and Drop**: Click and drag any available shape from the "Available Shapes" panel onto the triangular grid
2. **Grid Alignment**: Shapes automatically align to the triangular grid when dragged over it
3. **Rotate Shapes**: While dragging a shape, press "R" key or middle mouse button to rotate to the next valid orientation
4. **Place the Shape**: Release the mouse button to place the shape on the grid
5. **Pick Up Placed Shapes**: Click and drag any placed shape on the grid to move it to a new position
6. **Complete the Puzzle**: Fill the entire triangular grid with all the unique shapes
7. **Remove Shapes**: If you make a mistake, click on any placed shape in the "Placed Shapes" panel to remove it

## Game Features

- **15 Unique Shapes**: Each shape is made up of connected balls in different configurations with unique colors
- **Large Triangular Grid**: 10-row triangular grid with circular indents (55 total positions)
- **Drag and Drop**: Intuitive drag-and-drop interface for placing shapes
- **Grid Alignment**: Shapes automatically snap to valid grid positions when dragged
- **Smart Rotation**: Shapes rotate only to orientations that fit the triangular grid
- **Pick Up and Move**: Click and drag placed shapes to reposition them
- **Perfect Visual Feedback**: Shows exactly where the entire shape will land on the grid
- **Real-time Preview**: Grid cells highlight to show the complete shape placement
- **Rotation Preview**: Visual indicator updates as you rotate the shape
- **Hint System**: Get a hint to help you find a valid placement
- **Move Counter**: Track how many moves you've made
- **Completion Detection**: Automatically detects when the puzzle is solved

## Shapes Included

1. **Line** - 5 balls in a row (Red)
2. **T** - T-shaped configuration (Blue)
3. **L** - L-shaped configuration (Orange)
4. **Square** - Square with an extra ball (Purple)
5. **Zigzag** - Zigzag pattern (Green)
6. **Cross** - Cross-shaped configuration (Dark Orange)
7. **Corner** - Simple corner piece (Teal)
8. **Small L** - Smaller L-shaped piece (Dark Gray)
9. **Triangle** - Triangle-shaped configuration (Pink)
10. **Snake** - Snake-like pattern (Dark Red)
11. **Plus** - Plus-shaped configuration (Dark Purple)
12. **Staircase** - Staircase pattern (Dark Teal)
13. **Diamond** - Diamond-shaped configuration (Dark Orange)
14. **Hook** - Hook-shaped configuration (Dark Red)
15. **Spiral** - Spiral pattern (Dark Green)

## Technical Details

- Built with React and CSS modules
- Uses the site's existing Button component
- Follows the site's color scheme and styling patterns
- Responsive design for mobile and desktop
- Uses the triangular grid generation algorithm

## Game Logic

- Each shape can only be used once
- Shapes must fit completely within the triangular grid
- Shapes cannot overlap with already placed shapes
- Shapes rotate only to orientations that are valid for the triangular grid
- Placed shapes can be picked up and moved to new positions
- The puzzle is complete when all 55 grid positions are filled

## Integration

The game is integrated into the Notteknektene game system and can be accessed through the main game interface. It's configured as game #4 in the season 2 lineup.
