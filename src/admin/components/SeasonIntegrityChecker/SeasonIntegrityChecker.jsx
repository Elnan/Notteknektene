import React, { useState } from "react";
import { verifySeasonIntegrity } from "../../../utils/properSeasonCreation.js";
import { fixGameIdMismatches } from "../../../utils/fixGameIdMismatch.js";
import Button from "../../../components/Button";
import styles from "./SeasonIntegrityChecker.module.css";

const SeasonIntegrityChecker = () => {
  const [seasonName, setSeasonName] = useState("Test Season - SaveLoad");
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState(null);

  const handleCheckIntegrity = async () => {
    try {
      setIsChecking(true);
      setResults(null);

      const result = await verifySeasonIntegrity(seasonName);

      setResults({
        type: result.success ? "success" : "warning",
        message: result.success
          ? "✅ Season has no ID mismatches - integrity is good!"
          : `⚠️ Found ${result.mismatches.length} ID mismatches`,
        mismatches: result.mismatches || [],
      });
    } catch (error) {
      setResults({
        type: "error",
        message: `❌ Error checking season: ${error.message}`,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleFixIntegrity = async () => {
    try {
      setIsFixing(true);
      setResults(null);

      const result = await fixGameIdMismatches(seasonName);

      if (result.success) {
        setResults({
          type: "success",
          message: `✅ ${result.message}`,
        });

        // Re-check to verify the fix
        setTimeout(() => {
          handleCheckIntegrity();
        }, 1000);
      } else {
        setResults({
          type: "error",
          message: `❌ ${result.message}`,
        });
      }
    } catch (error) {
      setResults({
        type: "error",
        message: `❌ Error fixing season: ${error.message}`,
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Season Integrity Checker</h2>
      <p className={styles.description}>
        This tool checks for and fixes game ID mismatches in seasons to ensure
        proper document ID handling and prevent round table issues.
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
          onClick={handleCheckIntegrity}
          disabled={isChecking || isFixing}
          variant="secondary"
        >
          {isChecking ? "Checking..." : "Check Integrity"}
        </Button>

        <Button
          onClick={handleFixIntegrity}
          disabled={isChecking || isFixing}
          variant="primary"
        >
          {isFixing ? "Fixing..." : "Fix Mismatches"}
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

      <div className={styles.info}>
        <h4>ℹ️ About Season Integrity:</h4>
        <ul>
          <li>Document IDs should match the gameId field exactly</li>
          <li>Mismatches cause round tables to fail</li>
          <li>This tool fixes the root cause of the problem</li>
          <li>
            After fixing, the proper reordering logic will prevent future
            mismatches
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SeasonIntegrityChecker;
