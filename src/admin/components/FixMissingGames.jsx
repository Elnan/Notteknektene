import React, { useState } from "react";
import {
  getCurrentSeason,
  getSeasonGamesList,
  createGame,
} from "../../firebase/new-database-utils.js";
import { games as defaultGames } from "../../utils/gamesConfig.js";

const FixMissingGames = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [existingGames, setExistingGames] = useState([]);
  const [missingGames, setMissingGames] = useState([]);

  const checkCurrentGames = async () => {
    setLoading(true);
    setMessage("Checking current games...");

    try {
      const season = await getCurrentSeason();
      if (!season) {
        setMessage("❌ No active season found");
        return;
      }

      const games = await getSeasonGamesList(season.id);
      setExistingGames(games);

      // Find missing games
      const existingRoundNumbers = games.map((g) => g.roundNumber);
      const missing = [];

      for (let i = 0; i < defaultGames.length; i++) {
        const roundNumber = i + 1;
        if (!existingRoundNumbers.includes(roundNumber)) {
          const gameDef = defaultGames[i];
          missing.push({
            gameId: gameDef.id,
            roundNumber: roundNumber,
            status: "upcoming",
            isActive: false,
            config: gameDef.config || {},
          });
        }
      }

      setMissingGames(missing);

      if (missing.length === 0) {
        setMessage("✅ All games are present in the season!");
      } else {
        setMessage(
          `❌ Found ${missing.length} missing games: ${missing.map((g) => `Round ${g.roundNumber} (${g.gameId})`).join(", ")}`
        );
      }
    } catch (error) {
      console.error("Error checking games:", error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addMissingGames = async () => {
    if (missingGames.length === 0) {
      setMessage("✅ No missing games to add!");
      return;
    }

    setLoading(true);
    setMessage("Adding missing games...");

    try {
      const season = await getCurrentSeason();
      if (!season) {
        setMessage("❌ No active season found");
        return;
      }

      let addedCount = 0;
      for (const game of missingGames) {
        try {
          await createGame(season.id, game);
          addedCount++;
          setMessage(`✅ Added Round ${game.roundNumber}: ${game.gameId}`);
        } catch (error) {
          console.error(`Failed to add Round ${game.roundNumber}:`, error);
          setMessage(
            `❌ Failed to add Round ${game.roundNumber}: ${error.message}`
          );
          return;
        }
      }

      setMessage(`✅ Successfully added ${addedCount} missing games!`);

      // Refresh the games list
      await checkCurrentGames();
    } catch (error) {
      console.error("Error adding games:", error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>🔧 Fix Missing Games</h2>
      <p>
        This tool will check for missing games in the current season and add
        them if needed.
      </p>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={checkCurrentGames}
          disabled={loading}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Checking..." : "Check Current Games"}
        </button>

        {missingGames.length > 0 && (
          <button
            onClick={addMissingGames}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Adding..." : `Add ${missingGames.length} Missing Games`}
          </button>
        )}
      </div>

      {message && (
        <div
          style={{
            padding: "10px",
            backgroundColor: message.includes("❌") ? "#f8d7da" : "#d4edda",
            border: `1px solid ${message.includes("❌") ? "#f5c6cb" : "#c3e6cb"}`,
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          {message}
        </div>
      )}

      {existingGames.length > 0 && (
        <div>
          <h3>Current Games in Season:</h3>
          <ul>
            {existingGames.map((game) => (
              <li key={game.id}>
                Round {game.roundNumber}: {game.id} - {game.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingGames.length > 0 && (
        <div>
          <h3>Missing Games:</h3>
          <ul>
            {missingGames.map((game) => (
              <li key={game.gameId}>
                Round {game.roundNumber}: {game.gameId}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FixMissingGames;
