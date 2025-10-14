import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import styles from "./AdminSidebar.module.css";

const AdminSidebar = ({ isOpen, onToggle, onLogout, currentUser }) => {
  const location = useLocation();

  const navItems = [
    {
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: "📊",
      description: "Overview and analytics",
    },
    {
      path: "/admin/users",
      label: "User Management",
      icon: "👥",
      description: "Manage participants",
    },
    {
      path: "/admin/seasons",
      label: "Season Control",
      icon: "🎯",
      description: "Season settings and status",
    },
    {
      path: "/admin/games",
      label: "Game Management",
      icon: "🎮",
      description: "Configure and schedule games",
    },
    {
      path: "/admin/scores",
      label: "Score Management",
      icon: "🏆",
      description: "Override and manage scores",
    },
    {
      path: "/admin/results",
      label: "Game Results",
      icon: "📈",
      description: "View detailed game results",
    },
    {
      path: "/admin/schedule",
      label: "Live Schedule",
      icon: "⏰",
      description: "Control game timing",
    },
    {
      path: "/admin/migration",
      label: "Database Migration",
      icon: "🔄",
      description: "Migrate to new structure",
    },
    {
      path: "/admin/testing",
      label: "Test Dashboard",
      icon: "🧪",
      description: "Comprehensive testing tools",
    },
    {
      path: "/admin/fix-game-ids",
      label: "Fix Game IDs",
      icon: "🔧",
      description: "Fix game ID mismatches",
    },
    {
      path: "/admin/season-integrity",
      label: "Season Integrity",
      icon: "🛡️",
      description: "Check and fix season integrity",
    },
  ];

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
    >
      <div className={styles.sidebarHeader}>
        <h2 className={styles.logo}>Admin Panel</h2>
        <button className={styles.toggleButton} onClick={onToggle}>
          {isOpen ? "◀" : "▶"}
        </button>
      </div>

      <nav className={styles.navigation}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            {isOpen && (
              <div className={styles.navContent}>
                <span className={styles.label}>{item.label}</span>
                <span className={styles.description}>{item.description}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        {isOpen && (
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {currentUser.displayName || currentUser.email}
              </span>
              <span className={styles.userRole}>Administrator</span>
            </div>
          </div>
        )}
        <button className={styles.logoutButton} onClick={onLogout}>
          <span className={styles.icon}>🚪</span>
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
