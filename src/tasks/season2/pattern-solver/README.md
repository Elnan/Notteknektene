# Pattern Solver - Enhanced with Shapes

## Overview

Pattern Solver is a logic puzzle game where players must fill a 4x5 grid with both **colors** and **shapes** based on logical clues. This enhanced version adds three shapes (square, circle, triangle) alongside the original six colors, making the puzzles significantly more complex and engaging.

## Game Features

### Colors

- **6 available colors**: Red, Blue, Green, Yellow, Purple, Orange
- Each cell must have exactly one color

### Shapes

- **3 available shapes**: Square, Circle, Triangle
- Each cell must have exactly one shape
- Shapes are rendered as colored geometric forms within each cell

### Gameplay

1. **Select a cell** by clicking on it
2. **Choose a color** from the color palette
3. **Choose a shape** from the shape palette
4. **Both color and shape** must be assigned to complete a cell
5. Use the **logical clues** to deduce the correct combinations
6. **Clear cells** using the Clear Cell button
7. **Submit** your solution when the grid is complete

### Enhanced Clues

The game now includes clues that reference both colors and shapes:

- Color-based constraints (e.g., "Each color appears exactly 3 times")
- Shape-based constraints (e.g., "Each row must contain exactly 2 circles")
- **Color-shape relationships** (e.g., "Green shapes are always squares", "Red shapes are never triangles")

### Visual Design

- **Colored backgrounds** for each cell based on the selected color
- **Geometric shapes** rendered inside each cell:
  - **Square**: Rounded rectangle with the cell's color
  - **Circle**: Perfect circle with the cell's color
  - **Triangle**: Upward-pointing triangle with the cell's color
- **Intuitive UI** with separate palettes for colors and shapes
- **Pre-filled cells** are clearly marked and cannot be modified

## Technical Implementation

### Data Structure

Each cell now stores both color and shape:

```javascript
{
  color: "red" | "blue" | "green" | "yellow" | "purple" | "orange" | null,
  shape: "square" | "circle" | "triangle" | null
}
```

### Shape Rendering

Custom `ShapeComponent` renders each shape using CSS:

- **Squares**: `border-radius: 4px`
- **Circles**: `border-radius: 50%`
- **Triangles**: CSS borders to create triangle effect

### Clue System

Enhanced clue checking functions that can validate:

- Color distributions and constraints
- Shape distributions and constraints
- Color-shape relationship rules

## Difficulty Progression

The enhanced version significantly increases puzzle complexity:

- **Dual constraints**: Players must satisfy both color and shape rules
- **Relationship rules**: Some clues link colors to specific shapes
- **Increased combinations**: 6 colors × 3 shapes = 18 possible combinations per cell

This creates a much more challenging and engaging puzzle experience that requires deeper logical reasoning and planning.
