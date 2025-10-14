import {
  checkWin,
  checkDraw,
  getValidMoves,
  getWinningLines,
  evaluateLine,
  countSymbols,
} from "./gameLogic";
import { BOARD_SIZE, WIN_LENGTH, SYMBOLS } from "./constants";

// Make a computer move as Order
export const makeComputerMove = (board, lastPlayerSymbol) => {
  const validMoves = getValidMoves(board);
  if (validMoves.length === 0) return null;

  // Determine which symbol to use for this move
  const symbol = chooseSymbol(board, lastPlayerSymbol);

  // Find the best move
  const bestMove = findBestMove(board, symbol, validMoves);

  return {
    row: bestMove.row,
    col: bestMove.col,
    symbol: bestMove.symbol,
  };
};

// Choose which symbol to use for this move
const chooseSymbol = (board, lastPlayerSymbol) => {
  const xCount = countSymbols(board, SYMBOLS.X);
  const oCount = countSymbols(board, SYMBOLS.O);

  // If one symbol is significantly ahead, use the other to balance
  if (xCount > oCount + 2) return SYMBOLS.O;
  if (oCount > xCount + 2) return SYMBOLS.X;

  // Otherwise, choose based on which symbol has better winning potential
  const xPotential = evaluateBoardForSymbol(board, SYMBOLS.X);
  const oPotential = evaluateBoardForSymbol(board, SYMBOLS.O);

  if (xPotential > oPotential) return SYMBOLS.X;
  if (oPotential > xPotential) return SYMBOLS.O;

  // Tie breaker: use the opposite of last player's symbol
  return lastPlayerSymbol === SYMBOLS.X ? SYMBOLS.O : SYMBOLS.X;
};

// Find the best move for the computer
const findBestMove = (board, symbol, validMoves) => {
  let bestScore = -Infinity;
  let bestMove = null;

  for (const move of validMoves) {
    // Try both symbols for this position
    for (const testSymbol of [SYMBOLS.X, SYMBOLS.O]) {
      const newBoard = board.map((row) => [...row]);
      newBoard[move.row][move.col] = testSymbol;

      // Check if this move wins immediately
      if (checkWin(newBoard, testSymbol, WIN_LENGTH)) {
        return { ...move, symbol: testSymbol };
      }

      // Evaluate this move
      const score = evaluateMove(newBoard, testSymbol, move);

      if (score > bestScore) {
        bestScore = score;
        bestMove = { ...move, symbol: testSymbol };
      }
    }
  }

  return bestMove || { ...validMoves[0], symbol: symbol };
};

// Evaluate a specific move
const evaluateMove = (board, symbol, move) => {
  let score = 0;

  // Check if this move creates a winning threat
  const lines = getWinningLines(board, symbol, WIN_LENGTH);
  for (const line of lines) {
    const lineScore = evaluateLine(line, symbol);
    score += lineScore;
  }

  // Bonus for center positions (more strategic value)
  const centerBonus = getCenterBonus(move.row, move.col);
  score += centerBonus;

  // Bonus for creating multiple threats
  const threatBonus = getThreatBonus(board, symbol, move);
  score += threatBonus;

  // Penalty for moves that help opponent
  const opponentPenalty = getOpponentPenalty(board, symbol, move);
  score -= opponentPenalty;

  return score;
};

// Get bonus for center positions
const getCenterBonus = (row, col) => {
  const center = Math.floor(BOARD_SIZE / 2);
  const distanceFromCenter = Math.abs(row - center) + Math.abs(col - center);
  return Math.max(0, 5 - distanceFromCenter);
};

// Get bonus for creating multiple threats
const getThreatBonus = (board, symbol, move) => {
  const newBoard = board.map((row) => [...row]);
  newBoard[move.row][move.col] = symbol;

  let threatCount = 0;
  const lines = getWinningLines(newBoard, symbol, WIN_LENGTH);

  for (const line of lines) {
    const symbolCount = line.filter((cell) => cell.value === symbol).length;
    const emptyCount = line.filter((cell) => cell.value === null).length;

    if (symbolCount >= WIN_LENGTH - 2 && emptyCount >= 1) {
      threatCount++;
    }
  }

  return threatCount * 10;
};

// Get penalty for moves that help opponent
const getOpponentPenalty = (board, symbol, move) => {
  const opponentSymbol = symbol === SYMBOLS.X ? SYMBOLS.O : SYMBOLS.X;
  const newBoard = board.map((row) => [...row]);
  newBoard[move.row][move.col] = symbol;

  // Check if this move allows opponent to win next turn
  const opponentLines = getWinningLines(newBoard, opponentSymbol, WIN_LENGTH);
  for (const line of opponentLines) {
    const opponentCount = line.filter(
      (cell) => cell.value === opponentSymbol
    ).length;
    const emptyCount = line.filter((cell) => cell.value === null).length;

    if (opponentCount === WIN_LENGTH - 1 && emptyCount === 1) {
      return 50; // High penalty for allowing immediate win
    }
  }

  return 0;
};

// Evaluate the entire board for a specific symbol
const evaluateBoardForSymbol = (board, symbol) => {
  const lines = getWinningLines(board, symbol, WIN_LENGTH);
  let totalScore = 0;

  for (const line of lines) {
    totalScore += evaluateLine(line, symbol);
  }

  return totalScore;
};

// Check if a move blocks an immediate opponent win
const blocksOpponentWin = (board, move, symbol) => {
  const opponentSymbol = symbol === SYMBOLS.X ? SYMBOLS.O : SYMBOLS.X;
  const newBoard = board.map((row) => [...row]);
  newBoard[move.row][move.col] = symbol;

  // Check if opponent can still win after this move
  const opponentLines = getWinningLines(newBoard, opponentSymbol, WIN_LENGTH);
  for (const line of opponentLines) {
    const opponentCount = line.filter(
      (cell) => cell.value === opponentSymbol
    ).length;
    const emptyCount = line.filter((cell) => cell.value === null).length;

    if (opponentCount === WIN_LENGTH - 1 && emptyCount === 1) {
      return false; // Opponent can still win
    }
  }

  return true;
};
