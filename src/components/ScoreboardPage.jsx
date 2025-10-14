import React from "react";
import Scoreboard from "./Scoreboard";
import styles from "./ScoreboardPage.module.css";

const ScoreboardPage = () => {
  return (
    <div className={styles.content}>
      <Scoreboard />
    </div>
  );
};

export default ScoreboardPage;
