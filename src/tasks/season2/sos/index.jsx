import React, { useState, useCallback, useEffect, useRef } from "react";
import styles from "./SOS.module.css";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import modalStyles from "../../../components/Modal.module.css";
import html2canvas from "html2canvas";
import { useSOSSaveState } from "../../../hooks/useSOSSaveState";

const GRID_SIZE = 10;
const TOTAL_ROUNDS = 3;

// Smart AI function with multiple strategic considerations
const makeAIMove = (grid) => {
  // Find all empty cells
  const emptyCells = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === null) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length === 0) return null;

  // Helper function to check if a move creates an SOS
  const checkSOSOpportunity = (row, col, symbol, gridToCheck) => {
    const directions = [
      [0, -1, 0, 1], // horizontal
      [-1, 0, 1, 0], // vertical
      [-1, -1, 1, 1], // diagonal
      [-1, 1, 1, -1], // diagonal
    ];

    for (const [dr1, dc1, dr2, dc2] of directions) {
      // Check middle position
      const r1 = row + dr1;
      const c1 = col + dc1;
      const r2 = row + dr2;
      const c2 = col + dc2;

      if (
        r1 >= 0 &&
        r1 < GRID_SIZE &&
        c1 >= 0 &&
        c1 < GRID_SIZE &&
        r2 >= 0 &&
        r2 < GRID_SIZE &&
        c2 >= 0 &&
        c2 < GRID_SIZE
      ) {
        const cell1 = gridToCheck[r1][c1];
        const cell2 = gridToCheck[r2][c2];

        if (symbol === "O" && cell1 === "S" && cell2 === "S") {
          return true;
        }
      }

      // Check end positions
      const r1_end = row + dr1;
      const c1_end = col + dc1;
      const r2_end = row + dr1 * 2;
      const c2_end = col + dc1 * 2;

      if (
        r1_end >= 0 &&
        r1_end < GRID_SIZE &&
        c1_end >= 0 &&
        c1_end < GRID_SIZE &&
        r2_end >= 0 &&
        r2_end < GRID_SIZE &&
        c2_end >= 0 &&
        c2_end < GRID_SIZE
      ) {
        const cell1_end = gridToCheck[r1_end][c1_end];
        const cell2_end = gridToCheck[r2_end][c2_end];

        if (symbol === "S" && cell1_end === "O" && cell2_end === "S") {
          return true;
        }
      }

      const r1_end2 = row + dr2;
      const c1_end2 = col + dc2;
      const r2_end2 = row + dr2 * 2;
      const c2_end2 = col + dc2 * 2;

      if (
        r1_end2 >= 0 &&
        r1_end2 < GRID_SIZE &&
        c1_end2 >= 0 &&
        c1_end2 < GRID_SIZE &&
        r2_end2 >= 0 &&
        r2_end2 < GRID_SIZE &&
        c2_end2 >= 0 &&
        c2_end2 < GRID_SIZE
      ) {
        const cell1_end2 = gridToCheck[r1_end2][c1_end2];
        const cell2_end2 = gridToCheck[r2_end2][c2_end2];

        if (symbol === "S" && cell1_end2 === "O" && cell2_end2 === "S") {
          return true;
        }
      }
    }
    return false;
  };

  // Helper function to check if a move blocks opponent's SOS
  const checkBlockingMove = (row, col, symbol, gridToCheck) => {
    const tempGrid = gridToCheck.map((row) => [...row]);
    tempGrid[row][col] = symbol;

    // Check if this prevents opponent from creating SOS
    const opponentSymbol = symbol === "S" ? "O" : "S";
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (tempGrid[r][c] === null) {
          if (checkSOSOpportunity(r, c, opponentSymbol, tempGrid)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Helper function to check if a move gives opponent immediate SOS opportunities
  const checkGivesOpponentSOS = (row, col, symbol, gridToCheck) => {
    const tempGrid = gridToCheck.map((row) => [...row]);
    tempGrid[row][col] = symbol;

    // Check if this creates immediate SOS opportunities for the opponent
    const opponentSymbol = symbol === "S" ? "O" : "S";
    let opponentSOSCount = 0;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (tempGrid[r][c] === null) {
          if (checkSOSOpportunity(r, c, opponentSymbol, tempGrid)) {
            opponentSOSCount++;
          }
        }
      }
    }

    return opponentSOSCount;
  };

  // First, check if AI can create an SOS (highest priority)
  const sosMoves = [];
  for (const { row, col } of emptyCells) {
    if (checkSOSOpportunity(row, col, "S", grid)) {
      sosMoves.push({ row, col, symbol: "S" });
    }
    if (checkSOSOpportunity(row, col, "O", grid)) {
      sosMoves.push({ row, col, symbol: "O" });
    }
  }

  // If AI can create an SOS, do it (with small chance to miss)
  if (sosMoves.length > 0) {
    const missChance = Math.random();
    if (missChance < 0.12) {
      // 12% chance to miss obvious SOS opportunity (human-like mistake)
      // Fall through to safe placement logic
    } else {
      const selectedSOSMove =
        sosMoves[Math.floor(Math.random() * sosMoves.length)];
      return {
        row: selectedSOSMove.row,
        col: selectedSOSMove.col,
        symbol: selectedSOSMove.symbol,
      };
    }
  }

  // If no SOS opportunity, find moves that don't give opponent immediate SOS opportunities
  const safeMoves = [];
  for (const { row, col } of emptyCells) {
    const opponentSOSCountS = checkGivesOpponentSOS(row, col, "S", grid);
    const opponentSOSCountO = checkGivesOpponentSOS(row, col, "O", grid);

    if (opponentSOSCountS === 0) {
      safeMoves.push({ row, col, symbol: "S", opponentSOS: 0 });
    }
    if (opponentSOSCountO === 0) {
      safeMoves.push({ row, col, symbol: "O", opponentSOS: 0 });
    }
  }

  // If there are safe moves, pick one randomly (with human-like variations)
  if (safeMoves.length > 0) {
    const randomChance = Math.random();
    let selectedMove;

    if (randomChance < 0.08) {
      // 8% chance to make a completely random move (big mistake)
      const randomCell =
        emptyCells[Math.floor(Math.random() * emptyCells.length)];
      selectedMove = {
        row: randomCell.row,
        col: randomCell.col,
        symbol: Math.random() > 0.5 ? "S" : "O",
      };
    } else if (randomChance < 0.25) {
      // 17% chance to pick from less optimal safe moves (small mistake)
      // Shuffle safe moves and pick from the latter half
      const shuffledSafeMoves = [...safeMoves].sort(() => Math.random() - 0.5);
      const lessOptimalMoves = shuffledSafeMoves.slice(
        Math.floor(safeMoves.length / 2)
      );
      if (lessOptimalMoves.length > 0) {
        selectedMove =
          lessOptimalMoves[Math.floor(Math.random() * lessOptimalMoves.length)];
      } else {
        selectedMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
      }
    } else {
      // 75% chance to make a good safe move
      selectedMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    }

    return {
      row: selectedMove.row,
      col: selectedMove.col,
      symbol: selectedMove.symbol,
    };
  }

  // If all moves give opponent SOS opportunities, pick the one that gives the fewest
  const allMoves = [];
  for (const { row, col } of emptyCells) {
    const opponentSOSCountS = checkGivesOpponentSOS(row, col, "S", grid);
    const opponentSOSCountO = checkGivesOpponentSOS(row, col, "O", grid);

    allMoves.push({
      row,
      col,
      symbol: opponentSOSCountS <= opponentSOSCountO ? "S" : "O",
      opponentSOS: Math.min(opponentSOSCountS, opponentSOSCountO),
    });
  }

  // Sort by opponent SOS count (fewest first)
  allMoves.sort((a, b) => a.opponentSOS - b.opponentSOS);

  // Pick randomly from moves with the fewest opponent SOS opportunities
  const minOpponentSOS = allMoves[0].opponentSOS;
  const bestMoves = allMoves.filter(
    (move) => move.opponentSOS === minOpponentSOS
  );

  // Add some randomness even in damage control situations
  const damageControlChance = Math.random();
  let selectedMove;

  if (damageControlChance < 0.12) {
    // 12% chance to make a suboptimal move even in damage control
    const worseMoves = allMoves.filter(
      (move) => move.opponentSOS > minOpponentSOS
    );
    if (worseMoves.length > 0) {
      selectedMove = worseMoves[Math.floor(Math.random() * worseMoves.length)];
    } else {
      selectedMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
  } else {
    selectedMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return {
    row: selectedMove.row,
    col: selectedMove.col,
    symbol: selectedMove.symbol,
  };
};

// Check for SOS patterns and return the coordinates if found
const checkSOS = (row, col, symbol, gridToCheck) => {
  const patterns = [];

  // Define all 4 directions: horizontal, vertical, and 2 diagonals
  const directions = [
    [0, -1, 0, 1], // horizontal left-right
    [-1, 0, 1, 0], // vertical top-bottom
    [-1, -1, 1, 1], // diagonal top-left to bottom-right
    [-1, 1, 1, -1], // diagonal top-right to bottom-left
  ];

  for (const [dr1, dc1, dr2, dc2] of directions) {
    // Check for patterns where the new symbol is in the middle
    const r1 = row + dr1;
    const c1 = col + dc1;
    const r2 = row + dr2;
    const c2 = col + dc2;

    if (
      r1 >= 0 &&
      r1 < GRID_SIZE &&
      c1 >= 0 &&
      c1 < GRID_SIZE &&
      r2 >= 0 &&
      r2 < GRID_SIZE &&
      c2 >= 0 &&
      c2 < GRID_SIZE
    ) {
      const cell1 = gridToCheck[r1][c1];
      const cell2 = gridToCheck[r2][c2];

      // Only check for S-O-S pattern (new symbol is O in the middle)
      if (symbol === "O" && cell1 === "S" && cell2 === "S") {
        patterns.push([
          { row: r1, col: c1 },
          { row, col },
          { row: r2, col: c2 },
        ]);
      }
    }

    // Check for patterns where the new symbol is at one end
    const r1_end = row + dr1;
    const c1_end = col + dc1;
    const r2_end = row + dr1 * 2;
    const c2_end = col + dc1 * 2;

    if (
      r1_end >= 0 &&
      r1_end < GRID_SIZE &&
      c1_end >= 0 &&
      c1_end < GRID_SIZE &&
      r2_end >= 0 &&
      r2_end < GRID_SIZE &&
      c2_end >= 0 &&
      c2_end < GRID_SIZE
    ) {
      const cell1_end = gridToCheck[r1_end][c1_end];
      const cell2_end = gridToCheck[r2_end][c2_end];

      // Only check for S-O-S pattern (new symbol is S at one end)
      if (symbol === "S" && cell1_end === "O" && cell2_end === "S") {
        patterns.push([
          { row, col },
          { row: r1_end, col: c1_end },
          { row: r2_end, col: c2_end },
        ]);
      }
    }

    // Check the other end
    const r1_end2 = row + dr2;
    const c1_end2 = col + dc2;
    const r2_end2 = row + dr2 * 2;
    const c2_end2 = col + dc2 * 2;

    if (
      r1_end2 >= 0 &&
      r1_end2 < GRID_SIZE &&
      c1_end2 >= 0 &&
      c1_end2 < GRID_SIZE &&
      r2_end2 >= 0 &&
      r2_end2 < GRID_SIZE &&
      c2_end2 >= 0 &&
      c2_end2 < GRID_SIZE
    ) {
      const cell1_end2 = gridToCheck[r1_end2][c1_end2];
      const cell2_end2 = gridToCheck[r2_end2][c2_end2];

      // Only check for S-O-S pattern (new symbol is S at the other end)
      if (symbol === "S" && cell1_end2 === "O" && cell2_end2 === "S") {
        patterns.push([
          { row, col },
          { row: r1_end2, col: c1_end2 },
          { row: r2_end2, col: c2_end2 },
        ]);
      }
    }
  }

  // Remove duplicate patterns
  const uniquePatterns = patterns.filter((pattern, index, self) => {
    const patternKey = pattern
      .map((p) => `${p.row},${p.col}`)
      .sort()
      .join("|");
    return (
      index ===
      self.findIndex(
        (p) =>
          p
            .map((pos) => `${pos.row},${pos.col}`)
            .sort()
            .join("|") === patternKey
      )
    );
  });

  return {
    found: uniquePatterns.length > 0,
    patterns: uniquePatterns,
  };
};

const SOS = ({ onComplete, currentGameId }) => {
  // Game state
  const [grid, setGrid] = useState(
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState("player");
  const [selectedSymbol, setSelectedSymbol] = useState("S");
  const [cursorPosition, setCursorPosition] = useState({ row: 0, col: 0 });
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [roundWins, setRoundWins] = useState({ player: 0, ai: 0 });
  const [currentRound, setCurrentRound] = useState(1);
  const [gamePhase, setGamePhase] = useState("playing");
  const [lastMove, setLastMove] = useState(null);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showHintContent, setShowHintContent] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [instructionsUsed, setInstructionsUsed] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showInstructionsConfirm, setShowInstructionsConfirm] = useState(false);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [hasKeyboardFocus, setHasKeyboardFocus] = useState(false);
  const [roundSummaries, setRoundSummaries] = useState([]);
  const [capturedBoardImages, setCapturedBoardImages] = useState([]);
  const boardRef = useRef(null);

  // Save/load functionality
  const {
    saveGameState,
    loadGameState,
    clearSaveState,
    isLoading: saveLoading,
    error: saveError,
    cleanup,
  } = useSOSSaveState(currentGameId);

  // Track game start time for submission
  useEffect(() => {
    window.gameStartTime = Date.now();
  }, []);

  // Load game state on component mount
  useEffect(() => {
    const loadState = async () => {
      const savedState = await loadGameState();
      if (savedState) {
        setGrid(savedState.grid);
        setCurrentPlayer(savedState.currentPlayer);
        setSelectedSymbol(savedState.selectedSymbol);
        setCursorPosition(savedState.cursorPosition);
        setPlayerScore(savedState.playerScore);
        setAiScore(savedState.aiScore);
        setRoundWins(savedState.roundWins);
        setCurrentRound(savedState.currentRound);
        setGamePhase(savedState.gamePhase);
        setLastMove(savedState.lastMove);
        setHintUsed(savedState.hintUsed);
        setInstructionsUsed(savedState.instructionsUsed);
        setHighlightedCells(savedState.highlightedCells);
        setRoundSummaries(savedState.roundSummaries);
        setCapturedBoardImages(savedState.capturedBoardImages);
      }
    };

    loadState();
  }, [loadGameState]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Make a move
  const makeMove = useCallback(
    (row, col, symbol) => {
      if (grid[row][col] !== null || currentPlayer !== "player") {
        return false;
      }

      const newGrid = grid.map((row) => [...row]);
      newGrid[row][col] = symbol;
      setGrid(newGrid);
      setLastMove({ row, col, symbol, player: "player" });

      const sosResult = checkSOS(row, col, symbol, newGrid);
      if (sosResult.found) {
        // Award points for each SOS pattern found
        setPlayerScore((prev) => prev + sosResult.patterns.length);
        // Highlight all SOS patterns
        const allPatternCells = sosResult.patterns.flat();
        setHighlightedCells(allPatternCells);
        // Clear highlight after 2 seconds
        setTimeout(() => setHighlightedCells([]), 2000);

        // Save state after player move with SOS
        saveGameState({
          grid: newGrid,
          currentPlayer: "player",
          selectedSymbol,
          cursorPosition,
          playerScore: playerScore + sosResult.patterns.length,
          aiScore,
          roundWins,
          currentRound,
          gamePhase,
          lastMove: { row, col, symbol, player: "player" },
          hintUsed,
          instructionsUsed,
          highlightedCells: allPatternCells,
          roundSummaries,
          capturedBoardImages,
        });

        return true; // Player gets another turn
      } else {
        setCurrentPlayer("ai");

        // Save state after player move without SOS
        saveGameState({
          grid: newGrid,
          currentPlayer: "ai",
          selectedSymbol,
          cursorPosition,
          playerScore,
          aiScore,
          roundWins,
          currentRound,
          gamePhase,
          lastMove: { row, col, symbol, player: "player" },
          hintUsed,
          instructionsUsed,
          highlightedCells,
          roundSummaries,
          capturedBoardImages,
        });

        return false;
      }
    },
    [
      grid,
      currentPlayer,
      selectedSymbol,
      cursorPosition,
      playerScore,
      aiScore,
      roundWins,
      currentRound,
      gamePhase,
      hintUsed,
      instructionsUsed,
      highlightedCells,
      roundSummaries,
      capturedBoardImages,
      saveGameState,
    ]
  );

  // Handle cell click
  const handleCellClick = useCallback(
    (row, col) => {
      if (currentPlayer !== "player" || grid[row][col] !== null) {
        return;
      }
      // Remove keyboard focus when clicking
      setHasKeyboardFocus(false);
      const sosFound = makeMove(row, col, selectedSymbol);
      // If SOS was found, player gets another turn (don't switch to AI)
      // The makeMove function already handles the turn switching
    },
    [currentPlayer, grid, makeMove, selectedSymbol]
  );

  // AI turn - following Order & Chaos pattern exactly
  useEffect(() => {
    if (currentPlayer === "ai") {
      const timer = setTimeout(() => {
        const aiMove = makeAIMove(grid);
        if (aiMove) {
          const newGrid = grid.map((row) => [...row]);
          newGrid[aiMove.row][aiMove.col] = aiMove.symbol;

          setGrid(newGrid);
          setLastMove({
            row: aiMove.row,
            col: aiMove.col,
            symbol: aiMove.symbol,
            player: "ai",
          });

          // Check for SOS
          const sosResult = checkSOS(
            aiMove.row,
            aiMove.col,
            aiMove.symbol,
            newGrid
          );

          if (sosResult.found) {
            // Award points for each SOS pattern found
            setAiScore((prev) => prev + sosResult.patterns.length);
            // Highlight all SOS patterns
            const allPatternCells = sosResult.patterns.flat();
            setHighlightedCells(allPatternCells);
            // Clear highlight after 2 seconds
            setTimeout(() => setHighlightedCells([]), 2000);
            setCurrentPlayer("ai"); // AI gets another turn

            // Save state after AI move with SOS
            saveGameState({
              grid: newGrid,
              currentPlayer: "ai",
              selectedSymbol,
              cursorPosition,
              playerScore,
              aiScore: aiScore + sosResult.patterns.length,
              roundWins,
              currentRound,
              gamePhase,
              lastMove: {
                row: aiMove.row,
                col: aiMove.col,
                symbol: aiMove.symbol,
                player: "ai",
              },
              hintUsed,
              instructionsUsed,
              highlightedCells: allPatternCells,
              roundSummaries,
              capturedBoardImages,
            });
          } else {
            setCurrentPlayer("player");

            // Save state after AI move without SOS
            saveGameState({
              grid: newGrid,
              currentPlayer: "player",
              selectedSymbol,
              cursorPosition,
              playerScore,
              aiScore,
              roundWins,
              currentRound,
              gamePhase,
              lastMove: {
                row: aiMove.row,
                col: aiMove.col,
                symbol: aiMove.symbol,
                player: "ai",
              },
              hintUsed,
              instructionsUsed,
              highlightedCells,
              roundSummaries,
              capturedBoardImages,
            });
          }
        } else {
          setCurrentPlayer("player");
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, grid]);

  // Check if grid is full
  const isGridFull = useCallback(() => {
    return grid.every((row) => row.every((cell) => cell !== null));
  }, [grid]);

  // Capture board as image
  const captureBoardImage = useCallback(async () => {
    if (boardRef.current) {
      try {
        const canvas = await html2canvas(boardRef.current, {
          backgroundColor: null,
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
        });
        const imageDataUrl = canvas.toDataURL("image/png");
        return imageDataUrl;
      } catch (error) {
        return null;
      }
    }
    return null;
  }, []);

  // Check for round end
  useEffect(() => {
    if (isGridFull() && gamePhase === "playing") {
      // Capture board image when round ends
      const captureAndEndRound = async () => {
        const boardImage = await captureBoardImage();

        // Determine round winner
        const roundWinner =
          playerScore > aiScore
            ? "player"
            : aiScore > playerScore
              ? "ai"
              : "tie";

        // Update round wins immediately
        if (roundWinner !== "tie") {
          setRoundWins((prev) => ({
            ...prev,
            [roundWinner]: prev[roundWinner] + 1,
          }));
        }

        // Store round summary immediately - flatten board for Firebase compatibility
        const roundSummary = {
          round: currentRound,
          playerScore,
          aiScore,
          winner: roundWinner,
          boardImage,
          board: grid.flat(), // Flatten 2D grid to 1D for Firebase
        };

        setRoundSummaries((prev) => [...prev, roundSummary]);
        setGamePhase("roundEnd");

        // Save state immediately after round completion with updated round wins
        const updatedRoundWins = { ...roundWins };
        if (roundWinner !== "tie") {
          updatedRoundWins[roundWinner] =
            (updatedRoundWins[roundWinner] || 0) + 1;
        }

        saveGameState({
          grid,
          currentPlayer,
          selectedSymbol,
          cursorPosition,
          playerScore,
          aiScore,
          roundWins: updatedRoundWins,
          currentRound,
          gamePhase: "roundEnd",
          lastMove,
          hintUsed,
          instructionsUsed,
          highlightedCells,
          roundSummaries: [...roundSummaries, roundSummary],
          capturedBoardImages,
        });
      };

      captureAndEndRound();
    }
  }, [
    grid,
    gamePhase,
    isGridFull,
    captureBoardImage,
    currentRound,
    playerScore,
    aiScore,
  ]);

  // End round
  const endRound = useCallback(async () => {
    // Round wins and summary are already captured when round ends

    if (currentRound < TOTAL_ROUNDS) {
      const newRound = currentRound + 1;
      const newGrid = Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(null));

      setCurrentRound(newRound);
      setGrid(newGrid);
      setPlayerScore(0);
      setAiScore(0);
      setCurrentPlayer("player");
      setGamePhase("playing");
      setLastMove(null);
      setCursorPosition({ row: 0, col: 0 });
      setHasKeyboardFocus(false);
      // Don't reset hint state - hint can only be used once per game
      setShowHintContent(false);

      // Calculate updated round wins from the latest round summary
      const updatedRoundWins = { ...roundWins };
      if (roundSummaries.length > 0) {
        const lastRound = roundSummaries[roundSummaries.length - 1];
        if (lastRound.winner !== "tie") {
          updatedRoundWins[lastRound.winner] =
            (updatedRoundWins[lastRound.winner] || 0) + 1;
        }
      }

      // Save state after round completion
      saveGameState({
        grid: newGrid,
        currentPlayer: "player",
        selectedSymbol,
        cursorPosition: { row: 0, col: 0 },
        playerScore: 0,
        aiScore: 0,
        roundWins: updatedRoundWins,
        currentRound: newRound,
        gamePhase: "playing",
        lastMove: null,
        hintUsed,
        instructionsUsed,
        highlightedCells: [],
        roundSummaries,
        capturedBoardImages,
      });
    } else {
      setGamePhase("gameEnd");

      // Submit game data when all 3 rounds are completed
      if (onComplete) {
        const timeSpent = window.gameStartTime
          ? Date.now() - window.gameStartTime
          : 0;

        // Calculate totals from round summaries
        const totalPlayerScore = roundSummaries.reduce(
          (sum, round) => sum + round.playerScore,
          0
        );
        const totalAiScore = roundSummaries.reduce(
          (sum, round) => sum + round.aiScore,
          0
        );
        const playerWins = roundSummaries.filter(
          (round) => round.winner === "player"
        ).length;
        const aiWins = roundSummaries.filter(
          (round) => round.winner === "ai"
        ).length;
        const ties = roundSummaries.filter(
          (round) => round.winner === "tie"
        ).length;

        // Determine game winner
        let gameWinner = "tie";
        if (playerWins > aiWins) {
          gameWinner = "player";
        } else if (aiWins > playerWins) {
          gameWinner = "ai";
        }

        // Calculate final score: 2 points per round won, minus penalties
        const finalScore = Math.max(
          0,
          playerWins * 2 - (hintUsed ? 1 : 0) - (instructionsUsed ? 1 : 0)
        );

        const submissionData = {
          rounds: roundSummaries.map((round) => ({
            round: round.round,
            playerScore: round.playerScore,
            aiScore: round.aiScore,
            winner: round.winner,
            boardState: JSON.stringify(round.board), // Convert board to string for Firebase
          })),
          totalPlayerScore: totalPlayerScore,
          totalAiScore: totalAiScore,
          playerWins: playerWins,
          aiWins: aiWins,
          ties: ties,
          gameWinner: gameWinner,
          timeSpent: timeSpent,
          hintsUsed: hintUsed ? 1 : 0,
          instructionsUsed: instructionsUsed ? 1 : 0,
          completed: true,
          score: finalScore, // 2 points per round won minus penalties
        };

        console.log("🎮 SOS - Game Completed Submission:", submissionData);
        // Use currentGameId if available, otherwise fall back to base game ID
        const gameId = currentGameId || "sos";
        onComplete(gameId, submissionData);

        // Clear save state after game completion
        clearSaveState();
      }
    }
  }, [
    playerScore,
    aiScore,
    currentRound,
    captureBoardImage,
    grid,
    roundSummaries,
    hintUsed,
    onComplete,
    clearSaveState,
  ]);

  // Handle hint button click
  const handleHint = useCallback(() => {
    if (hintUsed) {
      setShowHintContent(true);
    } else {
      setShowHintModal(true);
    }
  }, [hintUsed]);

  // Handle instructions button click
  const handleInstructions = useCallback(() => {
    if (!instructionsUsed) {
      setShowInstructionsConfirm(true);
    } else {
      setShowInstructionsModal(true);
    }
  }, [instructionsUsed]);

  // Use hint
  const useHint = useCallback(() => {
    setHintUsed(true);
    setShowHintModal(false);
    setShowHintContent(true);

    // Save state after hint usage
    saveGameState({
      grid,
      currentPlayer,
      selectedSymbol,
      cursorPosition,
      playerScore,
      aiScore,
      roundWins,
      currentRound,
      gamePhase,
      lastMove,
      hintUsed: true,
      instructionsUsed,
      highlightedCells,
      roundSummaries,
      capturedBoardImages,
    });
  }, [
    grid,
    currentPlayer,
    selectedSymbol,
    cursorPosition,
    playerScore,
    aiScore,
    roundWins,
    currentRound,
    gamePhase,
    lastMove,
    instructionsUsed,
    highlightedCells,
    roundSummaries,
    capturedBoardImages,
    saveGameState,
  ]);

  // Use instructions
  const useInstructions = useCallback(() => {
    setInstructionsUsed(true);
    setShowInstructionsConfirm(false);
    setShowInstructionsModal(true);

    // Save state after instructions usage
    saveGameState({
      grid,
      currentPlayer,
      selectedSymbol,
      cursorPosition,
      playerScore,
      aiScore,
      roundWins,
      currentRound,
      gamePhase,
      lastMove,
      hintUsed,
      instructionsUsed: true,
      highlightedCells,
      roundSummaries,
      capturedBoardImages,
    });
  }, [
    grid,
    currentPlayer,
    selectedSymbol,
    cursorPosition,
    playerScore,
    aiScore,
    roundWins,
    currentRound,
    gamePhase,
    lastMove,
    hintUsed,
    highlightedCells,
    roundSummaries,
    capturedBoardImages,
    saveGameState,
  ]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gamePhase !== "playing" || currentPlayer !== "player") return;

      // Set keyboard focus when any key is pressed
      setHasKeyboardFocus(true);

      switch (e.key) {
        case "r":
        case "R":
          // Toggle between S and O
          setSelectedSymbol((prev) => (prev === "S" ? "O" : "S"));
          break;
        case "ArrowUp":
          e.preventDefault();
          setCursorPosition((prev) => ({
            ...prev,
            row: Math.max(0, prev.row - 1),
          }));
          break;
        case "ArrowDown":
          e.preventDefault();
          setCursorPosition((prev) => ({
            ...prev,
            row: Math.min(GRID_SIZE - 1, prev.row + 1),
          }));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCursorPosition((prev) => ({
            ...prev,
            col: Math.max(0, prev.col - 1),
          }));
          break;
        case "ArrowRight":
          e.preventDefault();
          setCursorPosition((prev) => ({
            ...prev,
            col: Math.min(GRID_SIZE - 1, prev.col + 1),
          }));
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          handleCellClick(cursorPosition.row, cursorPosition.col);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gamePhase, currentPlayer, cursorPosition, handleCellClick]);

  // Reset game
  const resetGame = useCallback(() => {
    setGrid(
      Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(null))
    );
    setPlayerScore(0);
    setAiScore(0);
    setRoundWins({ player: 0, ai: 0 });
    setCurrentRound(1);
    setGamePhase("playing");
    setCurrentPlayer("player");
    setLastMove(null);
    setSelectedSymbol("S");
    setCursorPosition({ row: 0, col: 0 });
    setHasKeyboardFocus(false);
    // Don't reset hint state - hint can only be used once per game
    setShowHintContent(false);
    setRoundSummaries([]);
    setCapturedBoardImages([]);
  }, []);

  // Render game board
  const renderBoard = () => {
    return (
      <div className={styles.board} ref={boardRef}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`${styles.cell} ${
                cell === "S"
                  ? styles.cellS
                  : cell === "O"
                    ? styles.cellO
                    : styles.cellEmpty
              } ${
                lastMove?.row === rowIndex && lastMove?.col === colIndex
                  ? styles.lastMove
                  : ""
              } ${
                highlightedCells.some(
                  (pos) => pos.row === rowIndex && pos.col === colIndex
                )
                  ? styles.sosHighlight
                  : ""
              } ${
                cursorPosition.row === rowIndex &&
                cursorPosition.col === colIndex &&
                currentPlayer === "player" &&
                gamePhase === "playing" &&
                hasKeyboardFocus
                  ? styles.cursor
                  : ""
              }`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              disabled={
                currentPlayer !== "player" || grid[rowIndex][colIndex] !== null
              }
            >
              {cell}
            </button>
          ))
        )}
      </div>
    );
  };

  // Render symbol selector with buttons
  const renderSymbolSelector = () => {
    return (
      <div className={styles.symbolSelectorContainer}>
        <Button onClick={handleHint} variant="secondary" size="small">
          Hint
        </Button>
        <div className={styles.symbolSelector}>
          <button
            className={`${styles.symbolButton} ${selectedSymbol === "S" ? styles.selected : ""}`}
            onClick={() => setSelectedSymbol("S")}
          >
            S
          </button>
          <button
            className={`${styles.symbolButton} ${selectedSymbol === "O" ? styles.selected : ""}`}
            onClick={() => setSelectedSymbol("O")}
          >
            O
          </button>
        </div>
        <Button
          onClick={handleInstructions}
          variant="secondary"
          size="small"
          className={instructionsUsed ? styles.instructionsButtonUsed : ""}
        >
          Instructions
          {!instructionsUsed && (
            <span className={styles.penaltyText}> (-1 point)</span>
          )}
        </Button>
      </div>
    );
  };

  // Render score display
  const renderScoreDisplay = () => {
    return (
      <div className={styles.scoreDisplay}>
        <div className={styles.playerInfo}>Your Score: {playerScore}</div>
        <div className={styles.scoreCenter}>
          <div className={styles.roundInfo}>
            Round {currentRound}/{TOTAL_ROUNDS}
          </div>

          <div className={styles.totalScore}>
            {currentPlayer === "player" ? "Your Turn" : "AI Thinking..."}
          </div>
        </div>
        <div className={styles.objective}>AI Score: {aiScore}</div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>S.O.S</h1>
      <p className={styles.description}></p>

      {renderScoreDisplay()}

      <div
        className={styles.gameArea}
        onClick={() => setHasKeyboardFocus(false)}
      >
        {gamePhase === "playing" && (
          <>
            {renderSymbolSelector()}
            {renderBoard()}
          </>
        )}

        {gamePhase === "roundEnd" && (
          <div className={styles.roundEndContent}>
            <div className={styles.roundScore}>
              <h3>Round {currentRound} Complete!</h3>

              {/* Current Round Scores */}
              <div className={styles.scoreDisplay}>
                <div className={styles.scoreCard}>
                  <div className={styles.scoreLabel}>Player</div>
                  <div className={styles.scoreValue}>{playerScore}</div>
                </div>
                <div className={styles.scoreCard}>
                  <div className={styles.scoreLabel}>AI</div>
                  <div className={styles.scoreValue}>{aiScore}</div>
                </div>
              </div>

              <p className={styles.roundWinner}>
                {playerScore > aiScore
                  ? "You won this round!"
                  : aiScore > playerScore
                    ? "AI won this round!"
                    : "It's a tie!"}
              </p>

              {/* Round Wins Summary */}
              <div className={styles.roundWinsSummary}>
                <h4>Round Wins</h4>
                <div className={styles.winsDisplay}>
                  <div className={styles.winCard}>
                    <div className={styles.winLabel}>You</div>
                    <div className={styles.winCount}>{roundWins.player}</div>
                  </div>
                  <div className={styles.winCard}>
                    <div className={styles.winLabel}>AI</div>
                    <div className={styles.winCount}>{roundWins.ai}</div>
                  </div>
                </div>
              </div>

              {/* Board Screenshot */}
              {roundSummaries.length > 0 &&
                roundSummaries[roundSummaries.length - 1].boardImage && (
                  <div className={styles.roundBoardImage}>
                    <h4>Final Board</h4>
                    <img
                      src={roundSummaries[roundSummaries.length - 1].boardImage}
                      alt={`Round ${currentRound} final board`}
                      className={styles.finalBoardImage}
                    />
                  </div>
                )}
            </div>
            <div className={styles.roundActions}>
              <Button onClick={endRound} variant="primary">
                {currentRound < TOTAL_ROUNDS
                  ? "Next Round"
                  : "See Final Results"}
              </Button>
            </div>
          </div>
        )}

        {gamePhase === "gameEnd" && (
          <div className={styles.gameEndContent}>
            <div className={styles.finalScore}>
              <h3>Game Complete!</h3>

              {/* Calculate total points */}
              {(() => {
                const totalPlayerPoints = roundSummaries.reduce(
                  (sum, summary) => sum + summary.playerScore,
                  0
                );
                const totalAiPoints = roundSummaries.reduce(
                  (sum, summary) => sum + summary.aiScore,
                  0
                );
                return (
                  <>
                    {/* Combined Final Stats Display */}
                    <div className={styles.finalWinsDisplay}>
                      {/* Player Total Points (Left) */}
                      <div className={styles.finalPointsCard}>
                        <div className={styles.finalPointsLabel}>You</div>
                        <div className={styles.finalPointsCount}>
                          {totalPlayerPoints}
                        </div>
                        <div className={styles.finalPointsText}>
                          Total Points
                        </div>
                      </div>

                      {/* Round Wins (Center) */}
                      <div className={styles.finalWinCard}>
                        <div className={styles.finalWinLabel}>You</div>
                        <div className={styles.finalWinCount}>
                          {roundWins.player}
                        </div>
                        <div className={styles.finalWinText}>Rounds Won</div>
                      </div>
                      <div className={styles.finalWinCard}>
                        <div className={styles.finalWinLabel}>AI</div>
                        <div className={styles.finalWinCount}>
                          {roundWins.ai}
                        </div>
                        <div className={styles.finalWinText}>Rounds Won</div>
                      </div>

                      {/* AI Total Points (Right) */}
                      <div className={styles.finalPointsCard}>
                        <div className={styles.finalPointsLabel}>AI</div>
                        <div className={styles.finalPointsCount}>
                          {totalAiPoints}
                        </div>
                        <div className={styles.finalPointsText}>
                          Total Points
                        </div>
                      </div>
                    </div>

                    <p className={styles.gameWinner}>
                      {roundWins.player > roundWins.ai
                        ? "Congratulations! You won!"
                        : roundWins.ai > roundWins.player
                          ? "AI wins the game!"
                          : "It's a tie game!"}
                    </p>
                  </>
                );
              })()}
            </div>

            <div className={styles.roundSummaries}>
              <h4>Round Results</h4>
              <div className={styles.summaryGrid}>
                {roundSummaries.map((summary, index) => (
                  <div key={index} className={styles.roundSummary}>
                    <h5>Round {summary.round}</h5>
                    <div className={styles.scoreInfo}>
                      <span>Player: {summary.playerScore}</span>
                      <span>AI: {summary.aiScore}</span>
                    </div>
                    {summary.boardImage && (
                      <div className={styles.boardImage}>
                        <img
                          src={summary.boardImage}
                          alt={`Round ${summary.round} board`}
                          className={styles.summaryBoardImage}
                        />
                      </div>
                    )}
                    <div className={styles.roundWinner}>
                      {summary.winner === "player"
                        ? "You won this round!"
                        : summary.winner === "ai"
                          ? "AI won this round!"
                          : "It's a tie!"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.controlsInfo}>
        <h3>Controls</h3>
        <div className={styles.controlsGrid}>
          <div>
            <strong>Mouse:</strong> Click S/O buttons, click grid to place
          </div>
          <div>
            <strong>Keyboard:</strong> Press R to switch S/O, arrow keys to
            navigate, Space/Enter to place
          </div>
        </div>
      </div>

      {/* Hint Confirmation Modal */}
      <Modal
        isOpen={showHintModal}
        onClose={() => setShowHintModal(false)}
        title="Use Hint?"
      >
        <div>
          <p>Are you sure you want to use a hint?</p>
          <p>
            <strong>Note:</strong> You can only use the hint once per game. Once
            used, you can view it again in any round.
          </p>
          <div className={modalStyles.modalButtons}>
            <Button onClick={useHint} variant="primary" size="small">
              Yes, Use Hint
            </Button>
            <Button
              onClick={() => setShowHintModal(false)}
              variant="secondary"
              size="small"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Instructions Confirmation Modal */}
      <Modal
        isOpen={showInstructionsConfirm}
        onClose={() => setShowInstructionsConfirm(false)}
        title="Use Instructions?"
      >
        <div>
          <p>Are you sure you want to use instructions?</p>
          <p>
            <strong>Warning:</strong> Using instructions will deduct 1 point
            from your final score.
          </p>
          <div className={modalStyles.modalButtons}>
            <Button onClick={useInstructions} variant="primary" size="small">
              Yes, Use Instructions
            </Button>
            <Button
              onClick={() => setShowInstructionsConfirm(false)}
              variant="secondary"
              size="small"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Instructions Modal */}
      <Modal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        title="S.O.S Instructions"
      >
        <div className="hintContent">
          <h4>How to Play:</h4>
          <p>
            Create <strong>SOS</strong> patterns by placing S and O symbols
            strategically. Each SOS pattern you complete gives you an extra turn
            and points.
          </p>

          <h4>Game Rules:</h4>
          <ul>
            <li>
              <strong>You go first</strong> - Place either S or O on the board
            </li>
            <li>
              <strong>AI goes second</strong> - The computer will then place its
              symbol.
            </li>
            <li>
              <strong>SOS patterns:</strong> Create S-O-S horizontally,
              vertically, or diagonally
            </li>
            <li>
              <strong>Extra turns:</strong> Each SOS you complete gives you
              another turn
            </li>
            <li>
              <strong>Scoring:</strong> Each SOS pattern scores 1 point
            </li>
            <li>
              <strong>Game end:</strong> When the board is full, highest score
              wins
            </li>
          </ul>
        </div>
      </Modal>

      {/* Hint Content Modal */}
      <Modal
        isOpen={showHintContent}
        onClose={() => setShowHintContent(false)}
        title="S.O.S Strategy Hint"
      >
        <div className="hintContent">
          <h4>Strategic Tips:</h4>
          <ul>
            <li>
              <strong>Chain multiple SOS patterns</strong> - One SOS completion
              gives you an extra turn. Use your extra turn to create another SOS
              pattern for big point combinations.
            </li>
            <li>
              <strong>Play defensively</strong> - Don't set up easy SOS
              opportunities for your opponent. Block potential SOS patterns when
              possible and think ahead about your opponent's next move.
            </li>
            <li>
              <strong>Create multiple possibilities</strong> - Set up areas
              where you can create multiple SOS patterns. As the grid fills up,
              more SOS opportunities will appear.
            </li>
          </ul>

          <p>
            <strong>Remember:</strong> The key to winning is not just creating
            SOS patterns, but preventing your opponent from creating them too!
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default SOS;
