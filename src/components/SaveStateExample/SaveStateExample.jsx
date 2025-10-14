import React, { useState } from "react";
import { useGameSaveState } from "../../hooks/useGameSaveState";
import SaveStateManager from "../SaveStateManager/SaveStateManager";
import styles from "./SaveStateExample.module.css";

const SaveStateExample = () => {
  // Define initial state for testing
  const initialState = {
    score: 0,
    level: 1,
    completed: false,
    playerName: "",
    items: new Set(),
    visitedAreas: new Set(),
    startTime: new Date(),
    lastPlayed: new Date(),
    settings: {
      soundEnabled: true,
      difficulty: "normal",
    },
  };

  // Use the save state hook
  const {
    gameState,
    updateGameState,
    saveState,
    isLoading,
    hasLoadedSave,
    lastSaveTime,
    saveError,
    saveInfo,
    getTimeSpent,
    hasSaveState,
  } = useGameSaveState("saveStateTest", initialState, {
    autoSave: true,
    autoSaveInterval: 10000, // Auto-save every 10 seconds
    saveOnUnload: true,
  });

  const [newItem, setNewItem] = useState("");
  const [newArea, setNewArea] = useState("");

  const handleScoreUpdate = (change) => {
    updateGameState((prevState) => ({
      ...prevState,
      score: Math.max(0, prevState.score + change),
    }));
  };

  const handleLevelChange = (change) => {
    updateGameState((prevState) => ({
      ...prevState,
      level: Math.max(1, prevState.level + change),
    }));
  };

  const handleNameChange = (name) => {
    updateGameState((prevState) => ({
      ...prevState,
      playerName: name,
    }));
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      updateGameState((prevState) => {
        const newItems = new Set(prevState.items);
        newItems.add(newItem.trim());
        return {
          ...prevState,
          items: newItems,
        };
      });
      setNewItem("");
    }
  };

  const handleRemoveItem = (item) => {
    updateGameState((prevState) => {
      const newItems = new Set(prevState.items);
      newItems.delete(item);
      return {
        ...prevState,
        items: newItems,
      };
    });
  };

  const handleAddArea = () => {
    if (newArea.trim()) {
      updateGameState((prevState) => {
        const newAreas = new Set(prevState.visitedAreas);
        newAreas.add(newArea.trim());
        return {
          ...prevState,
          visitedAreas: newAreas,
        };
      });
      setNewArea("");
    }
  };

  const handleRemoveArea = (area) => {
    updateGameState((prevState) => {
      const newAreas = new Set(prevState.visitedAreas);
      newAreas.delete(area);
      return {
        ...prevState,
        visitedAreas: newAreas,
      };
    });
  };

  const handleToggleCompletion = () => {
    updateGameState((prevState) => ({
      ...prevState,
      completed: !prevState.completed,
    }));
  };

  const handleToggleSound = () => {
    updateGameState((prevState) => ({
      ...prevState,
      settings: {
        ...prevState.settings,
        soundEnabled: !prevState.settings.soundEnabled,
      },
    }));
  };

  const handleDifficultyChange = (difficulty) => {
    updateGameState((prevState) => ({
      ...prevState,
      settings: {
        ...prevState.settings,
        difficulty,
      },
    }));
  };

  const handleManualSave = async () => {
    try {
      await saveState();
      alert("Game state saved successfully!");
    } catch (error) {
      alert("Failed to save game state: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading save state...</div>
      </div>
    );
  }

  if (saveError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Save Error</h2>
          <p>{saveError.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Save State Testing Component</h1>
        <p>
          This component demonstrates the save state functionality with various
          data types.
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.gameState}>
          <h2>Game State</h2>

          <div className={styles.stateSection}>
            <h3>Basic Info</h3>
            <div className={styles.field}>
              <label>Player Name:</label>
              <input
                type="text"
                value={gameState.playerName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter player name"
              />
            </div>
            <div className={styles.field}>
              <label>Score: {gameState.score}</label>
              <div className={styles.buttonGroup}>
                <button onClick={() => handleScoreUpdate(-10)}>-10</button>
                <button onClick={() => handleScoreUpdate(-1)}>-1</button>
                <button onClick={() => handleScoreUpdate(1)}>+1</button>
                <button onClick={() => handleScoreUpdate(10)}>+10</button>
              </div>
            </div>
            <div className={styles.field}>
              <label>Level: {gameState.level}</label>
              <div className={styles.buttonGroup}>
                <button onClick={() => handleLevelChange(-1)}>-1</button>
                <button onClick={() => handleLevelChange(1)}>+1</button>
              </div>
            </div>
            <div className={styles.field}>
              <label>
                <input
                  type="checkbox"
                  checked={gameState.completed}
                  onChange={handleToggleCompletion}
                />
                Game Completed
              </label>
            </div>
          </div>

          <div className={styles.stateSection}>
            <h3>Items (Set)</h3>
            <div className={styles.field}>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add new item"
                onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
              />
              <button onClick={handleAddItem}>Add Item</button>
            </div>
            <div className={styles.list}>
              {Array.from(gameState.items).map((item, index) => (
                <div key={index} className={styles.listItem}>
                  <span>{item}</span>
                  <button onClick={() => handleRemoveItem(item)}>Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.stateSection}>
            <h3>Visited Areas (Set)</h3>
            <div className={styles.field}>
              <input
                type="text"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="Add new area"
                onKeyPress={(e) => e.key === "Enter" && handleAddArea()}
              />
              <button onClick={handleAddArea}>Add Area</button>
            </div>
            <div className={styles.list}>
              {Array.from(gameState.visitedAreas).map((area, index) => (
                <div key={index} className={styles.listItem}>
                  <span>{area}</span>
                  <button onClick={() => handleRemoveArea(area)}>Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.stateSection}>
            <h3>Settings</h3>
            <div className={styles.field}>
              <label>
                <input
                  type="checkbox"
                  checked={gameState.settings.soundEnabled}
                  onChange={handleToggleSound}
                />
                Sound Enabled
              </label>
            </div>
            <div className={styles.field}>
              <label>Difficulty:</label>
              <select
                value={gameState.settings.difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className={styles.stateSection}>
            <h3>Metadata</h3>
            <div className={styles.metadata}>
              <p>
                <strong>Start Time:</strong>{" "}
                {gameState.startTime.toLocaleString()}
              </p>
              <p>
                <strong>Last Played:</strong>{" "}
                {gameState.lastPlayed.toLocaleString()}
              </p>
              <p>
                <strong>Time Spent:</strong> {Math.floor(getTimeSpent() / 1000)}{" "}
                seconds
              </p>
              <p>
                <strong>Has Save State:</strong> {hasSaveState() ? "Yes" : "No"}
              </p>
              {lastSaveTime && (
                <p>
                  <strong>Last Save:</strong> {lastSaveTime.toLocaleString()}
                </p>
              )}
              {hasLoadedSave && (
                <p>
                  <strong>Loaded from save:</strong> Yes
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <h2>Actions</h2>
          <div className={styles.buttonGroup}>
            <button onClick={handleManualSave} className={styles.saveButton}>
              Manual Save
            </button>
            <button
              onClick={() => window.location.reload()}
              className={styles.reloadButton}
            >
              Reload Page (Test Auto-Load)
            </button>
          </div>
        </div>

        <div className={styles.saveStateManager}>
          <h2>Save State Manager</h2>
          <SaveStateManager
            gameId="saveStateTest"
            onLoadSave={(savedState) => {
              console.log("Loaded save state:", savedState);
              alert("Save state loaded successfully!");
            }}
            onDeleteSave={() => {
              console.log("Save state deleted");
              alert("Save state deleted successfully!");
            }}
            showSaveInfo={true}
          />
        </div>
      </div>
    </div>
  );
};

export default SaveStateExample;
