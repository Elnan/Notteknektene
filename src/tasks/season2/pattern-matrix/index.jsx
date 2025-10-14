import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./PatternMatrix.module.css";
import PatternFigure from "./PatternFigure";
import PatternMatrixRules from "./PatternMatrixRules";
import { generatePattern, checkSolution } from "./pattern-matrix-logic";
import { useSaveState } from "../../../context/SaveStateContext";

const PRACTICE_ROUNDS = 2;
const MAIN_ROUNDS = 10;
const ROUND_TIME = 60;

const getInitialAnswers = (total) => Array(total).fill(null);

const GRID_SIZE = 64;
const MAIN_SIZE = 180;

const PatternMatrix = ({ onComplete, currentGameId }) => {
  // Initial state for save state system
  const initialState = {
    phase: "rules", // 'rules', 'practice', 'main', 'end', 'pause'
    practiceRound: 0,
    mainRound: 0,
    timer: ROUND_TIME,
    paused: false,
    pausePending: false,
    input: [0, 0, 0, 0, 0, 0, 0, 0],
    practiceAnswers: getInitialAnswers(PRACTICE_ROUNDS),
    mainAnswers: getInitialAnswers(MAIN_ROUNDS),
    showPauseOverlay: false,
    showPracticeFeedback: false,
    practiceFeedback: null,
    pausedDueToTimer: false,
    roundStartTime: null, // Track when current round started
    lastRoundCompleted: null, // Track last completed round
    gameStartTime: Date.now(),
  };

  // Get save state context functions
  const {
    saveGameState: contextSaveGameState,
    loadGameState,
    hasSaveState,
  } = useSaveState();

  // Simple state management
  const [gameState, setGameState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedSave, setHasLoadedSave] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Load save state on mount - simple, one-time load
  useEffect(() => {
    const loadSaveState = async () => {
      try {
        setIsLoading(true);
        console.log("Pattern Matrix: Loading save state...");

        // Try to load existing save state
        const savedState = await loadGameState(currentGameId);

        if (savedState) {
          console.log("Pattern Matrix: Found save state, applying smart logic");

          console.log("Pattern Matrix: Loaded save state", {
            phase: savedState.phase,
            practiceRound: savedState.practiceRound,
            mainRound: savedState.mainRound,
            practiceAnswers:
              savedState.practiceAnswers?.filter((a) => a !== null).length || 0,
            mainAnswers:
              savedState.mainAnswers?.filter((a) => a !== null).length || 0,
            mainAnswersDetail: savedState.mainAnswers,
          });

          console.log("Pattern Matrix: Raw saved state data", {
            practiceAnswers: savedState.practiceAnswers,
            mainAnswers: savedState.mainAnswers,
            practiceAnswersType: typeof savedState.practiceAnswers,
            mainAnswersType: typeof savedState.mainAnswers,
            practiceAnswersIsArray: Array.isArray(savedState.practiceAnswers),
            mainAnswersIsArray: Array.isArray(savedState.mainAnswers),
          });

          // Validate and fix save state data
          const validatedState = {
            ...savedState,
            practiceAnswers: Array.isArray(savedState.practiceAnswers)
              ? savedState.practiceAnswers.map((answer) =>
                  Array.isArray(answer)
                    ? answer
                    : answer && typeof answer === "object"
                      ? answer
                      : null
                )
              : getInitialAnswers(PRACTICE_ROUNDS),
            mainAnswers: Array.isArray(savedState.mainAnswers)
              ? savedState.mainAnswers.map((answer) =>
                  Array.isArray(answer)
                    ? answer
                    : answer && typeof answer === "object"
                      ? answer
                      : null
                )
              : getInitialAnswers(MAIN_ROUNDS),
            input: Array.isArray(savedState.input)
              ? savedState.input
              : [0, 0, 0, 0, 0, 0, 0, 0],
          };

          setGameState(validatedState);
          setHasLoadedSave(true);

          // Apply smart round logic here, not in a separate effect
          applySmartRoundLogic(validatedState);
        } else {
          console.log("Pattern Matrix: No save state found, starting fresh");
          setGameState(initialState);
        }

        setLastSaveTime(new Date());
        setIsLoading(false);
      } catch (error) {
        console.error("Pattern Matrix: Error loading save state", error);
        setSaveError(error);
        setGameState(initialState);
        setIsLoading(false);
      }
    };

    loadSaveState();
  }, [currentGameId, loadGameState]); // Only depend on stable values

  // Simple save function - no complex dependencies
  const saveGameState = useCallback(async () => {
    try {
      console.log("Pattern Matrix: Saving game state", {
        phase: gameState.phase,
        practiceRound: gameState.practiceRound,
        mainRound: gameState.mainRound,
        practiceAnswers:
          gameState.practiceAnswers?.filter((a) => a !== null).length || 0,
        mainAnswers:
          gameState.mainAnswers?.filter((a) => a !== null).length || 0,
        mainAnswersDetail: gameState.mainAnswers,
      });

      await contextSaveGameState(currentGameId, gameState, {
        timeSpent: Date.now() - gameState.gameStartTime,
        hintsUsed: 0,
        attempts: 0,
        completed: gameState.phase === "end",
        score: null,
        answer: null,
      });

      setLastSaveTime(new Date());
    } catch (error) {
      console.error("Pattern Matrix: Save error", error);
      setSaveError(error);
    }
  }, [currentGameId, gameState, contextSaveGameState]);

  // Auto-save every 10 seconds - simple approach
  useEffect(() => {
    if (!isLoading && gameState.phase !== "rules") {
      const interval = setInterval(() => {
        saveGameState();
      }, 10000); // Save every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isLoading, gameState.phase, saveGameState]);

  // Save on round completion
  useEffect(() => {
    if (
      !isLoading &&
      (gameState.practiceRound > 0 || gameState.mainRound > 0)
    ) {
      // Save after a short delay to ensure state is updated
      const timeout = setTimeout(() => {
        saveGameState();
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [gameState.practiceRound, gameState.mainRound, isLoading, saveGameState]);

  // Smart round logic for save state - defined after useGameSaveState
  const applySmartRoundLogic = useCallback(
    (loadedState) => {
      const now = Date.now();
      const currentPhase = loadedState.phase;
      const currentRound =
        currentPhase === "practice"
          ? loadedState.practiceRound
          : loadedState.mainRound;
      const roundStartTime = loadedState.roundStartTime;
      const lastRoundCompleted = loadedState.lastRoundCompleted;

      // Don't apply smart logic if player is paused between rounds
      if (loadedState.pausedDueToTimer || loadedState.showPauseOverlay) {
        console.log(
          "Pattern Matrix: Player paused between rounds, not advancing"
        );
        return;
      }

      // If we're in a round and it has started, check if we should advance
      if (
        (currentPhase === "practice" || currentPhase === "main") &&
        roundStartTime
      ) {
        const timeSinceRoundStart = now - roundStartTime;

        // If more than 60 seconds have passed since round start, advance to next round
        if (timeSinceRoundStart >= ROUND_TIME * 1000) {
          console.log(
            "Pattern Matrix: Round timeout detected, advancing to next round"
          );

          if (currentPhase === "practice") {
            if (currentRound + 1 < PRACTICE_ROUNDS) {
              setGameState((prev) => ({
                ...prev,
                practiceRound: currentRound + 1,
                timer: ROUND_TIME,
                input: [0, 0, 0, 0, 0, 0, 0, 0],
                roundStartTime: now,
                lastRoundCompleted: currentRound,
              }));
            } else {
              // Move to main game
              setGameState((prev) => ({
                ...prev,
                phase: "main",
                mainRound: 0,
                timer: ROUND_TIME,
                input: [0, 0, 0, 0, 0, 0, 0, 0],
                roundStartTime: now,
                lastRoundCompleted: currentRound,
              }));
            }
          } else if (currentPhase === "main") {
            if (currentRound + 1 < MAIN_ROUNDS) {
              setGameState((prev) => ({
                ...prev,
                mainRound: currentRound + 1,
                timer: ROUND_TIME,
                input: [0, 0, 0, 0, 0, 0, 0, 0],
                roundStartTime: now,
                lastRoundCompleted: currentRound,
              }));
            } else {
              // Game completed
              setGameState((prev) => ({
                ...prev,
                phase: "end",
                lastRoundCompleted: currentRound,
              }));
            }
          }
          return;
        }
      }

      // If we're paused between rounds and timer expired, advance to next round
      if (currentPhase === "pause" && lastRoundCompleted !== null) {
        console.log(
          "Pattern Matrix: Paused between rounds, advancing to next round"
        );

        if (lastRoundCompleted < PRACTICE_ROUNDS - 1) {
          // Still in practice rounds
          setGameState((prev) => ({
            ...prev,
            phase: "practice",
            practiceRound: lastRoundCompleted + 1,
            timer: ROUND_TIME,
            input: [0, 0, 0, 0, 0, 0, 0, 0],
            roundStartTime: now,
            paused: false,
            pausePending: false,
            pausedDueToTimer: false,
          }));
        } else if (lastRoundCompleted === PRACTICE_ROUNDS - 1) {
          // Move to main game
          setGameState((prev) => ({
            ...prev,
            phase: "main",
            mainRound: 0,
            timer: ROUND_TIME,
            input: [0, 0, 0, 0, 0, 0, 0, 0],
            roundStartTime: now,
            paused: false,
            pausePending: false,
            pausedDueToTimer: false,
          }));
        } else {
          // In main rounds
          const mainRoundIndex = lastRoundCompleted - PRACTICE_ROUNDS;
          if (mainRoundIndex + 1 < MAIN_ROUNDS) {
            setGameState((prev) => ({
              ...prev,
              phase: "main",
              mainRound: mainRoundIndex + 1,
              timer: ROUND_TIME,
              input: [0, 0, 0, 0, 0, 0, 0, 0],
              roundStartTime: now,
              paused: false,
              pausePending: false,
              pausedDueToTimer: false,
            }));
          } else {
            // Game completed
            setGameState((prev) => ({
              ...prev,
              phase: "end",
              paused: false,
              pausePending: false,
              pausedDueToTimer: false,
            }));
          }
        }
      }
    },
    [setGameState]
  );

  // Smart round logic is now applied directly in the load effect above

  // Extract state from gameState
  const {
    phase,
    practiceRound,
    mainRound,
    timer,
    paused,
    pausePending,
    input,
    practiceAnswers,
    mainAnswers,
    showPauseOverlay,
    showPracticeFeedback,
    practiceFeedback,
    pausedDueToTimer,
    roundStartTime,
    lastRoundCompleted,
    gameStartTime,
  } = gameState;

  const timerRef = useRef();

  // Track game start time for submission
  useEffect(() => {
    window.gameStartTime = gameStartTime;
  }, [gameStartTime]);

  // Pattern for current round
  const isPractice = phase === "practice";
  const roundIdx = isPractice ? practiceRound : mainRound;
  const totalRounds = isPractice ? PRACTICE_ROUNDS : MAIN_ROUNDS;
  const pattern = generatePattern(roundIdx, isPractice);

  // Timer effect
  useEffect(() => {
    if (!setGameState) return;
    if ((phase !== "practice" && phase !== "main") || paused) return;
    if (timer === 0) {
      if (pausePending) {
        setGameState((prev) => ({
          ...prev,
          showPauseOverlay: true,
          paused: true,
          pausePending: false,
          pausedDueToTimer: true,
        }));
        // Save immediately when pause state is set
        setTimeout(() => saveGameState(), 100);
        return;
      }
      handleConfirm();
      return;
    }
    timerRef.current = setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        timer: prev.timer - 1,
      }));
    }, 1000);
    return () => clearTimeout(timerRef.current);
  }, [timer, phase, paused, pausePending, setGameState]);

  // Track round start time when entering a new round
  useEffect(() => {
    if (!setGameState) return;
    if ((phase === "practice" || phase === "main") && !roundStartTime) {
      setGameState((prev) => ({
        ...prev,
        roundStartTime: Date.now(),
      }));
    }
  }, [phase, practiceRound, mainRound, roundStartTime, setGameState]);

  // Submit game data when reaching end phase
  useEffect(() => {
    if (phase === "end" && onComplete) {
      const timeSpent = window.gameStartTime
        ? Date.now() - window.gameStartTime
        : 0;

      // Process practice rounds
      const practiceRounds = [];
      let practiceCorrect = 0;

      for (let i = 0; i < PRACTICE_ROUNDS; i++) {
        const userAnswer = practiceAnswers[i];
        if (
          userAnswer &&
          (Array.isArray(userAnswer) ||
            (userAnswer && typeof userAnswer === "object"))
        ) {
          const practicePattern = generatePattern(i, true);

          // Convert object answers to arrays if needed
          const normalizedAnswer = Array.isArray(userAnswer)
            ? userAnswer
            : userAnswer && typeof userAnswer === "object"
              ? Object.values(userAnswer)
              : userAnswer;

          const isCorrect = checkSolution(
            normalizedAnswer,
            practicePattern.missing
          );

          practiceRounds.push({
            round: i + 1,
            userAnswer: normalizedAnswer.join(","), // Convert array to string for Firebase
            correctAnswer: practicePattern.missing.join(","),
            isCorrect: isCorrect,
          });

          if (isCorrect) practiceCorrect++;
        }
      }

      // Process main rounds
      const mainRounds = [];
      let mainCorrect = 0;

      for (let i = 0; i < MAIN_ROUNDS; i++) {
        const userAnswer = mainAnswers[i];
        if (
          userAnswer &&
          (Array.isArray(userAnswer) ||
            (userAnswer && typeof userAnswer === "object"))
        ) {
          const mainPattern = generatePattern(i, false);

          console.log("Pattern Matrix: Checking answer", {
            round: i + 1,
            userAnswer,
            userAnswerType: typeof userAnswer,
            userAnswerIsArray: Array.isArray(userAnswer),
            correctAnswer: mainPattern.missing,
            correctAnswerType: typeof mainPattern.missing,
            correctAnswerIsArray: Array.isArray(mainPattern.missing),
          });

          // Convert object answers to arrays if needed
          const normalizedAnswer = Array.isArray(userAnswer)
            ? userAnswer
            : userAnswer && typeof userAnswer === "object"
              ? Object.values(userAnswer)
              : userAnswer;

          const isCorrect = checkSolution(
            normalizedAnswer,
            mainPattern.missing
          );

          mainRounds.push({
            round: i + 1,
            userAnswer: normalizedAnswer.join(","), // Convert array to string for Firebase
            correctAnswer: mainPattern.missing.join(","),
            isCorrect: isCorrect,
          });

          if (isCorrect) mainCorrect++;
        }
      }

      const totalCorrect = practiceCorrect + mainCorrect;
      const totalRounds = practiceRounds.length + mainRounds.length;
      const accuracy = totalRounds > 0 ? (totalCorrect / totalRounds) * 100 : 0;
      const averageTimePerRound = totalRounds > 0 ? timeSpent / totalRounds : 0;

      // Calculate wrong rounds
      const wrongRounds = [];
      practiceRounds.forEach((round) => {
        if (!round.isCorrect) wrongRounds.push(round.round);
      });
      mainRounds.forEach((round) => {
        if (!round.isCorrect) wrongRounds.push(round.round);
      });
      const wrongInRound = wrongRounds.join(",");

      const submissionData = {
        practiceRounds: JSON.stringify(practiceRounds),
        mainRounds: JSON.stringify(mainRounds),
        practiceCorrect: practiceCorrect,
        mainCorrect: mainCorrect,
        wrongInRound: wrongInRound,
        accuracy: Math.round(accuracy * 100) / 100,
        timeSpent: timeSpent,
        averageTimePerRound: Math.round(averageTimePerRound),
        hintsUsed: 0, // No hints in this game
        completed: true,
        score: totalCorrect, // Use total correct as score
      };

      // Use currentGameId if available, otherwise fall back to base game ID
      const gameId = currentGameId || "pattern-matrix";
      onComplete(gameId, submissionData);
    }
  }, [phase, practiceAnswers, mainAnswers, onComplete]);

  // Reset input on round change
  useEffect(() => {
    if (setGameState) {
      setGameState((prev) => ({
        ...prev,
        input: [0, 0, 0, 0, 0, 0, 0, 0],
        timer: ROUND_TIME,
        showPracticeFeedback: false,
        practiceFeedback: null,
      }));
    }
  }, [practiceRound, mainRound, phase, setGameState]);

  // Handlers
  const handleStartPractice = () => {
    setGameState((prev) => ({
      ...prev,
      phase: "practice",
      practiceRound: 0,
      roundStartTime: Date.now(),
    }));

    // Save when game starts
    setTimeout(() => {
      saveGameState();
    }, 100);
  };

  const handlePracticeConfirm = () => {
    // Check if the answer is correct
    const isCorrect = checkSolution(input, pattern.missing);
    const feedback = {
      isCorrect,
      userAnswer: [...input],
      correctAnswer: pattern.missing,
      grid: pattern.grid,
      missingIndex: pattern.missingIndex,
      explanation: pattern.explanation,
    };

    setGameState((prev) => ({
      ...prev,
      practiceFeedback: feedback,
      showPracticeFeedback: true,
    }));
  };

  const handlePracticeFeedbackContinue = () => {
    // Save the practice answer
    const next = [...practiceAnswers];
    next[practiceRound] = input;

    // Move to next round or start main game
    if (practiceRound + 1 < PRACTICE_ROUNDS) {
      setGameState((prev) => ({
        ...prev,
        practiceAnswers: next,
        practiceRound: practiceRound + 1,
        roundStartTime: Date.now(),
        lastRoundCompleted: practiceRound,
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        practiceAnswers: next,
        phase: "main",
        mainRound: 0,
        roundStartTime: Date.now(),
        lastRoundCompleted: practiceRound,
      }));
    }

    // Explicitly save after round completion
    setTimeout(() => {
      saveGameState();
    }, 100);
  };

  const handleConfirm = () => {
    if (phase === "practice") {
      handlePracticeConfirm();
      return;
    }
    // Save answer (store at current round index, which is 0-based)
    const next = [...mainAnswers];
    next[mainRound] = input;

    console.log("Pattern Matrix: Storing answer", {
      mainRound,
      input,
      mainAnswersBefore: mainAnswers,
      mainAnswersAfter: next,
    });

    // Next round or end
    if (mainRound + 1 < MAIN_ROUNDS) {
      setGameState((prev) => ({
        ...prev,
        mainAnswers: next,
        mainRound: mainRound + 1,
        roundStartTime: Date.now(),
        lastRoundCompleted: practiceAnswers.length + mainRound,
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        mainAnswers: next,
        phase: "end",
        lastRoundCompleted: practiceAnswers.length + mainRound,
      }));
    }

    // Explicitly save after round completion
    setTimeout(() => {
      saveGameState();
    }, 100);
  };

  const handleReset = () => {
    setGameState((prev) => ({
      ...prev,
      input: [0, 0, 0, 0, 0, 0, 0, 0],
    }));
  };

  // Prepare and submit game data
  const prepareAndSubmitGameData = useCallback(() => {
    const timeSpent = window.gameStartTime
      ? Date.now() - window.gameStartTime
      : 0;

    // Process practice rounds
    const practiceRounds = [];
    let practiceCorrect = 0;

    for (let i = 0; i < PRACTICE_ROUNDS; i++) {
      const userAnswer = practiceAnswers[i];
      if (userAnswer) {
        const practicePattern = generatePattern(i, true);
        const isCorrect = checkSolution(userAnswer, practicePattern.missing);

        practiceRounds.push({
          round: i + 1,
          userAnswer: userAnswer.join(","), // Convert array to string for Firebase
          correctAnswer: practicePattern.missing.join(","),
          isCorrect: isCorrect,
        });

        if (isCorrect) practiceCorrect++;
      }
    }

    // Process main rounds
    const mainRounds = [];
    let mainCorrect = 0;

    for (let i = 0; i < MAIN_ROUNDS; i++) {
      const userAnswer = mainAnswers[i];
      if (userAnswer && Array.isArray(userAnswer)) {
        const mainPattern = generatePattern(i, false);
        const isCorrect = checkSolution(userAnswer, mainPattern.missing);

        mainRounds.push({
          round: i + 1,
          userAnswer: userAnswer.join(","), // Convert array to string for Firebase
          correctAnswer: mainPattern.missing.join(","),
          isCorrect: isCorrect,
        });

        if (isCorrect) mainCorrect++;
      }
    }

    const totalCorrect = practiceCorrect + mainCorrect;
    const totalRounds = practiceRounds.length + mainRounds.length;
    const accuracy = totalRounds > 0 ? (totalCorrect / totalRounds) * 100 : 0;
    const averageTimePerRound = totalRounds > 0 ? timeSpent / totalRounds : 0;

    // Calculate wrong rounds
    const wrongRounds = [];
    practiceRounds.forEach((round) => {
      if (!round.isCorrect) wrongRounds.push(round.round);
    });
    mainRounds.forEach((round) => {
      if (!round.isCorrect) wrongRounds.push(round.round);
    });
    const wrongInRound = wrongRounds.join(",");

    const submissionData = {
      practiceRounds: JSON.stringify(practiceRounds),
      mainRounds: JSON.stringify(mainRounds),
      practiceCorrect: practiceCorrect,
      mainCorrect: mainCorrect,
      wrongInRound: wrongInRound,
      accuracy: Math.round(accuracy * 100) / 100,
      timeSpent: timeSpent,
      averageTimePerRound: Math.round(averageTimePerRound),
      hintsUsed: 0, // No hints in this game
      completed: phase === "end",
      score: totalCorrect, // Use total correct as score
    };

    if (onComplete) {
      // Use currentGameId if available, otherwise fall back to base game ID
      const gameId = currentGameId || "pattern-matrix";
      onComplete(gameId, submissionData);
    }
  }, [practiceAnswers, mainAnswers, phase, onComplete]);

  const handlePause = () => {
    if (phase === "main" || phase === "practice") {
      setGameState((prev) => ({
        ...prev,
        pausePending: true,
        pausedDueToTimer: false,
      }));
    }
  };

  const handleResume = () => {
    setGameState((prev) => ({
      ...prev,
      paused: false,
      showPauseOverlay: false,
      // When resuming from a timer expiration pause, advance to next round
      ...(prev.pausedDueToTimer && {
        mainRound: prev.mainRound + 1,
        input: "",
        timer: ROUND_TIME,
        pausedDueToTimer: false,
      }),
    }));

    // If resuming from a timer expiration pause, call handleConfirm
    if (gameState.pausedDueToTimer) {
      setTimeout(() => handleConfirm(), 100);
    }
  };

  // Render grid (3x3)
  const renderGrid = () => {
    if (!pattern || !pattern.grid) return null;
    return (
      <div className={styles.gridWrapper}>
        {pattern.grid.flat().map((fig, idx) => {
          if (fig === null) {
            // Input figure (sync to main input)
            return <PatternFigure key={idx} value={input} size={GRID_SIZE} />;
          }
          return <PatternFigure key={idx} value={fig} size={GRID_SIZE} />;
        })}
      </div>
    );
  };

  // Practice feedback overlay
  if (showPracticeFeedback && practiceFeedback) {
    return (
      <div className={styles.pauseOverlayBg}>
        <div className={styles.pauseOverlayCard}>
          <div className={styles.pauseTitle}>
            {practiceFeedback.isCorrect ? "Correct!" : "Incorrect"}
          </div>
          <div className={styles.pauseText}>
            {practiceFeedback.isCorrect
              ? "Great job! You solved the pattern correctly."
              : "Not quite right. Here's the correct solution:"}
          </div>

          {/* Show the explanation */}
          {practiceFeedback.explanation && (
            <div className={styles.explanationBox}>
              <h4>Pattern Logic:</h4>
              <p>{practiceFeedback.explanation}</p>
            </div>
          )}

          {/* Show the grid with correct answer */}
          <div className={styles.feedbackGrid}>
            {practiceFeedback.grid.map((row, rowIdx) => (
              <div key={rowIdx} className={styles.feedbackGridRow}>
                {row.map((fig, colIdx) => {
                  const isMissing =
                    rowIdx === practiceFeedback.missingIndex[0] &&
                    colIdx === practiceFeedback.missingIndex[1];
                  return (
                    <div key={colIdx} className={styles.feedbackGridCell}>
                      <PatternFigure
                        value={isMissing ? practiceFeedback.correctAnswer : fig}
                        size={40}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <button
            onClick={handlePracticeFeedbackContinue}
            className={styles.resumeButton}
            autoFocus
          >
            <span>
              {practiceRound + 1 < PRACTICE_ROUNDS
                ? "Next Practice Round"
                : "Start Real Game"}
            </span>
            <span className={styles.resumeButtonIcon}>→</span>
          </button>
        </div>
      </div>
    );
  }

  // End screen
  if (phase === "end") {
    // Score and review
    let correct = 0;
    const review = mainAnswers.map((ans, i) => {
      const pat = generatePattern(i, false);

      console.log("Pattern Matrix: Review checking answer", {
        round: i + 1,
        userAnswer: ans,
        userAnswerType: typeof ans,
        userAnswerIsArray: Array.isArray(ans),
        correctAnswer: pat.missing,
        correctAnswerType: typeof pat.missing,
        correctAnswerIsArray: Array.isArray(pat.missing),
      });

      // Convert object answers to arrays if needed
      const normalizedAnswer = Array.isArray(ans)
        ? ans
        : ans && typeof ans === "object"
          ? Object.values(ans)
          : ans;

      const isCorrect = checkSolution(normalizedAnswer, pat.missing);
      if (isCorrect) correct++;
      return {
        ans,
        correct: pat.missing,
        isCorrect,
        grid: pat.grid,
        missingIndex: pat.missingIndex,
      };
    });
    return (
      <div className={styles.patternMatrixWrapper}>
        <h2>Game Over!</h2>
        <p>
          You got {correct} out of {MAIN_ROUNDS} correct.
        </p>
        <div className={styles.reviewGridOuter}>
          <div className={styles.reviewGrid}>
            {review.map((r, i) => {
              // Build the grid with the correct answer filled in
              const gridWithAnswer = r.grid.map((row, rowIdx) =>
                row.map((fig, colIdx) => {
                  if (fig === null) return r.correct;
                  return fig;
                })
              );
              return (
                <div key={i} className={styles.reviewGridItem}>
                  <div className={styles.reviewGridTitle}>Round {i + 1}</div>
                  <div className={styles.reviewGridItemContent}>
                    <div>
                      <div className={styles.reviewGridPattern}>
                        {gridWithAnswer.map((row, rowIdx) => (
                          <div
                            key={rowIdx}
                            className={styles.reviewGridPatternRow}
                          >
                            {row.map((fig, colIdx) => {
                              // Is this the missing spot?
                              const isMissing =
                                rowIdx === r.missingIndex[0] &&
                                colIdx === r.missingIndex[1];
                              return (
                                <div
                                  key={colIdx}
                                  className={
                                    styles.reviewGridFigure +
                                    (isMissing
                                      ? " " +
                                        styles["reviewGridFigure--missing"]
                                      : "")
                                  }
                                >
                                  <PatternFigure value={fig} size={36} />
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      <div className={styles.reviewGridLabel}>
                        Correct solution
                      </div>
                    </div>
                    <div className={styles.reviewGridUserCol}>
                      <div className={styles.reviewGridUserLabel}>
                        Your answer
                      </div>
                      <div
                        className={
                          styles.reviewGridUserFigure +
                          " " +
                          (r.isCorrect
                            ? styles["reviewGridFigure--userCorrect"]
                            : styles["reviewGridFigure--userIncorrect"])
                        }
                      >
                        <PatternFigure value={r.ans} size={36} />
                      </div>
                      <div className={styles.reviewGridLabel}>
                        {r.isCorrect ? "✔️ Correct!" : "❌ Incorrect"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Pause overlay
  if (showPauseOverlay) {
    return (
      <div className={styles.pauseOverlayBg}>
        <div className={styles.pauseOverlayCard}>
          <div className={styles.pauseTitle}>Paused</div>
          <div className={styles.pauseText}>
            Take a break!
            <br />
            The puzzle is hidden while paused.
            <br />
            When you're ready, resume to continue the round.
          </div>
          <button
            onClick={handleResume}
            className={styles.resumeButton}
            autoFocus
          >
            <span>Resume</span>
            <span className={styles.resumeButtonIcon}>▶</span>
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !setGameState) {
    return (
      <div className={styles.patternMatrixWrapper}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2>Loading Pattern Matrix...</h2>
          <p>Restoring your progress...</p>
        </div>
      </div>
    );
  }

  // Rules screen
  if (phase === "rules") {
    return <PatternMatrixRules onStart={handleStartPractice} />;
  }

  // Main/practice game UI
  return (
    <div className={styles.patternMatrixWrapper}>
      {/* Timer and pause/play row */}
      <div className={styles.timerRow}>
        <span
          className={`${styles.timerPill} ${pausePending || paused ? styles["timerPill-expanded"] : ""}`}
          onClick={() => {
            if (paused) {
              setGameState((prev) => ({
                ...prev,
                paused: false,
                pausePending: false,
                pausedDueToTimer: false,
              }));
            } else {
              setGameState((prev) => ({
                ...prev,
                pausePending: !prev.pausePending,
                pausedDueToTimer: false,
              }));
            }
          }}
          title={paused ? "Resume" : "Pause"}
        >
          <span className={styles.timerLeftGroup}>
            <span className={styles.timerIcon}>
              {pausePending && !paused ? "▶" : "⏸"}
            </span>
            {(pausePending || paused) && (
              <span
                className={
                  styles.pausesInTextPill + " " + styles["pausesInTextPill-in"]
                }
              >
                Pauses in
              </span>
            )}
          </span>
          <span className={styles.timerPillText}>{timer}s</span>
        </span>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div className={styles.roundTitle}>
          {isPractice
            ? `Practice Round ${practiceRound + 1} / ${PRACTICE_ROUNDS}`
            : `Round ${mainRound + 1} of ${MAIN_ROUNDS}`}
        </div>
        <div className={styles.roundSubtitle}>
          {isPractice
            ? "Try to solve the simple pattern below."
            : "Create the missing figure."}
        </div>
      </div>
      {/* Grid of 9 figures */}
      <div className={styles.gridWrapper}>{renderGrid()}</div>
      {/* Large interactive input */}
      <div className={styles.mainInputWrapper}>
        <PatternFigure
          value={input}
          onChange={(newInput) =>
            setGameState((prev) => ({ ...prev, input: newInput }))
          }
          interactive
          size={MAIN_SIZE}
        />
      </div>
      {/* Bottom controls */}
      <div className={styles.buttonRow}>
        <button
          onClick={handleReset}
          className={styles.roundButton}
          title="Reset"
        >
          <span className={styles.roundButtonIcon}>⟲</span>
        </button>
        <button
          onClick={handleConfirm}
          className={styles.roundButton}
          title={isPractice ? "Check Answer" : "Next/Confirm"}
        >
          <span className={styles.roundButtonIcon}>→</span>
        </button>
      </div>
    </div>
  );
};

export default PatternMatrix;
