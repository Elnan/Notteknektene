import React, { useState, useEffect } from "react";
import styles from "./WhatGame.module.css";
import Button from "../../../../components/Button";
import OnScreenKeyboard from "../../../../components/OnScreenKeyboard";
import { MYSTERY_DATA } from "../gameData";
import Modal from "../../../../components/Modal";
import modalStyles from "../../../../components/Modal.module.css";

const WhatGame = ({ onComplete, onBack, onHint, savedGameState }) => {
  // What mini-game state (Wordle)
  const [wordleGuesses, setWordleGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [wordleGameOver, setWordleGameOver] = useState(false);
  const [wordleWon, setWordleWon] = useState(false);
  const [wordleAttempt, setWordleAttempt] = useState(0);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [finalGuesses, setFinalGuesses] = useState(null);
  const [gameStartTime, setGameStartTime] = useState(null);

  const gameData = MYSTERY_DATA.what;

  // Track game start time
  useEffect(() => {
    setGameStartTime(Date.now());
  }, []);

  // ===== RESTORE SAVED STATE =====
  useEffect(() => {
    if (savedGameState && savedGameState.gameState) {
      console.log(
        "🔄 Restoring WhatGame saved state:",
        savedGameState.gameState
      );
      const { gameState } = savedGameState;

      // Restore game state
      if (gameState.wordleGuesses) setWordleGuesses(gameState.wordleGuesses);
      if (gameState.currentGuess) setCurrentGuess(gameState.currentGuess);
      if (gameState.wordleGameOver !== undefined)
        setWordleGameOver(gameState.wordleGameOver);
      if (gameState.wordleWon !== undefined) setWordleWon(gameState.wordleWon);
      if (gameState.wordleAttempt !== undefined)
        setWordleAttempt(gameState.wordleAttempt);
      if (gameState.finalGuesses) setFinalGuesses(gameState.finalGuesses);
    }
  }, [savedGameState]);

  const handleShowHint = () => {
    setHintUsed(true);
    // Call the parent component's hint handler
    if (onHint) {
      onHint(0); // Use hint index 0 for the first hint
    }
    setShowHintModal(true);
  };

  // Helper to calculate points for this game
  const getPoints = () => {
    const basePoints = 2;
    return Math.max(0, basePoints - (hintUsed ? 1 : 0));
  };

  // Calculate time spent on this mini-game
  const getTimeSpent = () => {
    return gameStartTime ? Date.now() - gameStartTime : 0;
  };

  // Complete the mini-game with detailed data
  const completeGame = () => {
    const timeSpent = getTimeSpent();
    const points = getPoints();

    const gameData = {
      points: points,
      hintUsed: hintUsed ? 1 : 0,
      timeSpent: timeSpent,
      attempts: wordleAttempt,
      guesses: finalGuesses || wordleGuesses,
      completed: wordleWon,
      // Include complete game state for save/load
      gameState: {
        wordleGuesses,
        currentGuess,
        wordleGameOver,
        wordleWon,
        wordleAttempt,
        finalGuesses,
      },
    };

    onComplete("what", gameData);
  };

  // Wordle game functions
  const getLetterState = (letter, position, word, targetWord) => {
    // If letter is in correct position, it's correct
    if (targetWord[position] === letter) return "correct";

    // Count how many times this letter appears in target word
    const letterCountInTarget = (
      targetWord.match(new RegExp(letter, "g")) || []
    ).length;

    // Count how many times we've already used this letter correctly (green) in current guess
    let correctUsages = 0;
    for (let i = 0; i < word.length; i++) {
      if (word[i] === letter && targetWord[i] === letter) {
        correctUsages++;
      }
    }

    // Count how many times we've marked this letter as present (yellow) before this position
    let presentUsages = 0;
    for (let i = 0; i < position; i++) {
      if (
        word[i] === letter &&
        targetWord[i] !== letter &&
        targetWord.includes(letter)
      ) {
        // Only count if we haven't exceeded the available count
        if (correctUsages + presentUsages < letterCountInTarget) {
          presentUsages++;
        }
      }
    }

    // If we still have room for this letter (haven't used all available instances)
    if (correctUsages + presentUsages < letterCountInTarget) {
      return "present";
    }

    return "absent";
  };

  const handleWordleKeyPress = (key) => {
    if (wordleGameOver) return;

    if (key === "ENTER") {
      if (currentGuess.length === 6) {
        const newGuesses = [...wordleGuesses, currentGuess];
        setWordleGuesses(newGuesses);

        const newAttempt = wordleAttempt + 1;
        setWordleAttempt(newAttempt);

        if (currentGuess === gameData.targetWord) {
          setWordleWon(true);
          setWordleGameOver(true);
          setFinalGuesses(newGuesses); // Save snapshot
        } else if (newAttempt >= gameData.maxAttempts) {
          setWordleWon(false);
          setWordleGameOver(true);
          setFinalGuesses(newGuesses); // Save snapshot
        }

        setCurrentGuess("");
      }
    } else if (key === "⌫") {
      setCurrentGuess(currentGuess.slice(0, -1));
    } else if (key.length === 1 && currentGuess.length < 6) {
      setCurrentGuess(currentGuess + key);
    }
  };

  const getKeyboardKeyState = (letter) => {
    let keyState = "default";

    for (const guess of wordleGuesses) {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === letter) {
          const state = getLetterState(letter, i, guess, gameData.targetWord);
          if (state === "correct") {
            keyState = "correct";
          } else if (state === "present" && keyState !== "correct") {
            keyState = "present";
          } else if (state === "absent" && keyState === "default") {
            keyState = "absent";
          }
        }
      }
    }

    return keyState;
  };

  // Create keyStates object for OnScreenKeyboard
  const getKeyStates = () => {
    const keyStates = {};
    gameData.keyboardLayout.flat().forEach((key) => {
      keyStates[key] = getKeyboardKeyState(key);
    });
    return keyStates;
  };

  // Physical keyboard support for Wordle
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle keyboard input when the game is active
      if (wordleGameOver) return;

      const key = event.key.toUpperCase();

      // Handle letter input (A-Z)
      if (/^[A-Z]$/.test(key) && currentGuess.length < 6) {
        event.preventDefault();
        handleWordleKeyPress(key);
      }
      // Handle Enter key
      else if (key === "ENTER" && currentGuess.length === 6) {
        event.preventDefault();
        handleWordleKeyPress("ENTER");
      }
      // Handle Backspace
      else if (key === "BACKSPACE" && currentGuess.length > 0) {
        event.preventDefault();
        handleWordleKeyPress("⌫");
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [wordleGameOver, currentGuess, wordleGuesses, wordleAttempt]);

  // When the game ends, call onComplete with points and hintUsed
  useEffect(() => {
    if (wordleGameOver) {
      onComplete("what", { points: getPoints(), hintUsed });
    }
    // eslint-disable-next-line
  }, [wordleGameOver]);

  // Extracted grid rendering for reuse (accepts guesses as argument)
  const renderWordleGrid = (guessesToShow, currentGuessToShow = "") => (
    <div className={styles.wordleGrid}>
      {Array.from({ length: gameData.maxAttempts }, (_, rowIndex) => (
        <div key={rowIndex} className={styles.wordleRow}>
          {Array.from({ length: 6 }, (_, colIndex) => {
            let letter = "";
            let cellClass = styles.wordleCell;

            if (rowIndex < guessesToShow.length) {
              // Completed guess
              letter = guessesToShow[rowIndex][colIndex] || "";
              const state = getLetterState(
                letter,
                colIndex,
                guessesToShow[rowIndex],
                gameData.targetWord
              );
              cellClass += ` ${styles[state]}`;
            } else if (rowIndex === guessesToShow.length) {
              // Current guess
              letter = currentGuessToShow[colIndex] || "";
              if (letter) {
                cellClass += ` ${styles.filled}`;
              }
            }

            return (
              <div key={colIndex} className={cellClass}>
                {letter}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  // Render results screen
  if (wordleGameOver) {
    // Use finalGuesses for snapshot, fallback to wordleGuesses if needed
    const guessesSnapshot = finalGuesses || wordleGuesses;
    const points = getPoints();
    return (
      <div className={styles.minigame}>
        <div className={styles.wordleResults}>
          <h3>Word Discovery Results</h3>
          <div className={styles.victoryFlexRow}>
            <div className={styles.victoryGrid}>
              {renderWordleGrid(guessesSnapshot)}
            </div>
            <div className={styles.victoryPanel}>
              {wordleWon ? (
                <div className={styles.wordleSuccess}>
                  <h4>Excellent!</h4>
                  <p>
                    You discovered the stolen artifact:{" "}
                    <strong>{gameData.targetWord}</strong>
                  </p>
                  <p>
                    Attempts used: {wordleAttempt} / {gameData.maxAttempts}
                  </p>
                  <p>
                    Points earned: {points} / 2{hintUsed ? " (hint used)" : ""}
                  </p>
                </div>
              ) : (
                <div className={styles.wordleFailure}>
                  <h4>Not quite!</h4>
                  <p>
                    The stolen artifact was:{" "}
                    <strong>{gameData.targetWord}</strong>
                  </p>
                  <p>Better luck next time!</p>
                  <p>Points earned: 0 / 2</p>
                </div>
              )}
              <Button variant="secondary" size="small" onClick={onBack}>
                Back to Overview
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.minigame}>
      <div className={styles.minigameHeader}>
        <h3>What</h3>
        <h4 className={styles.wordleQuestion}>{gameData.question}</h4>
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

      <div className={styles.wordleGame}>
        <div className={styles.wordleGrid}>
          {Array.from({ length: gameData.maxAttempts }, (_, rowIndex) => (
            <div key={rowIndex} className={styles.wordleRow}>
              {Array.from({ length: 6 }, (_, colIndex) => {
                let letter = "";
                let cellClass = styles.wordleCell;

                if (rowIndex < wordleGuesses.length) {
                  // Completed guess
                  letter = wordleGuesses[rowIndex][colIndex] || "";
                  const state = getLetterState(
                    letter,
                    colIndex,
                    wordleGuesses[rowIndex],
                    gameData.targetWord
                  );
                  cellClass += ` ${styles[state]}`;
                } else if (rowIndex === wordleGuesses.length) {
                  // Current guess
                  letter = currentGuess[colIndex] || "";
                  if (letter) {
                    cellClass += ` ${styles.filled}`;
                  }
                }

                return (
                  <div key={colIndex} className={cellClass}>
                    {letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className={styles.wordleKeyboard}>
          <OnScreenKeyboard
            keys={gameData.keyboardLayout}
            onKeyPress={handleWordleKeyPress}
            keyStates={getKeyStates()}
          />
        </div>

        {wordleGameOver && (
          <div className={styles.gameOverSection}>
            <div className={styles.gameOverMessage}>
              {wordleWon ? "Congratulations! You solved it!" : "Game Over"}
            </div>
            <div className={styles.gameOverStats}>
              <p>Attempts: {wordleAttempt}</p>
              <p>Points: {getPoints()}</p>
            </div>
            <Button variant="primary" onClick={completeGame}>
              Complete Mini-Game
            </Button>
          </div>
        )}
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
              <Button onClick={handleShowHint} variant="primary" size="small">
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
            <h4>Wordle Hint:</h4>
            <p>{gameData.hint}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WhatGame;
