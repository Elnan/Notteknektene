import React, { useState, useEffect, useRef } from "react";
import styles from "./WhenWhereGame.module.css";
import Button from "../../../../components/Button";
import { MYSTERY_DATA } from "../gameData";
import Modal from "../../../../components/Modal";
import modalStyles from "../../../../components/Modal.module.css";

const WhenWhereGame = ({ onComplete, onBack, onHint, savedGameState }) => {
  // When&Where mini-game state
  const [yearInput, setYearInput] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [whenWhereSubmitted, setWhenWhereSubmitted] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);

  // Ref for the country input container to detect clicks outside
  const countryInputRef = useRef(null);

  const gameData = MYSTERY_DATA.whenWhere;

  // Track game start time
  useEffect(() => {
    setGameStartTime(Date.now());
  }, []);

  // ===== RESTORE SAVED STATE =====
  useEffect(() => {
    if (savedGameState && savedGameState.gameState) {
      console.log(
        "🔄 Restoring WhenWhereGame saved state:",
        savedGameState.gameState
      );
      const { gameState } = savedGameState;

      // Restore game state
      if (gameState.yearInput) setYearInput(gameState.yearInput);
      if (gameState.selectedCountry)
        setSelectedCountry(gameState.selectedCountry);
      if (gameState.countrySearch) setCountrySearch(gameState.countrySearch);
      if (gameState.showCountryDropdown !== undefined)
        setShowCountryDropdown(gameState.showCountryDropdown);
      // Only restore submission state if the game was actually completed
      if (
        savedGameState.completed &&
        gameState.whenWhereSubmitted !== undefined
      ) {
        setWhenWhereSubmitted(gameState.whenWhereSubmitted);
      }
      if (gameState.showImageModal !== undefined)
        setShowImageModal(gameState.showImageModal);
      if (gameState.showHintModal !== undefined)
        setShowHintModal(gameState.showHintModal);
    }
  }, [savedGameState]);

  // Handle clicks outside the country dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        countryInputRef.current &&
        !countryInputRef.current.contains(event.target)
      ) {
        setShowCountryDropdown(false);
      }
    };

    // Add event listener when dropdown is shown
    if (showCountryDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCountryDropdown]);

  const getFilteredCountries = () => {
    if (!countrySearch) return gameData.countries;
    return gameData.countries.filter((country) =>
      country.toLowerCase().includes(countrySearch.toLowerCase())
    );
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setCountrySearch(country);
    setShowCountryDropdown(false);
  };

  const handleWhenWhereHintConfirm = () => {
    setHintUsed(true);
    // Call the parent component's hint handler
    if (onHint) {
      onHint(0); // Use hint index 0 for the first hint
    }
  };

  // Calculate time spent on this mini-game
  const getTimeSpent = () => {
    return gameStartTime ? Date.now() - gameStartTime : 0;
  };

  // Complete the mini-game with detailed data
  const completeGame = () => {
    const timeSpent = getTimeSpent();
    const yearCorrect = parseInt(yearInput) === gameData.correctYear;
    const yearClose = Math.abs(parseInt(yearInput) - gameData.correctYear) <= 3;
    const countryCorrect = selectedCountry === gameData.correctCountry;

    // Calculate total points
    let whenPoints = 0;
    let wherePoints = 0;
    if (yearClose) whenPoints = 2;
    if (countryCorrect) wherePoints = 2;
    if (hintUsed) {
      if (whenPoints > 0) whenPoints = Math.max(0, whenPoints - 1);
      if (wherePoints > 0) wherePoints = Math.max(0, wherePoints - 1);
    }
    const totalPoints = whenPoints + wherePoints;

    const submissionData = {
      points: totalPoints,
      hintUsed: hintUsed ? 1 : 0,
      timeSpent: timeSpent,
      yearGuessed: parseInt(yearInput) || 0,
      countryGuessed: selectedCountry,
      yearCorrect: yearCorrect,
      countryCorrect: countryCorrect,
      yearClose: yearClose,
      completed: totalPoints > 0,
      // Includes complete game state for save/load
      gameState: {
        yearInput,
        selectedCountry,
        countrySearch,
        showCountryDropdown,
        whenWhereSubmitted,
        showImageModal,
        showHintModal,
      },
    };

    // Show immediate visual feedback
    console.log("🎯 When&Where submission successful!");

    // Show success message briefly
    setShowSubmissionSuccess(true);

    // Call parent completion handler
    onComplete("when-where", submissionData);

    // Show results screen after a brief delay to ensure user sees the success message
    setTimeout(() => {
      setWhenWhereSubmitted(true);
      setShowSubmissionSuccess(false);
    }, 1000);
  };

  if (whenWhereSubmitted) {
    const yearCorrect = parseInt(yearInput) === gameData.correctYear;
    const yearClose = Math.abs(parseInt(yearInput) - gameData.correctYear) <= 3;
    const countryCorrect = selectedCountry === gameData.correctCountry;

    // Calculate points for each part
    let whenPoints = 0;
    let wherePoints = 0;
    if (yearClose) whenPoints = 2;
    if (countryCorrect) wherePoints = 2;
    if (hintUsed) {
      if (whenPoints > 0) whenPoints = Math.max(0, whenPoints - 1);
      if (wherePoints > 0) wherePoints = Math.max(0, wherePoints - 1);
    }

    return (
      <div className={styles.minigame}>
        <div className={styles.whenWhereResults}>
          <h3>Investigation Results</h3>
          <div className={styles.scoreBreakdown}>
            <div className={styles.resultBreakdown}>
              <p>
                <strong>Country:</strong>{" "}
                {countryCorrect ? (
                  <span className={styles.correct}>
                    ✓ Correct (+2 points{hintUsed ? ", -1 for hint" : ""})
                  </span>
                ) : (
                  <span className={styles.incorrect}>
                    ✗ Incorrect (0 points)
                  </span>
                )}
              </p>
              <p>
                <strong>Year:</strong>{" "}
                {yearClose ? (
                  <span className={styles.correct}>
                    ✓ Within 3 years (+2 points{hintUsed ? ", -1 for hint" : ""}
                    ){yearCorrect && " (Exact match!)"}
                  </span>
                ) : (
                  <span className={styles.incorrect}>
                    ✗ More than 3 years off (0 points)
                  </span>
                )}
              </p>
              <div className={styles.answerReveal}>
                <p>
                  <strong>Correct answers:</strong>
                </p>
                <p>Year: {gameData.correctYear}</p>
                <p>Country: {gameData.correctCountry}</p>
              </div>
            </div>
            <div className={styles.finalScore}>
              <p>
                <strong>Points earned: {wherePoints + whenPoints}/4</strong>
              </p>
              {hintUsed && (
                <p className={styles.hintPenalty}>
                  (Hint used: -1 point penalty per part)
                </p>
              )}
            </div>
          </div>
          <Button variant="secondary" size="small" onClick={onBack}>
            Back to Overview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.minigame}>
      <div className={styles.minigameHeader}>
        <h3>When & Where</h3>
        <h4 className={styles.whenWhereQuestion}>{gameData.question}</h4>
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

      <div className={styles.whenWhereGame}>
        <div className={styles.imageSection}>
          <div
            className={styles.artifactImage}
            onClick={() => setShowImageModal(true)}
          >
            <img
              src={gameData.imageUrl}
              alt="Ancient artifact"
              className={styles.artifactImg}
            />
            <div className={styles.imageOverlay}>
              <span>Click to enlarge</span>
            </div>
          </div>
        </div>

        <div className={styles.inputSection}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Year discovered:</label>
            <input
              type="number"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              placeholder="Enter year (1800-2024)"
              className={styles.yearInput}
              min="1800"
              max="2024"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Country of discovery:</label>
            <div className={styles.countryInputContainer} ref={countryInputRef}>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => {
                  setCountrySearch(e.target.value);
                  setShowCountryDropdown(true);
                }}
                onFocus={() => setShowCountryDropdown(true)}
                placeholder="Search for a country..."
                className={styles.countryInput}
              />
              {showCountryDropdown && (
                <div className={styles.countryDropdown}>
                  {getFilteredCountries()
                    .slice(0, 10)
                    .map((country) => (
                      <div
                        key={country}
                        className={styles.countryOption}
                        onClick={() => handleCountrySelect(country)}
                      >
                        {country}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Hint is now only shown in a modal, not inline */}

          <Button
            variant="primary"
            size="large"
            onClick={completeGame}
            disabled={!yearInput || !selectedCountry}
            className={styles.submitButton}
          >
            Submit Investigation
          </Button>

          {/* Success message overlay */}
          {showSubmissionSuccess && (
            <div className={styles.submissionSuccessOverlay}>
              <div className={styles.submissionSuccessMessage}>
                <div className={styles.successIcon}>✓</div>
                <h3>Investigation Submitted!</h3>
                <p>Processing your results...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal using shared Modal */}
      <Modal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        title="Artifact Image"
        className={modalStyles.modalWide}
      >
        <img
          src={gameData.imageUrl}
          alt="Ancient artifact enlarged"
          className={styles.modalLargeImage}
        />
      </Modal>

      {/* Hint Confirmation Modal */}
      <Modal
        isOpen={showHintModal}
        onClose={() => setShowHintModal(false)}
        title={hintUsed ? "Hint" : "Use Hint?"}
      >
        {hintUsed ? (
          <div className="hintContent">
            <h4>Investigation Hint:</h4>
            <p>{gameData.hints[0]}</p>
          </div>
        ) : (
          <>
            <p>Are you sure you want to use a hint?</p>
            <p>
              <strong>Warning:</strong> Using a hint will prevent you from
              earning points for this mini-game.
            </p>
            <div className={modalStyles.modalButtons}>
              <Button
                onClick={handleWhenWhereHintConfirm}
                variant="primary"
                size="small"
              >
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
        )}
      </Modal>
    </div>
  );
};

export default WhenWhereGame;
