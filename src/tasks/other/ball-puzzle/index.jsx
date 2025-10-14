import React, { useState, useEffect, useCallback } from "react";
import styles from "./BallPuzzle.module.css";
import Button from "../../../components/Button";

// Define the triangular grid size (number of rows)
const GRID_SIZE = 10;

// Define unique ball shapes
const SHAPES = [
  // 5x1 line
  {
    id: 1,
    name: "Line",
    balls: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
    ],
    color: "#e74c3c",
  },
  // T-shape
  {
    id: 2,
    name: "T",
    balls: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
    ],
    color: "#3498db",
  },
  // L-shape
  {
    id: 3,
    name: "L",
    balls: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    color: "#f39c12",
  },
  // Square with corner
  {
    id: 4,
    name: "Square",
    balls: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    color: "#9b59b6",
  },
  // Zigzag
  {
    id: 5,
    name: "Zigzag",
    balls: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    color: "#2ecc71",
  },
  // Cross
  {
    id: 6,
    name: "Cross",
    balls: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    color: "#e67e22",
  },
  // Corner piece
  {
    id: 7,
    name: "Corner",
    balls: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    color: "#1abc9c",
  },
  // Small L
  {
    id: 8,
    name: "Small L",
    balls: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    color: "#34495e",
  },
  // Triangle
  {
    id: 9,
    name: "Triangle",
    balls: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    color: "#e91e63",
  },
  // Snake
  {
    id: 10,
    name: "Snake",
    balls: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    color: "#ff5722",
  },
  // Plus
  {
    id: 11,
    name: "Plus",
    balls: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    color: "#8e44ad",
  },
  // Staircase
  {
    id: 12,
    name: "Staircase",
    balls: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ],
    color: "#16a085",
  },
  // Diamond
  {
    id: 13,
    name: "Diamond",
    balls: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    color: "#d35400",
  },
  // Hook
  {
    id: 14,
    name: "Hook",
    balls: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    color: "#c0392b",
  },
  // Spiral
  {
    id: 15,
    name: "Spiral",
    balls: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
    color: "#27ae60",
  },
];

// Generate triangular grid positions
const generateTriangularGrid = () => {
  const grid = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowPositions = [];
    for (let col = 0; col <= row; col++) {
      rowPositions.push({ row, col, x: col, y: row });
    }
    grid.push(rowPositions);
  }
  return grid;
};

// Helper: Find the top-left (min x, min y) ball in a shape
function getShapeOrigin(balls) {
  const minX = Math.min(...balls.map((b) => b.x));
  const minY = Math.min(...balls.map((b) => b.y));
  return { x: minX, y: minY };
}

const CELL_SIZE = 44; // px, must match .gridCell width+gap

const BallPuzzle = () => {
  const [grid, setGrid] = useState(generateTriangularGrid());
  const [placedShapes, setPlacedShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [moves, setMoves] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);

  // Drag and drop state
  const [draggedShape, setDraggedShape] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragRotation, setDragRotation] = useState(0);
  const [pickedUpShape, setPickedUpShape] = useState(null);
  const [gridHoverPosition, setGridHoverPosition] = useState(null);

  // Get valid rotations for a shape based on triangular grid constraints
  const getValidRotations = useCallback((shape) => {
    const validRotations = [];

    for (let rotation = 0; rotation < 4; rotation++) {
      const rotatedBalls = shape.balls.map((ball) => {
        const { x, y } = ball;
        switch (rotation) {
          case 0:
            return { x, y };
          case 1:
            return { x: -y, y: x };
          case 2:
            return { x: -x, y: -y };
          case 3:
            return { x: y, y: -x };
          default:
            return { x, y };
        }
      });

      // Normalize coordinates
      const minX = Math.min(...rotatedBalls.map((b) => b.x));
      const minY = Math.min(...rotatedBalls.map((b) => b.y));
      const normalizedBalls = rotatedBalls.map((ball) => ({
        x: ball.x - minX,
        y: ball.y - minY,
      }));

      // Check if this rotation can fit in the triangular grid
      let canFit = true;
      for (const ball of normalizedBalls) {
        if (ball.y >= GRID_SIZE || ball.x > ball.y) {
          canFit = false;
          break;
        }
      }

      if (canFit) {
        validRotations.push(rotation);
      }
    }

    return validRotations;
  }, []);

  // Get rotated shape with specific rotation
  const getRotatedShape = useCallback((shape, rotation) => {
    const rotatedBalls = shape.balls.map((ball) => {
      const { x, y } = ball;
      switch (rotation) {
        case 0:
          return { x, y };
        case 1:
          return { x: -y, y: x };
        case 2:
          return { x: -x, y: -y };
        case 3:
          return { x: y, y: -x };
        default:
          return { x, y };
      }
    });

    // Normalize coordinates to start from (0,0)
    const minX = Math.min(...rotatedBalls.map((b) => b.x));
    const minY = Math.min(...rotatedBalls.map((b) => b.y));

    return {
      ...shape,
      balls: rotatedBalls.map((ball) => ({
        ...ball,
        x: ball.x - minX,
        y: ball.y - minY,
      })),
    };
  }, []);

  // Rotate shape to next valid rotation
  const rotateShape = useCallback(
    (shape, currentRotation) => {
      const validRotations = getValidRotations(shape);
      const currentIndex = validRotations.indexOf(currentRotation);
      const nextIndex = (currentIndex + 1) % validRotations.length;
      return validRotations[nextIndex];
    },
    [getValidRotations]
  );

  // Check if a position is valid for placing a shape
  const isValidPosition = useCallback(
    (shape, startRow, startCol, rotation = 0) => {
      const rotatedShape = getRotatedShape(shape, rotation);

      for (const ball of rotatedShape.balls) {
        const targetRow = startRow + ball.y;
        const targetCol = startCol + ball.x;

        // Check if position is within triangular grid
        if (targetRow >= GRID_SIZE || targetCol > targetRow) {
          return false;
        }

        // Check if position is already occupied
        const isOccupied = placedShapes.some((placedShape) =>
          placedShape.balls.some(
            (placedBall) =>
              placedBall.row === targetRow && placedBall.col === targetCol
          )
        );

        if (isOccupied) {
          return false;
        }
      }
      return true;
    },
    [placedShapes, getRotatedShape]
  );

  // Place a shape on the grid
  const placeShape = useCallback(
    (shape, startRow, startCol, rotation = 0) => {
      if (!isValidPosition(shape, startRow, startCol, rotation)) {
        return false;
      }

      const rotatedShape = getRotatedShape(shape, rotation);
      const placedBalls = rotatedShape.balls.map((ball) => ({
        ...ball,
        row: startRow + ball.y,
        col: startCol + ball.x,
        shapeId: shape.id,
        color: shape.color,
      }));

      const newPlacedShape = {
        id: Date.now(),
        shapeId: shape.id,
        balls: placedBalls,
        color: shape.color,
        rotation,
      };

      setPlacedShapes((prev) => [...prev, newPlacedShape]);
      setMoves((prev) => prev + 1);
      return true;
    },
    [isValidPosition, getRotatedShape]
  );

  // Pick up a placed shape
  const pickUpShape = useCallback(
    (shapeId) => {
      const shape = placedShapes.find((s) => s.id === shapeId);
      if (shape) {
        setPickedUpShape(shape);
        setPlacedShapes((prev) => prev.filter((s) => s.id !== shapeId));
        setMoves((prev) => prev + 1);
      }
    },
    [placedShapes]
  );

  // Remove a shape from the grid
  const removeShape = useCallback((shapeId) => {
    setPlacedShapes((prev) => prev.filter((shape) => shape.id !== shapeId));
    setMoves((prev) => prev + 1);
  }, []);

  // Convert screen coordinates to grid coordinates
  const screenToGridCoords = useCallback((screenX, screenY) => {
    const gridElement = document.querySelector(`.${styles.gridContainer}`);
    if (!gridElement) return null;

    const rect = gridElement.getBoundingClientRect();
    const relativeX = screenX - rect.left;
    const relativeY = screenY - rect.top;

    // Calculate grid position based on triangular layout
    // Account for padding and cell spacing
    const cellSize = 44; // 40px cell + 4px gap
    const padding = 20; // Grid container padding

    const adjustedY = relativeY - padding;
    const adjustedX = relativeX - padding;

    const row = Math.round(adjustedY / cellSize);
    const col = Math.round(adjustedX / cellSize);

    // Validate the position is within the triangular grid
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col <= row) {
      console.log("Valid grid position:", {
        row,
        col,
        screen: { x: screenX, y: screenY },
        relative: { x: relativeX, y: relativeY },
      });
      return { row, col };
    }

    console.log("Invalid grid position:", {
      row,
      col,
      screen: { x: screenX, y: screenY },
      relative: { x: relativeX, y: relativeY },
    });
    return null;
  }, []);

  // Check if the puzzle is completed
  const checkCompletion = useCallback(() => {
    const totalPositions = grid.reduce((sum, row) => sum + row.length, 0);
    const filledPositions = placedShapes.reduce(
      (sum, shape) => sum + shape.balls.length,
      0
    );

    if (filledPositions === totalPositions) {
      setGameCompleted(true);
      setShowCompletionScreen(true);
    }
  }, [grid, placedShapes]);

  // Handle grid click
  const handleGridClick = useCallback(
    (row, col) => {
      if (!selectedShape || gameCompleted) return;

      if (placeShape(selectedShape, row, col)) {
        setSelectedShape(null);
      }
    },
    [selectedShape, placeShape, gameCompleted]
  );

  // Handle shape selection
  const handleShapeSelect = useCallback((shape) => {
    setSelectedShape(shape);
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    setPlacedShapes([]);
    setSelectedShape(null);
    setGameCompleted(false);
    setShowCompletionScreen(false);
    setMoves(0);
    setHintUsed(false);
    setDraggedShape(null);
    setPickedUpShape(null);
    setDragRotation(0);
    setGridHoverPosition(null);
    setIsDragging(false);
  }, []);

  // Provide hint
  const provideHint = useCallback(() => {
    if (hintUsed) return;

    // Find an empty position and suggest a shape
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col <= row; col++) {
        const isOccupied = placedShapes.some((placedShape) =>
          placedShape.balls.some((ball) => ball.row === row && ball.col === col)
        );

        if (!isOccupied) {
          // Find a shape that can fit here
          for (const shape of SHAPES) {
            if (isValidPosition(shape, row, col)) {
              setSelectedShape(shape);
              setHintUsed(true);
              return;
            }
          }
        }
      }
    }
  }, [hintUsed, placedShapes, isValidPosition]);

  // Handle keyboard events for rotation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isDragging && (draggedShape || pickedUpShape)) {
        if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          const shape = draggedShape || pickedUpShape;
          const validRotations = getValidRotations(shape);
          const currentIndex = validRotations.indexOf(dragRotation);
          const nextIndex = (currentIndex + 1) % validRotations.length;
          const newRotation = validRotations[nextIndex];
          setDragRotation(newRotation);
          console.log(
            "Rotating shape:",
            shape.name,
            "from",
            dragRotation,
            "to",
            newRotation
          );
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isDragging,
    draggedShape,
    pickedUpShape,
    dragRotation,
    getValidRotations,
  ]);

  // Handle mouse events for rotation
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (isDragging && (draggedShape || pickedUpShape) && e.button === 1) {
        // Middle mouse button
        e.preventDefault();
        const shape = draggedShape || pickedUpShape;
        const validRotations = getValidRotations(shape);
        const currentIndex = validRotations.indexOf(dragRotation);
        const nextIndex = (currentIndex + 1) % validRotations.length;
        const newRotation = validRotations[nextIndex];
        setDragRotation(newRotation);
        console.log(
          "Mouse rotating shape:",
          shape.name,
          "from",
          dragRotation,
          "to",
          newRotation
        );
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [
    isDragging,
    draggedShape,
    pickedUpShape,
    dragRotation,
    getValidRotations,
  ]);

  // Handle mouse move for drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && (draggedShape || pickedUpShape)) {
        setDragPosition({ x: e.clientX, y: e.clientY });

        // Update grid hover position for alignment
        const gridPos = screenToGridCoords(e.clientX, e.clientY);
        if (gridPos) {
          console.log("Mouse move grid pos:", gridPos, "at screen:", {
            x: e.clientX,
            y: e.clientY,
          });
        }
        setGridHoverPosition(gridPos);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        const shapeToPlace = draggedShape || pickedUpShape;
        if (shapeToPlace && gridHoverPosition) {
          const { row, col } = gridHoverPosition;
          const rotatedShape = getRotatedShape(shapeToPlace, dragRotation);
          const origin = getShapeOrigin(rotatedShape.balls);
          // Place so origin lands on (row, col) using corrected offset
          if (
            placeShape(
              shapeToPlace,
              row - origin.y,
              col - origin.x,
              dragRotation
            )
          ) {
            // Successfully placed
          }
        }
        setIsDragging(false);
        setDraggedShape(null);
        setPickedUpShape(null);
        setDragRotation(0);
        setGridHoverPosition(null);
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [
    isDragging,
    draggedShape,
    pickedUpShape,
    dragPosition,
    dragRotation,
    placeShape,
    screenToGridCoords,
    gridHoverPosition,
  ]);

  // Check completion on every move
  useEffect(() => {
    checkCompletion();
  }, [placedShapes, checkCompletion]);

  // Helper: Find which ball in shape is under mouse (palette or grid)
  const getAnchorBall = (shape, mouseX, mouseY, fromGridCell) => {
    if (fromGridCell) {
      // If picking up from grid, anchor is the ball at the clicked cell
      return fromGridCell;
    }
    // If dragging from palette, use the first ball as anchor (or improve with better hit test)
    return shape.balls[0];
  };

  // Render the triangular grid
  const renderGrid = () => {
    return (
      <div className={styles.gridContainer}>
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.gridRow}>
            {row.map(({ row, col, x, y }) => {
              const isOccupied = placedShapes.some((placedShape) =>
                placedShape.balls.some(
                  (ball) => ball.row === row && ball.col === col
                )
              );
              const occupiedShape = placedShapes.find((placedShape) =>
                placedShape.balls.some(
                  (ball) => ball.row === row && ball.col === col
                )
              );
              const isSelected =
                selectedShape &&
                selectedShape.balls.some(
                  (ball) => ball.x === x && ball.y === y
                );

              // Check if this cell is part of the dragged shape preview
              const currentDraggedShape = isDragging
                ? pickedUpShape || draggedShape
                : null;
              const isDraggedShapeCell =
                currentDraggedShape &&
                gridHoverPosition &&
                (() => {
                  const rotatedShape = getRotatedShape(
                    currentDraggedShape,
                    dragRotation
                  );
                  const origin = getShapeOrigin(rotatedShape.balls);
                  return rotatedShape.balls.some(
                    (ball) =>
                      gridHoverPosition.row - (ball.y - origin.y) === row &&
                      gridHoverPosition.col - (ball.x - origin.x) === col
                  );
                })();

              return (
                <div
                  key={`${row}-${col}`}
                  className={`${styles.gridCell} ${
                    isOccupied ? styles.occupied : styles.empty
                  } ${isSelected ? styles.selected : ""} ${
                    isDraggedShapeCell ? styles.draggedShapeCell : ""
                  }`}
                  onClick={() => handleGridClick(row, col)}
                  onMouseDown={(e) => {
                    if (isOccupied && occupiedShape) {
                      pickUpShape(occupiedShape.id);
                      setIsDragging(true);
                      setDragPosition({ x: e.clientX, y: e.clientY });
                      setDragRotation(occupiedShape.rotation || 0);
                      const initialGridPos = screenToGridCoords(
                        e.clientX,
                        e.clientY
                      );
                      setGridHoverPosition(initialGridPos);
                    }
                  }}
                  style={{
                    backgroundColor: isOccupied
                      ? occupiedShape?.color
                      : isDraggedShapeCell
                        ? currentDraggedShape?.color + "80" // Add transparency
                        : "transparent",
                  }}
                >
                  {isOccupied && <div className={styles.ball} />}
                  {isSelected && <div className={styles.preview} />}
                  {isDraggedShapeCell && !isOccupied && (
                    <div className={styles.draggedShapePreview} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Handle shape drag start
  const handleShapeDragStart = useCallback(
    (e, shape) => {
      const usedShapeIds = new Set(placedShapes.map((shape) => shape.shapeId));
      if (usedShapeIds.has(shape.id)) return;
      e.preventDefault();
      setDraggedShape(shape);
      setIsDragging(true);
      setDragPosition({ x: e.clientX, y: e.clientY });
      setDragRotation(0);
      const initialGridPos = screenToGridCoords(e.clientX, e.clientY);
      setGridHoverPosition(initialGridPos);
    },
    [placedShapes, screenToGridCoords]
  );

  // Render available shapes
  const renderShapes = () => {
    const usedShapeIds = new Set(placedShapes.map((shape) => shape.shapeId));

    return (
      <div className={styles.shapesContainer}>
        <h3>Available Shapes</h3>
        <div className={styles.shapesGrid}>
          {SHAPES.map((shape) => {
            const isUsed = usedShapeIds.has(shape.id);
            const isSelected = selectedShape?.id === shape.id;

            return (
              <div
                key={shape.id}
                className={`${styles.shapeItem} ${
                  isUsed ? styles.used : ""
                } ${isSelected ? styles.selected : ""}`}
                onClick={() => !isUsed && handleShapeSelect(shape)}
                onMouseDown={(e) => !isUsed && handleShapeDragStart(e, shape)}
                draggable={!isUsed}
              >
                <div className={styles.shapePreview}>
                  {shape.balls.map((ball, index) => (
                    <div
                      key={index}
                      className={styles.shapeBall}
                      style={{
                        left: `${ball.x * 16 + 8}px`,
                        top: `${ball.y * 16 + 8}px`,
                        backgroundColor: shape.color,
                      }}
                    />
                  ))}
                </div>
                <span className={styles.shapeName}>{shape.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render placed shapes (for removal)
  const renderPlacedShapes = () => {
    return (
      <div className={styles.placedShapesContainer}>
        <h3>Placed Shapes</h3>
        <div className={styles.placedShapesList}>
          {placedShapes.map((shape) => (
            <div
              key={shape.id}
              className={styles.placedShapeItem}
              onClick={() => removeShape(shape.id)}
            >
              <div className={styles.placedShapePreview}>
                {shape.balls.map((ball, index) => (
                  <div
                    key={index}
                    className={styles.placedShapeBall}
                    style={{
                      backgroundColor: shape.color,
                      left: `${(ball.x - Math.min(...shape.balls.map((b) => b.x))) * 8 + 4}px`,
                      top: `${(ball.y - Math.min(...shape.balls.map((b) => b.y))) * 8 + 4}px`,
                    }}
                  />
                ))}
              </div>
              <span>Click to remove</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render completion screen
  const renderCompletionScreen = () => {
    return (
      <div className={styles.completionOverlay}>
        <div className={styles.completionModal}>
          <h2>Puzzle Completed!</h2>
          <p>
            Congratulations! You've successfully filled the triangular grid.
          </p>
          <p>Moves made: {moves}</p>
          <div className={styles.completionButtons}>
            <Button onClick={resetGame} variant="primary">
              Play Again
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Ball Puzzle</h1>
        <p>Fill the triangular grid with all the unique ball shapes!</p>
        <div className={styles.stats}>
          <span>Moves: {moves}</span>
          <span>Shapes placed: {placedShapes.length}</span>
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.gridSection}>
          <h3>Triangular Grid</h3>
          {renderGrid()}
        </div>

        <div className={styles.controlsSection}>
          {renderShapes()}
          {placedShapes.length > 0 && renderPlacedShapes()}

          <div className={styles.controls}>
            <Button onClick={resetGame} variant="secondary" size="small">
              Reset Game
            </Button>
            <Button
              onClick={provideHint}
              variant="primary"
              size="small"
              disabled={hintUsed}
            >
              {hintUsed ? "Hint Used" : "Get Hint"}
            </Button>
          </div>
        </div>
      </div>

      {showCompletionScreen && renderCompletionScreen()}
    </div>
  );
};

export default BallPuzzle;
