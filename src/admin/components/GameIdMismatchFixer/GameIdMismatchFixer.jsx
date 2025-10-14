import React, { useState } from "react";
import {
  fixGameIdMismatches,
  checkGameIdMismatches,
} from "../../../utils/fixGameIdMismatch.js";
import { testGameIdMismatchFixer } from "../../../utils/testGameIdMismatch.js";
import Button from "../../../components/Button";
import styles from "./GameIdMismatchFixer.module.css";

const GameIdMismatchFixer = () => {
  const [seasonName, setSeasonName] = useState("Pre Production Season");
  const [isFixing, setIsFixing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState(null);
  const [mismatches, setMismatches] = useState([]);

  const handleCheckMismatches = async () => {
    try {
      setIsChecking(true);
      setResults(null);

      const foundMismatches = await checkGameIdMismatches(seasonName);
      setMismatches(foundMismatches);

      setResults({
        type: "check",
        message: `Found ${foundMismatches.length} game ID mismatches`,
        mismatches: foundMismatches,
      });
    } catch (error) {
      setResults({
        type: "error",
        message: `Error checking mismatches: ${error.message}`,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleFixMismatches = async () => {
    try {
      setIsFixing(true);
      setResults(null);

      const result = await fixGameIdMismatches(seasonName);

      if (result.success) {
        setResults({
          type: "success",
          message: result.message,
        });
      } else {
        setResults({
          type: "error",
          message: result.message,
        });
      }

      // Re-check to verify the fix
      setTimeout(() => {
        handleCheckMismatches();
      }, 1000);
    } catch (error) {
      setResults({
        type: "error",
        message: `Error fixing mismatches: ${error.message}`,
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleTestFixer = async () => {
    try {
      setIsFixing(true);
      setResults(null);

      const result = await testGameIdMismatchFixer(seasonName);

      if (result.success) {
        setResults({
          type: "success",
          message: result.message,
        });
      } else {
        setResults({
          type: "error",
          message: result.message,
        });
      }
    } catch (error) {
      setResults({
        type: "error",
        message: `Error testing fixer: ${error.message}`,
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Game ID Mismatch Fixer</h2>
      <p className={styles.description}>
        This tool fixes the issue where game document IDs don't match their
        gameId fields after reordering games in the season management interface.
      </p>

      <div className={styles.inputGroup}>
        <label htmlFor="seasonName">Season Name:</label>
        <input
          id="seasonName"
          type="text"
          value={seasonName}
          onChange={(e) => setSeasonName(e.target.value)}
          className={styles.input}
          placeholder="Enter season name"
        />
      </div>

      <div className={styles.buttonGroup}>
        <Button
          onClick={handleCheckMismatches}
          disabled={isChecking || isFixing}
          variant="secondary"
        >
          {isChecking ? "Checking..." : "Check Mismatches"}
        </Button>

        <Button
          onClick={handleFixMismatches}
          disabled={isChecking || isFixing || mismatches.length === 0}
          variant="primary"
        >
          {isFixing ? "Fixing..." : "Fix Mismatches"}
        </Button>

        <Button
          onClick={handleTestFixer}
          disabled={isChecking || isFixing}
          variant="secondary"
        >
          {isFixing ? "Testing..." : "Test Fixer"}
        </Button>
      </div>

      {results && (
        <div className={`${styles.results} ${styles[results.type]}`}>
          <h3>Results</h3>
          <p>{results.message}</p>

          {results.mismatches && results.mismatches.length > 0 && (
            <div className={styles.mismatchList}>
              <h4>Found Mismatches:</h4>
              <ul>
                {results.mismatches.map((game, index) => (
                  <li key={index}>
                    <strong>Document ID:</strong> "{game.id}" <br />
                    <strong>Game ID:</strong> "{game.gameId}" <br />
                    <strong>Round:</strong> {game.roundNumber}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className={styles.warning}>
        <h4>⚠️ Important Notes:</h4>
        <ul>
          <li>
            This tool will migrate submissions from old document IDs to new ones
          </li>
          <li>Make sure to backup your data before running this fix</li>
          <li>This process cannot be undone</li>
          <li>All users will need to refresh their browsers after the fix</li>
        </ul>
      </div>
    </div>
  );
};

export default GameIdMismatchFixer;
