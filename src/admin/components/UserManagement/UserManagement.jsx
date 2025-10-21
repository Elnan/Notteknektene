import React, { useState, useEffect } from "react";
import {
  getCurrentSeason,
  getSeasonParticipantsList,
  addSeasonParticipant,
  updateSeasonParticipant,
  deleteSeasonParticipant,
} from "../../../firebase/new-database-utils.js";
import { getAllUsers } from "../../../firebase/admin-firebase-utils.js";
import styles from "./UserManagement.module.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [seasonParticipants, setSeasonParticipants] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userAvatars, setUserAvatars] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load all registered users
      const allUsers = await getAllUsers();
      setUsers(allUsers);

      // Load current season
      const season = await getCurrentSeason();
      setCurrentSeason(season);

      if (season) {
        // Load season participants
        const participants = await getSeasonParticipantsList(season.id);
        setSeasonParticipants(participants);
      }

      // Load user avatars
      const avatarsMap = {};
      allUsers.forEach((user) => {
        if (user.displayName && user.avatar) {
          // Use userId as key to avoid conflicts with duplicate displayNames
          avatarsMap[user.id] = user.avatar;
        }
      });
      setUserAvatars(avatarsMap);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleParticipation = async (userId) => {
    try {
      const user = users.find((u) => u.id === userId);
      const isParticipating = seasonParticipants.some(
        (p) => p.userId === userId
      );

      if (isParticipating) {
        // Show confirmation dialog for removal
        const confirmMessage = `Remove ${user.displayName || user.name || user.email} from the season?\n\nThis will:\n• Remove them from the season participants\n• Remove them from the scoreboard\n• Their submissions will remain in round tables\n\nContinue?`;

        if (!window.confirm(confirmMessage)) {
          return;
        }

        // Remove from season participants
        await deleteSeasonParticipant(currentSeason.id, userId);

        // Also remove from totalScores if it exists
        try {
          const { deleteDoc, doc } = await import("firebase/firestore");
          const { notteknekteneDb } = await import(
            "../../../firebase/firebase-config-notteknektene.js"
          );
          const totalScoreRef = doc(
            notteknekteneDb,
            "seasons",
            currentSeason.id,
            "totalScores",
            userId
          );
          await deleteDoc(totalScoreRef);
          console.log(`Removed user ${userId} from totalScores`);
        } catch (error) {
          console.warn(
            `Could not remove user ${userId} from totalScores:`,
            error
          );
          // Don't fail the whole operation if totalScores deletion fails
        }

        alert("User removed from season and scoreboard");
      } else {
        // Add to season
        await addSeasonParticipant(currentSeason.id, {
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
        });
        alert("User added to season");
      }

      await loadUserData();
    } catch (error) {
      console.error("Error toggling participation:", error);
      alert("Error updating participation");
    }
  };

  const handleEditUser = async (userId, updates) => {
    try {
      await updateSeasonParticipant(currentSeason.id, userId, updates);
      setEditingUser(null);
      await loadUserData();
      alert("User updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Remove from season participants
      await deleteSeasonParticipant(currentSeason.id, userId);

      // In a real app, you'd also delete from the main users collection
      // await deleteUser(userId);

      await loadUserData();
      alert("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.displayName || user.name || user.email?.split("@")[0] || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isParticipating = (userId) => {
    return seasonParticipants.some((p) => p.userId === userId);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className={styles.userManagement}>
      <div className={styles.header}>
        <h1>User Management</h1>
        <p>Manage registered users and season participation</p>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button
          className={styles.addUserButton}
          onClick={() => setShowAddUserModal(true)}
        >
          Add User
        </button>
      </div>

      {/* Season Info */}
      {currentSeason && (
        <div className={styles.seasonInfo}>
          <h2>Current Season: {currentSeason.name}</h2>
          <p>
            Participants: {seasonParticipants.length} /{" "}
            {currentSeason.maxParticipants || "∞"}
          </p>
        </div>
      )}

      {/* Users List */}
      <div className={styles.usersList}>
        <h2>Registered Users ({filteredUsers.length})</h2>
        <div className={styles.usersGrid}>
          {filteredUsers.map((user) => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.userHeader}>
                <div className={styles.userNameContainer}>
                  <img
                    src={
                      userAvatars[user.id]
                        ? `/avatars/${userAvatars[user.id]}`
                        : "/defaultAvatar.webp"
                    }
                    alt={`${user.displayName || user.name}'s avatar`}
                    className={styles.userAvatar}
                  />
                  <h3>
                    {user.displayName ||
                      user.name ||
                      user.email?.split("@")[0] ||
                      "Unknown User"}
                  </h3>
                </div>
                <span
                  className={`${styles.participationStatus} ${
                    isParticipating(user.id)
                      ? styles.participating
                      : styles.notParticipating
                  }`}
                >
                  {isParticipating(user.id)
                    ? "🟢 Participating"
                    : "⚪ Not Participating"}
                </span>
              </div>

              <div className={styles.userDetails}>
                <p>
                  <strong>Email:</strong> {user.email || "No email"}
                </p>
                <p>
                  <strong>User ID:</strong> {user.id}
                </p>
                <p>
                  <strong>Participating:</strong>{" "}
                  {user.Participating ? "Yes" : "No"}
                </p>
                {user.createdAt && (
                  <p>
                    <strong>Joined:</strong>{" "}
                    {new Date(
                      user.createdAt.toDate
                        ? user.createdAt.toDate()
                        : user.createdAt
                    ).toLocaleDateString()}
                  </p>
                )}
                {user.lastLoginAt && (
                  <p>
                    <strong>Last Login:</strong>{" "}
                    {new Date(
                      user.lastLoginAt.toDate
                        ? user.lastLoginAt.toDate()
                        : user.lastLoginAt
                    ).toLocaleString()}
                  </p>
                )}
              </div>

              <div className={styles.userActions}>
                <button
                  className={`${styles.toggleButton} ${
                    isParticipating(user.id)
                      ? styles.removeButton
                      : styles.addButton
                  }`}
                  onClick={() => handleToggleParticipation(user.id)}
                >
                  {isParticipating(user.id)
                    ? "Remove from Season"
                    : "Add to Season"}
                </button>

                <button
                  className={styles.editButton}
                  onClick={() => setEditingUser(user)}
                >
                  Edit
                </button>

                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteUser(user.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className={styles.noUsers}>
            <p>No users found matching your search.</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div
          className={styles.modalOverlay}
          onClick={() => setEditingUser(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit User</h2>
              <button
                className={styles.closeButton}
                onClick={() => setEditingUser(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleEditUser(editingUser.userId, {
                    userName: formData.get("userName"),
                    userEmail: formData.get("userEmail"),
                  });
                }}
              >
                <div className={styles.formGroup}>
                  <label htmlFor="userName">Name</label>
                  <input
                    type="text"
                    id="userName"
                    name="userName"
                    defaultValue={editingUser.userName}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="userEmail">Email</label>
                  <input
                    type="email"
                    id="userEmail"
                    name="userEmail"
                    defaultValue={editingUser.userEmail}
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveButton}>
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowAddUserModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New User</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowAddUserModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const newUser = {
                    userId: formData.get("userId"),
                    userName: formData.get("userName"),
                    userEmail: formData.get("userEmail"),
                  };

                  // Add to season participants
                  addSeasonParticipant(currentSeason.id, {
                    ...newUser,
                    joinedAt: new Date().toISOString(),
                    isActive: true,
                  })
                    .then(() => {
                      setShowAddUserModal(false);
                      loadUserData();
                      alert("User added successfully");
                    })
                    .catch((error) => {
                      console.error("Error adding user:", error);
                      alert("Error adding user");
                    });
                }}
              >
                <div className={styles.formGroup}>
                  <label htmlFor="newUserId">User ID</label>
                  <input
                    type="text"
                    id="newUserId"
                    name="userId"
                    required
                    placeholder="Enter unique user ID"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="newUserName">Name</label>
                  <input
                    type="text"
                    id="newUserName"
                    name="userName"
                    required
                    placeholder="Enter user name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="newUserEmail">Email</label>
                  <input
                    type="email"
                    id="newUserEmail"
                    name="userEmail"
                    placeholder="Enter user email"
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveButton}>
                    Add User
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowAddUserModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
