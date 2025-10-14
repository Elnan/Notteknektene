import React, { useState } from "react";
import {
  migrateToNewStructure,
  verifyMigration,
  rollbackMigration,
} from "../../../firebase/migration-script.js";
import styles from "./DatabaseMigration.module.css";

const DatabaseMigration = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [seasonName, setSeasonName] = useState("SeasonTest");

  const handleMigration = async () => {
    if (!seasonName.trim()) {
      setStatus("❌ Please enter a season name");
      return;
    }

    setIsRunning(true);
    setStatus("🔄 Starting migration...");

    try {
      await migrateToNewStructure(seasonName);
      setStatus("✅ Migration completed successfully!");
    } catch (error) {
      setStatus(`❌ Migration failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleVerification = async () => {
    if (!seasonName.trim()) {
      setStatus("❌ Please enter a season name");
      return;
    }

    setIsRunning(true);
    setStatus("🔍 Verifying migration...");

    try {
      await verifyMigration(seasonName);
      setStatus("✅ Migration verification completed!");
    } catch (error) {
      setStatus(`❌ Verification failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRollback = async () => {
    if (!seasonName.trim()) {
      setStatus("❌ Please enter a season name");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to rollback the migration for season "${seasonName}"? This will delete all migrated data.`
      )
    ) {
      return;
    }

    setIsRunning(true);
    setStatus("🔄 Rolling back migration...");

    try {
      await rollbackMigration(seasonName);
      setStatus("✅ Migration rolled back successfully!");
    } catch (error) {
      setStatus(`❌ Rollback failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className={styles.databaseMigration}>
      <div className={styles.header}>
        <h1>Database Migration</h1>
        <p>Migrate existing data to the new hierarchical structure</p>
      </div>

      <div className={styles.content}>
        <div className={styles.seasonInput}>
          <label htmlFor="seasonName">Season Name:</label>
          <input
            id="seasonName"
            type="text"
            value={seasonName}
            onChange={(e) => setSeasonName(e.target.value)}
            placeholder="e.g., SeasonTest, Season1"
            disabled={isRunning}
          />
        </div>

        <div className={styles.actions}>
          <button
            className={styles.migrateButton}
            onClick={handleMigration}
            disabled={isRunning}
          >
            🚀 Run Migration
          </button>

          <button
            className={styles.verifyButton}
            onClick={handleVerification}
            disabled={isRunning}
          >
            🔍 Verify Migration
          </button>

          <button
            className={styles.rollbackButton}
            onClick={handleRollback}
            disabled={isRunning}
          >
            ⚠️ Rollback Migration
          </button>
        </div>

        {status && (
          <div className={styles.status}>
            <p>{status}</p>
          </div>
        )}

        <div className={styles.info}>
          <h3>Migration Process</h3>
          <ol>
            <li>
              <strong>Create Season:</strong> Creates a new season document
            </li>
            <li>
              <strong>Migrate Games:</strong> Moves games to the new structure
            </li>
            <li>
              <strong>Migrate Submissions:</strong> Moves user submissions
            </li>
            <li>
              <strong>Migrate Participants:</strong> Moves user participation
              data
            </li>
            <li>
              <strong>Calculate Scores:</strong> Recalculates all user scores
            </li>
          </ol>

          <h3>⚠️ Important Notes</h3>
          <ul>
            <li>Migration will create a new season with the specified name</li>
            <li>Existing data will remain untouched (migration is additive)</li>
            <li>
              After successful migration, you can switch to the new structure
            </li>
            <li>Rollback will delete the migrated season and all its data</li>
            <li>Always verify the migration before switching to production</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DatabaseMigration;
