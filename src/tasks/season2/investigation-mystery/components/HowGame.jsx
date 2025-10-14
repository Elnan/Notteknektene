import React, { useState, useEffect, useCallback, useRef } from "react";
import styles from "./HowGame.module.css";
import Button from "../../../../components/Button";
import { MYSTERY_DATA } from "../gameData.js";
import Modal from "../../../../components/Modal";
import modalStyles from "../../../../components/Modal.module.css";

const HowGame = ({ onComplete, onBack, onHint, savedGameState }) => {
  // ===== STATE MANAGEMENT =====
  const [currentLevel, setCurrentLevel] = useState(0);
  const [grid, setGrid] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const currentPathRef = useRef([]);
  const [completed, setCompleted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [completedGrid, setCompletedGrid] = useState(null); // <-- NEW
  const [victoryStage, setVictoryStage] = useState("none"); // <-- NEW: victory animation state
  const [pendingVictory, setPendingVictory] = useState(false); // <-- NEW: track pending victory
  const [moves, setMoves] = useState(0);
  const [dotConnections, setDotConnections] = useState(new Map());
  const [history, setHistory] = useState([]); // <-- Add history state
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [flowsUsed, setFlowsUsed] = useState(0);

  // ===== GAME DATA =====
  const currentPuzzle = MYSTERY_DATA.how.levels[currentLevel];
  const gameSettings = MYSTERY_DATA.how.settings;

  // Track game start time
  useEffect(() => {
    setGameStartTime(Date.now());
  }, []);

  // Calculate time spent on this mini-game
  const getTimeSpent = () => {
    return gameStartTime ? Date.now() - gameStartTime : 0;
  };

  // Helper to calculate points for this game
  const getPoints = () => {
    const basePoints = 2;
    return Math.max(0, basePoints - (hintUsed ? 1 : 0));
  };

  // Complete the mini-game with detailed data
  const completeGame = useCallback(() => {
    if (gameCompleted) {
      console.log("🎯 HowGame already completed, skipping...");
      return;
    }

    console.log("🎯 HowGame completeGame() called");
    const timeSpent = getTimeSpent();
    const points = getPoints();

    const gameData = {
      points: points,
      hintUsed: hintUsed ? 1 : 0,
      timeSpent: timeSpent,
      flowsUsed: flowsUsed,
      completed: completed,
      // Include complete game state for save/load
      gameState: {
        currentLevel,
        grid,
        dotConnections: Array.from(dotConnections.entries()),
        history,
        moves,
        completedGrid,
        victoryStage,
        pendingVictory,
        isDrawing,
        currentColor,
        currentPath,
      },
    };

    console.log("🎯 HowGame calling onComplete with data:", gameData);
    setGameCompleted(true);
    onComplete("how", gameData);
  }, [
    hintUsed,
    flowsUsed,
    completed,
    onComplete,
    gameCompleted,
    currentLevel,
    grid,
    dotConnections,
    history,
    moves,
    completedGrid,
    victoryStage,
    pendingVictory,
    isDrawing,
    currentColor,
    currentPath,
  ]);

  // Whenever you update currentPath, also update the ref
  const setCurrentPathAndRef = (newPath) => {
    setCurrentPath(newPath);
    currentPathRef.current = newPath;
  };

  // ===== INITIALIZATION =====
  useEffect(() => {
    initializeGrid();
  }, [currentLevel]);

  // ===== RESTORE SAVED STATE =====
  useEffect(() => {
    if (savedGameState && savedGameState.gameState) {
      console.log(
        "🔄 Restoring HowGame saved state:",
        savedGameState.gameState
      );
      const { gameState } = savedGameState;

      // Restore game state
      if (gameState.currentLevel !== undefined)
        setCurrentLevel(gameState.currentLevel);
      if (gameState.grid) {
        // Handle both 2D array and flattened array
        if (Array.isArray(gameState.grid) && gameState.grid.length > 0) {
          if (Array.isArray(gameState.grid[0])) {
            // Regular 2D array
            setGrid(gameState.grid);
          } else if (
            typeof gameState.grid[0] === "object" &&
            gameState.grid[0].hasOwnProperty("row")
          ) {
            // Flattened array - reconstruct 2D grid
            const maxRow = Math.max(...gameState.grid.map((item) => item.row));
            const maxCol = Math.max(...gameState.grid.map((item) => item.col));
            const reconstructedGrid = Array(maxRow + 1)
              .fill()
              .map(() => Array(maxCol + 1).fill(null));

            gameState.grid.forEach((item) => {
              if (item.row !== undefined && item.col !== undefined) {
                reconstructedGrid[item.row][item.col] = item.value;
              }
            });

            setGrid(reconstructedGrid);
          }
        }
      }
      if (gameState.dotConnections) {
        // Handle both Map entries array and regular array
        if (
          Array.isArray(gameState.dotConnections) &&
          gameState.dotConnections.length > 0 &&
          Array.isArray(gameState.dotConnections[0])
        ) {
          setDotConnections(new Map(gameState.dotConnections));
        } else {
          setDotConnections(new Map());
        }
      }
      if (gameState.history) setHistory(gameState.history);
      if (gameState.moves !== undefined) setMoves(gameState.moves);
      if (gameState.completedGrid) setCompletedGrid(gameState.completedGrid);
      if (gameState.victoryStage) setVictoryStage(gameState.victoryStage);
      if (gameState.pendingVictory !== undefined)
        setPendingVictory(gameState.pendingVictory);
      if (gameState.isDrawing !== undefined) setIsDrawing(gameState.isDrawing);
      if (gameState.currentColor) setCurrentColor(gameState.currentColor);
      if (gameState.currentPath) {
        setCurrentPath(gameState.currentPath);
        currentPathRef.current = gameState.currentPath;
      }

      // If game was completed, mark it as such
      if (savedGameState.completed) {
        setCompleted(true);
        setGameCompleted(true);
      }
    }
  }, [savedGameState]);

  const initializeGrid = () => {
    const size = currentPuzzle.size;
    const newGrid = Array(size)
      .fill()
      .map(() => Array(size).fill(null));

    // Place dots
    currentPuzzle.dots.forEach((dot) => {
      const [startRow, startCol] = dot.start;
      const [endRow, endCol] = dot.end;
      newGrid[startRow][startCol] = {
        type: "dot",
        color: dot.color,
        isStart: true,
      };
      newGrid[endRow][endCol] = { type: "dot", color: dot.color, isEnd: true };
    });

    setGrid(newGrid);
    setCompleted(false);
    setIsDrawing(false);
    setCurrentPath([]);
    setCurrentColor(null);
    setMoves(0);
    setDotConnections(new Map());
    setHistory([]);
    setVictoryStage("none"); // <-- NEW: reset victory stage
    setPendingVictory(false); // <-- NEW: reset pending victory
  };

  // ===== PATHFINDING UTILITIES =====
  const findPathBetweenDots = (startRow, startCol, endRow, endCol, color) => {
    const visited = new Set();
    const queue = [{ row: startRow, col: startCol }];

    while (queue.length > 0) {
      const { row, col } = queue.shift();
      const key = `${row},${col}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (row === endRow && col === endCol) return true;

      const directions = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
      ];

      directions.forEach(({ row: adjRow, col: adjCol }) => {
        if (
          adjRow >= 0 &&
          adjRow < grid.length &&
          adjCol >= 0 &&
          adjCol < grid[0].length
        ) {
          const adjCell = grid[adjRow][adjCol];
          if (
            adjCell &&
            (adjCell.type === "dot" ||
              adjCell.type === "path" ||
              adjCell.type === "gate") &&
            (adjCell.color === color ||
              (adjCell.colors && adjCell.colors.includes(color)))
          ) {
            queue.push({ row: adjRow, col: adjCol });
          }
        }
      });
    }

    return false;
  };

  const areDotsConnected = (color) => {
    const colorDots = currentPuzzle.dots.find((dot) => dot.color === color);
    if (!colorDots) return false;

    const [startRow, startCol] = colorDots.start;
    const [endRow, endCol] = colorDots.end;

    return findPathBetweenDots(startRow, startCol, endRow, endCol, color);
  };

  // ===== COMPLETION CHECKING =====
  const checkCompletion = useCallback(() => {
    if (!grid || !Array.isArray(grid) || grid.length === 0) return;
    if (!currentPuzzle || !currentPuzzle.dots) return;

    const allDotsConnected = currentPuzzle.dots.every((dot) => {
      const [startRow, startCol] = dot.start;
      const [endRow, endCol] = dot.end;
      return findPathBetweenDots(startRow, startCol, endRow, endCol, dot.color);
    });

    if (
      allDotsConnected &&
      victoryStage === "none" &&
      !gameCompleted &&
      !pendingVictory
    ) {
      // Set pending victory instead of immediately starting animation
      setPendingVictory(true);
    }
  }, [grid, currentPuzzle, victoryStage, gameCompleted, pendingVictory]);

  // Fallback: Check for completion on mouse up if not already pending
  const checkCompletionOnMouseUp = useCallback(() => {
    if (!grid || !Array.isArray(grid) || grid.length === 0) return false;
    if (!currentPuzzle || !currentPuzzle.dots) return false;

    const allDotsConnected = currentPuzzle.dots.every((dot) => {
      const [startRow, startCol] = dot.start;
      const [endRow, endCol] = dot.end;
      return findPathBetweenDots(startRow, startCol, endRow, endCol, dot.color);
    });

    return (
      allDotsConnected &&
      !pendingVictory &&
      victoryStage === "none" &&
      !gameCompleted
    );
  }, [grid, currentPuzzle, pendingVictory, victoryStage, gameCompleted]);

  // Start victory animation when mouse is released and victory is pending
  const startVictoryAnimation = useCallback(() => {
    if (pendingVictory && victoryStage === "none" && !gameCompleted) {
      // Add delay before starting animation
      setTimeout(() => {
        setCompletedGrid(JSON.parse(JSON.stringify(grid)));
        setVictoryStage("zoomIn");

        // Animation sequence timing
        setTimeout(() => {
          setVictoryStage("flipping");
          setTimeout(() => {
            setVictoryStage("pause");
            setTimeout(() => {
              setVictoryStage("zoomOut");
              setTimeout(() => {
                setVictoryStage("completed");
                setCompleted(true);
                setPendingVictory(false);
              }, 800); // Zoom out duration
            }, 600); // Pause duration
          }, 1800); // Flip animation duration
        }, 500); // Zoom in duration
      }, 900); // Delay before starting animation
    }
  }, [pendingVictory, victoryStage, gameCompleted, grid]);

  // Trigger victory animation when pendingVictory becomes true
  useEffect(() => {
    if (pendingVictory && victoryStage === "none" && !gameCompleted) {
      startVictoryAnimation();
    }
  }, [pendingVictory, victoryStage, gameCompleted, startVictoryAnimation]);

  useEffect(() => {
    checkCompletion();
  }, [checkCompletion]);

  // Auto-complete when game is finished
  useEffect(() => {
    console.log(
      `🔍 How game completion check: completed=${completed}, gameCompleted=${gameCompleted}`
    );
    if (completed && !gameCompleted) {
      console.log("✅ How game completed! Calling completeGame()");
      completeGame();
    }
  }, [completed, gameCompleted, completeGame]);

  // ===== PATH MANAGEMENT =====
  const resetColorPath = (color) => {
    pushHistory();
    const newGrid = [...grid];

    for (let row = 0; row < newGrid.length; row++) {
      for (let col = 0; col < newGrid[row].length; col++) {
        const cell = newGrid[row][col];
        if (
          cell &&
          cell.type === "path" &&
          (cell.color === color || (cell.colors && cell.colors.includes(color)))
        ) {
          const isGatePosition =
            currentPuzzle.gates?.some(
              ([gateRow, gateCol]) => gateRow === row && gateCol === col
            ) || false;

          if (cell.colors && cell.colors.length > 1) {
            const newColors = cell.colors.filter((c) => c !== color);
            if (newColors.length === 1) {
              newGrid[row][col] = {
                type: isGatePosition ? "gate" : "path",
                color: newColors[0],
              };
            } else {
              newGrid[row][col] = {
                ...cell,
                colors: newColors,
                color: newColors[0],
              };
            }
          } else {
            if (isGatePosition) {
              newGrid[row][col] = { type: "gate" };
            } else {
              newGrid[row][col] = null;
            }
          }
        }
      }
    }

    setGrid(newGrid);

    const newConnections = new Map(dotConnections);
    const colorDots = currentPuzzle.dots.find((dot) => dot.color === color);
    if (colorDots) {
      const [startRow, startCol] = colorDots.start;
      const [endRow, endCol] = colorDots.end;
      newConnections.delete(`${startRow},${startCol}`);
      newConnections.delete(`${endRow},${endCol}`);
      setDotConnections(newConnections);
    }
  };

  const breakPathAtPoint = (color, clickRow, clickCol) => {
    pushHistory();
    const colorDots = currentPuzzle.dots.find((dot) => dot.color === color);
    if (!colorDots) return null;

    const [startRow, startCol] = colorDots.start;
    const [endRow, endCol] = colorDots.end;

    const findAllConnectedCells = (dotRow, dotCol) => {
      const visited = new Set();
      const connected = new Set();
      const queue = [{ row: dotRow, col: dotCol }];

      while (queue.length > 0) {
        const { row, col } = queue.shift();
        const key = `${row},${col}`;

        if (visited.has(key)) continue;
        visited.add(key);
        connected.add(key);

        const directions = [
          { row: row - 1, col },
          { row: row + 1, col },
          { row, col: col - 1 },
          { row, col: col + 1 },
        ];

        directions.forEach(({ row: adjRow, col: adjCol }) => {
          if (
            adjRow >= 0 &&
            adjRow < grid.length &&
            adjCol >= 0 &&
            adjCol < grid[0].length
          ) {
            const adjCell = grid[adjRow][adjCol];
            if (
              adjCell &&
              (adjCell.type === "dot" ||
                adjCell.type === "path" ||
                adjCell.type === "gate" ||
                adjCell.type === "bridge") &&
              (adjCell.color === color ||
                (adjCell.colors && adjCell.colors.includes(color))) &&
              !visited.has(`${adjRow},${adjCol}`)
            ) {
              queue.push({ row: adjRow, col: adjCol });
            }
          }
        });
      }

      return connected;
    };

    const startDotConnected = findAllConnectedCells(startRow, startCol);
    const endDotConnected = findAllConnectedCells(endRow, endCol);
    const allValidCells = new Set([...startDotConnected, ...endDotConnected]);

    const newGrid = [...grid];
    for (let row = 0; row < newGrid.length; row++) {
      for (let col = 0; col < newGrid[row].length; col++) {
        const cell = newGrid[row][col];
        if (
          cell &&
          (cell.type === "path" ||
            cell.type === "gate" ||
            cell.type === "bridge") &&
          (cell.color === color || (cell.colors && cell.colors.includes(color)))
        ) {
          const cellKey = `${row},${col}`;
          if (!allValidCells.has(cellKey)) {
            const isGatePosition =
              currentPuzzle.gates?.some(
                ([gateRow, gateCol]) => gateRow === row && gateCol === col
              ) || false;

            if (cell.type === "bridge" && cell.colors) {
              const newColors = cell.colors.filter((c) => c !== color);
              if (newColors.length > 1) {
                newGrid[row][col] = {
                  ...cell,
                  colors: newColors,
                  color: newColors[0],
                };
              } else if (newColors.length === 1) {
                newGrid[row][col] = { type: "gate", color: newColors[0] };
              } else {
                newGrid[row][col] = isGatePosition ? { type: "gate" } : null;
              }
            } else {
              newGrid[row][col] = isGatePosition ? { type: "gate" } : null;
            }
          }
        }
      }
    }

    setGrid(newGrid);
  };

  const truncatePathAtPoint = (color, clickRow, clickCol) => {
    pushHistory();
    const colorDots = currentPuzzle.dots.find((dot) => dot.color === color);
    if (!colorDots) return null;

    const [startRow, startCol] = colorDots.start;
    const [endRow, endCol] = colorDots.end;

    const findShortestPathToDot = (dotRow, dotCol) => {
      const visited = new Set();
      const queue = [
        { row: dotRow, col: dotCol, path: [{ row: dotRow, col: dotCol }] },
      ];

      while (queue.length > 0) {
        const { row, col, path } = queue.shift();
        const key = `${row},${col}`;

        if (visited.has(key)) continue;
        visited.add(key);

        if (row === clickRow && col === clickCol) {
          return path;
        }

        const directions = [
          { row: row - 1, col },
          { row: row + 1, col },
          { row, col: col - 1 },
          { row, col: col + 1 },
        ];

        directions.forEach(({ row: adjRow, col: adjCol }) => {
          if (
            adjRow >= 0 &&
            adjRow < grid.length &&
            adjCol >= 0 &&
            adjCol < grid[0].length
          ) {
            const adjCell = grid[adjRow][adjCol];
            if (
              adjCell &&
              (adjCell.type === "dot" ||
                adjCell.type === "path" ||
                adjCell.type === "gate" ||
                adjCell.type === "bridge") &&
              (adjCell.color === color ||
                (adjCell.colors && adjCell.colors.includes(color))) &&
              !visited.has(`${adjRow},${adjCol}`)
            ) {
              queue.push({
                row: adjRow,
                col: adjCol,
                path: [...path, { row: adjRow, col: adjCol }],
              });
            }
          }
        });
      }

      return null;
    };

    let pathToKeep = findShortestPathToDot(startRow, startCol);
    if (!pathToKeep) {
      pathToKeep = findShortestPathToDot(endRow, endCol);
    }

    if (!pathToKeep) return null;

    const positionsToKeep = new Set(
      pathToKeep.map((pos) => `${pos.row},${pos.col}`)
    );

    const newGrid = [...grid];
    let removedCells = [];

    for (let row = 0; row < newGrid.length; row++) {
      for (let col = 0; col < newGrid[row].length; col++) {
        const cell = newGrid[row][col];
        if (
          cell &&
          (cell.type === "path" ||
            cell.type === "gate" ||
            cell.type === "bridge") &&
          (cell.color === color || (cell.colors && cell.colors.includes(color)))
        ) {
          const cellKey = `${row},${col}`;
          if (!positionsToKeep.has(cellKey)) {
            removedCells.push(`(${row},${col})`);
            const isGatePosition =
              currentPuzzle.gates?.some(
                ([gateRow, gateCol]) => gateRow === row && gateCol === col
              ) || false;

            if (cell.type === "bridge" && cell.colors) {
              const newColors = cell.colors.filter((c) => c !== color);
              if (newColors.length > 1) {
                newGrid[row][col] = {
                  ...cell,
                  colors: newColors,
                  color: newColors[0],
                };
              } else if (newColors.length === 1) {
                newGrid[row][col] = { type: "gate", color: newColors[0] };
              } else {
                newGrid[row][col] = isGatePosition ? { type: "gate" } : null;
              }
            } else {
              newGrid[row][col] = isGatePosition ? { type: "gate" } : null;
            }
          }
        }
      }
    }

    return newGrid;
  };

  // ===== EVENT HANDLERS SETUP =====
  useEffect(() => {
    const handleGlobalTouchMove = (e) => {
      if (isDrawing) {
        e.preventDefault();
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.dataset.row && element.dataset.col) {
          const row = parseInt(element.dataset.row);
          const col = parseInt(element.dataset.col);
          handleMouseEnter(row, col);
        }
      }
    };

    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    const handleDrag = (e) => {
      e.preventDefault();
      return false;
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("touchmove", handleGlobalTouchMove, {
      passive: false,
    });
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("drag", handleDrag);
    document.addEventListener("dragover", handleDragOver);

    return () => {
      document.removeEventListener("touchmove", handleGlobalTouchMove);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("drag", handleDrag);
      document.removeEventListener("dragover", handleDragOver);
    };
  }, [isDrawing]);

  // ===== PATH MANIPULATION UTILITIES =====
  const findDistanceToDot = (row, col, color, gridToCheck) => {
    const dots = [];
    for (let r = 0; r < gridToCheck.length; r++) {
      for (let c = 0; c < gridToCheck[r].length; c++) {
        const cell = gridToCheck[r][c];
        if (cell && cell.type === "dot" && cell.color === color) {
          dots.push({ row: r, col: c });
        }
      }
    }

    let minDistance = Infinity;
    for (const dot of dots) {
      const distance = Math.abs(row - dot.row) + Math.abs(col - dot.col);
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  };

  const cleanupBrokenPaths = (gridToClean, newColor) => {
    const pathSegments = new Map();

    for (let r = 0; r < gridToClean.length; r++) {
      for (let c = 0; c < gridToClean[r].length; c++) {
        const cell = gridToClean[r][c];
        if (cell && cell.type === "path" && cell.color !== newColor) {
          const color = cell.color;

          if (!pathSegments.has(color)) {
            pathSegments.set(color, []);
          }

          let foundSegment = false;
          for (const segment of pathSegments.get(color)) {
            if (segment.some((pos) => pos.row === r && pos.col === c)) {
              foundSegment = true;
              break;
            }
          }

          if (!foundSegment) {
            const segment = [];
            const visited = new Set();
            const stack = [{ row: r, col: c }];

            while (stack.length > 0) {
              const { row, col } = stack.pop();
              const key = `${row},${col}`;

              if (visited.has(key)) continue;
              visited.add(key);

              const currentCell = gridToClean[row][col];
              if (
                currentCell &&
                currentCell.type === "path" &&
                currentCell.color === color
              ) {
                segment.push({ row, col });

                const adjacent = [
                  { row: row - 1, col },
                  { row: row + 1, col },
                  { row, col: col - 1 },
                  { row, col: col + 1 },
                ];

                for (const { row: adjRow, col: adjCol } of adjacent) {
                  if (
                    adjRow >= 0 &&
                    adjRow < gridToClean.length &&
                    adjCol >= 0 &&
                    adjCol < gridToClean[0].length
                  ) {
                    const adjKey = `${adjRow},${adjCol}`;
                    if (!visited.has(adjKey)) {
                      stack.push({ row: adjRow, col: adjCol });
                    }
                  }
                }
              }
            }

            if (segment.length > 0) {
              pathSegments.get(color).push(segment);
            }
          }
        }
      }
    }

    pathSegments.forEach((segments, color) => {
      if (segments.length > 1) {
        let bestSegment = null;
        let bestDistance = Infinity;

        for (const segment of segments) {
          let segmentMinDistance = Infinity;
          for (const { row, col } of segment) {
            const distance = findDistanceToDot(row, col, color, gridToClean);
            segmentMinDistance = Math.min(segmentMinDistance, distance);
          }

          if (segmentMinDistance < bestDistance) {
            bestDistance = segmentMinDistance;
            bestSegment = segment;
          }
        }

        for (const segment of segments) {
          if (segment !== bestSegment) {
            for (const { row, col } of segment) {
              gridToClean[row][col] = null;
            }
          }
        }
      }
    });

    return gridToClean;
  };

  // ===== INTERACTION HANDLERS =====
  const isPathEnd = (row, col, color) => {
    if (!grid || !Array.isArray(grid) || grid.length === 0) return false;

    // Count adjacent cells with the same color path or dot
    let adjacentCount = 0;
    const directions = [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ];

    directions.forEach(({ row: adjRow, col: adjCol }) => {
      if (
        adjRow >= 0 &&
        adjRow < grid.length &&
        adjCol >= 0 &&
        adjCol < grid[0].length
      ) {
        const adjCell = grid[adjRow][adjCol];
        if (
          adjCell &&
          ((adjCell.type === "path" &&
            (adjCell.color === color ||
              (adjCell.colors && adjCell.colors.includes(color)))) ||
            (adjCell.type === "dot" && adjCell.color === color))
        ) {
          adjacentCount++;
        }
      }
    });

    // A path end has exactly 1 adjacent cell (either a dot or another path)
    return adjacentCount === 1;
  };

  const handleMouseDown = (row, col) => {
    pushHistory();
    const cell = grid[row][col];

    if (cell && cell.type === "dot") {
      resetColorPath(cell.color);
      setIsDrawing(true);
      setCurrentColor(cell.color);
      setCurrentPath([{ row, col }]);
      setMoves((prev) => prev + 1);
      setFlowsUsed((prev) => prev + 1);
    } else if (cell && cell.type === "path") {
      const colorToUse = cell.color || (cell.colors && cell.colors[0]);

      if (isPathEnd(row, col, colorToUse)) {
        // Clicking at path end - continue from this point
        setIsDrawing(true);
        setCurrentColor(colorToUse);
        setCurrentPath([{ row, col }]); // Start fresh from this point
        setMoves((prev) => prev + 1);
      } else {
        // Clicking in middle of path - truncate from this point
        const newGrid = truncatePathAtPoint(colorToUse, row, col);
        if (newGrid) {
          setGrid(newGrid);
          setIsDrawing(true);
          setCurrentColor(colorToUse);
          const initialPath = [{ row, col }];
          setCurrentPath(initialPath);
          updateGridWithPath(initialPath, newGrid);
          setMoves((prev) => prev + 1);
        }
      }
    } else if (
      cell &&
      cell.type === "path" &&
      cell.colors &&
      cell.colors.length > 1
    ) {
      const colorToUse = cell.color || cell.colors[0];

      if (isPathEnd(row, col, colorToUse)) {
        // Clicking at path end - continue from this point
        setIsDrawing(true);
        setCurrentColor(colorToUse);
        setCurrentPath([{ row, col }]); // Start fresh from this point
        setMoves((prev) => prev + 1);
      } else {
        // Clicking in middle of path - truncate from this point
        const newGrid = truncatePathAtPoint(colorToUse, row, col);
        if (newGrid) {
          setGrid(newGrid);
          setIsDrawing(true);
          setCurrentColor(colorToUse);
          const initialPath = [{ row, col }];
          setCurrentPath(initialPath);
          updateGridWithPath(initialPath, newGrid);
          setMoves((prev) => prev + 1);
          setFlowsUsed((prev) => prev + 1);
        }
      }
    }
  };

  const handleMouseEnter = (row, col) => {
    if (!isDrawing || !currentColor) return;
    const cell = grid[row][col];

    // Check if going backwards
    if (currentPath.length > 1) {
      const prevPos = currentPath[currentPath.length - 2];
      if (prevPos.row === row && prevPos.col === col) {
        const newPath = currentPath.slice(0, -1);
        setCurrentPathAndRef(newPath);

        const cellToRemove = currentPath[currentPath.length - 1];
        const newGrid = [...grid];
        const cellToRemoveData = newGrid[cellToRemove.row][cellToRemove.col];

        if (
          cellToRemoveData &&
          cellToRemoveData.type !== "dot" &&
          (cellToRemoveData.color === currentColor ||
            (cellToRemoveData.colors &&
              cellToRemoveData.colors.includes(currentColor)))
        ) {
          const isGatePosition =
            currentPuzzle.gates?.some(
              ([gateRow, gateCol]) =>
                gateRow === cellToRemove.row && gateCol === cellToRemove.col
            ) || false;

          if (cellToRemoveData.colors && cellToRemoveData.colors.length > 1) {
            const newColors = cellToRemoveData.colors.filter(
              (c) => c !== currentColor
            );
            if (newColors.length === 1) {
              newGrid[cellToRemove.row][cellToRemove.col] = {
                type: isGatePosition ? "gate" : "path",
                color: newColors[0],
              };
            } else {
              newGrid[cellToRemove.row][cellToRemove.col] = {
                ...cellToRemoveData,
                colors: newColors,
                color: newColors[0],
              };
            }
          } else {
            newGrid[cellToRemove.row][cellToRemove.col] = isGatePosition
              ? { type: "gate" }
              : null;
          }
        }

        setGrid(newGrid);
        updateGridWithPath(newPath, newGrid);
        return;
      }
    }

    // Check if cell is already in current path
    const isAlreadyInPath = currentPath.some(
      (p) => p.row === row && p.col === col
    );
    if (isAlreadyInPath) return;

    // Check adjacency
    const lastPos = currentPath[currentPath.length - 1];
    if (lastPos) {
      const isAdjacent =
        Math.abs(row - lastPos.row) + Math.abs(col - lastPos.col) === 1;
      if (!isAdjacent) return;
    }

    // Block paths from going through any dots (except target dots to complete the path)
    if (cell && cell.type === "dot") {
      // Only allow moving to dots of the same color to complete the path
      if (cell.color !== currentColor) {
        return;
      }
      // If it's a same-color dot, we'll handle it separately below
    }

    // Block self-collision with existing same-color paths (unless it's part of current path)
    if (
      cell &&
      (cell.type === "path" || cell.type === "gate") &&
      (cell.color === currentColor ||
        (cell.colors && cell.colors.includes(currentColor)))
    ) {
      // Allow if this cell is part of the current path we're building from
      const isInCurrentPath = currentPath.some(
        (p) => p.row === row && p.col === col
      );
      if (!isInCurrentPath) {
        return;
      }
    }

    // Handle collision with existing path of different color
    if (cell && cell.type === "path" && cell.color !== currentColor) {
      pushHistory(); // Save state before destructive action
      removePathFromCell(cell.color, row, col);
    }

    // Allow moving to end dots of the same color to complete the path
    if (cell && cell.type === "dot" && cell.color === currentColor) {
      const newPath = [...currentPath, { row, col }];
      setCurrentPathAndRef(newPath);
      updateGridWithPath(newPath);
      // End drawing after connecting to the dot
      setIsDrawing(false);
      setCurrentColor(null);
      setCurrentPath([]);
      return;
    }

    const newPath = [...currentPath, { row, col }];
    setCurrentPathAndRef(newPath);
    updateGridWithPath(newPath);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCurrentColor(null);
    setCurrentPath([]);

    // Check if we should trigger victory (fallback mechanism)
    if (checkCompletionOnMouseUp()) {
      setPendingVictory(true);
    }

    // Victory animation will be triggered by useEffect when pendingVictory changes
  };

  const removePathFromCell = (color, fromRow, fromCol) => {
    pushHistory();
    const newGrid = [...grid];

    for (let row = 0; row < newGrid.length; row++) {
      for (let col = 0; col < newGrid[row].length; col++) {
        const cell = newGrid[row][col];
        if (cell && cell.type === "path" && cell.color === color) {
          const hasConnectionToDot = checkConnectionToDot(
            row,
            col,
            color,
            newGrid
          );
          if (!hasConnectionToDot) {
            const isGatePosition =
              currentPuzzle.gates?.some(
                ([gateRow, gateCol]) => gateRow === row && gateCol === col
              ) || false;

            if (isGatePosition) {
              newGrid[row][col] = { type: "gate" };
            } else {
              newGrid[row][col] = null;
            }
          }
        }
      }
    }

    setGrid(newGrid);
  };

  const checkConnectionToDot = (row, col, color, gridToCheck) => {
    const colorDots = currentPuzzle.dots.find((dot) => dot.color === color);
    if (!colorDots) return false;

    const [startRow, startCol] = colorDots.start;
    const [endRow, endCol] = colorDots.end;

    const visited = new Set();
    const queue = [{ row, col }];

    while (queue.length > 0) {
      const { row: currentRow, col: currentCol } = queue.shift();
      const key = `${currentRow},${currentCol}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (
        (currentRow === startRow && currentCol === startCol) ||
        (currentRow === endRow && currentCol === endCol)
      ) {
        return true;
      }

      const directions = [
        { row: currentRow - 1, col: currentCol },
        { row: currentRow + 1, col: currentCol },
        { row: currentRow, col: currentCol - 1 },
        { row: currentRow, col: currentCol + 1 },
      ];

      directions.forEach(({ row: adjRow, col: adjCol }) => {
        if (
          adjRow >= 0 &&
          adjRow < gridToCheck.length &&
          adjCol >= 0 &&
          adjCol < gridToCheck[0].length
        ) {
          const adjCell = gridToCheck[adjRow][adjCol];
          if (
            adjCell &&
            (adjCell.type === "dot" ||
              adjCell.type === "path" ||
              adjCell.type === "gate" ||
              adjCell.type === "bridge") &&
            (adjCell.color === color ||
              (adjCell.colors && adjCell.colors.includes(color)))
          ) {
            queue.push({ row: adjRow, col: adjCol });
          }
        }
      });
    }

    return false;
  };

  // ===== GRID UPDATE LOGIC =====
  const updateGridWithPath = (path, baseGrid = null) => {
    const gridToUse = baseGrid || grid;
    const newGrid = [...gridToUse];

    const isStartingFromDot =
      path.length > 0 &&
      newGrid[path[0].row] &&
      newGrid[path[0].row][path[0].col] &&
      newGrid[path[0].row][path[0].col].type === "dot";

    if (isStartingFromDot) {
      for (let row = 0; row < newGrid.length; row++) {
        for (let col = 0; col < newGrid[row].length; col++) {
          const cell = newGrid[row][col];
          if (
            cell &&
            (cell.type === "path" ||
              cell.type === "gate" ||
              cell.type === "bridge") &&
            (cell.color === currentColor ||
              (cell.colors && cell.colors.includes(currentColor)))
          ) {
            const isInNewPath = path.some(
              (p) => p.row === row && p.col === col
            );
            if (!isInNewPath) {
              const isGatePosition =
                currentPuzzle.gates?.some(
                  ([gateRow, gateCol]) => gateRow === row && gateCol === col
                ) || false;

              if (cell.type === "bridge" && cell.colors) {
                const newColors = cell.colors.filter((c) => c !== currentColor);
                if (newColors.length > 1) {
                  newGrid[row][col] = {
                    ...cell,
                    colors: newColors,
                    color: newColors[0],
                  };
                } else if (newColors.length === 1) {
                  newGrid[row][col] = { type: "gate", color: newColors[0] };
                } else {
                  newGrid[row][col] = isGatePosition ? { type: "gate" } : null;
                }
              } else {
                newGrid[row][col] = isGatePosition ? { type: "gate" } : null;
              }
            }
          }
        }
      }
    }

    const collidedColors = new Set();

    path.forEach(({ row, col }, index) => {
      const existingCell = newGrid[row][col];

      if (existingCell && existingCell.type === "dot") {
        return;
      }

      if (
        existingCell &&
        existingCell.type === "path" &&
        existingCell.color !== currentColor
      ) {
        collidedColors.add(existingCell.color);
      }

      if (
        existingCell &&
        existingCell.type === "path" &&
        existingCell.colors &&
        !existingCell.colors.includes(currentColor)
      ) {
        existingCell.colors.forEach((color) => {
          if (color !== currentColor) {
            collidedColors.add(color);
          }
        });
      }

      let fromDirection = null;
      let toDirection = null;

      if (index > 0) {
        const prevCell = path[index - 1];
        if (prevCell.row < row) fromDirection = "top";
        else if (prevCell.row > row) fromDirection = "bottom";
        else if (prevCell.col < col) fromDirection = "left";
        else if (prevCell.col > col) fromDirection = "right";
      }

      if (index < path.length - 1) {
        const nextCell = path[index + 1];
        if (nextCell.row < row) toDirection = "top";
        else if (nextCell.row > row) toDirection = "bottom";
        else if (nextCell.col < col) toDirection = "left";
        else if (nextCell.col > col) toDirection = "right";
      }

      if (
        index === 0 &&
        existingCell &&
        existingCell.type === "path" &&
        existingCell.color === currentColor
      ) {
        const adjacentDirections = [
          { dir: "top", row: row - 1, col },
          { dir: "bottom", row: row + 1, col },
          { dir: "left", row, col: col - 1 },
          { dir: "right", row, col: col + 1 },
        ];

        for (const { dir, row: adjRow, col: adjCol } of adjacentDirections) {
          if (
            adjRow >= 0 &&
            adjRow < gridToUse.length &&
            adjCol >= 0 &&
            adjCol < gridToUse[0].length
          ) {
            const adjCell = gridToUse[adjRow][adjCol];
            if (
              adjCell &&
              adjCell.type === "path" &&
              adjCell.color === currentColor &&
              !path.some((p) => p.row === adjRow && p.col === adjCol)
            ) {
              if (!fromDirection && dir !== toDirection) {
                fromDirection = dir;
              } else if (!toDirection && dir !== fromDirection) {
                toDirection = dir;
              }
            }
          }
        }
      }

      const directions = [];
      if (fromDirection) directions.push(fromDirection);
      if (toDirection) directions.push(toDirection);

      if (
        existingCell &&
        existingCell.type === "path" &&
        existingCell.color !== currentColor
      ) {
        const colors = [existingCell.color];
        if (!colors.includes(currentColor)) {
          colors.push(currentColor);
        }

        const newCell = {
          type: "path",
          colors: colors,
          color: currentColor,
          fromDirection,
          toDirection,
          directions,
        };
        newGrid[row][col] = newCell;
      } else if (
        existingCell &&
        existingCell.type === "path" &&
        existingCell.colors &&
        !existingCell.colors.includes(currentColor)
      ) {
        const colors = [...existingCell.colors];
        if (!colors.includes(currentColor)) {
          colors.push(currentColor);
        }

        const newCell = {
          type: "path",
          colors: colors,
          color: currentColor,
          fromDirection,
          toDirection,
          directions,
        };
        newGrid[row][col] = newCell;
      } else {
        const newCell = {
          type: "path",
          color: currentColor,
          fromDirection,
          toDirection,
          directions,
        };
        newGrid[row][col] = newCell;
      }
    });

    if (collidedColors.size > 0) {
      cleanupBrokenPaths(newGrid, currentColor);
    }

    if (!isStartingFromDot) {
      const colorDots = currentPuzzle.dots.find(
        (dot) => dot.color === currentColor
      );
      if (colorDots) {
        const [startRow, startCol] = colorDots.start;
        const [endRow, endCol] = colorDots.end;

        const findConnectedCells = (dotRow, dotCol) => {
          const visited = new Set();
          const connected = new Set();
          const queue = [{ row: dotRow, col: dotCol }];

          while (queue.length > 0) {
            const { row, col } = queue.shift();
            const key = `${row},${col}`;

            if (visited.has(key)) continue;
            visited.add(key);
            connected.add(key);

            const directions = [
              { row: row - 1, col },
              { row: row + 1, col },
              { row, col: col - 1 },
              { row, col: col + 1 },
            ];

            directions.forEach(({ row: adjRow, col: adjCol }) => {
              if (
                adjRow >= 0 &&
                adjRow < newGrid.length &&
                adjCol >= 0 &&
                adjCol < newGrid[0].length
              ) {
                const adjCell = newGrid[adjRow][adjCol];
                if (
                  adjCell &&
                  (adjCell.type === "dot" || adjCell.type === "path") &&
                  (adjCell.color === currentColor ||
                    (adjCell.colors &&
                      adjCell.colors.includes(currentColor))) &&
                  !visited.has(`${adjRow},${adjCol}`)
                ) {
                  queue.push({ row: adjRow, col: adjCol });
                }
              }
            });
          }
          return connected;
        };

        const startConnected = findConnectedCells(startRow, startCol);
        const endConnected = findConnectedCells(endRow, endCol);
        const allValidCells = new Set([...startConnected, ...endConnected]);

        for (let row = 0; row < newGrid.length; row++) {
          for (let col = 0; col < newGrid[row].length; col++) {
            const cell = newGrid[row][col];
            if (
              cell &&
              cell.type === "path" &&
              (cell.color === currentColor ||
                (cell.colors && cell.colors.includes(currentColor)))
            ) {
              const cellKey = `${row},${col}`;
              if (!allValidCells.has(cellKey)) {
                newGrid[row][col] = null;
              }
            }
          }
        }
      }
    }

    setGrid(newGrid);

    if (path.length > 1) {
      const newConnections = new Map(dotConnections);
      const startCell = path[0];
      const secondCell = path[1];

      const firstGridCell = newGrid[startCell.row][startCell.col];
      if (firstGridCell && firstGridCell.type === "dot") {
        let direction = null;
        if (secondCell.row < startCell.row) direction = "top";
        else if (secondCell.row > startCell.row) direction = "bottom";
        else if (secondCell.col < startCell.col) direction = "left";
        else if (secondCell.col > startCell.col) direction = "right";

        if (direction) {
          const dotKey = `${startCell.row},${startCell.col}`;
          newConnections.set(dotKey, direction);
          setDotConnections(newConnections);
        }
      }
    }
    setGrid(newGrid); // Always update grid state
  };

  // ===== UNDO/REVERT FUNCTIONALITY =====
  const pushHistory = () => {
    setHistory((prev) => [
      {
        grid: JSON.parse(JSON.stringify(grid)),
        dotConnections: new Map(dotConnections),
        moves,
        completed,
        gameCompleted,
      },
      ...prev,
    ]);
  };

  const handleRevert = () => {
    // If currently drawing, step back the current path
    if (isDrawing && currentPathRef.current.length > 1) {
      const newPath = currentPathRef.current.slice(0, -1);
      setCurrentPathAndRef(newPath);
      updateGridWithPath(newPath);
      return;
    }

    // If not drawing, fallback to history-based revert
    if (history.length === 0) return;
    const last = history[0];
    setGrid(JSON.parse(JSON.stringify(last.grid)));
    setDotConnections(new Map(last.dotConnections));
    setMoves(last.moves);
    setCompleted(last.completed);
    setGameCompleted(last.gameCompleted);
    setHistory((prev) => prev.slice(1));
    setIsDrawing(false);
    setCurrentColor(null);
    setCurrentPathAndRef([]);
  };

  // ===== GAME CONTROLS =====
  const nextLevel = () => {
    if (currentLevel < MYSTERY_DATA.how.levels.length - 1) {
      setCurrentLevel((prev) => prev + 1);
    }
  };

  const resetLevel = () => {
    initializeGrid();
  };

  // ===== RENDERING LOGIC =====
  // Add flip animation for celebration
  const renderCell = (row, col, opts = {}) => {
    // Safety checks
    if (
      !grid ||
      !Array.isArray(grid) ||
      !grid[row] ||
      !Array.isArray(grid[row])
    ) {
      return <div key={`${row}-${col}`} className={styles.cell}></div>;
    }

    // Use completedGrid for celebration/final view if provided
    const cellGrid = opts.gridOverride || grid;
    const cell = cellGrid[row][col];
    const isInCurrentPath = currentPath.some(
      (p) => p.row === row && p.col === col
    );

    let cellClass = styles.cell;
    let content = null;

    // Add flip animation for celebration
    if (opts.flipWave) {
      const delay = (row + col) * 80; // ms, diagonal wave
      cellClass += ` ${styles.flipCell}`;
      // Inline style for staggered animation delay
      opts.extraStyle = {
        ...(opts.extraStyle || {}),
        animationDelay: `${delay}ms`,
      };
    }

    if (cell) {
      if (cell.type === "dot") {
        cellClass += ` ${styles.dot} ${styles[cell.color]}`;

        // Check if this color's dots are connected
        const isConnected = areDotsConnected(cell.color);
        if (isConnected) {
          cellClass += ` ${styles.connected}`;
        }

        if (cell.isCompleted) {
          cellClass += ` ${styles.completed}`;
        }

        // Check for connected paths to show directional extensions
        const connectedDirections = [];

        // Check adjacent cells for paths of this color or current drawing
        const adjacentDirections = [
          { dir: "top", row: row - 1, col },
          { dir: "bottom", row: row + 1, col },
          { dir: "left", row, col: col - 1 },
          { dir: "right", row, col: col + 1 },
        ];

        // A dot should only have ONE direction going out
        let connectedDirection = null;

        // Priority 1: Use stored connection direction if available
        const dotKey = `${row},${col}`;
        const storedDirection = dotConnections.get(dotKey);
        if (storedDirection) {
          // Verify the stored direction still has a valid path
          const directionMap = {
            top: [-1, 0],
            bottom: [1, 0],
            left: [0, -1],
            right: [0, 1],
          };
          const [deltaRow, deltaCol] = directionMap[storedDirection];
          const adjRow = row + deltaRow;
          const adjCol = col + deltaCol;

          if (
            adjRow >= 0 &&
            adjRow < grid.length &&
            adjCol >= 0 &&
            adjCol < grid[0].length
          ) {
            const adjCell = grid[adjRow][adjCol];
            if (
              (adjCell &&
                (adjCell.type === "path" ||
                  adjCell.type === "gate" ||
                  adjCell.type === "bridge") &&
                (adjCell.color === cell.color ||
                  (adjCell.colors && adjCell.colors.includes(cell.color)))) ||
              (isDrawing &&
                currentColor === cell.color &&
                currentPath.some((p) => p.row === adjRow && p.col === adjCol))
            ) {
              connectedDirection = storedDirection;
            }
          }
        }

        // Priority 2: If currently drawing from this dot and no stored direction, use current path direction
        if (!connectedDirection && isDrawing && currentColor === cell.color) {
          if (
            currentPath.length > 1 &&
            currentPath[0].row === row &&
            currentPath[0].col === col
          ) {
            const nextCell = currentPath[1];
            if (nextCell.row < row) connectedDirection = "top";
            else if (nextCell.row > row) connectedDirection = "bottom";
            else if (nextCell.col < col) connectedDirection = "left";
            else if (nextCell.col > col) connectedDirection = "right";
          }
        }

        // Priority 3: Fallback to any adjacent path if no direction found
        if (!connectedDirection) {
          for (const { dir, row: adjRow, col: adjCol } of adjacentDirections) {
            if (
              adjRow >= 0 &&
              adjRow < grid.length &&
              adjCol >= 0 &&
              adjCol < grid[0].length
            ) {
              const adjCell = grid[adjRow][adjCol];
              if (
                adjCell &&
                (adjCell.type === "path" ||
                  adjCell.type === "gate" ||
                  adjCell.type === "bridge") &&
                (adjCell.color === cell.color ||
                  (adjCell.colors && adjCell.colors.includes(cell.color)))
              ) {
                connectedDirection = dir;
                break; // Use first available path as fallback
              }
            }
          }
        }

        // Update connectedDirections to use new logic - ensure only one direction
        if (connectedDirection) {
          connectedDirections.push(connectedDirection);
        }

        // Safety check: ensure dots never show more than one connection
        if (connectedDirections.length > 1) {
          connectedDirections.splice(1); // Keep only the first one
        }

        // Create SVG content for dot connections
        let dotContent = <div className={styles.dotContent} />;

        if (connectedDirections.length > 0) {
          const cellSize = 40;
          const strokeWidth = 16;
          const center = cellSize / 2;

          let svgPaths = [];

          connectedDirections.forEach((dir) => {
            let pathData = "";
            switch (dir) {
              case "top":
                pathData = `M ${center} ${center} L ${center} 0`;
                break;
              case "bottom":
                pathData = `M ${center} ${center} L ${center} ${cellSize}`;
                break;
              case "left":
                pathData = `M ${center} ${center} L 0 ${center}`;
                break;
              case "right":
                pathData = `M ${center} ${center} L ${cellSize} ${center}`;
                break;
            }

            if (pathData) {
              svgPaths.push(
                <path
                  key={dir}
                  d={pathData}
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            }
          });

          content = (
            <>
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${cellSize} ${cellSize}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                }}
              >
                {svgPaths}
              </svg>
              {dotContent}
            </>
          );
        } else {
          content = dotContent;
        }
      } else if (cell.type === "path") {
        cellClass += ` ${styles.path} ${styles[cell.color]}`;
        if (cell.isCompleted) {
          cellClass += ` ${styles.completed}`;
        }
        if (cell.isPreview) {
          cellClass += ` ${styles.preview}`;
        }

        // Create SVG path content for smooth curves
        if (cell.directions && cell.directions.length > 0) {
          const dirs = cell.directions.sort();
          const cellSize = 40; // Match CSS cell size
          const strokeWidth = 16;
          const center = cellSize / 2;

          let svgPath = "";

          if (dirs.length === 1) {
            // Single direction - path end, but still extend edge to edge for visual consistency
            const dir = dirs[0];
            switch (dir) {
              case "top":
                svgPath = `M ${center} 0 L ${center} ${cellSize}`;
                break;
              case "bottom":
                svgPath = `M ${center} 0 L ${center} ${cellSize}`;
                break;
              case "left":
                svgPath = `M 0 ${center} L ${cellSize} ${center}`;
                break;
              case "right":
                svgPath = `M 0 ${center} L ${cellSize} ${center}`;
                break;
            }
          } else if (dirs.length === 2) {
            const [dir1, dir2] = dirs;

            // Check for straight lines first
            if (
              (dir1 === "top" && dir2 === "bottom") ||
              (dir1 === "bottom" && dir2 === "top") ||
              (dir1 === "left" && dir2 === "right") ||
              (dir1 === "right" && dir2 === "left")
            ) {
              // Straight line
              if (
                (dir1 === "top" && dir2 === "bottom") ||
                (dir1 === "bottom" && dir2 === "top")
              ) {
                svgPath = `M ${center} 0 L ${center} ${cellSize}`;
              } else {
                svgPath = `M 0 ${center} L ${cellSize} ${center}`;
              }
            } else {
              // 90-degree turn - use smooth curves
              const radius = 12; // Distance from center for curve control point

              if (dir1 === "top" && dir2 === "left") {
                // Top-Left turn
                svgPath = `M ${center} 0 L ${center} ${center - radius} Q ${center} ${center} ${center - radius} ${center} L 0 ${center}`;
              } else if (dir1 === "top" && dir2 === "right") {
                // Top-Right turn
                svgPath = `M ${center} 0 L ${center} ${center - radius} Q ${center} ${center} ${center + radius} ${center} L ${cellSize} ${center}`;
              } else if (dir1 === "bottom" && dir2 === "left") {
                // Bottom-Left turn
                svgPath = `M ${center} ${cellSize} L ${center} ${center + radius} Q ${center} ${center} ${center - radius} ${center} L 0 ${center}`;
              } else if (dir1 === "bottom" && dir2 === "right") {
                // Bottom-Right turn
                svgPath = `M ${center} ${cellSize} L ${center} ${center + radius} Q ${center} ${center} ${center + radius} ${center} L ${cellSize} ${center}`;
              } else if (dir1 === "left" && dir2 === "top") {
                // Left-Top turn (same as top-left)
                svgPath = `M 0 ${center} L ${center - radius} ${center} Q ${center} ${center} ${center} ${center - radius} L ${center} 0`;
              } else if (dir1 === "right" && dir2 === "top") {
                // Right-Top turn (same as top-right)
                svgPath = `M ${cellSize} ${center} L ${center + radius} ${center} Q ${center} ${center} ${center} ${center - radius} L ${center} 0`;
              } else if (dir1 === "left" && dir2 === "bottom") {
                // Left-Bottom turn (same as bottom-left)
                svgPath = `M 0 ${center} L ${center - radius} ${center} Q ${center} ${center} ${center} ${center + radius} L ${center} ${cellSize}`;
              } else if (dir1 === "right" && dir2 === "bottom") {
                // Right-Bottom turn (same as bottom-right)
                svgPath = `M ${cellSize} ${center} L ${center + radius} ${center} Q ${center} ${center} ${center} ${center + radius} L ${center} ${cellSize}`;
              }
            }
          }

          // Create SVG content that fills the entire cell
          content = (
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${cellSize} ${cellSize}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
              }}
            >
              <path
                d={svgPath}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          );
        }
      } else if (
        cell.type === "path" &&
        cell.colors &&
        cell.colors.length > 1
      ) {
        // Multi-color path (crossing) - treat as special path rendering
        cellClass += ` ${styles.path}`;
        if (cell.isCompleted) {
          cellClass += ` ${styles.completed}`;
        }
        if (cell.isPreview) {
          cellClass += ` ${styles.preview}`;
        }

        // Render crossing paths using SVG
        const cellSize = 40;
        const strokeWidth = 16;
        const center = cellSize / 2;

        // Color mapping
        const colorMap = {
          red: "#ff4757",
          blue: "#3742fa",
          green: "#2ed573",
          yellow: "#e7d61f",
          purple: "#a55eea",
          orange: "#ffa502",
          cyan: "#26d0ce",
          pink: "#ff38d7",
        };

        // For crossing paths, first color goes horizontal (under), second goes vertical (over)
        const svgPaths = [];

        if (cell.colors.length >= 2) {
          const horizontalColor = cell.colors[0];
          const verticalColor = cell.colors[1];

          // Horizontal path (under)
          svgPaths.push(
            <path
              key={`${horizontalColor}-horizontal`}
              d={`M 0 ${center} L ${cellSize} ${center}`}
              stroke={colorMap[horizontalColor] || "#666"}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
          );

          // Vertical path (over) - with gap where it crosses
          const gapSize = 6;
          svgPaths.push(
            <path
              key={`${verticalColor}-vertical`}
              d={`M ${center} 0 L ${center} ${center - gapSize} M ${center} ${center + gapSize} L ${center} ${cellSize}`}
              stroke={colorMap[verticalColor] || "#666"}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
          );
        }

        content = (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${cellSize} ${cellSize}`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          >
            {svgPaths}
          </svg>
        );
      }
    }

    // Handle current drawing path visualization
    if (isInCurrentPath) {
      cellClass += ` ${styles.currentPath} ${styles.dragPreview}`;
      if (currentColor) {
        cellClass += ` ${styles[currentColor]}`;
      }

      // Render path lines for current drawing if not already a path cell
      if (!cell || cell.type !== "path") {
        // Find this cell's position in the current path
        const pathIndex = currentPath.findIndex(
          (p) => p.row === row && p.col === col
        );

        if (pathIndex !== -1) {
          // Determine directions based on adjacent cells in the path
          const directions = [];

          // Check previous cell in path
          if (pathIndex > 0) {
            const prevCell = currentPath[pathIndex - 1];
            if (prevCell.row < row) directions.push("top");
            else if (prevCell.row > row) directions.push("bottom");
            else if (prevCell.col < col) directions.push("left");
            else if (prevCell.col > col) directions.push("right");
          }

          // Check next cell in path
          if (pathIndex < currentPath.length - 1) {
            const nextCell = currentPath[pathIndex + 1];
            if (nextCell.row < row) directions.push("top");
            else if (nextCell.row > row) directions.push("bottom");
            else if (nextCell.col < col) directions.push("left");
            else if (nextCell.col > col) directions.push("right");
          }

          // Create SVG for current drawing path
          if (directions.length > 0) {
            const cellSize = 40;
            const strokeWidth = 16;
            const center = cellSize / 2;
            let svgPath = "";

            if (directions.length === 1) {
              // Single direction - extend through the cell
              const dir = directions[0];
              switch (dir) {
                case "top":
                case "bottom":
                  svgPath = `M ${center} 0 L ${center} ${cellSize}`;
                  break;
                case "left":
                case "right":
                  svgPath = `M 0 ${center} L ${cellSize} ${center}`;
                  break;
              }
            } else if (directions.length === 2) {
              const [dir1, dir2] = directions.sort();

              // Check for straight lines first
              if (
                (dir1 === "top" && dir2 === "bottom") ||
                (dir1 === "bottom" && dir2 === "top") ||
                (dir1 === "left" && dir2 === "right") ||
                (dir1 === "right" && dir2 === "left")
              ) {
                // Straight line
                if (
                  (dir1 === "top" && dir2 === "bottom") ||
                  (dir1 === "bottom" && dir2 === "top")
                ) {
                  svgPath = `M ${center} 0 L ${center} ${cellSize}`;
                } else {
                  svgPath = `M 0 ${center} L ${cellSize} ${center}`;
                }
              } else {
                // 90-degree turn
                const radius = 12;

                if (dir1 === "top" && dir2 === "left") {
                  svgPath = `M ${center} 0 L ${center} ${center - radius} Q ${center} ${center} ${center - radius} ${center} L 0 ${center}`;
                } else if (dir1 === "top" && dir2 === "right") {
                  svgPath = `M ${center} 0 L ${center} ${center - radius} Q ${center} ${center} ${center + radius} ${center} L ${cellSize} ${center}`;
                } else if (dir1 === "bottom" && dir2 === "left") {
                  svgPath = `M ${center} ${cellSize} L ${center} ${center + radius} Q ${center} ${center} ${center - radius} ${center} L 0 ${center}`;
                } else if (dir1 === "bottom" && dir2 === "right") {
                  svgPath = `M ${center} ${cellSize} L ${center} ${center + radius} Q ${center} ${center} ${center + radius} ${center} L ${cellSize} ${center}`;
                } else if (dir1 === "left" && dir2 === "top") {
                  svgPath = `M 0 ${center} L ${center - radius} ${center} Q ${center} ${center} ${center} ${center - radius} L ${center} 0`;
                } else if (dir1 === "right" && dir2 === "top") {
                  svgPath = `M ${cellSize} ${center} L ${center + radius} ${center} Q ${center} ${center} ${center} ${center - radius} L ${center} 0`;
                } else if (dir1 === "left" && dir2 === "bottom") {
                  svgPath = `M 0 ${center} L ${center - radius} ${center} Q ${center} ${center} ${center} ${center + radius} L ${center} ${cellSize}`;
                } else if (dir1 === "right" && dir2 === "bottom") {
                  svgPath = `M ${cellSize} ${center} L ${center + radius} ${center} Q ${center} ${center} ${center} ${center + radius} L ${center} ${cellSize}`;
                }
              }
            }

            // Add current drawing path SVG to content
            const currentPathSvg = (
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${cellSize} ${cellSize}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                  opacity: 0.8,
                }}
              >
                <path
                  d={svgPath}
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            );

            // Combine with existing content
            content = content ? (
              <>
                {content}
                {currentPathSvg}
              </>
            ) : (
              currentPathSvg
            );
          }
        }
      }
    }

    return (
      <div
        key={`${row}-${col}`}
        className={cellClass}
        style={{ userSelect: "none", ...(opts.extraStyle || {}) }}
        onMouseDown={(e) => {
          e.preventDefault();
          handleMouseDown(row, col);
        }}
        onMouseEnter={(e) => handleMouseEnter(row, col)}
        onMouseOver={(e) => handleMouseEnter(row, col)}
        onTouchStart={(e) => {
          e.preventDefault();
          handleMouseDown(row, col);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          handleMouseEnter(row, col);
        }}
        onDragStart={(e) => {
          e.preventDefault();
          return false;
        }}
        draggable={false}
        data-row={row}
        data-col={col}
      >
        {content}
      </div>
    );
  };

  // ===== MAIN COMPONENT RENDER =====
  if (
    victoryStage === "zoomIn" ||
    victoryStage === "flipping" ||
    victoryStage === "pause"
  ) {
    // Show the grid with zoom and flip animations
    return (
      <div className={styles.minigame}>
        <div className={styles.flowGame}>
          <div
            className={`${styles.grid} ${styles[victoryStage]}`}
            style={{
              gridTemplateColumns: `repeat(${currentPuzzle.size}, 1fr)`,
              gridTemplateRows: `repeat(${currentPuzzle.size}, 1fr)`,
              userSelect: "none",
              position: "relative",
            }}
          >
            {completedGrid && completedGrid.length > 0
              ? completedGrid.map((rowArr, rowIndex) =>
                  rowArr && Array.isArray(rowArr)
                    ? rowArr.map((_, colIndex) =>
                        renderCell(rowIndex, colIndex, {
                          gridOverride: completedGrid,
                          flipWave: victoryStage === "flipping",
                        })
                      )
                    : null
                )
              : null}
            {victoryStage === "pause" && (
              <div className={styles.celebrationOverlay}>
                <div className={styles.celebrationCheck}>✓</div>
              </div>
            )}
          </div>
          {victoryStage === "pause" && (
            <div className={styles.celebrationText}>
              All connections complete!
            </div>
          )}
        </div>
      </div>
    );
  }

  if (victoryStage === "zoomOut") {
    // Show the grid transitioning to completion position
    return (
      <div className={styles.minigame}>
        <div className={styles.flowGame}>
          <div
            className={`${styles.grid} ${styles.zoomOut}`}
            style={{
              gridTemplateColumns: `repeat(${currentPuzzle.size}, 1fr)`,
              gridTemplateRows: `repeat(${currentPuzzle.size}, 1fr)`,
              userSelect: "none",
              position: "relative",
            }}
          >
            {completedGrid && completedGrid.length > 0
              ? completedGrid.map((rowArr, rowIndex) =>
                  rowArr && Array.isArray(rowArr)
                    ? rowArr.map((_, colIndex) =>
                        renderCell(rowIndex, colIndex, {
                          gridOverride: completedGrid,
                        })
                      )
                    : null
                )
              : null}
          </div>
        </div>
      </div>
    );
  }

  if (gameCompleted && completedGrid && victoryStage === "completed") {
    // Side-by-side layout for results and puzzle
    const points = getPoints();
    return (
      <div className={styles.minigame}>
        <div className={styles.completionRow}>
          <div className={styles.howResults}>
            <h3>All dots connected!</h3>
            <div className={styles.howSuccess}>
              <h4>It all makes sense now!</h4>
              <p> </p>
              <p> </p>
              <p>
                Points earned: {points} / 2{hintUsed ? " (hint used)" : ""}
              </p>
            </div>
          </div>
          <div className={styles.finalGridWrapper}>
            <div
              className={styles.grid}
              style={{
                gridTemplateColumns: `repeat(${currentPuzzle.size}, 1fr)`,
                gridTemplateRows: `repeat(${currentPuzzle.size}, 1fr)`,
                userSelect: "none",
              }}
            >
              {completedGrid && completedGrid.length > 0
                ? completedGrid.map((rowArr, rowIndex) =>
                    rowArr && Array.isArray(rowArr)
                      ? rowArr.map((_, colIndex) =>
                          renderCell(rowIndex, colIndex, {
                            gridOverride: completedGrid,
                          })
                        )
                      : null
                  )
                : null}
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={onBack}
          className={styles.backButton}
        >
          Back to Overview
        </Button>
      </div>
    );
  }

  return (
    <div
      className={styles.minigame}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
    >
      <div className={styles.minigameHeader}>
        <div className={styles.headerContent}>
          <h3
            style={{
              flex: 1,
              textAlign: "left",
              color: "var(--color-green-bg)",
              margin: 0,
            }}
          >
            How
          </h3>
          <h4
            className={styles.howQuestion}
            style={{
              flex: 2,
              textAlign: "center",
              color: "var(--color-green-bg)",
              fontWeight: 600,
              fontSize: "1.2rem",
              margin: 0,
              padding: "0 20px",
            }}
          >
            We need to connect all the dots to understand how they did it.
          </h4>
          <div className={styles.headerButtons}>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowHintModal(true)}
            >
              Hint
            </Button>
            <Button variant="secondary" size="small" onClick={onBack}>
              Back to Overview
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.flowGame}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${currentPuzzle.size}, 1fr)`,
            gridTemplateRows: `repeat(${currentPuzzle.size}, 1fr)`,
            userSelect: "none",
          }}
          draggable={false}
          onDragStart={(e) => {
            e.preventDefault();
            return false;
          }}
        >
          {grid && Array.isArray(grid) && grid.length > 0
            ? grid.map((row, rowIndex) =>
                row && Array.isArray(row)
                  ? row.map((_, colIndex) => renderCell(rowIndex, colIndex))
                  : null
              )
            : null}
        </div>

        <div className={styles.controls}>
          <Button onClick={resetLevel} variant="secondary" size="small">
            Reset Grid
          </Button>
          <Button
            onClick={handleRevert}
            variant="primary"
            size="small"
            disabled={history.length === 0}
          >
            Revert
          </Button>
          {completed && !gameCompleted && (
            <Button onClick={completeGame} variant="primary" size="small">
              Complete Mini-Game
            </Button>
          )}
          {completed && gameCompleted && (
            <div style={{ color: "green", fontWeight: "bold" }}>
              ✓ Mini-Game Completed!
            </div>
          )}
        </div>
      </div>
      {/* Hint Modal using shared Modal component */}
      <Modal
        isOpen={showHintModal}
        onClose={() => setShowHintModal(false)}
        title={hintUsed ? "Hint" : "Use Hint?"}
      >
        {!hintUsed ? (
          <>
            <p>Are you sure you want to use a hint?</p>
            <p>
              <strong>Warning:</strong> Using a hint will prevent you from
              earning points for this mini-game.
            </p>
            <div className={modalStyles.modalButtons}>
              <Button
                onClick={() => {
                  setHintUsed(true);
                  // Call the parent component's hint handler
                  if (onHint) {
                    onHint(0); // Use hint index 0 for the first hint
                  }
                }}
                variant="primary"
                size="small"
              >
                Yes, Show Hint
              </Button>
              <Button
                onClick={() => setShowHintModal(false)}
                variant="secondary"
                size="small"
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="hintContent">
            <h4>Flow Path Hint:</h4>
            <p>Here is the yellow path:</p>
            <img
              src="/how-game-hint.png"
              alt="Yellow path solution"
              style={{
                maxWidth: 300,
                width: "100%",
                borderRadius: 16,
                marginTop: 12,
                boxShadow: "0 4px 20px rgba(36,92,79,0.15)",
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HowGame;
