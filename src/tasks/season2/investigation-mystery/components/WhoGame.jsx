import React, { useState, useEffect } from "react";
import styles from "./WhoGame.module.css";
import Button from "../../../../components/Button";
import Modal from "../../../../components/Modal";
import { MYSTERY_DATA } from "../gameData";

const WhoGame = ({ onComplete, onBack, onHint, savedGameState }) => {
  const [selectedWords, setSelectedWords] = useState([]);
  const [revealedCategories, setRevealedCategories] = useState([]);
  const [connectionsAttempts, setConnectionsAttempts] = useState(3);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [connectionsFeedback, setConnectionsFeedback] = useState(null); // 'correct', 'wrong', or null
  const [connectionsCompleted, setConnectionsCompleted] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintWords, setHintWords] = useState([]);
  const [showHintConfirm, setShowHintConfirm] = useState(false);
  const [forceRerender, setForceRerender] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [guessCombinations, setGuessCombinations] = useState([]);

  const gameData = MYSTERY_DATA.who;

  // Track game start time
  useEffect(() => {
    setGameStartTime(Date.now());
  }, []);

  // ===== RESTORE SAVED STATE =====
  useEffect(() => {
    if (savedGameState && savedGameState.gameState) {
      console.log(
        "🔄 Restoring WhoGame saved state:",
        savedGameState.gameState
      );
      const { gameState } = savedGameState;

      // Restore game state
      if (gameState.selectedWords) setSelectedWords(gameState.selectedWords);
      if (gameState.revealedCategories)
        setRevealedCategories(gameState.revealedCategories);
      if (gameState.connectionsAttempts !== undefined)
        setConnectionsAttempts(gameState.connectionsAttempts);
      if (gameState.shuffledWords) setShuffledWords(gameState.shuffledWords);
      if (gameState.connectionsFeedback)
        setConnectionsFeedback(gameState.connectionsFeedback);
      if (gameState.guessCombinations)
        setGuessCombinations(gameState.guessCombinations);
    }
  }, [savedGameState]);

  // Initialize shuffled words for connections game
  useEffect(() => {
    const allWords = gameData.categories.flatMap((cat) =>
      cat.words.map((word) => ({
        word,
        categoryId: cat.id,
        categoryName: cat.name,
      }))
    );
    // Simple shuffle
    const shuffled = allWords.sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
  }, [gameData.categories]);

  const handleWordClick = (wordObj) => {
    if (revealedCategories.some((cat) => cat.words.includes(wordObj.word))) {
      return; // Word is already revealed, can't select
    }

    if (selectedWords.includes(wordObj.word)) {
      // Deselect word
      setSelectedWords((prev) => prev.filter((w) => w !== wordObj.word));
    } else if (selectedWords.length < 4) {
      // Select word (max 4)
      setSelectedWords((prev) => [...prev, wordObj.word]);
    }
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
    const attempts = 3 - connectionsAttempts; // Convert remaining attempts to used attempts

    const gameData = {
      points: points,
      hintUsed: hintUsed ? 1 : 0,
      timeSpent: timeSpent,
      attempts: attempts,
      guessCombinations: guessCombinations,
      completed: revealedCategories.length === 4,
      // Include complete game state for save/load
      gameState: {
        selectedWords,
        revealedCategories,
        connectionsAttempts,
        shuffledWords,
        connectionsFeedback,
        guessCombinations,
      },
    };

    onComplete("who", gameData);
  };

  const handleSubmitGuess = () => {
    if (selectedWords.length !== 4) return;

    // Track this guess combination
    setGuessCombinations((prev) => [...prev, [...selectedWords]]);

    // Check if selected words form a category
    const matchingCategory = gameData.categories.find(
      (cat) =>
        cat.words.every((word) => selectedWords.includes(word)) &&
        selectedWords.every((word) => cat.words.includes(word))
    );

    if (matchingCategory) {
      // Correct guess!
      setConnectionsFeedback("correct");
      setTimeout(() => {
        setRevealedCategories((prev) => [...prev, matchingCategory]);
        setSelectedWords([]);
        setConnectionsFeedback(null);

        // Check if all categories are revealed
        if (revealedCategories.length === 3) {
          // Will be 4 after this update
          setTimeout(() => {
            setConnectionsCompleted(true);
            completeGame();
          }, 500);
        }
      }, 1000);
    } else {
      // Wrong guess
      setConnectionsFeedback("wrong");
      setTimeout(() => {
        setConnectionsAttempts((prev) => prev - 1);
        setSelectedWords([]);
        setConnectionsFeedback(null);

        if (connectionsAttempts === 0) {
          // Game over - reveal remaining categories and show results
          const remainingCategories = gameData.categories.filter(
            (cat) =>
              !revealedCategories.some((revealed) => revealed.id === cat.id)
          );
          setRevealedCategories((prev) => [...prev, ...remainingCategories]);
          setTimeout(() => {
            setConnectionsCompleted(true);
            // Pass points and hintUsed for future database use
            onComplete("who", { points: getPoints(), hintUsed });
          }, 500);
        }
      }, 1000);
    }
  };

  const handleHintButton = () => {
    setShowHintConfirm(true);
    setForceRerender((f) => f + 1); // force a rerender
  };

  const confirmUseHint = () => {
    // Find a category that is not yet revealed
    const unrevealed = gameData.categories.filter(
      (cat) => !revealedCategories.some((revealed) => revealed.id === cat.id)
    );
    if (unrevealed.length > 0) {
      // Pick a random unrevealed category
      const cat = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      // Pick two random words from this category
      const shuffled = [...cat.words].sort(() => Math.random() - 0.5);
      setHintWords(shuffled.slice(0, 2));
    }
    setHintUsed(true);
    // Call the parent component's hint handler
    if (onHint) {
      onHint(0); // Use hint index 0 for the first hint
    }
    setShowHintConfirm(false);
    setShowHintModal(true);
  };

  // When a category is revealed, clear hintWords if it was the hinted one
  useEffect(() => {
    if (
      hintWords.length > 0 &&
      revealedCategories.some((cat) => cat.words.includes(hintWords[0]))
    ) {
      setHintWords([]);
    }
  }, [revealedCategories]);

  useEffect(() => {
    // No-op: removed debug log
  }, [showHintConfirm]);

  const getAvailableWords = () => {
    return shuffledWords.filter(
      (wordObj) =>
        !revealedCategories.some((cat) => cat.words.includes(wordObj.word))
    );
  };

  if (connectionsCompleted) {
    // Calculate points for this game
    const points = getPoints();
    return (
      <div className={styles.minigame}>
        <div className={styles.connectionsResults}>
          <h3>Connections Complete!</h3>
          <div
            style={{
              fontSize: "1.2rem",
              color: "#22523b",
              margin: "12px 0 18px 0",
              fontWeight: 600,
            }}
          >
            Ah, of course! The culprit is Dr Michael Freudstone!
          </div>
          <div className={styles.resultsGrid}>
            {gameData.categories.map((category) => (
              <div
                key={category.id}
                className={`${styles.resultCategory} ${styles[category.color]}`}
              >
                <div className={styles.categoryHeader}>
                  <strong>{category.name}</strong>
                </div>
                <div className={styles.categoryWords}>
                  {category.words.join(", ")}
                </div>
              </div>
            ))}
          </div>
          <div style={{ margin: "18px 0", fontWeight: 500, color: "#22523b" }}>
            You earned {points} point{points !== 1 ? "s" : ""} for this game
            {hintUsed ? " (hint used)" : ""}.
          </div>
          <Button variant="secondary" size="small" onClick={onBack}>
            Back to Overview
          </Button>
        </div>
      </div>
    );
  }

  // Arrange words in a 4x4 grid
  const availableWords = getAvailableWords();
  const gridRows = [];
  for (let i = 0; i < 4; i++) {
    gridRows.push(availableWords.slice(i * 4, i * 4 + 4));
  }

  return (
    <div className={styles.minigame}>
      <div className={styles.minigameHeader}>
        <div className={styles.headerFlex}>
          <div className={styles.headerLeft}>
            <h3>Who</h3>
          </div>
          <div className={styles.headerCenter}>
            <h4 className={styles.whoQuestion}>
              Find groups of 4 connected words
            </h4>
          </div>
          <div className={styles.headerRight}>
            <Button
              variant="secondary"
              size="small"
              onClick={handleHintButton}
              style={{ marginRight: 10 }}
              disabled={hintUsed}
            >
              Hint
            </Button>
            <Button variant="secondary" size="small" onClick={onBack}>
              Back to Overview
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.connectionsGame}>
        <div className={styles.attemptsDisplay}>
          Mistakes remaining: {connectionsAttempts}
        </div>

        {/* Revealed categories */}
        {revealedCategories.map((category) => (
          <div
            key={category.id}
            className={`${styles.revealedCategory} ${styles[category.color]}`}
          >
            <div className={styles.categoryHeader}>
              <strong>{category.name}</strong>
            </div>
            <div className={styles.categoryWords}>
              {category.words.join(", ")}
            </div>
          </div>
        ))}

        {/* Word grid - always 4x4 */}
        <div
          className={`${styles.wordsGrid} ${connectionsFeedback ? styles[connectionsFeedback] : ""}`}
        >
          {gridRows.map((row, rowIdx) =>
            row.map((wordObj, colIdx) => {
              const isHinted = hintWords.includes(wordObj.word);
              return (
                <button
                  key={`${wordObj.word}-${rowIdx}-${colIdx}`}
                  className={`${styles.wordButton} ${selectedWords.includes(wordObj.word) ? styles.selected : ""} ${isHinted ? styles.hinted : ""}`}
                  onClick={() => handleWordClick(wordObj)}
                  disabled={
                    revealedCategories.some((cat) =>
                      cat.words.includes(wordObj.word)
                    ) || connectionsFeedback
                  }
                >
                  {wordObj.word}
                </button>
              );
            })
          )}
        </div>

        {/* Feedback message */}
        {connectionsFeedback && (
          <div className={styles.feedbackMessage}>
            {connectionsFeedback === "correct" ? (
              <span className={styles.correctFeedback}>
                ✅ Correct! Well done!
              </span>
            ) : (
              <span className={styles.wrongFeedback}>
                ❌ Not quite right. Try again!
              </span>
            )}
          </div>
        )}

        {/* Submit button */}
        {getAvailableWords().length > 0 && !connectionsCompleted && (
          <div className={styles.connectionsControls}>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setSelectedWords([])}
              disabled={selectedWords.length === 0 || connectionsFeedback}
            >
              Clear Selection
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSubmitGuess}
              disabled={selectedWords.length !== 4 || connectionsFeedback}
            >
              Submit ({selectedWords.length}/4)
            </Button>
          </div>
        )}

        {/* Completion button */}
        {connectionsCompleted && (
          <div className={styles.connectionsControls}>
            <div className={styles.gameOverStats}>
              <p>Attempts: {3 - connectionsAttempts}</p>
              <p>Points: {getPoints()}</p>
            </div>
            <Button variant="primary" onClick={completeGame}>
              Complete Mini-Game
            </Button>
          </div>
        )}
      </div>

      {/* Hint Modal */}
      {showHintModal && (
        <Modal isOpen={true} onClose={() => setShowHintModal(false)}>
          <div className="hintContent">
            <h4>Strategy Hint:</h4>
            <p>
              Two words in the grid are highlighted. Find the other two that
              connect with them!
            </p>
            <div style={{ margin: "12px 0 18px 0" }}>
              {hintWords.length > 0 && (
                <>
                  <span style={{ fontWeight: 600, color: "#b8860b" }}>
                    {hintWords[0]}
                  </span>
                  {hintWords[1] && (
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#b8860b",
                        marginLeft: 12,
                      }}
                    >
                      {hintWords[1]}
                    </span>
                  )}
                </>
              )}
            </div>
            <Button
              variant="primary"
              size="small"
              onClick={() => setShowHintModal(false)}
            >
              Got it
            </Button>
          </div>
        </Modal>
      )}
      {/* Hint Confirmation Modal */}
      {showHintConfirm && (
        <Modal isOpen={true} onClose={() => setShowHintConfirm(false)}>
          <div style={{ padding: 24, textAlign: "center" }}>
            <h3>Use a Hint?</h3>
            <p style={{ fontSize: "1.1rem", margin: "18px 0" }}>
              Are you sure you want to use a hint? You won't earn points for
              this round if you do.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowHintConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="small" onClick={confirmUseHint}>
                Yes, use hint
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {/* Fallback if Modal is not rendering */}
      {!Modal && (
        <div style={{ color: "red" }}>Modal component not found or broken!</div>
      )}
    </div>
  );
};

export default WhoGame;
