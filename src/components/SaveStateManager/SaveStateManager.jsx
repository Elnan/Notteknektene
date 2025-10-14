import React, { useState } from "react";
import { useSaveState } from "../../context/SaveStateContext";
import { useAuth } from "../../context/authContext";
import styles from "./SaveStateManager.module.css";

const SaveStateManager = ({
  gameId,
  onLoadSave,
  onDeleteSave,
  showSaveInfo = true,
}) => {
  const { currentUser } = useAuth();
  const {
    saveStates,
    loading,
    lastSaveTime,
    hasSaveState,
    getSaveStateInfo,
    deleteSaveState,
    loadGameState,
  } = useSaveState();

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!currentUser) {
    return null;
  }

  const saveInfo = getSaveStateInfo(gameId);
  const hasSave = hasSaveState(gameId);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  const handleLoadSave = async () => {
    if (!hasSave) return;

    setIsLoading(true);
    try {
      const savedState = await loadGameState(gameId);
      if (savedState && onLoadSave) {
        onLoadSave(savedState);
      }
    } catch (error) {
      console.error("Error loading save state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSave = async () => {
    if (!hasSave) return;

    setIsLoading(true);
    try {
      const success = await deleteSaveState(gameId);
      if (success && onDeleteSave) {
        onDeleteSave();
      }
    } catch (error) {
      console.error("Error deleting save state:", error);
    } finally {
      setIsLoading(false);
      setShowConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading save data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {hasSave && showSaveInfo && (
        <div className={styles.saveInfo}>
          <h3>Save Information</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Last Saved:</span>
              <span className={styles.value}>
                {formatDate(saveInfo?.lastModified)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Time Spent:</span>
              <span className={styles.value}>
                {formatTime(saveInfo?.timeSpent || 0)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Hints Used:</span>
              <span className={styles.value}>{saveInfo?.hintsUsed || 0}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Attempts:</span>
              <span className={styles.value}>{saveInfo?.attempts || 0}</span>
            </div>
            {saveInfo?.score !== null && (
              <div className={styles.infoItem}>
                <span className={styles.label}>Score:</span>
                <span className={styles.value}>{saveInfo.score}</span>
              </div>
            )}
            <div className={styles.infoItem}>
              <span className={styles.label}>Status:</span>
              <span className={`${styles.value} ${styles.status}`}>
                {saveInfo?.completed ? "Completed" : "In Progress"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        {hasSave ? (
          <>
            <button
              className={`${styles.button} ${styles.loadButton}`}
              onClick={handleLoadSave}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load Save"}
            </button>

            <button
              className={`${styles.button} ${styles.deleteButton}`}
              onClick={() => setShowConfirmDelete(true)}
              disabled={isLoading}
            >
              Delete Save
            </button>
          </>
        ) : (
          <div className={styles.noSave}>
            <p>No save data found for this game.</p>
            <p>Your progress will be automatically saved as you play.</p>
          </div>
        )}
      </div>

      {showConfirmDelete && (
        <div className={styles.confirmModal}>
          <div className={styles.confirmContent}>
            <h3>Delete Save Data?</h3>
            <p>
              This will permanently delete your save data for this game. This
              action cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={`${styles.button} ${styles.cancelButton}`}
                onClick={() => setShowConfirmDelete(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className={`${styles.button} ${styles.confirmDeleteButton}`}
                onClick={handleDeleteSave}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaveStateManager;
