import React, { useState, useEffect } from "react";
import styles from "./TaskOpener.module.css";
import AnimatedLogo from "../AnimatedLogo";

const TaskOpener = ({
  children,
  taskName,
  taskDescription,
  onTaskOpen,
  isOpened = false,
  loading = false,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [showContent, setShowContent] = useState(isOpened);
  const [animationStep, setAnimationStep] = useState(0);

  // Update showContent when isOpened changes
  useEffect(() => {
    setShowContent(isOpened);
  }, [isOpened]);

  const handleOpenTask = async () => {
    setIsOpening(true);
    setAnimationStep(1);

    // Call the callback to record the opening time
    if (onTaskOpen) {
      try {
        await onTaskOpen();
      } catch (error) {
        console.error("Error recording task opening:", error);
      }
    }

    // Start the opening animation sequence
    setTimeout(() => setAnimationStep(2), 800); // Border completes drawing
    setTimeout(() => setAnimationStep(3), 1200); // Card fades out
    setTimeout(() => {
      setShowContent(true);
      setIsOpening(false);
    }, 1600); // Show game content
  };

  if (showContent) {
    return <div className={styles.gameContent}>{children}</div>;
  }

  if (loading) {
    return (
      <div className={styles.taskOpenerContainer}>
        <div className={styles.overlay}>
          <div className={styles.taskCard}>
            <div className={styles.cardTop}>
              <h2 className={styles.taskTitle}>{taskName}</h2>
              <div className={styles.taskIcon}>
                <AnimatedLogo className={styles.logoImage} />
              </div>
            </div>
            <div className={styles.cardBottom}>
              <p className={styles.taskDescription}>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.taskOpenerContainer}>
      <div className={`${styles.overlay} ${isOpening ? styles.opening : ""}`}>
        <div className={`${styles.taskCard} ${styles[`step${animationStep}`]}`}>
          <div className={styles.cardTop}>
            <h2 className={styles.taskTitle}>{taskName}</h2>
            <div className={styles.taskIcon}>
              <AnimatedLogo className={styles.logoImage} />
            </div>
          </div>

          <div className={styles.cardBottom}>
            <p className={styles.taskDescription}>{taskDescription}</p>
            <button
              className={styles.openButton}
              onClick={handleOpenTask}
              disabled={isOpening}
            >
              Open Task
            </button>
          </div>

          <div className={styles.borderEffect}>
            <div className={styles.borderLine}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskOpener;
