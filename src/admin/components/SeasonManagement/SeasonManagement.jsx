import React, { useState, useEffect } from "react";
import {
  getAllSeasons,
  createSeason,
  updateSeason,
  getCurrentSeason,
  deleteSeason,
  areAllSeasonGamesCompleted,
  finishSeason,
  generateRoundTableForRound,
  fixSeasonMissingLastRound,
} from "../../../firebase/new-database-utils.js";
import { getAllGames } from "../../../firebase/admin-firebase-utils";
import styles from "./SeasonManagement.module.css";

const SeasonManagement = () => {
  const [seasons, setSeasons] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [availableGames, setAvailableGames] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [seasonToFinish, setSeasonToFinish] = useState(null);
  const [finishingSeason, setFinishingSeason] = useState(false);
  const [showGenerateRoundTableConfirm, setShowGenerateRoundTableConfirm] =
    useState(false);
  const [seasonToGenerateRoundTable, setSeasonToGenerateRoundTable] =
    useState(null);
  const [generatingRoundTable, setGeneratingRoundTable] = useState(false);
  const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);
  const [seasonToActivate, setSeasonToActivate] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userAvatars, setUserAvatars] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    weeks: 10,
    description: "",
    maxParticipants: 100,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [seasonsData, currentSeasonData, gamesData] = await Promise.all([
        getAllSeasons(),
        getCurrentSeason(),
        getAllGames(),
      ]);

      // Load games and participants for each season
      const seasonsWithGames = await Promise.all(
        seasonsData.map(async (season) => {
          try {
            const { getSeasonGamesList, getSeasonParticipantsList } =
              await import("../../../firebase/new-database-utils.js");
            const [games, participants] = await Promise.all([
              getSeasonGamesList(season.id),
              getSeasonParticipantsList(season.id),
            ]);
            // Sort games by round number to ensure consistent order
            const sortedGames = games.sort(
              (a, b) => a.roundNumber - b.roundNumber
            );
            return { ...season, games: sortedGames, participants };
          } catch (error) {
            console.error(`Error loading data for season ${season.id}:`, error);
            return { ...season, games: [], participants: [] };
          }
        })
      );

      setSeasons(seasonsWithGames);
      setCurrentSeason(currentSeasonData);

      // Set all games as available initially (will be filtered when season is selected)
      setAvailableGames(gamesData);
    } catch (error) {
      console.error("Error loading season data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = async (e) => {
    e.preventDefault();

    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + formData.weeks * 7);

      const newSeason = {
        ...formData,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isActive: false,
        createdAt: new Date().toISOString(),
        games: [],
        participants: [],
      };

      await createSeason(newSeason);
      setShowCreateForm(false);
      setFormData({
        name: "",
        startDate: "",
        weeks: 10,
        description: "",
        maxParticipants: 100,
      });
      await loadData();

      // Automatically select the newly created season for game management
      const newSeasonData = { ...newSeason, id: newSeason.name };
      setSelectedSeason(newSeasonData);
      alert("Season created successfully! Now add games to your season.");
    } catch (error) {
      console.error("Error creating season:", error);
      alert("Error creating season");
    }
  };

  const handleDeleteSeason = async (seasonId) => {
    console.log("Delete button clicked for season:", seasonId);
    setSeasonToDelete(seasonId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSeason = async () => {
    if (!seasonToDelete) return;

    try {
      console.log("Starting deletion process for season:", seasonToDelete);
      // For new database structure, seasonId is the season name
      await deleteSeason(seasonToDelete);
      console.log("Season deleted from database");
      await loadData();
      console.log("Data reloaded");
      if (selectedSeason?.id === seasonToDelete) {
        setSelectedSeason(null);
        console.log("Selected season cleared");
      }
      alert("Season deleted successfully!");
    } catch (error) {
      console.error("Error deleting season:", error);
      alert("Error deleting season: " + error.message);
    } finally {
      setShowDeleteConfirm(false);
      setSeasonToDelete(null);
    }
  };

  const handleFinishSeason = async (seasonId) => {
    try {
      // Check if all games are completed
      const allCompleted = await areAllSeasonGamesCompleted(seasonId);

      setSeasonToFinish(seasonId);
      setShowFinishConfirm(true);
    } catch (error) {
      console.error("Error checking season completion:", error);
      alert("Error checking season completion");
    }
  };

  const confirmFinishSeason = async (forceComplete = false) => {
    if (!seasonToFinish) return;

    try {
      setFinishingSeason(true);
      const result = await finishSeason(seasonToFinish, forceComplete);

      setShowFinishConfirm(false);
      setSeasonToFinish(null);
      await loadData();

      alert(result.message);
    } catch (error) {
      console.error("Error finishing season:", error);

      // If the error mentions incomplete games, offer to force complete
      if (error.message.includes("not completed") && !forceComplete) {
        const shouldForce = confirm(
          `${error.message}\n\nWould you like to force complete the season anyway? This will automatically complete any remaining games.`
        );
        if (shouldForce) {
          await confirmFinishSeason(true);
          return;
        }
      } else {
        alert(`Error finishing season: ${error.message}`);
      }
    } finally {
      setFinishingSeason(false);
    }
  };

  const handleGenerateRoundTable = async (seasonId) => {
    try {
      setSeasonToGenerateRoundTable(seasonId);
      setShowGenerateRoundTableConfirm(true);
    } catch (error) {
      console.error("Error preparing to generate round table:", error);
      alert("Error preparing to generate round table");
    }
  };

  const confirmGenerateRoundTable = async () => {
    if (!seasonToGenerateRoundTable) return;

    try {
      setGeneratingRoundTable(true);

      // Get the season to find the last round number
      const season = seasons.find((s) => s.id === seasonToGenerateRoundTable);
      if (!season || !season.games || season.games.length === 0) {
        throw new Error("Season not found or has no games");
      }

      // Get the last round number (round 10)
      const lastRound = season.games[season.games.length - 1].roundNumber;

      const result = await generateRoundTableForRound(
        seasonToGenerateRoundTable,
        lastRound
      );

      setShowGenerateRoundTableConfirm(false);
      setSeasonToGenerateRoundTable(null);
      await loadData();

      alert(result.message);
    } catch (error) {
      console.error("Error generating round table:", error);
      alert(`Error generating round table: ${error.message}`);
    } finally {
      setGeneratingRoundTable(false);
    }
  };

  const handleFixSeason = async (seasonId) => {
    try {
      setSeasonToFix(seasonId);
      setShowFixSeasonModal(true);
    } catch (error) {
      console.error("Error preparing to fix season:", error);
      alert("Error preparing to fix season");
    }
  };

  const confirmFixSeason = async (reFinishSeason = false) => {
    if (!seasonToFix) return;

    try {
      setFixingSeason(true);
      const result = await fixSeasonMissingLastRound(
        seasonToFix,
        reFinishSeason
      );

      setShowFixSeasonModal(false);
      setSeasonToFix(null);
      await loadData();

      alert(result.message);
    } catch (error) {
      console.error("Error fixing season:", error);
      alert(`Error fixing season: ${error.message}`);
    } finally {
      setFixingSeason(false);
    }
  };

  const handleActivateSeason = async (seasonId) => {
    // Show user selection modal instead of directly activating
    try {
      const { getAllUsers } = await import(
        "../../../firebase/admin-firebase-utils.js"
      );

      const users = await getAllUsers();
      setAllUsers(users);

      // Pre-select users with Participating: true
      const preSelectedUsers = users
        .filter((user) => user.Participating === true)
        .map((user) => user.id);
      setSelectedUsers(preSelectedUsers);

      // Load user avatars
      const avatarsMap = {};
      users.forEach((user) => {
        if (user.displayName && user.avatar) {
          // Use userId as key to avoid conflicts with duplicate displayNames
          avatarsMap[user.id] = user.avatar;
        }
      });
      setUserAvatars(avatarsMap);

      setSeasonToActivate(seasonId);
      setShowUserSelectionModal(true);
    } catch (error) {
      console.error("Error loading users for season activation:", error);
      alert("Error loading users");
    }
  };

  const handleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleConfirmSeasonActivation = async () => {
    if (!seasonToActivate) return;

    try {
      // Deactivate all other seasons first
      const batch = seasons.map((season) =>
        updateSeason(season.id, {
          ...season,
          isActive: season.id === seasonToActivate,
        })
      );
      await Promise.all(batch);

      const { addSeasonParticipant, initializeSeasonTotalScores } =
        await import("../../../firebase/new-database-utils.js");

      // Add selected users to the season
      const selectedUsersData = allUsers.filter((user) =>
        selectedUsers.includes(user.id)
      );
      const participantDataList = [];

      for (const user of selectedUsersData) {
        try {
          const participantData = {
            userId: user.id,
            displayName:
              user.displayName ||
              user.name ||
              user.email?.split("@")[0] ||
              "Unknown User",
            email: user.email,
            avatar: user.avatar || "male_avatar_portrait_man.png",
            joinedAt: new Date(),
            isActive: true,
          };

          await addSeasonParticipant(seasonToActivate, participantData);
          participantDataList.push(participantData);
          console.log(`Added user ${user.displayName || user.email} to season`);
        } catch (error) {
          console.error(`Error adding user ${user.id} to season:`, error);
        }
      }

      // Initialize totalScores for all participants
      if (participantDataList.length > 0) {
        await initializeSeasonTotalScores(
          seasonToActivate,
          participantDataList
        );
      }

      // Close modal and reset state
      setShowUserSelectionModal(false);
      setSeasonToActivate(null);
      setSelectedUsers([]);
      setAllUsers([]);
      setUserAvatars({});

      await loadData();
      alert(
        `Season activated successfully! Added ${selectedUsersData.length} users to the season.`
      );
    } catch (error) {
      console.error("Error activating season:", error);
      alert("Error activating season");
    }
  };

  const handleCancelSeasonActivation = () => {
    setShowUserSelectionModal(false);
    setSeasonToActivate(null);
    setSelectedUsers([]);
    setAllUsers([]);
    setUserAvatars({});
  };

  const handleAddGameToSeason = async (gameId) => {
    if (!selectedSeason) return;

    const game = availableGames.find((g) => g.id === gameId);
    if (!game) return;

    try {
      // Get current games to determine the next round number
      const { getSeasonGamesList } = await import(
        "../../../firebase/new-database-utils.js"
      );
      const currentGames = await getSeasonGamesList(selectedSeason.id);

      // Check if we're adding more games than weeks
      if (currentGames.length >= selectedSeason.weeks) {
        alert(
          `Cannot add more games. Season is limited to ${selectedSeason.weeks} games (one per week).`
        );
        return;
      }

      // Add game without round number - will be assigned during reordering
      const { addGameToSeason } = await import(
        "../../../utils/properSeasonCreation.js"
      );
      await addGameToSeason(selectedSeason.id, game);

      // Update selected season with new games (no full page reload)
      const updatedGames = await getSeasonGamesList(selectedSeason.id);

      // Sort games by round number to ensure consistent order
      const sortedGames = updatedGames.sort(
        (a, b) => a.roundNumber - b.roundNumber
      );

      setSelectedSeason({ ...selectedSeason, games: sortedGames });

      // Update the season in the seasons list
      setSeasons((prevSeasons) =>
        prevSeasons.map((season) =>
          season.id === selectedSeason.id
            ? { ...season, games: updatedGames }
            : season
        )
      );

      // Update available games to remove the added game
      setAvailableGames((prevGames) =>
        prevGames.filter((g) => g.id !== gameId)
      );
    } catch (error) {
      console.error("Error adding game to season:", error);
      alert("Error adding game to season");
    }
  };

  const handleRemoveGameFromSeason = async (gameId) => {
    if (!selectedSeason) return;

    try {
      // Find the game to get its full ID
      const currentGames = selectedSeason.games || [];
      const gameToRemove = currentGames.find((game) => game.gameId === gameId);

      if (!gameToRemove) {
        alert("Game not found in season");
        return;
      }

      console.log("Removing game:", {
        seasonId: selectedSeason.id,
        gameId: gameToRemove.id,
        gameData: gameToRemove,
      });

      // Use the new deleteGame function
      const { deleteGame } = await import(
        "../../../firebase/new-database-utils.js"
      );
      await deleteGame(selectedSeason.id, gameToRemove.id);

      console.log("Game deleted successfully, reloading data...");

      // Reload the season data
      await loadData();

      // Update selected season
      const { getSeasonGamesList } = await import(
        "../../../firebase/new-database-utils.js"
      );
      const updatedGames = await getSeasonGamesList(selectedSeason.id);

      // Sort games by round number to ensure consistent order
      const sortedGames = updatedGames.sort(
        (a, b) => a.roundNumber - b.roundNumber
      );

      setSelectedSeason({ ...selectedSeason, games: sortedGames });

      // Add the removed game back to available games
      const { getAllGames } = await import(
        "../../../firebase/admin-firebase-utils.js"
      );
      const allGames = await getAllGames();
      const baseGameId = gameToRemove.gameId.replace(/\d+$/, ""); // Remove round number
      const removedGame = allGames.find((g) => g.id === baseGameId);
      if (removedGame) {
        setAvailableGames((prevGames) => {
          const gameExists = prevGames.find((g) => g.id === removedGame.id);
          return gameExists ? prevGames : [...prevGames, removedGame];
        });
      }

      alert("Game removed successfully!");
    } catch (error) {
      console.error("Error removing game from season:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      alert(`Error removing game from season: ${error.message}`);
    }
  };

  const handleReorderGames = (fromIndex, toIndex, event) => {
    if (!selectedSeason) return;

    // Prevent page reload
    event.preventDefault();
    event.stopPropagation();

    console.log(`🔄 Reordering game from position ${fromIndex} to ${toIndex}`);

    // Just update the local state - no database changes yet
    const updatedGames = [...selectedSeason.games];
    const [movedGame] = updatedGames.splice(fromIndex, 1);
    updatedGames.splice(toIndex, 0, movedGame);

    // Update local state immediately for responsive UI
    const updatedSeason = { ...selectedSeason, games: updatedGames };
    setSelectedSeason(updatedSeason);

    // Update the season in the seasons list
    setSeasons((prevSeasons) =>
      prevSeasons.map((season) =>
        season.id === selectedSeason.id ? updatedSeason : season
      )
    );

    console.log(
      "✅ Game reordered locally. Click 'Apply Order' to save to database."
    );
  };

  const handleApplyOrder = async () => {
    if (!selectedSeason) return;

    try {
      console.log(
        "💾 Applying new game order with proper document ID handling..."
      );

      // Use the reordering utility
      const { reorderGames } = await import("../../../utils/gameReordering.js");
      const result = await reorderGames(
        selectedSeason.id,
        selectedSeason.games
      );

      if (result.success) {
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

        // Update the season in the seasons list
        setSeasons((prevSeasons) =>
          prevSeasons.map((season) =>
            season.id === selectedSeason.id ? updatedSeason : season
          )
        );

        alert(
          "✅ Game order applied successfully with proper document ID handling!"
        );
      } else {
        alert("❌ Error applying game order: " + result.message);
      }
    } catch (error) {
      console.error("Error applying game order:", error);
      alert("Error applying game order: " + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const getSeasonStatus = (season) => {
    if (season.isCompleted)
      return { text: "🏁 Completed", class: styles.completed };
    if (season.isActive) return { text: "🟢 Active", class: styles.active };
    if (new Date(season.endDate) < new Date())
      return { text: "🔴 Ended", class: styles.ended };
    if (new Date(season.startDate) > new Date())
      return { text: "🟡 Upcoming", class: styles.upcoming };
    return { text: "⚪ Inactive", class: styles.inactive };
  };

  const isGameInSeason = (gameId) => {
    return (
      selectedSeason?.games?.some((game) => game.gameId === gameId) || false
    );
  };

  const handleSeasonSelect = async (season) => {
    setSelectedSeason(season);

    // Update available games to filter out games already in the selected season
    const { getAllGames } = await import(
      "../../../firebase/admin-firebase-utils.js"
    );
    const allGames = await getAllGames();

    const seasonGameIds =
      season.games?.map((game) => game.gameId.replace(/\d+$/, "")) || [];
    const filteredGames = allGames.filter(
      (game) => !seasonGameIds.includes(game.id)
    );
    setAvailableGames(filteredGames);
  };

  // Helper function to find and remove duplicate games
  const handleRemoveDuplicateGames = async () => {
    if (!selectedSeason) return;

    try {
      const currentGames = selectedSeason.games || [];
      const gameCounts = {};
      const duplicates = [];

      // Count occurrences of each game
      currentGames.forEach((game) => {
        const key = game.gameId;
        if (!gameCounts[key]) {
          gameCounts[key] = [];
        }
        gameCounts[key].push(game);
      });

      // Find duplicates (games with more than one occurrence)
      Object.entries(gameCounts).forEach(([gameId, games]) => {
        if (games.length > 1) {
          // Keep the first one, mark the rest as duplicates
          duplicates.push(...games.slice(1));
        }
      });

      if (duplicates.length === 0) {
        alert("No duplicate games found!");
        return;
      }

      // Remove all duplicates
      const { deleteGame, ensureSingleActiveGame } = await import(
        "../../../firebase/new-database-utils.js"
      );

      for (const duplicate of duplicates) {
        console.log(
          `Removing duplicate game: ${duplicate.gameId} (ID: ${duplicate.id})`
        );
        await deleteGame(selectedSeason.id, duplicate.id);
      }

      // Ensure only one game is active after removing duplicates
      await ensureSingleActiveGame(selectedSeason.id);

      // Reload data
      await loadData();
      const { getSeasonGamesList } = await import(
        "../../../firebase/new-database-utils.js"
      );
      const updatedGames = await getSeasonGamesList(selectedSeason.id);

      // Sort games by round number to ensure consistent order
      const sortedGames = updatedGames.sort(
        (a, b) => a.roundNumber - b.roundNumber
      );

      setSelectedSeason({ ...selectedSeason, games: sortedGames });

      alert(
        `Removed ${duplicates.length} duplicate game(s) successfully! Active game status has been fixed.`
      );
    } catch (error) {
      console.error("Error removing duplicate games:", error);
      alert(`Error removing duplicate games: ${error.message}`);
    }
  };

  // Helper function to fix active game status
  const handleFixActiveGame = async () => {
    if (!selectedSeason) return;

    try {
      const { ensureSingleActiveGame } = await import(
        "../../../firebase/new-database-utils.js"
      );

      await ensureSingleActiveGame(selectedSeason.id);

      // Reload data
      await loadData();
      const { getSeasonGamesList } = await import(
        "../../../firebase/new-database-utils.js"
      );
      const updatedGames = await getSeasonGamesList(selectedSeason.id);

      // Sort games by round number to ensure consistent order
      const sortedGames = updatedGames.sort(
        (a, b) => a.roundNumber - b.roundNumber
      );

      setSelectedSeason({ ...selectedSeason, games: sortedGames });

      alert("Active game status fixed! Only round 1 should now be active.");
    } catch (error) {
      console.error("Error fixing active game status:", error);
      alert(`Error fixing active game status: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading seasons...</p>
      </div>
    );
  }

  return (
    <div className={styles.seasonManagement}>
      <div className={styles.header}>
        <h1>Season Management</h1>
        <p>Create and manage game seasons</p>
      </div>

      <div className={styles.content}>
        {/* Current Season Overview */}
        <div className={styles.currentSeason}>
          <h2>Current Season</h2>
          {currentSeason ? (
            <div className={styles.currentSeasonCard}>
              <div className={styles.seasonInfo}>
                <h3>{currentSeason.name}</h3>
                <p>{currentSeason.description}</p>
                <div className={styles.seasonStats}>
                  <span>Start: {formatDate(currentSeason.startDate)}</span>
                  <span>Weeks: {currentSeason.weeks || 10}</span>
                  <span>Games: {currentSeason.games?.length || 0}</span>
                  <span>
                    Participants: {currentSeason.participants?.length || 0}
                  </span>
                </div>
              </div>
              <div className={styles.currentSeasonActions}>
                <button
                  className={styles.editButton}
                  onClick={() => handleSeasonSelect(currentSeason)}
                >
                  Manage Games
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.noCurrentSeason}>
              <p>No active season found.</p>
              <button
                className={styles.createButton}
                onClick={() => setShowCreateForm(true)}
              >
                Create New Season
              </button>
            </div>
          )}
        </div>

        {/* Create Season Form */}
        {showCreateForm && (
          <div className={styles.formSection}>
            <h2>Create New Season</h2>
            <form className={styles.seasonForm} onSubmit={handleCreateSeason}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Season Name</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="e.g., Season 2 - Winter 2024"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="weeks">Number of Weeks</label>
                  <input
                    type="number"
                    id="weeks"
                    value={formData.weeks}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weeks: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="52"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="maxParticipants">Max Participants</label>
                  <input
                    type="number"
                    id="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxParticipants: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="1000"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                  placeholder="Describe the season, themes, or special features..."
                />
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>
                  Create Season
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Game Management for Selected Season */}
        {selectedSeason && (
          <div className={styles.gameManagement}>
            <div className={styles.gameManagementHeader}>
              <h2>Manage Games: {selectedSeason.name}</h2>
              <div className={styles.gameCounter}>
                Games: {selectedSeason.games?.length || 0} /{" "}
                {selectedSeason.weeks}
                {selectedSeason.games?.length >= selectedSeason.weeks && (
                  <span className={styles.warning}>⚠️ Season is full</span>
                )}
              </div>
              <button
                className={styles.removeDuplicatesButton}
                onClick={handleRemoveDuplicateGames}
                title="Remove duplicate games from the season"
              >
                🧹 Remove Duplicates
              </button>
              <button
                className={styles.fixActiveGameButton}
                onClick={handleFixActiveGame}
                title="Fix active game status - ensure only round 1 is active"
              >
                🔧 Fix Active Game
              </button>
              <button
                className={styles.applyOrderButton}
                onClick={handleApplyOrder}
                title="Apply the current game order to the database"
              >
                💾 Apply Order
              </button>
            </div>

            <div className={styles.gameManagementContent}>
              {/* Available Games */}
              <div className={styles.availableGames}>
                <h3>Available Games</h3>
                <div className={styles.gamesGrid}>
                  {availableGames
                    .filter((game) => !isGameInSeason(game.id))
                    .map((game) => (
                      <div key={game.id} className={styles.gameCard}>
                        <div className={styles.gameIcon}>{game.icon}</div>
                        <div className={styles.gameInfo}>
                          <h4>{game.name}</h4>
                          <p>{game.description}</p>
                          <div className={styles.gameMeta}>
                            <span className={styles.gameType}>{game.type}</span>
                            <span className={styles.gameDifficulty}>
                              {game.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className={styles.gameActions}>
                          <button
                            className={styles.addButton}
                            onClick={() => handleAddGameToSeason(game.id)}
                            disabled={
                              selectedSeason.games?.length >=
                              selectedSeason.weeks
                            }
                          >
                            Add to Season
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Season Games Order */}
              <div className={styles.seasonGames}>
                <h3>Season Games Order</h3>
                {selectedSeason.games && selectedSeason.games.length > 0 ? (
                  <div className={styles.seasonGamesList}>
                    {selectedSeason.games.map((game, index) => {
                      // Find the game name from available games
                      const baseGameId = game.gameId.replace(/\d+$/, ""); // Remove round number
                      const gameInfo = availableGames.find(
                        (g) => g.id === baseGameId
                      );
                      const gameName = gameInfo ? gameInfo.name : game.gameId;

                      return (
                        <div
                          key={game.gameId}
                          className={styles.seasonGameItem}
                        >
                          <span className={styles.gameOrder}>{index + 1}</span>
                          <span className={styles.gameName}>{gameName}</span>
                          <div className={styles.gameItemActions}>
                            <div className={styles.reorderButtons}>
                              {index > 0 && (
                                <button
                                  onClick={(e) =>
                                    handleReorderGames(index, index - 1, e)
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
                                    handleReorderGames(index, index + 1, e)
                                  }
                                  className={styles.reorderButton}
                                  type="button"
                                >
                                  ↓
                                </button>
                              )}
                            </div>
                            <button
                              className={styles.removeButton}
                              onClick={() =>
                                handleRemoveGameFromSeason(game.gameId)
                              }
                              type="button"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={styles.noGames}>
                    No games added to season yet.
                  </p>
                )}
              </div>
            </div>

            <div className={styles.seasonActions}>
              <button
                className={styles.backButton}
                onClick={() => setSelectedSeason(null)}
              >
                Back to Seasons
              </button>
            </div>
          </div>
        )}

        {/* All Seasons List */}
        {!selectedSeason && (
          <div className={styles.seasonsList}>
            <div className={styles.seasonsHeader}>
              <h2>All Seasons</h2>
              {!showCreateForm && (
                <button
                  className={styles.createButton}
                  onClick={() => setShowCreateForm(true)}
                >
                  Create New Season
                </button>
              )}
            </div>

            <div className={styles.seasonsGrid}>
              {seasons.map((season) => {
                const status = getSeasonStatus(season);
                return (
                  <div key={season.id} className={styles.seasonCard}>
                    <div className={styles.seasonHeader}>
                      <h3>{season.name}</h3>
                      <span className={`${styles.status} ${status.class}`}>
                        {status.text}
                      </span>
                    </div>

                    <p className={styles.seasonDescription}>
                      {season.description || "No description"}
                    </p>

                    <div className={styles.seasonDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Start:</span>
                        <span>{formatDate(season.startDate)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Weeks:</span>
                        <span>{season.weeks || 10}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Games:</span>
                        <span>{season.games?.length || 0}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>
                          Participants:
                        </span>
                        <span>{season.participants?.length || 0}</span>
                      </div>
                    </div>

                    <div className={styles.seasonActions}>
                      <button
                        className={styles.manageButton}
                        onClick={() => handleSeasonSelect(season)}
                      >
                        Manage Games
                      </button>
                      {!season.isActive && !season.isCompleted && (
                        <button
                          className={styles.activateButton}
                          onClick={() => handleActivateSeason(season.id)}
                        >
                          Activate
                        </button>
                      )}
                      {season.isActive && !season.isCompleted && (
                        <>
                          <button
                            className={styles.generateRoundTableButton}
                            onClick={() => handleGenerateRoundTable(season.id)}
                            title="Generate round table for round 10 without ending the season"
                          >
                            📊 Generate Round Table
                          </button>
                          <button
                            className={styles.finishButton}
                            onClick={() => handleFinishSeason(season.id)}
                            title="Finish season (end the season)"
                          >
                            🏁 Finish Season
                          </button>
                        </>
                      )}
                      {season.isCompleted && (
                        <button
                          className={styles.fixButton}
                          onClick={() => handleFixSeason(season.id)}
                          title="Fix season - restore missing last round table"
                        >
                          🔧 Fix Last Round
                        </button>
                      )}
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteSeason(season.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {seasons.length === 0 && (
              <div className={styles.noSeasons}>
                <p>No seasons created yet.</p>
                <button
                  className={styles.createButton}
                  onClick={() => setShowCreateForm(true)}
                >
                  Create First Season
                </button>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Confirm Deletion</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>
                  Are you sure you want to delete this season? This action
                  cannot be undone.
                </p>
                <div className={styles.modalActions}>
                  <button
                    className={styles.deleteButton}
                    onClick={confirmDeleteSeason}
                  >
                    Delete Season
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Finish Season Confirmation Modal */}
        {showFinishConfirm && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowFinishConfirm(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Finish Season</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowFinishConfirm(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>Are you sure you want to finish this season? This will:</p>
                <ul>
                  <li>Mark the season as completed</li>
                  <li>Deactivate the season</li>
                  <li>Archive the season data</li>
                </ul>
                <p>
                  <strong>This action cannot be undone.</strong>
                </p>
                <div className={styles.modalActions}>
                  <button
                    className={styles.finishButton}
                    onClick={confirmFinishSeason}
                    disabled={finishingSeason}
                  >
                    {finishingSeason ? "Finishing..." : "🏁 Finish Season"}
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowFinishConfirm(false)}
                    disabled={finishingSeason}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fix Season Modal */}
        {showFixSeasonModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowFixSeasonModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Fix Season - Restore Last Round</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowFixSeasonModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>
                  This will fix a season that was accidentally finished before
                  completing the last round. It will:
                </p>
                <ul>
                  <li>Revert the season completion status</li>
                  <li>Find the last round that doesn't have a round table</li>
                  <li>Create the round table for that round</li>
                  <li>Optionally re-finish the season</li>
                </ul>
                <p>
                  <strong>
                    This will restore the missing round table and update the
                    total scores.
                  </strong>
                </p>
                <div className={styles.modalActions}>
                  <button
                    className={styles.fixButton}
                    onClick={() => confirmFixSeason(false)}
                    disabled={fixingSeason}
                  >
                    {fixingSeason ? "Fixing..." : "🔧 Fix Only"}
                  </button>
                  <button
                    className={styles.finishButton}
                    onClick={() => confirmFixSeason(true)}
                    disabled={fixingSeason}
                  >
                    {fixingSeason
                      ? "Fixing & Finishing..."
                      : "🔧 Fix & Re-finish Season"}
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowFixSeasonModal(false)}
                    disabled={fixingSeason}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Round Table Confirmation Modal */}
        {showGenerateRoundTableConfirm && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowGenerateRoundTableConfirm(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Generate Round Table</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowGenerateRoundTableConfirm(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>
                  Are you sure you want to generate the round table for round
                  10? This will:
                </p>
                <ul>
                  <li>Generate the round table for the final round</li>
                  <li>Calculate scores and rankings</li>
                  <li>Make the round table visible to users</li>
                </ul>
                <p>
                  <strong>Note: This will NOT end the season.</strong>
                </p>
                <div className={styles.modalActions}>
                  <button
                    className={styles.generateRoundTableButton}
                    onClick={confirmGenerateRoundTable}
                    disabled={generatingRoundTable}
                  >
                    {generatingRoundTable
                      ? "Generating..."
                      : "📊 Generate Round Table"}
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowGenerateRoundTableConfirm(false)}
                    disabled={generatingRoundTable}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Selection Modal for Season Activation */}
        {showUserSelectionModal && (
          <div
            className={styles.modalOverlay}
            onClick={handleCancelSeasonActivation}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Select Users for Season</h2>
                <button
                  className={styles.closeButton}
                  onClick={handleCancelSeasonActivation}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>Select which users should participate in this season:</p>
                <div className={styles.userSelectionGrid}>
                  {allUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`${styles.userSelectionCard} ${
                        selectedUsers.includes(user.id) ? styles.selected : ""
                      }`}
                      onClick={() => handleUserSelection(user.id)}
                    >
                      <div className={styles.userSelectionHeader}>
                        <img
                          src={
                            userAvatars[user.id]
                              ? `/avatars/${userAvatars[user.id]}`
                              : "/defaultAvatar.webp"
                          }
                          alt={`${user.displayName || user.name}'s avatar`}
                          className={styles.userSelectionAvatar}
                        />
                        <div className={styles.userSelectionInfo}>
                          <h4>
                            {user.displayName ||
                              user.name ||
                              user.email?.split("@")[0] ||
                              "Unknown User"}
                          </h4>
                          <p>{user.email}</p>
                          <span
                            className={`${styles.participationStatus} ${
                              user.Participating
                                ? styles.participating
                                : styles.notParticipating
                            }`}
                          >
                            {user.Participating
                              ? "🟢 Participating"
                              : "⚪ Not Participating"}
                          </span>
                        </div>
                        <div className={styles.userSelectionCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserSelection(user.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.modalActions}>
                  <button
                    className={styles.activateButton}
                    onClick={handleConfirmSeasonActivation}
                  >
                    Activate Season ({selectedUsers.length} users selected)
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={handleCancelSeasonActivation}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonManagement;
