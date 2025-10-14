import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar/AdminSidebar.jsx";
import styles from "./AdminLayout.module.css";
import Button from "../../components/Button.jsx";

const AdminLayout = ({ children, onRefresh }) => {
  const { currentUser, isAdmin, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle authentication check in useEffect
  useEffect(() => {
    console.log("Auth state:", {
      currentUser: !!currentUser,
      isAdmin,
      loading,
    });

    // Only redirect if we're sure the user is not an admin
    // currentUser === null means auth is still loading
    if (currentUser !== null && !isAdmin) {
      console.log("Redirecting: User is not admin");
      navigate("/");
    }
  }, [currentUser, isAdmin, loading, navigate]);

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading authentication...</p>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      <div className={styles.authPrompt}>
        <div className={styles.authCard}>
          <h2>Admin Access Required</h2>
          <p>Please log in to access the admin panel.</p>
          <div className={styles.authButtons}>
            <button
              className={styles.loginButton}
              onClick={() => navigate("/auth/login?redirect=/admin")}
            >
              Login
            </button>
            <button
              className={styles.registerButton}
              onClick={() => navigate("/auth/register?redirect=/admin")}
            >
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't render admin panel if user is not admin
  if (!isAdmin) {
    return (
      <div className={styles.authPrompt}>
        <div className={styles.authCard}>
          <h2>Access Denied</h2>
          <p>You don't have admin privileges.</p>
          <p>Logged in as: {currentUser.email}</p>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={logout}
        currentUser={currentUser}
      />
      <main
        className={`${styles.mainContent} ${!sidebarOpen ? styles.sidebarClosed : ""}`}
      >
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Admin Dashboard</h1>
            <div className={styles.headerActions}>
              <div className={styles.userInfo}>
                <span>
                  Welcome, {currentUser.displayName || currentUser.email}
                </span>
              </div>
              <Button
                variant="secondary"
                size="small"
                onClick={() => navigate("/scoreboard")}
                style={{ marginRight: "10px" }}
              >
                Go to Notteknektene
              </Button>
              {onRefresh && (
                <Button variant="primary" size="small" onClick={onRefresh}>
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
