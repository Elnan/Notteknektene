import React, { useState, useEffect } from "react";
import {
  getAllGames,
  saveGameConfig,
  getGameConfig,
} from "../../../firebase/admin-firebase-utils";
import styles from "./GameManagement.module.css";

const GameManagement = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameConfig, setGameConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configText, setConfigText] = useState("");

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      const gamesData = await getAllGames();
      setGames(gamesData);
    } catch (error) {
      console.error("Error loading games:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGameConfig = async (gameId) => {
    try {
      setConfigLoading(true);
      const config = await getGameConfig(gameId);
      setGameConfig(config);
      setConfigText(JSON.stringify(config, null, 2));
    } catch (error) {
      console.error("Error loading game config:", error);
      setGameConfig(null);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    loadGameConfig(game.id);
  };

  const handleSaveConfig = async () => {
    if (!selectedGame) return;

    try {
      const parsedConfig = JSON.parse(configText);
      await saveGameConfig(selectedGame.id, parsedConfig);
      setGameConfig(parsedConfig);
      setEditingConfig(false);
      alert("Game configuration saved successfully!");
    } catch (error) {
      console.error("Error saving game config:", error);
      alert("Error saving configuration. Please check JSON format.");
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading games...</p>
      </div>
    );
  }

  return (
    <div className={styles.gameManagement}>
      <div className={styles.header}>
        <h1>Game Management</h1>
        <p>View and edit game configurations</p>
      </div>

      <div className={styles.content}>
        {/* Games List */}
        <div className={styles.gamesList}>
          <h2>Available Games</h2>
          <div className={styles.gamesGrid}>
            {games.map((game) => (
              <div
                key={game.id}
                className={`${styles.gameCard} ${
                  selectedGame?.id === game.id ? styles.selected : ""
                }`}
                onClick={() => handleGameSelect(game)}
              >
                <div className={styles.gameIcon}>{game.icon || "🎮"}</div>
                <div className={styles.gameInfo}>
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                  <div className={styles.gameMeta}>
                    <span className={styles.gameType}>{game.type}</span>
                    <span className={styles.gameDifficulty}>
                      {game.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Details and Config */}
        <div className={styles.gameDetails}>
          {selectedGame ? (
            <>
              <div className={styles.gameHeader}>
                <h2>{selectedGame.name}</h2>
                <div className={styles.gameStats}>
                  <span>Type: {selectedGame.type}</span>
                  <span>Difficulty: {selectedGame.difficulty}</span>
                  <span>Path: {selectedGame.path}</span>
                </div>
              </div>

              {/* Game Configuration */}
              <div className={styles.gameConfig}>
                <div className={styles.configHeader}>
                  <h3>Game Configuration</h3>
                  {!editingConfig ? (
                    <button
                      className={styles.editButton}
                      onClick={() => setEditingConfig(true)}
                    >
                      Edit Config
                    </button>
                  ) : (
                    <div className={styles.configActions}>
                      <button
                        className={styles.saveButton}
                        onClick={handleSaveConfig}
                      >
                        Save
                      </button>
                      <button
                        className={styles.cancelButton}
                        onClick={() => {
                          setEditingConfig(false);
                          setConfigText(JSON.stringify(gameConfig, null, 2));
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {configLoading ? (
                  <div className={styles.configLoading}>
                    <div className={styles.spinner}></div>
                    <p>Loading configuration...</p>
                  </div>
                ) : gameConfig ? (
                  <div className={styles.configContent}>
                    {editingConfig ? (
                      <textarea
                        value={configText}
                        onChange={(e) => setConfigText(e.target.value)}
                        className={styles.configEditor}
                        placeholder="Edit game configuration..."
                      />
                    ) : (
                      <pre className={styles.configDisplay}>
                        {JSON.stringify(gameConfig, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <p className={styles.noConfig}>
                    No configuration found for this game.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              <h3>Select a Game</h3>
              <p>
                Choose a game from the list to view details and configuration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameManagement;
