import { BOARD_SIZE, WIN_LENGTH } from "./constants";

// Check if a player has won by getting WIN_LENGTH in a row
export const checkWin = (board, symbol, winLength = WIN_LENGTH) => {
  // Check horizontal lines
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col <= BOARD_SIZE - winLength; col++) {
      let count = 0;
      for (let i = 0; i < winLength; i++) {
        if (board[row][col + i] === symbol) {
          count++;
        } else {
          break;
        }
      }
      if (count === winLength) {
        // Check ends
        const before = col - 1 >= 0 ? board[row][col - 1] : null;
        const after =
          col + winLength < BOARD_SIZE ? board[row][col + winLength] : null;
        if (before !== symbol && after !== symbol) return true;
      }
    }
  }

  // Check vertical lines
  for (let row = 0; row <= BOARD_SIZE - winLength; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      let count = 0;
      for (let i = 0; i < winLength; i++) {
        if (board[row + i][col] === symbol) {
          count++;
        } else {
          break;
        }
      }
      if (count === winLength) {
        const before = row - 1 >= 0 ? board[row - 1][col] : null;
        const after =
          row + winLength < BOARD_SIZE ? board[row + winLength][col] : null;
        if (before !== symbol && after !== symbol) return true;
      }
    }
  }

  // Check diagonal lines (top-left to bottom-right)
  for (let row = 0; row <= BOARD_SIZE - winLength; row++) {
    for (let col = 0; col <= BOARD_SIZE - winLength; col++) {
      let count = 0;
      for (let i = 0; i < winLength; i++) {
        if (board[row + i][col + i] === symbol) {
          count++;
        } else {
          break;
        }
      }
      if (count === winLength) {
        const before =
          row - 1 >= 0 && col - 1 >= 0 ? board[row - 1][col - 1] : null;
        const after =
          row + winLength < BOARD_SIZE && col + winLength < BOARD_SIZE
            ? board[row + winLength][col + winLength]
            : null;
        if (before !== symbol && after !== symbol) return true;
      }
    }
  }

  // Check diagonal lines (top-right to bottom-left)
  for (let row = 0; row <= BOARD_SIZE - winLength; row++) {
    for (let col = winLength - 1; col < BOARD_SIZE; col++) {
      let count = 0;
      for (let i = 0; i < winLength; i++) {
        if (board[row + i][col - i] === symbol) {
          count++;
        } else {
          break;
        }
      }
      if (count === winLength) {
        const before =
          row - 1 >= 0 && col + 1 < BOARD_SIZE ? board[row - 1][col + 1] : null;
        const after =
          row + winLength < BOARD_SIZE && col - winLength >= 0
            ? board[row + winLength][col - winLength]
            : null;
        if (before !== symbol && after !== symbol) return true;
      }
    }
  }

  return false;
};

// Check if the game is a draw (board is full)
export const checkDraw = (board) => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) {
        return false;
      }
    }
  }
  return true;
};

// Get all valid moves (empty positions)
export const getValidMoves = (board) => {
  const moves = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
};

// Count symbols on the board
export const countSymbols = (board, symbol) => {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === symbol) {
        count++;
      }
    }
  }
  return count;
};

// Get all possible winning lines for a symbol
export const getWinningLines = (board, symbol, winLength = WIN_LENGTH) => {
  const lines = [];

  // Horizontal lines
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col <= BOARD_SIZE - winLength; col++) {
      const line = [];
      for (let i = 0; i < winLength; i++) {
        line.push({ row: row, col: col + i, value: board[row][col + i] });
      }
      lines.push(line);
    }
  }

  // Vertical lines
  for (let row = 0; row <= BOARD_SIZE - winLength; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const line = [];
      for (let i = 0; i < winLength; i++) {
        line.push({ row: row + i, col: col, value: board[row + i][col] });
      }
      lines.push(line);
    }
  }

  // Diagonal lines (top-left to bottom-right)
  for (let row = 0; row <= BOARD_SIZE - winLength; row++) {
    for (let col = 0; col <= BOARD_SIZE - winLength; col++) {
      const line = [];
      for (let i = 0; i < winLength; i++) {
        line.push({
          row: row + i,
          col: col + i,
          value: board[row + i][col + i],
        });
      }
      lines.push(line);
    }
  }

  // Diagonal lines (top-right to bottom-left)
  for (let row = 0; row <= BOARD_SIZE - winLength; row++) {
    for (let col = winLength - 1; col < BOARD_SIZE; col++) {
      const line = [];
      for (let i = 0; i < winLength; i++) {
        line.push({
          row: row + i,
          col: col - i,
          value: board[row + i][col - i],
        });
      }
      lines.push(line);
    }
  }

  return lines;
};

// Evaluate the strength of a line for a symbol
export const evaluateLine = (line, symbol) => {
  const symbolCount = line.filter((cell) => cell.value === symbol).length;
  const emptyCount = line.filter((cell) => cell.value === null).length;
  const opponentCount = line.filter(
    (cell) => cell.value !== null && cell.value !== symbol
  ).length;

  // If opponent has any pieces in this line, it's blocked
  if (opponentCount > 0) {
    return 0;
  }

  // Return score based on how close to winning
  if (symbolCount === WIN_LENGTH) return 1000; // Win
  if (symbolCount === WIN_LENGTH - 1 && emptyCount === 1) return 100; // One move from win
  if (symbolCount === WIN_LENGTH - 2 && emptyCount === 2) return 10; // Two moves from win
  if (symbolCount === WIN_LENGTH - 3 && emptyCount === 3) return 1; // Three moves from win

  return 0;
};
