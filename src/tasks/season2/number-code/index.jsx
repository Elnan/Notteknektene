import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import OnScreenKeyboard from "../../../components/OnScreenKeyboard";
import { IoLockClosedOutline, IoClose } from "react-icons/io5";
import puzzle from "./puzzleData";
import styles from "./NumberCode.module.css";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

function assignCodes(quote) {
  const codes = {};
  let code = 1;
  for (const char of quote.toUpperCase()) {
    if (/[A-Z]/.test(char) && !codes[char]) {
      codes[char] = code++;
    }
  }
  return codes;
}

const letterCodes = assignCodes(puzzle.quote);
const keyboardKeys = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
  ["←", " ", "→"],
];

// Get all hidden slot positions as a flat array of {wi, li}
function getAllHiddenPositions(layout) {
  const positions = [];
  for (let wi = 0; wi < layout.length; wi++) {
    for (let li = 0; li < layout[wi].length; li++) {
      if (layout[wi][li].type === "hidden") {
        positions.push({ wi, li });
      }
    }
  }
  return positions;
}

const NumberCode = ({ onComplete, currentGameId }) => {
  const quoteWords = puzzle.quote.split(" ").map((word) => word.split(""));

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

  // Track game start time
  useEffect(() => {
    window.gameStartTime = Date.now();
  }, []);

  // State for filled letters (2D array matching layout)
  const [filled, setFilled] = useState(
    puzzle.layout.map((word) => word.map(() => ""))
  );
  const [selected, setSelected] = useState({ wi: 0, li: 0 });
  const [mistake, setMistake] = useState(false);
  const [unlockingPadlocks, setUnlockingPadlocks] = useState({});
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [gameLost, setGameLost] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHintInput, setShowHintInput] = useState(false);
  const [hintLetter, setHintLetter] = useState("");
  const [hintError, setHintError] = useState("");
  const [instructionsUsed, setInstructionsUsed] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showInstructionsConfirmation, setShowInstructionsConfirmation] =
    useState(false);

  // Helper to check if a slot is filled or revealed
  const isSlotFilledOrRevealed = useCallback(
    (wi, li, filledOverride) => {
      const slot = puzzle.layout[wi][li];
      const filledArr = filledOverride || filled;
      if (!slot) return false;
      if (slot.type === "revealed") return true;
      if (slot.type === "hidden" && filledArr[wi][li]) return true;
      return false;
    },
    [filled, puzzle.layout]
  );

  // Get all hidden positions, including unlocked padlocks
  const getAllHiddenPositionsDynamic = useCallback(
    (layout, filledOverride) => {
      const positions = [];
      const filledArr = filledOverride || filled;
      for (let wi = 0; wi < layout.length; wi++) {
        for (let li = 0; li < layout[wi].length; li++) {
          const slot = layout[wi][li];
          if (slot.type === "hidden") {
            positions.push({ wi, li });
          } else if (slot.type === "padlock") {
            // Check if padlock is unlocked
            const wordLayout = layout[wi];
            const prev = li > 0 ? { wi, li: li - 1 } : null;
            const next = li < wordLayout.length - 1 ? { wi, li: li + 1 } : null;
            const prevFilled =
              prev && isSlotFilledOrRevealed(prev.wi, prev.li, filledArr);
            const nextFilled =
              next && isSlotFilledOrRevealed(next.wi, next.li, filledArr);
            if (prevFilled && nextFilled) {
              positions.push({ wi, li });
            }
          }
        }
      }
      return positions;
    },
    [filled, isSlotFilledOrRevealed, puzzle.layout]
  );

  const hiddenPositions = getAllHiddenPositionsDynamic(puzzle.layout);
  const findFirstHidden = () => hiddenPositions[0] || { wi: 0, li: 0 };

  // Calculate score based on completion and hints used
  const calculateScore = () => {
    const baseScore = 7; // Base score for completing the puzzle
    const hintPenalty = hintUsed ? 1 : 0; // -1 point for using hint
    const instructionPenalty = instructionsUsed ? 1 : 0; // -1 point for using instructions
    return Math.max(0, baseScore - hintPenalty - instructionPenalty); // Minimum score is 0
  };

  // Helper to get all currently available hidden slots for a given letter (including unlocked padlocks)
  const getAllCurrentHiddenPositionsForLetter = useCallback(
    (char, filledOverride) => {
      const positions = [];
      const filledArr = filledOverride || filled;
      for (let wi = 0; wi < puzzle.layout.length; wi++) {
        for (let li = 0; li < puzzle.layout[wi].length; li++) {
          const slot = puzzle.layout[wi][li];
          const slotChar = quoteWords[wi][li]?.toUpperCase();
          if (slotChar !== char) continue;
          if (slot.type === "hidden") {
            positions.push({ wi, li });
          } else if (slot.type === "padlock") {
            // Check if padlock is unlocked
            const wordLayout = puzzle.layout[wi];
            const prev = li > 0 ? { wi, li: li - 1 } : null;
            const next = li < wordLayout.length - 1 ? { wi, li: li + 1 } : null;
            const prevFilled =
              prev && isSlotFilledOrRevealed(prev.wi, prev.li, filledArr);
            const nextFilled =
              next && isSlotFilledOrRevealed(next.wi, next.li, filledArr);
            if (prevFilled && nextFilled) {
              positions.push({ wi, li });
            }
          }
        }
      }
      return positions;
    },
    [filled, isSlotFilledOrRevealed, puzzle.layout, quoteWords]
  );

  // Compute which letters are fully filled (all hidden slots for that letter, including unlocked padlocks, are filled)
  const fullyFilledLetters = useMemo(() => {
    const result = {};
    for (const char in letterCodes) {
      const code = letterCodes[char];
      const positions = getAllCurrentHiddenPositionsForLetter(char);
      // If there are no hidden slots for this letter, check if it only appears in revealed slots
      if (positions.length === 0) {
        // Check if all occurrences are revealed
        let onlyRevealed = true;
        for (let wi = 0; wi < puzzle.layout.length; wi++) {
          for (let li = 0; li < puzzle.layout[wi].length; li++) {
            const slot = puzzle.layout[wi][li];
            const slotChar = quoteWords[wi][li]?.toUpperCase();
            if (slotChar === char && slot.type !== "revealed") {
              onlyRevealed = false;
            }
          }
        }
        if (onlyRevealed) {
          result[code] = true;
        }
        continue;
      }
      const allFilled = positions.every(
        ({ wi, li }) => filled[wi][li] && filled[wi][li].toUpperCase() === char
      );
      if (allFilled) {
        result[code] = true;
      }
    }
    return result;
  }, [
    filled,
    getAllCurrentHiddenPositionsForLetter,
    letterCodes,
    puzzle.layout,
    quoteWords,
  ]);

  // Grey out keys for fully filled letters
  const disabledKeys = useMemo(() => {
    const disabled = [];
    for (const char in letterCodes) {
      const code = letterCodes[char];
      if (fullyFilledLetters[code]) {
        disabled.push(char);
      }
    }
    return disabled;
  }, [fullyFilledLetters]);

  // Compute which letters are in play (filled or revealed somewhere, but not fully filled)
  const inPlayKeys = useMemo(() => {
    const inPlay = new Set();
    for (let wi = 0; wi < puzzle.layout.length; wi++) {
      for (let li = 0; li < puzzle.layout[wi].length; li++) {
        const slot = puzzle.layout[wi][li];
        const char = quoteWords[wi][li]?.toUpperCase();
        if (!char || !/[A-Z]/.test(char)) continue;
        const code = letterCodes[char];
        // Hidden slot
        if (
          slot.type === "hidden" &&
          filled[wi][li] &&
          !fullyFilledLetters[code]
        ) {
          inPlay.add(char);
        }
        // Revealed slot
        if (slot.type === "revealed" && !fullyFilledLetters[code]) {
          inPlay.add(char);
        }
        // Unlocked padlock slot
        if (slot.type === "padlock") {
          // Check if padlock is unlocked
          const wordLayout = puzzle.layout[wi];
          const prev = li > 0 ? { wi, li: li - 1 } : null;
          const next = li < wordLayout.length - 1 ? { wi, li: li + 1 } : null;
          const prevFilled = prev && isSlotFilledOrRevealed(prev.wi, prev.li);
          const nextFilled = next && isSlotFilledOrRevealed(next.wi, next.li);
          if (
            prevFilled &&
            nextFilled &&
            filled[wi][li] &&
            !fullyFilledLetters[code]
          ) {
            inPlay.add(char);
          }
        }
      }
    }
    return Array.from(inPlay);
  }, [
    filled,
    puzzle.layout,
    quoteWords,
    fullyFilledLetters,
    letterCodes,
    isSlotFilledOrRevealed,
  ]);

  // Helper to check if a slot is filled with the correct letter
  const isSlotCorrectlyFilled = useCallback(
    (wi, li, filledOverride) => {
      const slot = puzzle.layout[wi][li];
      const char = quoteWords[wi][li]?.toUpperCase();
      const filledArr = filledOverride || filled;
      if (!char || !/[A-Z]/.test(char)) return false;
      if (slot.type === "hidden") {
        return filledArr[wi][li] && filledArr[wi][li].toUpperCase() === char;
      }
      if (slot.type === "padlock") {
        // Check if padlock is unlocked
        const wordLayout = puzzle.layout[wi];
        const prev = li > 0 ? { wi, li: li - 1 } : null;
        const next = li < wordLayout.length - 1 ? { wi, li: li + 1 } : null;
        const prevFilled =
          prev && isSlotFilledOrRevealed(prev.wi, prev.li, filledArr);
        const nextFilled =
          next && isSlotFilledOrRevealed(next.wi, next.li, filledArr);
        if (prevFilled && nextFilled) {
          return filledArr[wi][li] && filledArr[wi][li].toUpperCase() === char;
        }
      }
      return false;
    },
    [filled, puzzle.layout, quoteWords, isSlotFilledOrRevealed]
  );

  // Move all handler functions above useEffect hooks
  // 1. moveSelection
  const moveSelection = useCallback(
    (dir) => {
      if (!hiddenPositions.length) return;
      let idx = hiddenPositions.findIndex(
        (pos) => pos.wi === selected.wi && pos.li === selected.li
      );
      let nextIdx = idx;
      let tries = 0;
      do {
        if (dir === "right") {
          nextIdx = (nextIdx + 1) % hiddenPositions.length;
        } else if (dir === "left") {
          nextIdx =
            (nextIdx - 1 + hiddenPositions.length) % hiddenPositions.length;
        }
        tries++;
        if (tries > hiddenPositions.length) return;
      } while (
        isSlotCorrectlyFilled(
          hiddenPositions[nextIdx].wi,
          hiddenPositions[nextIdx].li
        )
      );
      setSelected(hiddenPositions[nextIdx]);
    },
    [selected, hiddenPositions, isSlotCorrectlyFilled]
  );

  // 2. handleInput
  const handleInput = useCallback(
    (input) => {
      const { wi, li } = selected;
      const correct = quoteWords[wi][li].toUpperCase();
      if (input === correct) {
        setFilled((prev) => {
          const next = prev.map((arr) => arr.slice());
          next[wi][li] = input;
          // After updating filled, recompute hiddenPositions and move marker
          const newHiddenPositions = getAllHiddenPositionsDynamic(
            puzzle.layout,
            next
          );
          const idx = newHiddenPositions.findIndex(
            (pos) => pos.wi === wi && pos.li === li
          );
          let nextIdx = idx;
          let tries = 0;
          do {
            nextIdx = (nextIdx + 1) % newHiddenPositions.length;
            tries++;
            if (tries > newHiddenPositions.length) return next;
          } while (
            isSlotCorrectlyFilled(
              newHiddenPositions[nextIdx].wi,
              newHiddenPositions[nextIdx].li,
              next
            )
          );
          setSelected(newHiddenPositions[nextIdx]);
          setMistake(false);
          return next;
        });
      } else {
        setMistake(true);
        setTimeout(() => setMistake(false), 400);
        setMistakes((m) => {
          if (m < 2) return m + 1;
          setGameLost(true);

          // Calculate submission data for game loss
          const timeSpent = Date.now() - (window.gameStartTime || Date.now());

          // Prepare submission data using the new standardized system
          const submissionData = {
            score: 0, // No points for losing
            mistakes: 3, // 3 mistakes = game lost
            timeSpent: timeSpent,
            hintsUsed: hintUsed ? 1 : 0,
            instructionsUsed: instructionsUsed ? 1 : 0,
          };

          // Call onComplete with submission data
          if (onComplete) {
            // Use currentGameId if available, otherwise fall back to base game ID
            const gameId = currentGameId || "number-code";
            onComplete(gameId, submissionData);
          }

          setTimeout(() => setShowCompletionScreen(true), 2000); // Show loss for 2s
          return 3;
        });
      }
    },
    [selected, quoteWords, getAllHiddenPositionsDynamic, isSlotCorrectlyFilled]
  );

  // 3. handleKeyboard
  const handleKeyboard = (key) => {
    if (key === "→") moveSelection("right");
    else if (key === "←") moveSelection("left");
    else if (/^[A-Z]$/.test(key)) handleInput(key);
  };

  // Keyboard navigation (physical)
  useEffect(() => {
    if (showHintInput) return; // Don't handle keys if hint modal is open
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        moveSelection("right");
      } else if (e.key === "ArrowLeft") {
        moveSelection("left");
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleInput(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveSelection, handleInput, showHintInput]);

  // Animate padlock unlock
  const handlePadlockUnlock = (wi, li) => {
    setUnlockingPadlocks((prev) => ({ ...prev, [`${wi}-${li}`]: true }));
    setTimeout(() => {
      setUnlockingPadlocks((prev) => ({ ...prev, [`${wi}-${li}`]: false }));
    }, 400);
  };

  // Check for completion after each input
  useEffect(() => {
    const allFilled = getAllHiddenPositionsDynamic(puzzle.layout).every((pos) =>
      isSlotCorrectlyFilled(pos.wi, pos.li)
    );
    if (allFilled && !gameCompleted) {
      setGameCompleted(true);

      // Calculate submission data
      const timeSpent = Date.now() - (window.gameStartTime || Date.now());

      // Prepare submission data using the new standardized system
      const submissionData = {
        score: calculateScore(),
        mistakes: mistakes, // Number of mistakes made (0-2 for success)
        timeSpent: timeSpent,
        hintsUsed: hintUsed ? 1 : 0,
        instructionsUsed: instructionsUsed ? 1 : 0,
      };

      // Call onComplete with submission data
      if (onComplete) {
        // Use currentGameId if available, otherwise fall back to base game ID
        const gameId = currentGameId || "number-code";
        onComplete(gameId, submissionData);
      }

      setTimeout(() => {
        setShowCompletionScreen(true);
      }, 2000); // 2 seconds linger
    }
  }, [
    filled,
    gameCompleted,
    getAllHiddenPositionsDynamic,
    isSlotCorrectlyFilled,
    puzzle.layout,
    mistakes,
    hintUsed,
    instructionsUsed,
    onComplete,
  ]);

  // Instructions confirmation handler
  const handleInstructionsConfirm = () => {
    if (!instructionsUsed) setInstructionsUsed(true);
    setShowInstructionsModal(true);
    setShowInstructionsConfirmation(false);
  };

  // Hint logic
  const handleHintConfirm = () => {
    const letter = hintLetter.trim().toUpperCase();
    if (!/^[A-Z]$/.test(letter)) {
      setHintError("Type a valid letter (A-Z)");
      return;
    }
    // Finn alle tomme plasser (hidden eller unlocked padlock) med denne bokstaven
    const candidates = [];
    for (let wi = 0; wi < puzzle.layout.length; wi++) {
      for (let li = 0; li < puzzle.layout[wi].length; li++) {
        const slot = puzzle.layout[wi][li];
        const char = quoteWords[wi][li]?.toUpperCase();
        if (char !== letter) continue;
        // Hidden
        if (slot.type === "hidden" && !filled[wi][li]) {
          candidates.push({ wi, li });
        }
        // Unlocked padlock
        if (slot.type === "padlock") {
          const wordLayout = puzzle.layout[wi];
          const prev = li > 0 ? { wi, li: li - 1 } : null;
          const next = li < wordLayout.length - 1 ? { wi, li: li + 1 } : null;
          const prevFilled = prev && isSlotFilledOrRevealed(prev.wi, prev.li);
          const nextFilled = next && isSlotFilledOrRevealed(next.wi, next.li);
          if (prevFilled && nextFilled && !filled[wi][li]) {
            candidates.push({ wi, li });
          }
        }
      }
    }
    if (candidates.length === 0) {
      setHintError("Ingen tomme plasser med denne bokstaven");
      return;
    }
    // Velg én tilfeldig plass
    const idx = Math.floor(Math.random() * candidates.length);
    const { wi, li } = candidates[idx];
    setFilled((prev) => {
      const next = prev.map((arr) => arr.slice());
      next[wi][li] = letter;
      return next;
    });
    setHintUsed(true);
    setShowHintInput(false);
    setHintLetter("");
    setHintError("");
  };

  // Render forsøk above the input area (top of GameArea)
  const Attempts = () => (
    <div className={styles.attemptsWrapper}>
      <div className={styles.attemptsHeading}>Attempts:</div>
      <div className={styles.attemptsCircles}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={styles.attemptCircle}>
            {mistakes > i ? <IoClose className={styles.attemptCross} /> : null}
          </span>
        ))}
      </div>
    </div>
  );

  // Render hint modal using custom Modal component
  const HintModal = (
    <Modal
      isOpen={showHintInput}
      onClose={() => {
        setShowHintInput(false);
        setHintLetter("");
        setHintError("");
      }}
      title="Hint"
    >
      <div className={styles.hintContent}>
        <div className={styles.hintInstr}>
          Type a letter you need help with. A random empty slot with that letter
          will be filled.
          <br /> You can only do this once and
          <strong> will result in 1 points deduction.</strong>
        </div>
        <input
          className={styles.hintInput}
          type="text"
          maxLength={1}
          value={hintLetter}
          onChange={(e) => {
            setHintLetter(
              e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase()
            );
            setHintError("");
          }}
          autoFocus
        />
        {hintError && <div className={styles.hintError}>{hintError}</div>}
        <div className={styles.hintActions}>
          <Button
            size="small"
            variant="logout"
            onClick={() => {
              setShowHintInput(false);
              setHintLetter("");
              setHintError("");
            }}
          >
            Cancel
          </Button>
          <Button size="small" variant="primary" onClick={handleHintConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );

  if (showCompletionScreen) {
    const completedWithWin = !gameLost;
    return (
      <div className={styles.completionScreenAnimated}>
        <div className={styles.quoteText}>{puzzle.quote}</div>
        <div className={styles.authorBlock}>
          <div className={styles.authorName}>
            <em>{puzzle.author}</em>
          </div>
          <div className={styles.authorDetails}>
            {puzzle.occupation}, {puzzle.years}
          </div>
        </div>
        <div className={styles.congratsBlock}>
          {completedWithWin
            ? "Congratulations! You solved the puzzle."
            : "Sorry, you didn't solve it this time."}
        </div>
      </div>
    );
  }

  if (gameLost) {
    return (
      <div className={styles.lossScreen}>
        <div className={styles.lossMessage}>
          You have used up all your attempts.
          <br />
          Try again next week!
        </div>
      </div>
    );
  }

  if (gameCompleted) {
    return (
      <div className={styles.puzzleCompletedContainer}>
        <div className={styles.container}>
          <div className={styles.quoteWordsArea}>
            {puzzle.layout.map((wordLayout, wi) => (
              <span key={wi} className={styles.wordGroup}>
                {wordLayout.map((slot, li) => {
                  const char = quoteWords[wi][li];
                  const code = letterCodes[char?.toUpperCase()];
                  const isSelected =
                    selected.wi === wi &&
                    selected.li === li &&
                    slot.type === "hidden";
                  const isFilled = slot.type === "hidden" && filled[wi][li];
                  const hideCode = fullyFilledLetters[code];

                  // Padlock logic
                  if (slot.type === "padlock") {
                    // Check adjacent slots
                    const prev = li > 0 ? { wi, li: li - 1 } : null;
                    const next =
                      li < wordLayout.length - 1 ? { wi, li: li + 1 } : null;
                    const prevFilled =
                      prev && isSlotFilledOrRevealed(prev.wi, prev.li);
                    const nextFilled =
                      next && isSlotFilledOrRevealed(next.wi, next.li);
                    const dots = slot.dots;
                    let padlockState = "2dot";
                    if (
                      (prevFilled && !nextFilled) ||
                      (!prevFilled && nextFilled)
                    )
                      padlockState = "1dot";
                    if (prevFilled && nextFilled) padlockState = "unlocked";

                    // Animate unlock
                    const padlockKey = `${wi}-${li}`;
                    if (
                      padlockState === "unlocked" &&
                      !unlockingPadlocks[padlockKey]
                    ) {
                      handlePadlockUnlock(wi, li);
                    }

                    // If unlocked, fade out padlock and fade in slot
                    if (padlockState === "unlocked") {
                      // Always render as a normal hidden slot (with input, marker, filled letter, etc.)
                      const coveredChar = quoteWords[wi][li];
                      const coveredCode =
                        letterCodes[coveredChar?.toUpperCase()];
                      const isSelectedUnlocked =
                        selected.wi === wi && selected.li === li;
                      const isFilledUnlocked = filled[wi][li];
                      const hideCodeUnlocked = fullyFilledLetters[coveredCode];
                      return (
                        <span
                          key={li}
                          className={
                            styles.letterSlot +
                            (isSelectedUnlocked ? " " + styles.selected : "") +
                            (isSelectedUnlocked && mistake
                              ? " " + styles.mistake
                              : "") +
                            " " +
                            styles.padlockUnlockedFadeIn
                          }
                          onClick={() =>
                            !isSlotCorrectlyFilled(wi, li) &&
                            setSelected({ wi, li })
                          }
                        >
                          {isSelectedUnlocked ? (
                            <span className={styles.selectedContainer}>
                              <span className={styles.letterAboveTight}>
                                {isFilledUnlocked ? filled[wi][li] : ""}
                              </span>
                              <span className={styles.underlineTight}></span>
                              <span
                                className={
                                  styles.codeNormalTight +
                                  (hideCodeUnlocked
                                    ? " " + styles.invisibleCode
                                    : "")
                                }
                              >
                                {coveredCode}
                              </span>
                            </span>
                          ) : (
                            <>
                              <span className={styles.letterAboveTight}>
                                {isFilledUnlocked ? filled[wi][li] : ""}
                              </span>
                              <span className={styles.underlineTight}></span>
                              <span
                                className={
                                  styles.codeNormalTight +
                                  (hideCodeUnlocked
                                    ? " " + styles.invisibleCode
                                    : "")
                                }
                              >
                                {coveredCode}
                              </span>
                            </>
                          )}
                        </span>
                      );
                    }

                    // Otherwise, render padlock with correct dots and animation
                    return (
                      <span
                        key={li}
                        className={
                          styles.letterSlot +
                          (padlockState === "1dot"
                            ? " " + styles.padlockOneDot
                            : "") +
                          (padlockState === "unlocked"
                            ? " " + styles.padlockFadeOut
                            : "")
                        }
                      >
                        <span className={styles.padlockAbove}>
                          <IoLockClosedOutline className={styles.padlockIcon} />
                          {padlockState === "2dot" && (
                            <span className={styles.padlockDot}>• •</span>
                          )}
                          {padlockState === "1dot" && (
                            <span
                              className={
                                styles.padlockDot + " " + styles.dotFadeOut
                              }
                            >
                              •
                            </span>
                          )}
                        </span>
                        <span className={styles.underlineTight}></span>
                        <span className={styles.codeNormalTight}></span>
                      </span>
                    );
                  } else if (slot.type === "revealed") {
                    return (
                      <span key={li} className={styles.letterSlot}>
                        <span
                          className={
                            styles.letterAboveTight +
                            " " +
                            styles.revealedLetter
                          }
                        >
                          {slot.letter.toUpperCase()}
                        </span>
                        <span className={styles.underlineTight}></span>
                        <span
                          className={
                            styles.codeNormalTight +
                            (hideCode ? " " + styles.invisibleCode : "")
                          }
                        >
                          {code}
                        </span>
                      </span>
                    );
                  } else if (slot.type === "hidden") {
                    return (
                      <span
                        key={li}
                        className={
                          styles.letterSlot +
                          (isSelected ? " " + styles.selected : "") +
                          (isSelected && mistake ? " " + styles.mistake : "")
                        }
                        onClick={() =>
                          !isSlotCorrectlyFilled(wi, li) &&
                          setSelected({ wi, li })
                        }
                      >
                        {isSelected ? (
                          <span className={styles.selectedContainer}>
                            <span className={styles.letterAboveTight}>
                              {isFilled ? filled[wi][li] : ""}
                            </span>
                            <span className={styles.underlineTight}></span>
                            <span
                              className={
                                styles.codeNormalTight +
                                (hideCode ? " " + styles.invisibleCode : "")
                              }
                            >
                              {code}
                            </span>
                          </span>
                        ) : (
                          <>
                            <span className={styles.letterAboveTight}>
                              {isFilled ? filled[wi][li] : ""}
                            </span>
                            <span className={styles.underlineTight}></span>
                            <span
                              className={
                                styles.codeNormalTight +
                                (hideCode ? " " + styles.invisibleCode : "")
                              }
                            >
                              {code}
                            </span>
                          </>
                        )}
                      </span>
                    );
                  } else if (slot.type === "punct") {
                    return (
                      <span key={li} className={styles.letterSlot}>
                        <span className={styles.letterAboveTight}></span>
                        <span className={styles.underlineTight}></span>
                        <span className={styles.codeNormalTight}>
                          {slot.char}
                        </span>
                      </span>
                    );
                  } else {
                    return null;
                  }
                })}
              </span>
            ))}
          </div>
          <div className={styles.keyboardRow}>
            {!isMobile && (
              <div className={styles.attemptsLeft}>
                <Attempts />
              </div>
            )}
            <div className={styles.keyboardCenter}>
              <OnScreenKeyboard
                keys={keyboardKeys}
                onKeyPress={handleKeyboard}
                disabledKeys={disabledKeys}
                inPlayKeys={[]}
              />
            </div>
          </div>
          {HintModal}
        </div>
        <div className={styles.puzzleCompletedOverlay}>
          <span className={styles.puzzleCompletedText}>Puzzle Completed!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Number Code</h1>

      {/* Mobile attempts and buttons at top */}
      {isMobile && (
        <div className={styles.attemptsAndButtons}>
          <div className={styles.attemptsLeft}>
            <Attempts />
          </div>
          <div className={styles.hintRight}>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setShowHintInput(true)}
              disabled={hintUsed}
              className={hintUsed ? styles.hintButtonUsed : ""}
            >
              Hint
              {!hintUsed && (
                <span className={styles.penaltyText}> (-1 point)</span>
              )}
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => {
                if (instructionsUsed) {
                  setShowInstructionsModal(true);
                } else {
                  setShowInstructionsConfirmation(true);
                }
              }}
              className={instructionsUsed ? styles.instructionsButtonUsed : ""}
            >
              Instructions
              {!instructionsUsed && (
                <span className={styles.penaltyText}> (-1 point)</span>
              )}
            </Button>
          </div>
        </div>
      )}

      <div className={styles.quoteWordsArea}>
        {puzzle.layout.map((wordLayout, wi) => (
          <span key={wi} className={styles.wordGroup}>
            {wordLayout.map((slot, li) => {
              const char = quoteWords[wi][li];
              const code = letterCodes[char?.toUpperCase()];
              const isSelected =
                selected.wi === wi &&
                selected.li === li &&
                slot.type === "hidden";
              const isFilled = slot.type === "hidden" && filled[wi][li];
              const hideCode = fullyFilledLetters[code];

              // Padlock logic
              if (slot.type === "padlock") {
                // Check adjacent slots
                const prev = li > 0 ? { wi, li: li - 1 } : null;
                const next =
                  li < wordLayout.length - 1 ? { wi, li: li + 1 } : null;
                const prevFilled =
                  prev && isSlotFilledOrRevealed(prev.wi, prev.li);
                const nextFilled =
                  next && isSlotFilledOrRevealed(next.wi, next.li);
                const dots = slot.dots;
                let padlockState = "2dot";
                if ((prevFilled && !nextFilled) || (!prevFilled && nextFilled))
                  padlockState = "1dot";
                if (prevFilled && nextFilled) padlockState = "unlocked";

                // Animate unlock
                const padlockKey = `${wi}-${li}`;
                if (
                  padlockState === "unlocked" &&
                  !unlockingPadlocks[padlockKey]
                ) {
                  handlePadlockUnlock(wi, li);
                }

                // If unlocked, fade out padlock and fade in slot
                if (padlockState === "unlocked") {
                  // Always render as a normal hidden slot (with input, marker, filled letter, etc.)
                  const coveredChar = quoteWords[wi][li];
                  const coveredCode = letterCodes[coveredChar?.toUpperCase()];
                  const isSelectedUnlocked =
                    selected.wi === wi && selected.li === li;
                  const isFilledUnlocked = filled[wi][li];
                  const hideCodeUnlocked = fullyFilledLetters[coveredCode];
                  return (
                    <span
                      key={li}
                      className={
                        styles.letterSlot +
                        (isSelectedUnlocked ? " " + styles.selected : "") +
                        (isSelectedUnlocked && mistake
                          ? " " + styles.mistake
                          : "") +
                        " " +
                        styles.padlockUnlockedFadeIn
                      }
                      onClick={() =>
                        !isSlotCorrectlyFilled(wi, li) &&
                        setSelected({ wi, li })
                      }
                    >
                      {isSelectedUnlocked ? (
                        <span className={styles.selectedContainer}>
                          <span className={styles.letterAboveTight}>
                            {isFilledUnlocked ? filled[wi][li] : ""}
                          </span>
                          <span className={styles.underlineTight}></span>
                          <span
                            className={
                              styles.codeNormalTight +
                              (hideCodeUnlocked
                                ? " " + styles.invisibleCode
                                : "")
                            }
                          >
                            {coveredCode}
                          </span>
                        </span>
                      ) : (
                        <>
                          <span className={styles.letterAboveTight}>
                            {isFilledUnlocked ? filled[wi][li] : ""}
                          </span>
                          <span className={styles.underlineTight}></span>
                          <span
                            className={
                              styles.codeNormalTight +
                              (hideCodeUnlocked
                                ? " " + styles.invisibleCode
                                : "")
                            }
                          >
                            {coveredCode}
                          </span>
                        </>
                      )}
                    </span>
                  );
                }

                // Otherwise, render padlock with correct dots and animation
                return (
                  <span
                    key={li}
                    className={
                      styles.letterSlot +
                      (padlockState === "1dot"
                        ? " " + styles.padlockOneDot
                        : "") +
                      (padlockState === "unlocked"
                        ? " " + styles.padlockFadeOut
                        : "")
                    }
                  >
                    <span className={styles.padlockAbove}>
                      <IoLockClosedOutline className={styles.padlockIcon} />
                      {padlockState === "2dot" && (
                        <span className={styles.padlockDot}>• •</span>
                      )}
                      {padlockState === "1dot" && (
                        <span
                          className={
                            styles.padlockDot + " " + styles.dotFadeOut
                          }
                        >
                          •
                        </span>
                      )}
                    </span>
                    <span className={styles.underlineTight}></span>
                    <span className={styles.codeNormalTight}></span>
                  </span>
                );
              } else if (slot.type === "revealed") {
                return (
                  <span key={li} className={styles.letterSlot}>
                    <span
                      className={
                        styles.letterAboveTight + " " + styles.revealedLetter
                      }
                    >
                      {slot.letter.toUpperCase()}
                    </span>
                    <span className={styles.underlineTight}></span>
                    <span
                      className={
                        styles.codeNormalTight +
                        (hideCode ? " " + styles.invisibleCode : "")
                      }
                    >
                      {code}
                    </span>
                  </span>
                );
              } else if (slot.type === "hidden") {
                return (
                  <span
                    key={li}
                    className={
                      styles.letterSlot +
                      (isSelected ? " " + styles.selected : "") +
                      (isSelected && mistake ? " " + styles.mistake : "")
                    }
                    onClick={() =>
                      !isSlotCorrectlyFilled(wi, li) && setSelected({ wi, li })
                    }
                  >
                    {isSelected ? (
                      <span className={styles.selectedContainer}>
                        <span className={styles.letterAboveTight}>
                          {isFilled ? filled[wi][li] : ""}
                        </span>
                        <span className={styles.underlineTight}></span>
                        <span
                          className={
                            styles.codeNormalTight +
                            (hideCode ? " " + styles.invisibleCode : "")
                          }
                        >
                          {code}
                        </span>
                      </span>
                    ) : (
                      <>
                        <span className={styles.letterAboveTight}>
                          {isFilled ? filled[wi][li] : ""}
                        </span>
                        <span className={styles.underlineTight}></span>
                        <span
                          className={
                            styles.codeNormalTight +
                            (hideCode ? " " + styles.invisibleCode : "")
                          }
                        >
                          {code}
                        </span>
                      </>
                    )}
                  </span>
                );
              } else if (slot.type === "punct") {
                return (
                  <span key={li} className={styles.letterSlot}>
                    <span className={styles.letterAboveTight}></span>
                    <span className={styles.underlineTight}></span>
                    <span className={styles.codeNormalTight}>{slot.char}</span>
                  </span>
                );
              } else {
                return null;
              }
            })}
          </span>
        ))}
      </div>
      <div className={styles.keyboardRow}>
        {!isMobile && (
          <div className={styles.attemptsLeft}>
            <Attempts />
          </div>
        )}
        <div className={styles.keyboardCenter}>
          <OnScreenKeyboard
            keys={keyboardKeys}
            onKeyPress={handleKeyboard}
            disabledKeys={disabledKeys}
            inPlayKeys={inPlayKeys}
          />
        </div>
        {!isMobile && (
          <div className={styles.hintRight}>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setShowHintInput(true)}
              disabled={hintUsed}
              className={hintUsed ? styles.hintButtonUsed : ""}
            >
              Hint
              {!hintUsed && (
                <span className={styles.penaltyText}> (-1 point)</span>
              )}
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => {
                if (instructionsUsed) {
                  setShowInstructionsModal(true);
                } else {
                  setShowInstructionsConfirmation(true);
                }
              }}
              className={instructionsUsed ? styles.instructionsButtonUsed : ""}
            >
              Instructions
              {!instructionsUsed && (
                <span className={styles.penaltyText}> (-1 point)</span>
              )}
            </Button>
          </div>
        )}
      </div>
      {HintModal}

      {/* Instructions Confirmation Modal */}
      <Modal
        isOpen={showInstructionsConfirmation}
        onClose={() => setShowInstructionsConfirmation(false)}
        title="Confirm Instructions"
      >
        <div className={styles.hintContent}>
          <div className={styles.hintInstr}>
            Using the instructions will result in a 1 point deduction. Are you
            sure you want to continue?
          </div>
          <div className={styles.hintActions}>
            <Button
              size="small"
              variant="logout"
              onClick={() => setShowInstructionsConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="primary"
              onClick={handleInstructionsConfirm}
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>

      {/* Instructions Modal */}
      <Modal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        title="Number Code Instructions"
      >
        <div className="hintContent">
          <h4>How to Play:</h4>
          <p>
            Decode the hidden message by figuring out which number corresponds
            to which letter.
          </p>

          <h4>Game Rules:</h4>
          <ul>
            <li>
              <strong>Letter codes:</strong> Each letter in the message has a
              unique number code
            </li>
            <li>
              <strong>Revealed letters:</strong> Some letters are already shown
              to help you start
            </li>
            <li>
              <strong>Padlocks:</strong> Some letters are locked and need
              adjacent letters to be filled first
            </li>
            <li>
              <strong>Mistakes:</strong> You have 3 attempts before the game
              ends
            </li>
            <li>
              <strong>Objective:</strong> Fill all the empty slots with the
              correct letters
            </li>
          </ul>
          <p>
            <strong>Be careful:</strong>You only have 3 attempts, so any three
            misplaced letters, and you lose.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default NumberCode;
