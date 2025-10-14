import React from "react";
import styles from "./PatternMatrix.module.css";
import Button from "../../../components/Button";

const PatternMatrixRules = ({ onStart }) => (
  <div className={styles.rulesWrapper}>
    <div className={styles.rulesContent}>
      <h1 className={styles.rulesTitle}>Pattern Matrix</h1>

      <div className={styles.rulesSection}>
        <h2 className={styles.rulesSubtitle}>Objective</h2>
        <p className={styles.rulesText}>
          You will see a 3x3 grid of figures. Each figure has a circle with four
          segments and four squares around it. One figure is missing - your task
          is to deduce and recreate the missing figure based on the pattern.
          <br />
          <br />
          <strong>
            You will get some practice rounds to understand the game mechanics
            before the game begins.
          </strong>
        </p>
      </div>

      <div className={styles.rulesSection}>
        <h2 className={styles.rulesSubtitle}>How to Play</h2>
        <div className={styles.rulesList}>
          <div className={styles.rulesItem}>
            <div className={styles.rulesIcon}>🟢</div>
            <div>
              <strong>Click to cycle colors:</strong> Each piece can be empty
              (white), green, or gold. Click on any segment to cycle through the
              colors.
            </div>
          </div>
          <div className={styles.rulesItem}>
            <div className={styles.rulesIcon}>📊</div>
            <div>
              <strong>Progress:</strong> Complete 2 practice rounds, then 10
              main rounds. See your final score and review all answers.
            </div>
          </div>

          <div className={styles.rulesItem}>
            <div className={styles.rulesIcon}>⏱️</div>
            <div>
              <strong>Time limit:</strong> You have 60 seconds per round. But
              dont worry, you can use the pause button to take breaks between
              rounds.
            </div>
          </div>

          <div className={styles.rulesItem}>
            <div className={styles.rulesIcon}>🔄</div>
            <div>
              <strong>Reset:</strong> Use the reset button to clear your input
              and start over for the current round.
            </div>
          </div>
        </div>
      </div>

      <Button variant="primary" size="large" onClick={onStart}>
        Start Practice
      </Button>
    </div>
  </div>
);

export default PatternMatrixRules;
