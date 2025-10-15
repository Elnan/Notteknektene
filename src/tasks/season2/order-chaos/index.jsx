import React, { useState, useEffect, useCallback } from "react";
import styles from "./OrderChaos.module.css";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import { useOrderChaosSaveState } from "../../../hooks/useOrderChaosSaveState";
import { checkWin, checkDraw } from "./gameLogic";
import { makeComputerMove } from "./ai";
import { BOARD_SIZE, WIN_LENGTH, ROUNDS_TOTAL } from "./constants";

const BoardSnapshot = ({ board, result, resultClass }) => {
  const [isEnlarged, setIsEnlarged] = useState(false);

  const handleClick = () => {
    setIsEnlarged(!isEnlarged);
  };

  return (
    <div
      className={`${styles.boardSnapshotWrapper} ${isEnlarged ? styles.enlarged : ""}`}
      onClick={handleClick}
    >
      <div className={styles.boardSnapshot}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((cell, colIndex) => (
              <div key={colIndex} className={styles.cell}>
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div
        className={`${styles.resultModalBadge} ${resultClass} ${styles.snapshotBadge}`}
      >
        {result}
      </div>
    </div>
  );
};

const OrderChaos = ({ onComplete, currentGameId }) => {
  // Save/load functionality
  const {
    saveGameState,
    loadGameState,
    clearSaveState,
    isLoading: saveLoading,
    error: saveError,
    cleanup,
  } = useOrderChaosSaveState(currentGameId);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Game state
  const [board, setBoard] = useState(
    Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState("chaos"); // chaos goes first
  const [selectedSymbol, setSelectedSymbol] = useState("X");
  const [cursorPosition, setCursorPosition] = useState({ row: 0, col: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Round management
  const [currentRound, setCurrentRound] = useState(1);
  const [roundScores, setRoundScores] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Move counting and game tracking
  const [movesCount, setMovesCount] = useState(0);
  const [roundMoves, setRoundMoves] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());

  // Result modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [resultClass, setResultClass] = useState("");

  // Round summaries
  const [roundSummaries, setRoundSummaries] = useState([]);

  // Instructions system state
  const [instructionsUsed, setInstructionsUsed] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false);

  // Submission data state (for completed games)
  const [submissionWins, setSubmissionWins] = useState(undefined);
  const [submissionLosses, setSubmissionLosses] = useState(undefined);
  const [submissionRounds, setSubmissionRounds] = useState(undefined);
  const [submissionFinalScore, setSubmissionFinalScore] = useState(undefined);
  const [submissionTimeSpent, setSubmissionTimeSpent] = useState(undefined);

  // Track game start time
  useEffect(() => {
    window.gameStartTime = Date.now();
  }, []);

  // Load game state on component mount
  useEffect(() => {
    const loadState = async () => {
      const savedState = await loadGameState();
      if (savedState) {
        setBoard(savedState.board);
        setCurrentPlayer(savedState.currentPlayer);
        setSelectedSymbol(savedState.selectedSymbol);
        setCursorPosition(savedState.cursorPosition);
        setGameOver(savedState.gameOver);
        setWinner(savedState.winner);
        setCurrentRound(savedState.currentRound);
        setRoundScores(savedState.roundScores);
        setTotalScore(savedState.totalScore);
        setGameCompleted(savedState.gameCompleted);
        setMovesCount(savedState.movesCount);
        setRoundMoves(savedState.roundMoves);
        setRoundStartTime(savedState.roundStartTime);
        setShowResultModal(savedState.showResultModal);
        setResultMsg(savedState.resultMsg);
        setResultClass(savedState.resultClass);
        setRoundSummaries(savedState.roundSummaries);
        setInstructionsUsed(savedState.instructionsUsed);

        // Load submission data if available
        setSubmissionWins(savedState.submissionWins);
        setSubmissionLosses(savedState.submissionLosses);
        setSubmissionRounds(savedState.submissionRounds);
        setSubmissionFinalScore(savedState.submissionFinalScore);
        setSubmissionTimeSpent(savedState.submissionTimeSpent);

        console.log("🎮 Loaded saved Order & Chaos game state");
      }
      setHasLoadedInitialState(true);
    };

    loadState();
  }, [loadGameState]);

  // Handle submission using saved data if available
  const handleSubmissionWithSavedData = useCallback(() => {
    if (gameCompleted && onComplete) {
      // Check if we have saved submission data
      if (
        submissionWins !== undefined &&
        submissionLosses !== undefined &&
        submissionRounds &&
        submissionFinalScore !== undefined
      ) {
        const submissionData = {
          score: submissionFinalScore,
          wins: submissionWins,
          losses: submissionLosses,
          rounds: submissionRounds,
          movesCount: movesCount,
          timeSpent:
            submissionTimeSpent ||
            Date.now() - (window.gameStartTime || Date.now()),
          hintsUsed: 0,
          instructionsUsed: instructionsUsed ? 1 : 0,
        };

        const gameId = currentGameId || "order-chaos";
        onComplete(gameId, submissionData);
        return true;
      }
    }
    return false;
  }, [
    gameCompleted,
    onComplete,
    submissionWins,
    submissionLosses,
    submissionRounds,
    submissionFinalScore,
    movesCount,
    submissionTimeSpent,
    instructionsUsed,
    currentGameId,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Auto-submit if game is completed and we have saved submission data
  useEffect(() => {
    if (
      hasLoadedInitialState &&
      gameCompleted &&
      handleSubmissionWithSavedData()
    ) {
      console.log(
        "🎮 Auto-submitting completed Order & Chaos game with saved data"
      );
    }
  }, [hasLoadedInitialState, gameCompleted, handleSubmissionWithSavedData]);

  // Initialize game
  const initializeGame = useCallback(() => {
    setBoard(
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null))
    );
    setCurrentPlayer("chaos");
    setSelectedSymbol("X");
    setCursorPosition({ row: 0, col: 0 });
    setGameOver(false);
    setWinner(null);

    // Reset round-specific tracking
    setRoundMoves(0);
    setRoundStartTime(Date.now());
  }, []);

  // Handle player move
  const handlePlayerMove = useCallback(
    (row, col) => {
      if (gameOver || currentPlayer !== "chaos" || board[row][col] !== null) {
        return;
      }

      const newBoard = board.map((row) => [...row]);
      newBoard[row][col] = selectedSymbol;
      setBoard(newBoard);

      // Count moves
      setMovesCount((prev) => prev + 1);
      setRoundMoves((prev) => prev + 1);

      // Check for win (any five in a row of X or O means Order wins)
      if (
        checkWin(newBoard, "X", WIN_LENGTH) ||
        checkWin(newBoard, "O", WIN_LENGTH)
      ) {
        setGameOver(true);
        setWinner("order");
        handleRoundEnd("order", newBoard);
        return;
      }

      // Check for draw (board full, no five in a row)
      if (checkDraw(newBoard)) {
        setGameOver(true);
        setWinner("chaos");
        handleRoundEnd("chaos", newBoard);
        return;
      }

      // Switch to computer's turn
      setCurrentPlayer("order");

      // Save state after player move
      saveGameState({
        board: newBoard,
        currentPlayer: "order",
        selectedSymbol,
        cursorPosition,
        gameOver: false,
        winner: null,
        currentRound,
        roundScores,
        totalScore,
        gameCompleted,
        movesCount: movesCount + 1,
        roundMoves: roundMoves + 1,
        roundStartTime,
        showResultModal,
        resultMsg,
        resultClass,
        roundSummaries,
        instructionsUsed,
        gameStartTime: window.gameStartTime,
      });
    },
    [
      board,
      currentPlayer,
      selectedSymbol,
      gameOver,
      cursorPosition,
      currentRound,
      roundScores,
      totalScore,
      gameCompleted,
      movesCount,
      roundMoves,
      roundStartTime,
      showResultModal,
      resultMsg,
      resultClass,
      roundSummaries,
      instructionsUsed,
      saveGameState,
    ]
  );

  // Handle computer move
  useEffect(() => {
    if (currentPlayer === "order" && !gameOver) {
      const timer = setTimeout(() => {
        const computerMove = makeComputerMove(board, selectedSymbol);
        if (computerMove) {
          const newBoard = board.map((row) => [...row]);
          newBoard[computerMove.row][computerMove.col] = computerMove.symbol;
          setBoard(newBoard);

          // Check for win (any five in a row of X or O means Order wins)
          if (
            checkWin(newBoard, "X", WIN_LENGTH) ||
            checkWin(newBoard, "O", WIN_LENGTH)
          ) {
            setGameOver(true);
            setWinner("order");
            handleRoundEnd("order", newBoard);
            return;
          }

          // Check for draw (board full, no five in a row)
          if (checkDraw(newBoard)) {
            setGameOver(true);
            setWinner("chaos");
            handleRoundEnd("chaos", newBoard);
            return;
          }

          setCurrentPlayer("chaos");

          // Save state after computer move
          saveGameState({
            board: newBoard,
            currentPlayer: "chaos",
            selectedSymbol,
            cursorPosition,
            gameOver: false,
            winner: null,
            currentRound,
            roundScores,
            totalScore,
            gameCompleted,
            movesCount,
            roundMoves,
            roundStartTime,
            showResultModal,
            resultMsg,
            resultClass,
            roundSummaries,
            instructionsUsed,
            gameStartTime: window.gameStartTime,
          });
        }
      }, 500); // Small delay for better UX

      return () => clearTimeout(timer);
    }
  }, [
    currentPlayer,
    board,
    gameOver,
    selectedSymbol,
    cursorPosition,
    currentRound,
    roundScores,
    totalScore,
    gameCompleted,
    movesCount,
    roundMoves,
    roundStartTime,
    showResultModal,
    resultMsg,
    resultClass,
    roundSummaries,
    instructionsUsed,
    saveGameState,
  ]);

  // Handle round end (store board and result)
  const handleRoundEnd = useCallback(
    (result, finalBoard) => {
      let roundScore = 0;
      if (result === "chaos")
        roundScore = 3; // Win
      else if (result === "draw") roundScore = 1; // Draw
      // Loss = 0 points

      // Calculate round duration
      const roundDuration = Date.now() - roundStartTime;

      // Store board snapshot and result
      const resultMsg =
        result === "chaos"
          ? "You Win!"
          : result === "order"
            ? "Order Wins!"
            : "Draw!";
      const resultClass =
        result === "chaos"
          ? "resultWin"
          : result === "order"
            ? "resultLose"
            : "resultNeutral";
      setRoundSummaries((prev) => [
        ...prev,
        {
          board: (finalBoard || board).map((row) => [...row]),
          result: resultMsg,
          resultClass,
          score: roundScore,
          moves: roundMoves,
          duration: roundDuration,
        },
      ]);

      const newRoundScores = [...roundScores, roundScore];
      setRoundScores(newRoundScores);
      setTotalScore(newRoundScores.reduce((sum, score) => sum + score, 0));

      if (currentRound < ROUNDS_TOTAL) {
        setCurrentRound(currentRound + 1);
        setTimeout(() => {
          initializeGame();
        }, 2000);
      } else {
        setGameCompleted(true);

        // Calculate submission data
        const timeSpent = Date.now() - (window.gameStartTime || Date.now());
        const wins = newRoundScores.filter((score) => score === 3).length;
        const losses = newRoundScores.filter((score) => score === 0).length;

        // Ensure all values are defined before saving
        const safeWins = wins || 0;
        const safeLosses = losses || 0;
        const safeTimeSpent = timeSpent || 0;

        // Calculate the total score directly from newRoundScores to avoid state timing issues
        const calculatedTotalScore = newRoundScores.reduce(
          (sum, score) => sum + score,
          0
        );

        // Apply instructions penalty if used
        let finalScore = calculatedTotalScore;
        if (instructionsUsed) {
          finalScore -= 1; // Instructions penalty
        }
        finalScore = Math.max(0, finalScore); // Ensure score doesn't go below 0

        // Prepare rounds array with detailed information
        // Include the current round data that hasn't been added to roundSummaries yet
        const currentRoundData = {
          board: (finalBoard || board).map((row) => [...row]),
          result:
            result === "chaos"
              ? "You Win!"
              : result === "order"
                ? "Order Wins!"
                : "Draw!",
          resultClass:
            result === "chaos"
              ? "resultWin"
              : result === "order"
                ? "resultLose"
                : "resultNeutral",
          score: roundScore,
          moves: roundMoves,
          duration: roundDuration,
        };

        // Combine existing round summaries with current round data
        const allRounds = [...roundSummaries, currentRoundData];
        const rounds = allRounds.map((summary, index) => ({
          roundNumber: index + 1,
          won: summary.score === 3,
          score: summary.score || 0,
          moves: summary.moves || 0,
          duration: summary.duration || 0,
        }));

        // Prepare submission data using the new standardized system
        const submissionData = {
          score: finalScore,
          wins: safeWins,
          losses: safeLosses,
          rounds: rounds,
          movesCount: movesCount,
          timeSpent: safeTimeSpent,
          hintsUsed: 0, // This game doesn't have hints
          instructionsUsed: instructionsUsed ? 1 : 0,
        };

        // Set submission data state
        setSubmissionWins(safeWins);
        setSubmissionLosses(safeLosses);
        setSubmissionRounds(rounds);
        setSubmissionFinalScore(finalScore);
        setSubmissionTimeSpent(safeTimeSpent);

        // Save final game state before submission with all calculated data
        saveGameState({
          board: finalBoard || board,
          currentPlayer,
          selectedSymbol,
          cursorPosition,
          gameOver: true,
          winner: result,
          currentRound: ROUNDS_TOTAL,
          roundScores: newRoundScores,
          totalScore: calculatedTotalScore,
          gameCompleted: true,
          movesCount,
          roundMoves,
          roundStartTime,
          showResultModal: false,
          resultMsg: resultMsg,
          resultClass: resultClass,
          roundSummaries: [...roundSummaries, currentRoundData],
          instructionsUsed,
          gameStartTime: window.gameStartTime || Date.now(),
          // Save calculated submission data
          submissionWins: safeWins,
          submissionLosses: safeLosses,
          submissionRounds: rounds,
          submissionFinalScore: finalScore,
          submissionTimeSpent: safeTimeSpent,
        });

        // Call onComplete with submission data
        if (onComplete) {
          // Use currentGameId if available, otherwise fall back to base game ID
          const gameId = currentGameId || "order-chaos";
          onComplete(gameId, submissionData);
        }
      }
    },
    [
      roundScores,
      currentRound,
      board,
      movesCount,
      instructionsUsed,
      onComplete,
      currentPlayer,
      selectedSymbol,
      cursorPosition,
      roundMoves,
      roundStartTime,
      roundSummaries,
      saveGameState,
    ]
  );

  // Calculate final score with penalties
  const calculateFinalScore = () => {
    let finalScore = totalScore;
    if (instructionsUsed) {
      finalScore -= 1; // Instructions penalty
    }
    return Math.max(0, finalScore); // Ensure score doesn't go below 0
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver || gameCompleted) return;

      switch (e.key) {
        case "r":
        case "R":
          // Toggle between X and O
          setSelectedSymbol((prev) => (prev === "X" ? "O" : "X"));
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
            row: Math.min(BOARD_SIZE - 1, prev.row + 1),
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
            col: Math.min(BOARD_SIZE - 1, prev.col + 1),
          }));
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          handlePlayerMove(cursorPosition.row, cursorPosition.col);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    gameOver,
    gameCompleted,
    cursorPosition,
    handlePlayerMove,
    initializeGame,
  ]);

  // Show result modal for 1 second after round ends
  useEffect(() => {
    if (gameOver && !gameCompleted) {
      setShowResultModal(true);
      let msg = "";
      let cls = styles.resultNeutral;
      if (winner === "chaos") {
        msg = "You Win!";
        cls = styles.resultWin;
      } else if (winner === "order") {
        msg = "Order Wins!";
        cls = styles.resultLose;
      } else {
        msg = "Draw!";
      }
      setResultMsg(msg);
      setResultClass(cls);
      const timer = setTimeout(() => setShowResultModal(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [gameOver, gameCompleted, winner]);

  // Render game board
  const renderBoard = () => {
    return (
      <div className={styles.board}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`${styles.cell} ${
                  cursorPosition.row === rowIndex &&
                  cursorPosition.col === colIndex
                    ? styles.cursor
                    : ""
                }`}
                onClick={() => handlePlayerMove(rowIndex, colIndex)}
                disabled={
                  gameOver || currentPlayer !== "chaos" || cell !== null
                }
              >
                {cell}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Render symbol selector
  const renderSymbolSelector = () => {
    return (
      <div className={styles.symbolSelector}>
        <button
          className={`${styles.symbolButton} ${selectedSymbol === "X" ? styles.selected : ""}`}
          onClick={() => setSelectedSymbol("X")}
        >
          X
        </button>
        <button
          className={`${styles.symbolButton} ${selectedSymbol === "O" ? styles.selected : ""}`}
          onClick={() => setSelectedSymbol("O")}
        >
          O
        </button>
      </div>
    );
  };

  // Render score display
  const renderScoreDisplay = () => {
    const finalScore = calculateFinalScore();
    return (
      <div className={styles.scoreDisplay}>
        <div className={styles.playerInfo}>You are Chaos</div>
        <div className={styles.scoreCenter}>
          <div className={styles.roundInfo}>
            Round {currentRound}/{ROUNDS_TOTAL}
          </div>
          <div className={styles.scores}>
            {roundScores.map((score, index) => (
              <span key={index} className={styles.roundScore}>
                R{index + 1}: {score}
              </span>
            ))}
          </div>
          <div className={styles.totalScore}>
            <div>Total Score: {finalScore}/9</div>
            {instructionsUsed && (
              <div className={styles.penaltyText}>(-1 instructions)</div>
            )}
          </div>
        </div>
        <div className={styles.objective}>Beat Order</div>
      </div>
    );
  };

  // Render result modal overlay
  const renderResultModal = () => {
    if (!showResultModal) return null;
    return (
      <div className={styles.resultModalOverlay}>
        <div className={`${styles.resultModalBadge} ${resultClass}`}>
          {resultMsg}
        </div>
      </div>
    );
  };

  // Render game status (only show final score if gameCompleted)
  const renderGameStatus = () => {
    if (gameCompleted) {
      const finalScore = calculateFinalScore();
      return (
        <div className={styles.gameCompleted}>
          <h2>Game Completed!</h2>
          <p>Final Score: {finalScore}/9</p>
          {instructionsUsed && (
            <p className={styles.penaltyText}>
              (-1 point for using instructions)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Render controls info
  const renderControlsInfo = () => {
    return (
      <div className={styles.controlsInfo}>
        <h3>Controls</h3>
        <div className={styles.controlsGrid}>
          <div>
            <strong>Mouse:</strong> Click X/O buttons, click grid to place
          </div>
          <div>
            <strong>Keyboard:</strong> Press R to switch X/O, arrow keys to
            navigate, Space/Enter to place
          </div>
        </div>
      </div>
    );
  };

  // Handle instructions button click
  const handleInstructionsClick = () => {
    if (!instructionsUsed) {
      setInstructionsUsed(true);

      // Save state after instructions usage
      saveGameState({
        board,
        currentPlayer,
        selectedSymbol,
        cursorPosition,
        gameOver,
        winner,
        currentRound,
        roundScores,
        totalScore,
        gameCompleted,
        movesCount,
        roundMoves,
        roundStartTime,
        showResultModal,
        resultMsg,
        resultClass,
        roundSummaries,
        instructionsUsed: true,
        gameStartTime: window.gameStartTime,
      });
    }
    setShowInstructionsModal(true);
  };

  // Make clearSaveState globally available for testing
  useEffect(() => {
    window.clearOrderChaosSave = async () => {
      await clearSaveState();
      window.location.reload();
    };
    return () => {
      delete window.clearOrderChaosSave;
    };
  }, [clearSaveState]);

  // Render instructions button
  const renderInstructionsButton = () => {
    if (gameCompleted) return null;

    return (
      <div className={styles.hintButtonContainer}>
        <Button
          variant="secondary"
          size="small"
          onClick={handleInstructionsClick}
          className={instructionsUsed ? styles.hintButtonUsed : ""}
        >
          Instructions
          {!instructionsUsed && (
            <span className={styles.penaltyText}> (-1 point)</span>
          )}
        </Button>
      </div>
    );
  };

  // Render game summary after all rounds
  const renderGameSummary = () => {
    const finalScore = calculateFinalScore();
    return (
      <div className={styles.summaryWrapper}>
        <h2 className={styles.summaryTitle}>Game Completed!</h2>
        <div className={styles.summaryBoards}>
          {roundSummaries.map((summary, idx) => (
            <BoardSnapshot
              key={idx}
              board={summary.board}
              result={summary.result}
              resultClass={summary.resultClass}
            />
          ))}
        </div>
        <div className={styles.summaryScore}>
          Final Score: {finalScore}/9
          {instructionsUsed && (
            <span className={styles.penaltyText}> (-1 instructions)</span>
          )}
        </div>
      </div>
    );
  };

  // Show loading screen only during initial load, not during saves
  if (saveLoading && !hasLoadedInitialState) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Order & Chaos</h1>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div>Loading game...</div>
        </div>
      </div>
    );
  }

  // Show save error if any
  if (saveError) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Order & Chaos</h1>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Error Loading Game</h3>
          <p>There was an error loading your save data: {saveError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Order & Chaos</h1>

      {renderScoreDisplay()}

      <div className={styles.gameArea}>
        {!gameCompleted && (
          <>
            <div className={styles.mobileControlsRow}>
              {renderInstructionsButton()}
              {renderSymbolSelector()}
            </div>
            {renderBoard()}
            {renderGameStatus()}
            {renderResultModal()}
          </>
        )}
        {gameCompleted && renderGameSummary()}
      </div>

      {!gameCompleted && !isMobile && renderControlsInfo()}

      {/* Instructions Modal */}
      <Modal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        title="Instructions"
      >
        <div className="hintContent">
          <h4>How to Play:</h4>
          <p>
            You are <strong>Chaos</strong>. Your goal is to prevent{" "}
            <strong>Order</strong> from creating any line of 5 X's or O's in a
            row (horizontal, vertical, or diagonal). If the board fills up
            without any 5-in-a-row, you win!
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default OrderChaos;
