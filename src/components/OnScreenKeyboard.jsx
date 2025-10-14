import React from "react";
import styles from "./OnScreenKeyboard.module.css";

const OnScreenKeyboard = ({
  keys = [], // array of rows
  onKeyPress = () => {},
  disabledKeys = [],
  pressedKey = null,
  inPlayKeys = [],
  keyStates = {}, // object mapping keys to their Wordle states: {key: 'correct'|'present'|'absent'}
}) => {
  return (
    <div className={styles.keyboard}>
      {keys.map((row, rowIdx) => (
        <div className={styles.row} key={rowIdx}>
          {row.map((key, i) => {
            const isSpace = key === " ";
            const isArrow = key === "←" || key === "→";
            const isPressed = pressedKey === key;
            const isDisabled = disabledKeys.includes(key);
            const isInPlay = inPlayKeys.includes(key);
            const keyState = keyStates[key];

            // Build className with Wordle states
            let className = styles.key;
            if (isSpace) className += " " + styles.space;
            if (isArrow) className += " " + styles.arrow;
            if (isPressed) className += " " + styles.pressed;
            if (isInPlay && !isDisabled) className += " " + styles.inPlay;

            // Add Wordle state classes
            if (keyState === "correct") className += " " + styles.wordleCorrect;
            else if (keyState === "present")
              className += " " + styles.wordlePresent;
            else if (keyState === "absent")
              className += " " + styles.wordleAbsent;

            return (
              <button
                key={i}
                className={className}
                onClick={() => onKeyPress(key)}
                disabled={isDisabled}
                tabIndex={0}
                aria-label={key === " " ? "Space" : key}
              >
                {key === " " ? "" : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default OnScreenKeyboard;
