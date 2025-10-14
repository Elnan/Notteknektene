// Game configuration for Sum Grid (5x5) - Operation-based puzzles
// Players input the result of operations (+, -, ×, ÷) between row and column numbers

const puzzles = [
  {
    // Round 1
    rowNumbers: [7, 12, 4, 15, 8],
    colNumbers: [5, 9, 3, 11, 6],
    operations: [
      ["+", "×", "-", "÷", "+"],
      ["-", "+", "×", "-", "÷"],
      ["×", "-", "+", "×", "-"],
      ["÷", "+", "×", "-", "+"],
      ["+", "÷", "-", "+", "×"],
    ],
    colSums: [45, 67, 23, 34, 42],
  },
  {
    // Round 2
    rowNumbers: [9, 14, 6, 18, 11],
    colNumbers: [4, 7, 12, 8, 5],
    operations: [
      ["×", "+", "-", "÷", "+"],
      ["-", "×", "+", "-", "×"],
      ["+", "-", "×", "+", "-"],
      ["÷", "+", "-", "×", "+"],
      ["×", "÷", "+", "-", "×"],
    ],
    colSums: [52, 89, 31, 47, 58],
  },
  {
    // Round 3
    rowNumbers: [13, 8, 16, 10, 12],
    colNumbers: [6, 9, 4, 15, 7],
    operations: [
      ["+", "×", "÷", "-", "+"],
      ["×", "-", "+", "×", "-"],
      ["-", "+", "×", "÷", "+"],
      ["÷", "×", "-", "+", "×"],
      ["+", "-", "+", "×", "÷"],
    ],
    colSums: [61, 73, 28, 95, 44],
  },
];

// Helper function to calculate the result of an operation
export function calculateOperation(rowNum, colNum, operation) {
  switch (operation) {
    case "+":
      return rowNum + colNum;
    case "-":
      return rowNum - colNum;
    case "×":
      return rowNum * colNum;
    case "÷":
      return rowNum / colNum;
    default:
      return 0;
  }
}

// Helper function to get the solution grid
export function getSolutionGrid(puzzle) {
  const solution = [];
  for (let i = 0; i < 5; i++) {
    solution[i] = [];
    for (let j = 0; j < 5; j++) {
      const result = calculateOperation(
        puzzle.rowNumbers[i],
        puzzle.colNumbers[j],
        puzzle.operations[i][j]
      );
      // Only allow whole numbers
      if (Number.isInteger(result)) {
        solution[i][j] = result;
      } else {
        // If division doesn't result in whole number, use a different operation
        // This ensures all puzzles are solvable with whole numbers
        const alternatives = ["+", "-", "×"];
        for (const altOp of alternatives) {
          const altResult = calculateOperation(
            puzzle.rowNumbers[i],
            puzzle.colNumbers[j],
            altOp
          );
          if (Number.isInteger(altResult)) {
            solution[i][j] = altResult;
            puzzle.operations[i][j] = altOp; // Update the operation
            break;
          }
        }
      }
    }
  }
  return solution;
}

export default puzzles;
