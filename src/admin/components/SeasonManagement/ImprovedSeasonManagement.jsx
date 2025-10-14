/**
 * Improved Season Management Component
 *
 * This component fixes the game reordering issue by using proper document ID handling
 * instead of just updating field values.
 */

import React, { useState, useEffect } from "react";
import { properlyReorderGames } from "../../../utils/properGameReordering.js";
import styles from "./SeasonManagement.module.css";

const ImprovedSeasonManagement = () => {
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderResults, setReorderResults] = useState(null);

  // ... (other state and functions would be the same as the original component)

  /**
   * Improved game reordering that prevents ID mismatches
   */
  const handleProperReorderGames = async (fromIndex, toIndex, event) => {
    if (!selectedSeason) return;

    // Prevent page reload
    event.preventDefault();
    event.stopPropagation();

    console.log(
      `🔄 Properly reordering game from position ${fromIndex} to ${toIndex}`
    );

    // Update local state immediately for responsive UI
    const updatedGames = [...selectedSeason.games];
    const [movedGame] = updatedGames.splice(fromIndex, 1);
    updatedGames.splice(toIndex, 0, movedGame);

    const updatedSeason = { ...selectedSeason, games: updatedGames };
    setSelectedSeason(updatedSeason);

    console.log(
      "✅ Game reordered locally. Click 'Apply Order' to save to database."
    );
  };

  /**
   * Apply the new order using proper document ID handling
   */
  const handleApplyProperOrder = async () => {
    if (!selectedSeason) return;

    setIsReordering(true);
    setReorderResults(null);

    try {
      console.log(
        "💾 Applying new game order with proper document ID handling..."
      );

      // Use the proper reordering utility
      const result = await properlyReorderGames(
        selectedSeason.id,
        selectedSeason.games
      );

      if (result.success) {
        setReorderResults({
          type: "success",
          message: result.message,
          details: result.results,
        });

        // Reload the season data to get the updated games
        const { getSeasonGamesList } = await import(
          "../../../firebase/new-database-utils.js"
        );
        const reloadedGames = await getSeasonGamesList(selectedSeason.id);
        const sortedGames = reloadedGames.sort(
          (a, b) => a.roundNumber - b.roundNumber
        );

        // Update local state with reloaded data
        const updatedSeason = { ...selectedSeason, games: sortedGames };
        setSelectedSeason(updatedSeason);

        alert(
          "✅ Game order applied successfully with proper document ID handling!"
        );
      } else {
        setReorderResults({
          type: "error",
          message: result.message,
          details: result.results,
        });
        alert("❌ Error applying game order: " + result.message);
      }
    } catch (error) {
      console.error("Error applying proper game order:", error);
      setReorderResults({
        type: "error",
        message: error.message,
      });
      alert("Error applying game order: " + error.message);
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Improved Season Management</h2>
      <p className={styles.description}>
        This version uses proper document ID handling to prevent game ID
        mismatches.
      </p>

      {/* Game list with reordering */}
      {selectedSeason && selectedSeason.games && (
        <div className={styles.gamesList}>
          <h3>Games in Season</h3>
          <div className={styles.gameList}>
            {selectedSeason.games.map((game, index) => (
              <div key={game.id} className={styles.seasonGameItem}>
                <span className={styles.gameOrder}>{index + 1}</span>
                <span className={styles.gameName}>{game.gameId}</span>
                <div className={styles.gameItemActions}>
                  <div className={styles.reorderButtons}>
                    {index > 0 && (
                      <button
                        onClick={(e) =>
                          handleProperReorderGames(index, index - 1, e)
                        }
                        className={styles.reorderButton}
                        type="button"
                      >
                        ↑
                      </button>
                    )}
                    {index < selectedSeason.games.length - 1 && (
                      <button
                        onClick={(e) =>
                          handleProperReorderGames(index, index + 1, e)
                        }
                        className={styles.reorderButton}
                        type="button"
                      >
                        ↓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.applyOrderSection}>
            <button
              onClick={handleApplyProperOrder}
              disabled={isReordering}
              className={styles.applyOrderButton}
            >
              {isReordering ? "Applying Order..." : "Apply Order (Proper)"}
            </button>
          </div>
        </div>
      )}

      {/* Results display */}
      {reorderResults && (
        <div className={`${styles.results} ${styles[reorderResults.type]}`}>
          <h3>Reordering Results</h3>
          <p>{reorderResults.message}</p>

          {reorderResults.details && (
            <div className={styles.detailsList}>
              <h4>Details:</h4>
              <ul>
                {reorderResults.details.map((result, index) => (
                  <li key={index}>
                    <strong>{result.gameId}:</strong> {result.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className={styles.warning}>
        <h4>✅ Improved Features:</h4>
        <ul>
          <li>Proper document ID handling prevents mismatches</li>
          <li>Migrates all submissions correctly</li>
          <li>No more need for migration tools</li>
          <li>Round tables will work correctly</li>
        </ul>
      </div>
    </div>
  );
};

export default ImprovedSeasonManagement;
