import React, { useState, useCallback, useRef, useEffect } from "react";
import styles from "./LogicGrid.module.css";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import modalStyles from "../../../components/Modal.module.css";
import { useLogicGridSaveState } from "../../../hooks/useLogicGridSaveState";
import GAME_CONFIG, {
  getCategoryItems,
  validateConfig,
  getRandomCorrectSolution,
} from "./gameConfig";
import html2canvas from "html2canvas";

const LogicGrid = ({ onComplete, currentGameId }) => {
  // Save/load functionality
  const {
    saveGameState,
    loadGameState,
    clearSaveState,
    isLoading: saveLoading,
    error: saveError,
    cleanup,
  } = useLogicGridSaveState(currentGameId);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Validate configuration on component mount
  React.useEffect(() => {
    const errors = validateConfig();
    if (errors.length > 0) {
      console.error("Game configuration errors:", errors);
    }
  }, []);

  // Grid state: 0 = empty, 1 = X, 2 = ✓
  const [gridState, setGridState] = useState({});
  const [selectedClues, setSelectedClues] = useState(new Set());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [score, setScore] = useState(0);
  const [showGridModal, setShowGridModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [capturedGridImage, setCapturedGridImage] = useState(null);
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false);
  const gridRef = useRef(null);

  // Track game start time for submission
  useEffect(() => {
    window.gameStartTime = Date.now();
  }, []);

  // Load game state on component mount
  useEffect(() => {
    const loadState = async () => {
      const savedState = await loadGameState();
      if (savedState) {
        setGridState(savedState.gridState);
        setSelectedClues(savedState.selectedClues);
        setHintsUsed(savedState.hintsUsed);
        setGameCompleted(savedState.gameCompleted);
        setShowSolution(savedState.showSolution);
        setScore(savedState.score);
        setCapturedGridImage(savedState.capturedGridImage);
        console.log("🎮 Loaded saved Logic Grid game state");
      }
      setHasLoadedInitialState(true);
    };

    loadState();
  }, [loadGameState]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const MAX_HINTS = GAME_CONFIG.maxHints;
  const BASE_SCORE = GAME_CONFIG.baseScore;

  // Analyze grid and prepare submission data
  const analyzeGridAndSubmit = useCallback(
    (calculatedScore) => {
      const timeSpent = window.gameStartTime
        ? Date.now() - window.gameStartTime
        : 0;

      // Only track correct and wrong cells
      const correctCells = [];
      const wrongCells = [];

      GRID_CONFIG.gridPattern.forEach((row, rowIndex) => {
        row.forEach((shouldShow, colIndex) => {
          if (shouldShow) {
            // Generate 5x5 sub-grid for this cell
            for (let subRow = 0; subRow < 5; subRow++) {
              for (let subCol = 0; subCol < 5; subCol++) {
                const cellState =
                  gridState[`${rowIndex}-${colIndex}-${subRow}-${subCol}`] || 0;

                // Get the items for this cell based on grid position
                const leftCategory = GRID_CONFIG.categories[rowIndex];
                const topCategory = GRID_CONFIG.topCategories[colIndex];

                if (!leftCategory || !topCategory) continue;

                const leftItem = leftCategory.items[subRow];
                const topItem = topCategory.items[subCol];

                if (!leftItem || !topItem) continue;

                // Create the solution key
                const solutionKey = `${leftItem}-${topItem}`;
                const shouldBeCorrect = GAME_CONFIG.solution[solutionKey];

                // Only save cells that have checkmarks (cellState === 2)
                if (cellState === 2) {
                  const cellData = {
                    leftItem: leftItem,
                    topItem: topItem,
                    status: "yes", // Always "yes" since we only save checkmarks
                    expected: shouldBeCorrect, // true if should be correct, false if should be wrong
                  };

                  if (shouldBeCorrect === true) {
                    correctCells.push(cellData);
                  } else if (shouldBeCorrect === false) {
                    wrongCells.push(cellData);
                  }
                }
              }
            }
          }
        });
      });

      const totalPossible = correctCells.length + wrongCells.length;
      const accuracy =
        totalPossible > 0 ? (correctCells.length / totalPossible) * 100 : 0;

      const submissionData = {
        score: calculatedScore, // Use the calculated score passed as parameter
        correctPlacements: correctCells.length,
        wrongPlacements: wrongCells.length,
        totalPossible: totalPossible,
        accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
        correctCells: JSON.stringify(correctCells), // Only correct checkmarks
        wrongCells: JSON.stringify(wrongCells), // Only wrong checkmarks
        hintsUsed: hintsUsed,
        timeSpent: timeSpent,
        completed: gameCompleted,
      };

      // Submission data prepared

      if (onComplete) {
        // Use currentGameId if available, otherwise fall back to base game ID
        const gameId = currentGameId || "logic-grid";
        onComplete(gameId, submissionData);
      }
    },
    [gridState, hintsUsed, gameCompleted, onComplete]
  );

  // Grid configuration
  const GRID_CONFIG = {
    cellSize: GAME_CONFIG.gridConfig.cellSize,
    categories: GAME_CONFIG.leftColumnCategories.map((cat) => ({
      name: cat.name,
      items: getCategoryItems(cat.items),
    })),
    topCategories: GAME_CONFIG.topRowCategories.map((cat) => ({
      name: cat.name,
      items: getCategoryItems(cat.items),
    })),
    gridPattern: GAME_CONFIG.gridConfig.gridPattern,
  };

  // Handle cell click
  const handleCellClick = useCallback(
    (cellKey) => {
      setGridState((prev) => {
        const newGridState = {
          ...prev,
          [cellKey]: ((prev[cellKey] || 0) + 1) % 3,
        };

        // Save state after cell click
        saveGameState({
          gridState: newGridState,
          selectedClues,
          hintsUsed,
          gameCompleted,
          showSolution,
          score,
          capturedGridImage,
          gameStartTime: window.gameStartTime,
        });

        return newGridState;
      });
    },
    [
      selectedClues,
      hintsUsed,
      gameCompleted,
      showSolution,
      score,
      capturedGridImage,
      saveGameState,
    ]
  );

  // Check if puzzle is solved
  const checkSolution = useCallback(() => {
    // Check if any cells are marked
    if (!Object.values(gridState).some((state) => state === 2)) {
      return false;
    }

    // Get all possible cell keys based on the grid pattern
    const allCellKeys = [];
    GRID_CONFIG.gridPattern.forEach((row, rowIndex) => {
      row.forEach((shouldShow, colIndex) => {
        if (shouldShow) {
          // Generate 5x5 sub-grid for this cell
          for (let subRow = 0; subRow < 5; subRow++) {
            for (let subCol = 0; subCol < 5; subCol++) {
              const cellKey = `${rowIndex}-${colIndex}-${subRow}-${subCol}`;
              allCellKeys.push(cellKey);
            }
          }
        }
      });
    });

    // Check each cell against the solution
    for (const cellKey of allCellKeys) {
      const [rowIndex, colIndex, subRow, subCol] = cellKey
        .split("-")
        .map(Number);
      const cellState = gridState[cellKey] || 0;

      // Get the items for this cell based on grid position
      const leftCategory = GRID_CONFIG.categories[rowIndex];
      const topCategory = GRID_CONFIG.topCategories[colIndex];

      if (!leftCategory || !topCategory) continue;

      const leftItem = leftCategory.items[subRow];
      const topItem = topCategory.items[subCol];

      if (!leftItem || !topItem) continue;

      // Create the solution key
      const solutionKey = `${leftItem}-${topItem}`;
      const shouldBeCorrect = GAME_CONFIG.solution[solutionKey];

      // Check if the cell state matches the solution
      if (shouldBeCorrect === true) {
        // This cell should be marked with a checkmark
        if (cellState !== 2) {
          return false;
        }
      } else if (shouldBeCorrect === false) {
        // This cell should be marked with an X or left empty
        if (cellState === 2) {
          return false;
        }
      }
    }

    return true;
  }, [gridState]);

  // Calculate score
  const calculateScore = useCallback(() => {
    if (!checkSolution()) return 0;
    return Math.max(0, BASE_SCORE - hintsUsed * 1);
  }, [checkSolution, hintsUsed]);

  // Show hint confirmation modal
  const handleHint = useCallback(() => {
    if (hintsUsed >= MAX_HINTS) return;
    setShowHintModal(true);
  }, [hintsUsed]);

  // Actually use the hint
  const useHint = useCallback(() => {
    // Get a random correct solution from the game config
    const randomSolution = getRandomCorrectSolution();

    if (!randomSolution) {
      console.error("No correct solutions found in game config");
      setShowHintModal(false);
      return;
    }

    // Parse the solution to get the two items
    const [leftItem, topItem] = randomSolution.split("-");

    // Find the cell that corresponds to this solution
    let targetCellKey = null;

    outerLoop: for (
      let rowIndex = 0;
      rowIndex < GRID_CONFIG.gridPattern.length;
      rowIndex++
    ) {
      const row = GRID_CONFIG.gridPattern[rowIndex];
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const shouldShow = row[colIndex];
        if (shouldShow) {
          // Generate 5x5 sub-grid for this cell
          for (let subRow = 0; subRow < 5; subRow++) {
            for (let subCol = 0; subCol < 5; subCol++) {
              const cellKey = `${rowIndex}-${colIndex}-${subRow}-${subCol}`;
              const cellState = gridState[cellKey] || 0;

              // Get the items for this cell based on grid position
              const leftCategory = GRID_CONFIG.categories[rowIndex];
              const topCategory = GRID_CONFIG.topCategories[colIndex];

              if (!leftCategory || !topCategory) continue;

              const currentLeftItem = leftCategory.items[subRow];
              const currentTopItem = topCategory.items[subCol];

              if (!currentLeftItem || !currentTopItem) continue;

              // Check if this cell matches our target solution
              if (currentLeftItem === leftItem && currentTopItem === topItem) {
                // Only hint if this cell doesn't already have a checkmark
                if (cellState !== 2) {
                  targetCellKey = cellKey;
                  break outerLoop;
                }
              }
            }
          }
        }
      }
    }

    // If we found a valid cell to hint, place the checkmark
    if (targetCellKey) {
      setGridState((prev) => {
        const newGridState = { ...prev, [targetCellKey]: 2 };

        // Save state after hint usage
        saveGameState({
          gridState: newGridState,
          selectedClues,
          hintsUsed: hintsUsed + 1,
          gameCompleted,
          showSolution,
          score,
          capturedGridImage,
          gameStartTime: window.gameStartTime,
        });

        return newGridState;
      });
      setHintsUsed((prev) => prev + 1);
      console.log(`Hint placed: ${leftItem} - ${topItem}`);
    } else {
      console.log(
        "No valid cell found for hint, all correct solutions may already be marked"
      );
    }

    setShowHintModal(false);
  }, [
    gridState,
    hintsUsed,
    selectedClues,
    gameCompleted,
    showSolution,
    score,
    capturedGridImage,
    saveGameState,
  ]);

  // Capture grid as image
  const captureGridImage = useCallback(async () => {
    if (gridRef.current) {
      try {
        const canvas = await html2canvas(gridRef.current, {
          backgroundColor: null,
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
        });
        const imageDataUrl = canvas.toDataURL("image/png");
        setCapturedGridImage(imageDataUrl);
      } catch (error) {
        console.error("Failed to capture grid image:", error);
      }
    }
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    // Capture the grid image first
    await captureGridImage();

    const isCorrect = checkSolution();
    const finalScore = calculateScore();
    setScore(finalScore);

    // Always submit the game data regardless of correctness
    setTimeout(() => {
      analyzeGridAndSubmit(finalScore); // Pass the calculated score directly
    }, 1000); // Small delay to ensure state is updated

    if (isCorrect) {
      setGameCompleted(true);
      setShowSolution(true);
    } else {
      setShowFailureModal(true);
    }
  }, [checkSolution, calculateScore, captureGridImage, analyzeGridAndSubmit]);

  // Toggle clue selection
  const toggleClue = useCallback(
    (index) => {
      setSelectedClues((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }

        // Save state after clue selection
        saveGameState({
          gridState,
          selectedClues: newSet,
          hintsUsed,
          gameCompleted,
          showSolution,
          score,
          capturedGridImage,
          gameStartTime: window.gameStartTime,
        });

        return newSet;
      });
    },
    [
      gridState,
      hintsUsed,
      gameCompleted,
      showSolution,
      score,
      capturedGridImage,
      saveGameState,
    ]
  );

  // Check if any checkmarks exist
  const hasAnyCheckmarks = useCallback(() => {
    return Object.values(gridState).some((state) => state === 2);
  }, [gridState]);

  // Generate all grid cells with proper positioning
  const generateGridCells = () => {
    const cells = [];
    let cellIndex = 0;

    GRID_CONFIG.gridPattern.forEach((row, rowIndex) => {
      row.forEach((shouldShow, colIndex) => {
        if (shouldShow) {
          // Generate 5x5 sub-grid for this cell
          for (let subRow = 0; subRow < 5; subRow++) {
            for (let subCol = 0; subCol < 5; subCol++) {
              const cellKey = `${rowIndex}-${colIndex}-${subRow}-${subCol}`;
              const cellState = gridState[cellKey] || 0;

              // Calculate grid position
              const gridCol = 3 + colIndex * 5 + subCol;
              const gridRow = 3 + rowIndex * 5 + subRow;

              cells.push({
                key: cellKey,
                rowIndex,
                colIndex,
                subRow,
                subCol,
                state: cellState,
                gridCol,
                gridRow,
                onClick: () => handleCellClick(cellKey),
              });
            }
          }
        }
      });
    });

    return cells;
  };

  // Render completion screen
  if (gameCompleted && showSolution) {
    return (
      <div className={styles.container}>
        <div className={styles.completionScreen}>
          <h2>🎉 Puzzle Solved!</h2>
          <div className={styles.scoreDisplay}>
            Your Score: {score}/{BASE_SCORE}
          </div>

          {/* Grid Preview */}
          <div className={styles.gridPreview}>
            <div className={styles.gridPreviewTitle}>Your Submitted Grid:</div>
            {capturedGridImage ? (
              <div
                className={styles.gridImageContainer}
                onClick={() => setShowGridModal(true)}
              >
                <img
                  src={capturedGridImage}
                  alt="Your submitted logic grid"
                  className={styles.gridImage}
                />
                <div className={styles.gridPreviewHint}>Click to enlarge</div>
              </div>
            ) : (
              <div className={styles.gridPreviewPlaceholder}>
                Grid image not available
              </div>
            )}
          </div>

          {/* Agent Profiles - Horizontal Layout */}
          <div className={styles.agentsGrid}>
            <div className={styles.agentCard}>
              <div className={styles.agentName}>Astrid</div>
              <div className={styles.agentDetails}>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Country:</span>
                  <span className={styles.detailValue}>Italy</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Mission:</span>
                  <span className={styles.detailValue}>Theft</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Codename:</span>
                  <span className={styles.detailValue}>Sparrow</span>
                </div>
              </div>
            </div>

            <div className={styles.agentCard}>
              <div className={styles.agentName}>Bjørn</div>
              <div className={styles.agentDetails}>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Country:</span>
                  <span className={styles.detailValue}>England</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Mission:</span>
                  <span className={styles.detailValue}>Raid</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Codename:</span>
                  <span className={styles.detailValue}>Hawk</span>
                </div>
              </div>
            </div>

            <div className={styles.agentCard}>
              <div className={styles.agentName}>Elise</div>
              <div className={styles.agentDetails}>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Country:</span>
                  <span className={styles.detailValue}>Hungary</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Mission:</span>
                  <span className={styles.detailValue}>Surveillance</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Codename:</span>
                  <span className={styles.detailValue}>Osprey</span>
                </div>
              </div>
            </div>

            <div className={styles.agentCard}>
              <div className={styles.agentName}>Thea</div>
              <div className={styles.agentDetails}>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Country:</span>
                  <span className={styles.detailValue}>Spain</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Mission:</span>
                  <span className={styles.detailValue}>Assassination</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Codename:</span>
                  <span className={styles.detailValue}>Eagle</span>
                </div>
              </div>
            </div>

            <div className={styles.agentCard}>
              <div className={styles.agentName}>Håkon</div>
              <div className={styles.agentDetails}>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Country:</span>
                  <span className={styles.detailValue}>Germany</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Mission:</span>
                  <span className={styles.detailValue}>Sabotage</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Codename:</span>
                  <span className={styles.detailValue}>Falcon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen only during initial load, not during saves
  if (saveLoading && !hasLoadedInitialState) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>{GAME_CONFIG.title}</h2>
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
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>{GAME_CONFIG.title}</h2>
        </div>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Error Loading Game</h3>
          <p>There was an error loading your save data: {saveError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{GAME_CONFIG.title}</h2>
        <p className={styles.description}>{GAME_CONFIG.description}</p>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.gridContainer}>
          <div className={styles.logicGrid} ref={gridRef}>
            {/* Top-left corner with stats */}
            <div className={styles.cornerCell}>
              <div className={styles.cornerStats}>
                <div className={styles.cornerStat}>
                  Hints: {hintsUsed}/{MAX_HINTS}
                </div>
                <div className={styles.cornerStat}>
                  Score: {calculateScore()}/{BASE_SCORE}
                </div>
              </div>
            </div>

            {/* Top row categories */}
            {GRID_CONFIG.topCategories.map((category, index) => (
              <div key={`top-cat-${index}`} className={styles.topCategoryCell}>
                {category.name}
              </div>
            ))}

            {/* Top row items */}
            {GRID_CONFIG.topCategories.flatMap((category) =>
              category.items.map((item, itemIndex) => (
                <div key={`top-item-${item}`} className={styles.topItemCell}>
                  <span className={styles.rotatedText}>{item}</span>
                </div>
              ))
            )}

            {/* Left column categories */}
            {GRID_CONFIG.categories.map((category, index) => (
              <div
                key={`left-cat-${index}`}
                className={styles.leftCategoryCell}
              >
                <span className={styles.leftCategoryLabel}>
                  {category.name}
                </span>
              </div>
            ))}

            {/* Left column items */}
            {GRID_CONFIG.categories.flatMap((category, categoryIndex) =>
              category.items.map((item, itemIndex) => {
                // Calculate the grid row position
                const gridRow = 3 + categoryIndex * 5 + itemIndex;

                // Add thicker border for category separations (last item in each category)
                const isLastInCategory = itemIndex === 4; // 5 items per category, so index 4 is last
                const needsThickerBottomBorder =
                  isLastInCategory && categoryIndex < 2; // Only first two categories need bottom border

                const borderClasses = needsThickerBottomBorder
                  ? styles.thickerBottomBorder
                  : "";

                return (
                  <div
                    key={`left-item-${item}`}
                    className={`${styles.leftItemCell} ${borderClasses}`}
                    style={{ gridRow: gridRow }}
                  >
                    {item}
                  </div>
                );
              })
            )}

            {/* Main grid cells */}
            {generateGridCells().map((cell) => {
              // Determine if this cell needs thicker borders
              const needsThickerRightBorder =
                cell.gridCol === 7 || cell.gridCol === 12;
              const needsThickerBottomBorder =
                cell.gridRow === 7 || cell.gridRow === 12;

              const borderClasses = [
                needsThickerRightBorder ? styles.thickerRightBorder : "",
                needsThickerBottomBorder ? styles.thickerBottomBorder : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={cell.key}
                  className={`${styles.gridCell} ${
                    cell.state === 1
                      ? styles.cellX
                      : cell.state === 2
                        ? styles.cellCheck
                        : styles.cellEmpty
                  } ${borderClasses}`}
                  style={{
                    gridColumn: cell.gridCol,
                    gridRow: cell.gridRow,
                  }}
                  onClick={cell.onClick}
                >
                  {cell.state === 1 && "✗"}
                  {cell.state === 2 && "✓"}
                </div>
              );
            })}
          </div>

          <div className={styles.controls}>
            <Button
              onClick={handleHint}
              disabled={hintsUsed >= MAX_HINTS}
              variant="secondary"
              size="small"
            >
              Get Hint ({MAX_HINTS - hintsUsed} left)
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasAnyCheckmarks()}
              variant="primary"
              size={isMobile ? "small" : "large"}
            >
              Submit Solution
            </Button>
          </div>
        </div>

        <div className={styles.cluesPanel}>
          <h3>Clues</h3>
          <div className={styles.cluesList}>
            {GAME_CONFIG.clues.map((clue, index) => (
              <div
                key={index}
                className={`${styles.clue} ${selectedClues.has(index) ? styles.clueSelected : ""}`}
                onClick={() => toggleClue(index)}
              >
                <span className={styles.clueNumber}>{index + 1}.</span>
                <span className={styles.clueText}>{clue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Modal */}
      <div className={styles.modalWrapper}>
        <Modal
          isOpen={showGridModal}
          onClose={() => setShowGridModal(false)}
          title="Your Submitted Solution"
          className={modalStyles.modalWide}
        >
          <div className={styles.gridModalGrid}>
            {capturedGridImage ? (
              <img
                src={capturedGridImage}
                alt="Your submitted logic grid"
                className={styles.gridModalImage}
              />
            ) : (
              <div className={styles.gridModalPlaceholder}>
                Grid image not available
              </div>
            )}
          </div>
        </Modal>
      </div>

      {/* Failure Modal */}
      <Modal
        isOpen={showFailureModal}
        onClose={() => setShowFailureModal(false)}
        title="❌ Mission Failed!"
        className={modalStyles.modalWide}
      >
        <div className={styles.scoreDisplay}>
          Your Score: {score}/{BASE_SCORE}
        </div>

        {/* Grid Preview */}
        <div className={styles.gridPreview}>
          <div className={styles.gridPreviewTitle}>Your Grid:</div>
          {capturedGridImage ? (
            <div
              className={styles.gridImageContainer}
              onClick={() => setShowGridModal(true)}
            >
              <img
                src={capturedGridImage}
                alt="Your submitted logic grid"
                className={styles.gridImage}
              />
              <div className={styles.gridPreviewHint}>Click to enlarge</div>
            </div>
          ) : (
            <div className={styles.gridPreviewPlaceholder}>
              Grid image not available
            </div>
          )}
        </div>

        {/* Correct Solution */}
        <div className={styles.correctSolution}>
          <h4>Correct Solution:</h4>
          <div className={styles.agentsGrid}>
            <div className={styles.agentCard}>
              <div className={styles.agentName}>Astrid</div>
              <div className={styles.agentDetails}>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Country:</span>
                  <span className={styles.detailValue}>Italy</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Mission:</span>
                  <span className={styles.detailValue}>Theft</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Codename:</span>
                  <span className={styles.detailValue}>Sparrow</span>
                </div>
              </div>
            </div>

            <div className={styles.agentCard}>
              <div className={styles.agentName}>Bjørn</div>
              <div className={styles.agentDetails}>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Country:</span>
                  <span className={styles.detailValue}>England</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Mission:</span>
                  <span className={styles.detailValue}>Raid</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Codename:</span>
                  <span className={styles.detailValue}>Hawk</span>
                </div>
              </div>
            </div>

            <div className={styles.agentCard}>
              <div className={styles.agentName}>Elise</div>
              <div className={styles.agentDetails}>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Country:</span>
                  <span className={styles.detailValue}>Hungary</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Mission:</span>
                  <span className={styles.detailValue}>Surveillance</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Codename:</span>
                  <span className={styles.detailValue}>Osprey</span>
                </div>
              </div>
            </div>

            <div className={styles.agentCard}>
              <div className={styles.agentName}>Thea</div>
              <div className={styles.agentDetails}>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Country:</span>
                  <span className={styles.detailValue}>Spain</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Mission:</span>
                  <span className={styles.detailValue}>Assassination</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Codename:</span>
                  <span className={styles.detailValue}>Eagle</span>
                </div>
              </div>
            </div>

            <div className={styles.agentCard}>
              <div className={styles.agentName}>Håkon</div>
              <div className={styles.agentDetails}>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Country:</span>
                  <span className={styles.detailValue}>Germany</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Mission:</span>
                  <span className={styles.detailValue}>Sabotage</span>
                </div>
                <div className={styles.agentDetail}>
                  <span className={styles.detailLabel}>Codename:</span>
                  <span className={styles.detailValue}>Falcon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Hint Confirmation Modal */}
      <Modal
        isOpen={showHintModal}
        onClose={() => setShowHintModal(false)}
        title="Use Hint?"
      >
        <div className="hintContent">
          <h4>Hint Information:</h4>
          <p>The hint will place one of the correct connections in the grid.</p>
          <p>
            <strong>Warning:</strong> Using a hint will deduct you 1 point.
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
    </div>
  );
};

export default LogicGrid;
