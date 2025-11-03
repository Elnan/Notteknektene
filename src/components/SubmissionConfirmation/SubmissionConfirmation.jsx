import React, { useState } from "react";
import SuccessLogo from "../SuccessLogo";
import styles from "./SubmissionConfirmation.module.css";

/**
 * SubmissionConfirmation component - Shows a pill-shaped notification
 * when user has submitted an answer for the current game/round.
 *
 * - Clickable to collapse message behind logo */

const SubmissionConfirmation = ({
  message = "Answer submitted",
  position = "bottom-right", // "top-right" | "bottom-right" | "top-left" | "bottom-left"
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleClick = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className={`${styles.container} ${styles[position]}`}>
      <div
        className={`${styles.pill} ${isCollapsed ? styles.collapsed : ""}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={
          isCollapsed
            ? "Expand submission confirmation"
            : "Collapse submission confirmation"
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className={styles.logoContainer}>
          <SuccessLogo className={styles.logo} />
        </div>
        <div
          className={`${styles.message} ${isCollapsed ? styles.messageCollapsed : ""}`}
        >
          {message}
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmation;
