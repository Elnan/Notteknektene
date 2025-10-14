import React from "react";
import styles from "./GameArea.module.css";

const GameArea = ({ children }) => {
  return <div className={styles.gameArea}>{children}</div>;
};

export default GameArea;
