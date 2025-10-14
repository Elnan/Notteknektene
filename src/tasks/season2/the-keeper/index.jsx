import React, { useState, useEffect } from "react";
import styles from "./TheKeeper.module.css";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import { useKeeperSaveState } from "../../../hooks/useKeeperSaveState";
import {
  BOARD_SIZE,
  INITIAL_PLAYER_POS,
  INITIAL_KEEPER_POS,
  EXIT_POS,
  OBSTACLES,
  KEEPER_RULES,
  GAME_TITLE,
  UI_CONFIG,
  PRESSURE_PLATES,
  VALID_COMBINATIONS,
} from "./gameConfig";

const TheKeeper = ({ onComplete, currentGameId }) => {
  // Save/load functionality
  const {
    saveGameState,
    loadGameState,
    clearSaveState,
    isLoading: saveLoading,
    error: saveError,
    cleanup,
  } = useKeeperSaveState(currentGameId);

  // Game state
  const [phase, setPhase] = useState("game"); // Start directly in game
  const [playerPos, setPlayerPos] = useState(INITIAL_PLAYER_POS);
  const [keeperPos, setKeeperPos] = useState(INITIAL_KEEPER_POS);
  const [moves, setMoves] = useState(0);
  const [visitedCells, setVisitedCells] = useState(new Set());
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const [activatedPlates, setActivatedPlates] = useState(new Set());
  const [exitRevealed, setExitRevealed] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [repetitiveMoveCount, setRepetitiveMoveCount] = useState(0);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showHintConfirmation, setShowHintConfirmation] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track total game time from first opening (for submission)
  const [totalGameStartTime, setTotalGameStartTime] = useState(null);

  // Track current attempt start time (for internal use)
  const [currentAttemptStartTime, setCurrentAttemptStartTime] = useState(null);

  // Set total game start time only once when component first mounts
  useEffect(() => {
    if (!totalGameStartTime) {
      const now = Date.now();
      setTotalGameStartTime(now);
      setCurrentAttemptStartTime(now);
      window.gameStartTime = now; // Keep for backward compatibility
    }
  }, [totalGameStartTime]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        window.innerWidth <= 768 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load game state on component mount
  useEffect(() => {
    const loadState = async () => {
      const savedState = await loadGameState();
      if (savedState) {
        setPhase(savedState.phase);
        setPlayerPos(savedState.playerPos);
        setKeeperPos(savedState.keeperPos);
        setMoves(savedState.moves);
        setVisitedCells(savedState.visitedCells);
        setGameWon(savedState.gameWon);
        setGameLost(savedState.gameLost);
        setAttempts(savedState.attempts);
        setActivatedPlates(savedState.activatedPlates);
        setExitRevealed(savedState.exitRevealed);
        setMoveHistory(savedState.moveHistory);
        setRepetitiveMoveCount(savedState.repetitiveMoveCount);
        setHintUsed(savedState.hintUsed);
        // Restore total game start time if available, otherwise keep current
        if (savedState.totalGameStartTime && !totalGameStartTime) {
          setTotalGameStartTime(savedState.totalGameStartTime);
        }
        setHasLoadedInitialState(true);
        console.log("🎮 Loaded saved Keeper game state");
      } else {
        setHasLoadedInitialState(true);
      }
    };

    loadState();
  }, [loadGameState]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Check for capture after keeper moves
  useEffect(() => {
    if (phase === "game" && !gameWon && !gameLost) {
      if (playerPos[0] === keeperPos[0] && playerPos[1] === keeperPos[1]) {
        setGameLost(true);
        setPhase("end");
        // No database submission when caught - just show end screen
        console.log("🎮 The Keeper - Game Lost (no submission)");
        return;
      }
    }
  }, [keeperPos, playerPos, phase, gameWon, gameLost]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Handle Space and Enter for Try Again button when game is lost
      if (
        phase === "end" &&
        gameLost &&
        (event.key === " " || event.key === "Enter")
      ) {
        event.preventDefault();
        resetGame();
        return;
      }

      // Handle game movement keys only during active gameplay
      if (phase !== "game" || gameWon || gameLost) return;

      const [px, py] = playerPos;
      let newX = px;
      let newY = py;

      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          event.preventDefault();
          newY = py - 1;
          break;
        case "ArrowDown":
        case "s":
        case "S":
          event.preventDefault();
          newY = py + 1;
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          event.preventDefault();
          newX = px - 1;
          break;
        case "ArrowRight":
        case "d":
        case "D":
          event.preventDefault();
          newX = px + 1;
          break;
        default:
          return;
      }

      // Check if move is valid
      if (isValidPosition(newX, newY)) {
        handlePlayerMove(newX, newY);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [playerPos, phase, gameWon, gameLost, visitedCells, moves]);

  // Calculate cell value (x + y)
  const getCellValue = (x, y) => x + y;

  // Check if a position is a pressure plate
  const isPressurePlate = (x, y) => {
    return Object.entries(PRESSURE_PLATES).some(
      ([plate, pos]) => pos[0] === x && pos[1] === y
    );
  };

  // Get pressure plate letter at position
  const getPressurePlateLetter = (x, y) => {
    for (const [letter, pos] of Object.entries(PRESSURE_PLATES)) {
      if (pos[0] === x && pos[1] === y) {
        return letter;
      }
    }
    return null;
  };

  // Check if activated plates form a valid combination
  const checkValidCombination = (plates) => {
    const plateArray = Array.from(plates).sort();
    return VALID_COMBINATIONS.some(
      (combination) => combination.sort().join(",") === plateArray.join(",")
    );
  };

  // Get direction from two positions
  const getDirection = (fromPos, toPos) => {
    const [fromX, fromY] = fromPos;
    const [toX, toY] = toPos;

    if (toX > fromX) return "right";
    if (toX < fromX) return "left";
    if (toY > fromY) return "down";
    if (toY < fromY) return "up";
    return "none";
  };

  // Check for repetitive movement patterns
  const checkRepetitiveMovement = (newPos) => {
    const newHistory = [...moveHistory, newPos];
    setMoveHistory(newHistory);

    // Keep only last 4 moves
    if (newHistory.length > 4) {
      newHistory.shift();
    }

    if (newHistory.length >= 4) {
      const directions = [];
      for (let i = 1; i < newHistory.length; i++) {
        directions.push(getDirection(newHistory[i - 1], newHistory[i]));
      }

      // Check if all last 4 moves are in the same direction
      const allSameDirection = directions.every((dir) => dir === directions[0]);

      if (allSameDirection) {
        setRepetitiveMoveCount((prev) => prev + 1);
        return true;
      } else {
        setRepetitiveMoveCount(0);
        return false;
      }
    }

    return false;
  };

  // Check if position is valid (within bounds and not an obstacle)
  const isValidPosition = (x, y) => {
    return (
      x >= 0 &&
      x < BOARD_SIZE &&
      y >= 0 &&
      y < BOARD_SIZE &&
      !OBSTACLES.some(([ox, oy]) => ox === x && oy === y)
    );
  };

  // Calculate Manhattan distance between two positions
  const manhattanDistance = (pos1, pos2) => {
    return Math.abs(pos1[0] - pos2[0]) + Math.abs(pos1[1] - pos2[1]);
  };

  // Get valid moves for a position (no diagonals)
  const getValidMoves = (pos) => {
    const [x, y] = pos;
    const moves = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    return moves.filter(([mx, my]) => isValidPosition(mx, my));
  };

  // Check if keeper is cornered by walls (has 2 or more walls adjacent)
  const isKeeperCornered = () => {
    const [kx, ky] = keeperPos;
    const adjacentPositions = [
      [kx - 1, ky],
      [kx + 1, ky],
      [kx, ky - 1],
      [kx, ky + 1],
    ];

    const wallCount = adjacentPositions.filter(([x, y]) => {
      return (
        x < 0 ||
        x >= BOARD_SIZE ||
        y < 0 ||
        y >= BOARD_SIZE ||
        OBSTACLES.some(([ox, oy]) => ox === x && oy === y)
      );
    }).length;

    return wallCount >= 2;
  };

  // Move keeper based on player's move using configuration
  const moveKeeper = (playerNewPos) => {
    const [px, py] = playerNewPos;
    const cellValue = getCellValue(px, py);
    const isFirstVisit = !visitedCells.has(`${px},${py}`);
    const isRepetitive = checkRepetitiveMovement(playerNewPos);

    let newKeeperPos = [...keeperPos];

    // If player steps on keeper's cell, keeper moves away
    if (playerNewPos[0] === keeperPos[0] && playerNewPos[1] === keeperPos[1]) {
      const validMoves = getValidMoves(keeperPos);
      const movesAwayFromPlayer = validMoves.filter((move) => {
        const currentDist = manhattanDistance(keeperPos, playerNewPos);
        const newDist = manhattanDistance(move, playerNewPos);
        return newDist > currentDist;
      });

      if (movesAwayFromPlayer.length > 0) {
        // Keeper moves away from player when stepped on
        newKeeperPos = movesAwayFromPlayer.reduce((furthest, move) => {
          const furthestDist = manhattanDistance(furthest, playerNewPos);
          const moveDist = manhattanDistance(move, playerNewPos);
          return moveDist > furthestDist ? move : furthest;
        });

        setKeeperPos(newKeeperPos);
        return;
      }
    }

    // Sort rules by priority (lowest number = highest priority)
    const sortedRules = Object.entries(KEEPER_RULES).sort(
      (a, b) => (a[1].priority || 999) - (b[1].priority || 999)
    );

    // Check each rule in order of priority
    for (const [ruleName, rule] of sortedRules) {
      let shouldApplyRule = false;

      // Check if rule should be applied based on its type
      if (rule.behavior === "repetitiveMovement") {
        shouldApplyRule = isRepetitive && repetitiveMoveCount >= 1;
      } else if (rule.behavior === "corneredKeeper") {
        shouldApplyRule = isKeeperCornered();
      } else {
        // For cell-value based rules, check if current cell value matches
        shouldApplyRule = rule.numbers.includes(cellValue);
      }

      if (shouldApplyRule) {
        switch (rule.behavior) {
          case "repetitiveMovement":
            // If player is moving repetitively, keeper makes a big leap towards player
            const repetitiveValidMoves = getValidMoves(newKeeperPos);
            const repetitiveMovesTowardsPlayer = repetitiveValidMoves.filter(
              (move) => {
                const currentDist = manhattanDistance(
                  newKeeperPos,
                  playerNewPos
                );
                const newDist = manhattanDistance(move, playerNewPos);
                return newDist < currentDist;
              }
            );

            if (repetitiveMovesTowardsPlayer.length > 0) {
              // Make multiple steps towards player based on repetitive count
              const stepsToTake = Math.min(repetitiveMoveCount + 1, 3);

              for (let step = 0; step < stepsToTake; step++) {
                const currentValidMoves = getValidMoves(newKeeperPos);
                const currentMovesTowardsPlayer = currentValidMoves.filter(
                  (move) => {
                    const currentDist = manhattanDistance(
                      newKeeperPos,
                      playerNewPos
                    );
                    const newDist = manhattanDistance(move, playerNewPos);
                    return newDist < currentDist;
                  }
                );

                if (currentMovesTowardsPlayer.length > 0) {
                  newKeeperPos = currentMovesTowardsPlayer.reduce(
                    (closest, move) => {
                      const closestDist = manhattanDistance(
                        closest,
                        playerNewPos
                      );
                      const moveDist = manhattanDistance(move, playerNewPos);
                      return moveDist < closestDist ? move : closest;
                    }
                  );
                }
              }
            }
            break;

          case "corneredKeeper":
            // If keeper is cornered by walls, it becomes less aggressive and moves away from player
            const corneredValidMoves = getValidMoves(newKeeperPos);
            const corneredMovesAwayFromPlayer = corneredValidMoves.filter(
              (move) => {
                const currentDist = manhattanDistance(
                  newKeeperPos,
                  playerNewPos
                );
                const newDist = manhattanDistance(move, playerNewPos);
                return newDist > currentDist;
              }
            );

            if (corneredMovesAwayFromPlayer.length > 0) {
              // Cornered keeper moves away from player (less aggressive)
              newKeeperPos = corneredMovesAwayFromPlayer.reduce(
                (furthest, move) => {
                  const furthestDist = manhattanDistance(
                    furthest,
                    playerNewPos
                  );
                  const moveDist = manhattanDistance(move, playerNewPos);
                  return moveDist > furthestDist ? move : furthest;
                }
              );
            }
            break;

          case "moveTowardsPlayer":
            for (let step = 0; step < (rule.steps || 1); step++) {
              const validMoves = getValidMoves(newKeeperPos);
              const movesTowardsPlayer = validMoves.filter((move) => {
                const currentDist = manhattanDistance(
                  newKeeperPos,
                  playerNewPos
                );
                const newDist = manhattanDistance(move, playerNewPos);
                return newDist < currentDist;
              });

              if (movesTowardsPlayer.length > 0) {
                newKeeperPos = movesTowardsPlayer.reduce((closest, move) => {
                  const closestDist = manhattanDistance(closest, playerNewPos);
                  const moveDist = manhattanDistance(move, playerNewPos);
                  return moveDist < closestDist ? move : closest;
                });
              }
            }
            break;

          case "moveAwayFromPlayer":
            for (let step = 0; step < (rule.steps || 1); step++) {
              const validMoves = getValidMoves(newKeeperPos);
              const movesAwayFromPlayer = validMoves.filter((move) => {
                const currentDist = manhattanDistance(
                  newKeeperPos,
                  playerNewPos
                );
                const newDist = manhattanDistance(move, playerNewPos);
                return newDist > currentDist;
              });

              if (movesAwayFromPlayer.length > 0) {
                const moveIndex =
                  (moves + cellValue) % movesAwayFromPlayer.length;
                newKeeperPos = movesAwayFromPlayer[moveIndex];
              }
            }
            break;

          case "randomPattern":
            const randomValidMoves = getValidMoves(newKeeperPos);
            if (randomValidMoves.length > 0) {
              const moveIndex = (moves + cellValue) % randomValidMoves.length;
              newKeeperPos = randomValidMoves[moveIndex];
            }
            break;

          case "stayInPlace":
            // Keeper doesn't move
            break;

          case "spiralPattern":
            const [kx, ky] = keeperPos;
            const spiralMoves = [
              [kx + 1, ky],
              [kx, ky - 1],
              [kx - 1, ky],
              [kx, ky + 1], // Right, Up, Left, Down
              [kx + 1, ky + 1],
              [kx - 1, ky - 1],
              [kx + 1, ky - 1],
              [kx - 1, ky + 1], // Diagonals
            ];

            const validSpiralMoves = spiralMoves.filter(
              ([x, y]) => isValidPosition(x, y) && (x !== px || y !== py)
            );

            if (validSpiralMoves.length > 0) {
              if (rule.prioritizePlayer) {
                const movesTowardsPlayer = validSpiralMoves.filter((move) => {
                  const currentDist = manhattanDistance(
                    keeperPos,
                    playerNewPos
                  );
                  const newDist = manhattanDistance(move, playerNewPos);
                  return newDist < currentDist;
                });

                if (movesTowardsPlayer.length > 0) {
                  newKeeperPos = movesTowardsPlayer[0];
                } else {
                  const moveIndex =
                    (moves + cellValue) % validSpiralMoves.length;
                  newKeeperPos = validSpiralMoves[moveIndex];
                }
              } else {
                const moveIndex = (moves + cellValue) % validSpiralMoves.length;
                newKeeperPos = validSpiralMoves[moveIndex];
              }
            }
            break;

          case "knightPattern":
            const [kx2, ky2] = keeperPos;
            const knightMoves = [
              [kx2 + 2, ky2 + 1],
              [kx2 + 2, ky2 - 1],
              [kx2 - 2, ky2 + 1],
              [kx2 - 2, ky2 - 1],
              [kx2 + 1, ky2 + 2],
              [kx2 + 1, ky2 - 2],
              [kx2 - 1, ky2 + 2],
              [kx2 - 1, ky2 - 2],
            ];

            const validKnightMoves = knightMoves.filter(
              ([x, y]) => isValidPosition(x, y) && (x !== px || y !== py)
            );

            if (validKnightMoves.length > 0) {
              if (rule.prioritizePlayer) {
                const movesTowardsPlayer = validKnightMoves.filter((move) => {
                  const currentDist = manhattanDistance(
                    keeperPos,
                    playerNewPos
                  );
                  const newDist = manhattanDistance(move, playerNewPos);
                  return newDist < currentDist;
                });

                if (movesTowardsPlayer.length > 0) {
                  newKeeperPos = movesTowardsPlayer[0];
                } else {
                  const moveIndex =
                    (moves + cellValue) % validKnightMoves.length;
                  newKeeperPos = validKnightMoves[moveIndex];
                }
              } else {
                const moveIndex = (moves + cellValue) % validKnightMoves.length;
                newKeeperPos = validKnightMoves[moveIndex];
              }
            }
            break;

          case "swapPositions":
            if (!rule.firstVisitOnly || isFirstVisit) {
              newKeeperPos = [...playerPos];
              setPlayerPos([...keeperPos]);
              setKeeperPos(newKeeperPos);
              return; // Exit early since we've already set both positions
            }
            break;

          default:
            break;
        }
        break; // Exit after first matching rule
      }
    }

    setKeeperPos(newKeeperPos);
  };

  // Handle player move (shared function for both click and keyboard)
  const handlePlayerMove = (x, y) => {
    if (phase !== "game" || gameWon || gameLost) return;

    // Check if move is valid (adjacent to current position)
    const [px, py] = playerPos;
    const isAdjacent =
      (Math.abs(x - px) === 1 && y === py) ||
      (Math.abs(y - py) === 1 && x === px);

    if (!isAdjacent || !isValidPosition(x, y)) return;

    // Update visited cells
    const newVisited = new Set(visitedCells);
    newVisited.add(`${x},${y}`);
    setVisitedCells(newVisited);

    // Check if player stepped on a pressure plate
    if (isPressurePlate(x, y)) {
      const plateLetter = getPressurePlateLetter(x, y);
      const newActivatedPlates = new Set(activatedPlates);
      newActivatedPlates.add(plateLetter);
      setActivatedPlates(newActivatedPlates);

      // Check if we have a valid combination
      if (checkValidCombination(newActivatedPlates)) {
        setExitRevealed(true);
      }
    }

    // Move player
    setPlayerPos([x, y]);

    // Increment moves
    setMoves(moves + 1);

    // Check win condition (reaching exit only if revealed)
    if (x === EXIT_POS[0] && y === EXIT_POS[1] && exitRevealed) {
      setGameWon(true);
      setPhase("end");

      // Submit game data when won
      if (onComplete) {
        const timeSpent = totalGameStartTime
          ? Date.now() - totalGameStartTime
          : 0;
        const submissionData = {
          moves: moves + 1, // Include the final winning move
          attempts: attempts, // Current attempt number (already correct)
          gameWon: true,
          timeSpent: timeSpent, // Total time from first opening the game
          hintsUsed: hintUsed ? 1 : 0,
          completed: true,
          // Score will be calculated after round ends based on ranking
        };
        console.log("🎮 The Keeper - Game Won Submission:", submissionData);
        // Use currentGameId if available, otherwise fall back to base game ID
        const gameId = currentGameId || "the-keeper";
        onComplete(gameId, submissionData);
      }
      return;
    }

    // Move keeper
    moveKeeper([x, y]);

    // Save state after player move
    saveGameState({
      phase,
      playerPos: [x, y],
      keeperPos,
      moves: moves + 1,
      visitedCells: newVisited,
      gameWon: false,
      gameLost: false,
      attempts,
      activatedPlates: isPressurePlate(x, y)
        ? new Set([...activatedPlates, getPressurePlateLetter(x, y)])
        : activatedPlates,
      exitRevealed:
        isPressurePlate(x, y) &&
        checkValidCombination(
          new Set([...activatedPlates, getPressurePlateLetter(x, y)])
        )
          ? true
          : exitRevealed,
      moveHistory: [
        ...moveHistory,
        { from: [px, py], to: [x, y], move: moves + 1 },
      ],
      repetitiveMoveCount: checkRepetitiveMovement([x, y])
        ? repetitiveMoveCount + 1
        : 0,
      hintUsed,
      gameStartTime: window.gameStartTime,
      totalGameStartTime: totalGameStartTime,
    });
  };

  // Handle cell click
  const handleCellClick = (x, y) => {
    handlePlayerMove(x, y);
  };

  // Handle mobile directional movement
  const handleMobileMove = (direction) => {
    const [px, py] = playerPos;
    let newX = px;
    let newY = py;

    switch (direction) {
      case "up":
        newY = py - 1;
        break;
      case "down":
        newY = py + 1;
        break;
      case "left":
        newX = px - 1;
        break;
      case "right":
        newX = px + 1;
        break;
      default:
        return;
    }

    // Check if move is valid
    if (isValidPosition(newX, newY)) {
      handlePlayerMove(newX, newY);
    }
  };

  // Reset game
  const resetGame = () => {
    const newAttempts = attempts + 1;
    console.log(
      `🎮 The Keeper - Resetting game. Attempt ${attempts} -> ${newAttempts}`
    );

    setPlayerPos(INITIAL_PLAYER_POS);
    setKeeperPos(INITIAL_KEEPER_POS);
    setMoves(0);
    setVisitedCells(new Set());
    setGameWon(false);
    setGameLost(false);
    setAttempts(newAttempts);
    setPhase("game");
    setActivatedPlates(new Set());
    setExitRevealed(false);
    setMoveHistory([]);
    setRepetitiveMoveCount(0);

    // Reset current attempt start time (but keep total game start time)
    const now = Date.now();
    setCurrentAttemptStartTime(now);
    window.gameStartTime = now; // Keep for backward compatibility
    console.log(
      `🎮 The Keeper - New attempt started at: ${new Date(now).toLocaleTimeString()}`
    );

    // Save state after reset
    saveGameState({
      phase: "game",
      playerPos: INITIAL_PLAYER_POS,
      keeperPos: INITIAL_KEEPER_POS,
      moves: 0,
      visitedCells: new Set(),
      gameWon: false,
      gameLost: false,
      attempts: newAttempts,
      activatedPlates: new Set(),
      exitRevealed: false,
      moveHistory: [],
      repetitiveMoveCount: 0,
      hintUsed,
      gameStartTime: window.gameStartTime,
      totalGameStartTime: totalGameStartTime,
    });
  };

  // Handle hint request
  const handleHintRequest = () => {
    if (hintUsed) {
      // If hint was already used, show it directly
      setShowHintModal(true);
    } else {
      // First time using hint, show confirmation
      setShowHintConfirmation(true);
    }
  };

  // Handle hint confirmation
  const handleHintConfirm = () => {
    setHintUsed(true);
    setShowHintConfirmation(false);
    setShowHintModal(true);

    // Save state after hint usage
    saveGameState({
      phase,
      playerPos,
      keeperPos,
      moves,
      visitedCells,
      gameWon,
      gameLost,
      attempts,
      activatedPlates,
      exitRevealed,
      moveHistory,
      repetitiveMoveCount,
      hintUsed: true,
      gameStartTime: window.gameStartTime,
      totalGameStartTime: totalGameStartTime,
    });
  };

  // Handle hint cancel
  const handleHintCancel = () => {
    setShowHintConfirmation(false);
  };

  // Close hint modal
  const closeHintModal = () => {
    setShowHintModal(false);
  };

  // Render board cell
  const renderCell = (x, y) => {
    const isPlayer = x === playerPos[0] && y === playerPos[1];
    const isKeeper = x === keeperPos[0] && y === keeperPos[1];
    const isObstacle = OBSTACLES.some(([ox, oy]) => ox === x && oy === y);
    const isExit = x === EXIT_POS[0] && y === EXIT_POS[1];
    const isVisited = visitedCells.has(`${x},${y}`);
    const isPressurePlateCell = isPressurePlate(x, y);
    const pressurePlateLetter = getPressurePlateLetter(x, y);
    const isActivatedPlate = activatedPlates.has(pressurePlateLetter);
    const cellValue = getCellValue(x, y);

    let cellClass = styles.cell;

    if (isObstacle) {
      cellClass += ` ${styles.obstacle}`;
    } else if (isPlayer) {
      cellClass += ` ${styles.player}`;
    } else if (isKeeper) {
      cellClass += ` ${styles.keeper}`;
    } else if (isPressurePlateCell) {
      cellClass += ` ${styles.pressurePlate}`;
      if (isActivatedPlate) {
        cellClass += ` ${styles.activatedPlate}`;
      }
    } else if (isExit && exitRevealed) {
      cellClass += ` ${styles.exit}`;
    } else {
      cellClass += ` ${styles.empty}`;
    }

    // Add glow effect for keeper
    if (isKeeper) {
      cellClass += ` ${styles.glowing}`;
    }

    return (
      <div
        key={`${x}-${y}`}
        className={cellClass}
        onClick={() => handleCellClick(x, y)}
        title={`Position (${x}, ${y}) - Value: ${cellValue}`}
      >
        {isPlayer && <div className={styles.playerIcon}>💂‍♀️</div>}
        {isKeeper && <div className={styles.keeperIcon}>👹</div>}
        {isExit && exitRevealed && <div className={styles.exitIcon}>🚪</div>}
        {isPressurePlateCell && (
          <div className={styles.pressurePlateLabel}>{pressurePlateLetter}</div>
        )}
      </div>
    );
  };

  // Render board
  const renderBoard = () => {
    const board = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        board.push(renderCell(x, y));
      }
    }
    return board;
  };

  // End screen
  if (phase === "end") {
    return (
      <div className={styles.theKeeperWrapper}>
        <div className={styles.endScreen}>
          <h2>{gameWon ? "You Escaped!" : "The Keeper Caught You"}</h2>
          <p>
            {gameWon
              ? `You escaped in ${moves} moves on attempt ${attempts}! Your score has been submitted, but you can play again for fun if you want to.`
              : `The keeper caught you on attempt ${attempts}. Try again!`}
          </p>
          <div className={styles.buttonRow}>
            <Button onClick={resetGame}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen only during initial load, not during saves
  if (saveLoading && !hasLoadedInitialState) {
    return (
      <div className={styles.theKeeperWrapper}>
        <div className={styles.gameHeader}>
          <h2>{GAME_TITLE}</h2>
        </div>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div>Loading game...</div>
        </div>
      </div>
    );
  }

  // Show save error if any
  if (saveError) {
    return (
      <div className={styles.theKeeperWrapper}>
        <div className={styles.gameHeader}>
          <h2>{GAME_TITLE}</h2>
        </div>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Error Loading Game</h3>
          <p>There was an error loading your save data: {saveError}</p>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className={styles.theKeeperWrapper}>
      <div className={styles.gameHeader}>
        <h2>{GAME_TITLE}</h2>
        <div className={styles.stats}>
          <span>Moves: {moves}</span>
          <span>Attempts: {attempts}</span>
        </div>
        <div className={styles.controls}>
          <span>
            {isMobile
              ? "Click a neighbouring cell to move or use the directional buttons"
              : "Use mouse, arrow keys or WASD to move"}
          </span>
        </div>
      </div>

      <div className={styles.boardWrapper}>
        <div className={styles.board}>{renderBoard()}</div>
      </div>

      {/* Mobile Directional Pad */}
      {isMobile && (
        <div className={styles.mobileControls}>
          <div className={styles.directionalPad}>
            <div className={styles.dPadRow}>
              <div></div>
              <button
                className={styles.dPadButton}
                onClick={() => handleMobileMove("up")}
                aria-label="Move up"
              >
                ↑
              </button>
              <div></div>
            </div>
            <div className={styles.dPadRow}>
              <button
                className={styles.dPadButton}
                onClick={() => handleMobileMove("left")}
                aria-label="Move left"
              >
                ←
              </button>
              <div className={styles.dPadCenter}></div>
              <button
                className={styles.dPadButton}
                onClick={() => handleMobileMove("right")}
                aria-label="Move right"
              >
                →
              </button>
            </div>
            <div className={styles.dPadRow}>
              <div></div>
              <button
                className={styles.dPadButton}
                onClick={() => handleMobileMove("down")}
                aria-label="Move down"
              >
                ↓
              </button>
              <div></div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.gameControls}>
        <Button onClick={resetGame}>Reset</Button>
        <Button variant="secondary" onClick={handleHintRequest}>
          Hint
        </Button>
      </div>

      {/* Hint Confirmation Modal */}
      <Modal
        isOpen={showHintConfirmation}
        onClose={handleHintCancel}
        title="Use Hint?"
      >
        <p>
          Using a hint will give you a point deduction. Are you sure you want to
          continue?
        </p>
        <div className={styles.buttonRow}>
          <Button variant="secondary" onClick={handleHintCancel}>
            Cancel
          </Button>
          <Button onClick={handleHintConfirm}>Use Hint</Button>
        </div>
      </Modal>

      {/* Hint Modal */}
      <Modal isOpen={showHintModal} onClose={closeHintModal} title="Hint">
        <div className="hintContent">
          <h4>Goal:</h4>
          <p>
            Open the door by stepping on the correct letters and escape without
            getting caught.
          </p>

          <h4>Strategy:</h4>
          <p>
            The keeper's movement is based on the cell values (sum of x + y
            coordinates).
          </p>
          <p>
            Also, if you step into the keeper's cell, it will flee away from
            you.
          </p>
        </div>
        <div className={styles.buttonRow}>
          <Button onClick={closeHintModal}>Got it</Button>
        </div>
      </Modal>
    </div>
  );
};

export default TheKeeper;
