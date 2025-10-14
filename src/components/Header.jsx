import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import { FaListOl, FaChartBar, FaBook, FaCog, FaUser } from "react-icons/fa";
import Button from "./Button";
import { useAuth } from "../context/authContext";
import AvatarSelector from "./AvatarSelector";

// Component for countdown timer
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();

      // Find the next Sunday at 23:59
      const nextSunday = new Date(now);
      const daysUntilSunday = (7 - now.getDay()) % 7;

      if (daysUntilSunday === 0) {
        // Today is Sunday, check if it's before 23:59
        if (
          now.getHours() < 23 ||
          (now.getHours() === 23 && now.getMinutes() < 59)
        ) {
          // Still time left today
          nextSunday.setHours(23, 59, 59, 999);
        } else {
          // Move to next Sunday
          nextSunday.setDate(nextSunday.getDate() + 7);
          nextSunday.setHours(23, 59, 59, 999);
        }
      } else {
        // Move to next Sunday
        nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
        nextSunday.setHours(23, 59, 59, 999);
      }

      const timeDiff = nextSunday - now;

      if (timeDiff <= 0) {
        return "Deadline passed";
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else {
        return `${minutes}m ${seconds}s`;
      }
    };

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft());
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.countdown}>
      <div className={styles.countdownLabel}>Deadline:</div>
      <div className={styles.countdownTime}>{timeLeft}</div>
    </div>
  );
};

const AVATAR_SIZE = 40;
const CARET_WIDTH = 16;
const DROPDOWN_TOP = 48;

const Header = () => {
  const [dropdownShouldOpen, setDropdownShouldOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [caretLeft, setCaretLeft] = useState(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const avatarRef = useRef(null);
  const dropdownRef = useRef(null);
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Helper to recalculate caret position
  const updateCaretPosition = useCallback(() => {
    if (avatarRef.current && dropdownRef.current) {
      const avatarRect = avatarRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const avatarCenter = avatarRect.left + avatarRect.width / 2;
      const dropdownLeft = dropdownRect.left;
      const caretPosition = avatarCenter - dropdownLeft - CARET_WIDTH / 2;
      setCaretLeft(
        Math.max(0, Math.min(caretPosition, dropdownRect.width - CARET_WIDTH))
      );
    }
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
      setDropdownShouldOpen(false);
      setCaretLeft(null);
      navigate("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // When dropdownShouldOpen is set, render the dropdown hidden, measure, then show
  useLayoutEffect(() => {
    if (dropdownShouldOpen && !showDropdown) {
      setDropdownVisible(true);
    }
  }, [dropdownShouldOpen, showDropdown]);

  // When dropdown is rendered (even hidden), measure and then show
  useLayoutEffect(() => {
    if (dropdownVisible && dropdownShouldOpen && !showDropdown) {
      updateCaretPosition();
      setShowDropdown(true);
    }
  }, [dropdownVisible, dropdownShouldOpen, showDropdown, updateCaretPosition]);

  // When dropdown is open, update caret position on resize/resize observer
  useEffect(() => {
    if (!showDropdown) return;
    const handleResize = () => {
      updateCaretPosition();
    };
    window.addEventListener("resize", handleResize);
    let resizeObserver;
    if (window.ResizeObserver && avatarRef.current && dropdownRef.current) {
      resizeObserver = new window.ResizeObserver(() => {
        updateCaretPosition();
      });
      resizeObserver.observe(avatarRef.current);
      resizeObserver.observe(dropdownRef.current);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [showDropdown, updateCaretPosition]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!showDropdown) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
        setDropdownShouldOpen(false);
        setCaretLeft(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDropdown]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
        setDropdownShouldOpen(false);
        setCaretLeft(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDropdown]);

  // Hide dropdown after animation out
  useEffect(() => {
    if (!showDropdown && dropdownVisible) {
      const timeout = setTimeout(() => setDropdownVisible(false), 320);
      return () => clearTimeout(timeout);
    }
  }, [showDropdown, dropdownVisible]);

  // Handler for avatar click
  const handleAvatarClick = () => {
    if (!showDropdown && !dropdownShouldOpen) {
      setDropdownShouldOpen(true);
    } else {
      setShowDropdown(false);
      setDropdownShouldOpen(false);
      setCaretLeft(null);
    }
  };

  // Handler for avatar selection
  const handleAvatarSelected = (newAvatar) => {
    // The avatar will be updated in the auth context automatically
    // since we're updating the user document in Firebase
  };

  // Handler for opening avatar selector
  const handleOpenAvatarSelector = () => {
    setShowDropdown(false);
    setDropdownShouldOpen(false);
    setCaretLeft(null);
    setShowAvatarSelector(true);
  };

  return (
    <header className={styles.header}>
      {/* Left: Navigation Links (icon+text on mobile) */}
      <nav className={styles.nav}>
        <Link to="/scoreboard" className={styles.navLink}>
          <FaListOl className={styles.icon} />
          <span className={styles.linkText}>Table</span>
        </Link>
        <Link to="/rules" className={styles.navLink}>
          <FaBook className={styles.icon} />
          <span className={styles.linkText}>Rules</span>
        </Link>
      </nav>
      {/* Center: Title (shorten to 'NK' on mobile) */}
      <div className={styles.title}>
        <span className={styles.fullTitle}>Nøtteknektene</span>
        <span className={styles.shortTitle}>NK</span>
      </div>
      {/* Countdown Timer */}
      <CountdownTimer />
      {/* Right: Account Management */}
      <div className={styles.account}>
        {/* Avatar triggers dropdown */}
        <img
          ref={avatarRef}
          src={
            currentUser?.avatar
              ? `/avatars/${currentUser.avatar}`
              : "/defaultAvatar.webp"
          }
          alt="User avatar"
          className={styles.avatar}
          onClick={handleAvatarClick}
        />
        {dropdownVisible && (
          <div
            ref={dropdownRef}
            className={
              showDropdown
                ? styles.dropdown
                : `${styles.dropdown} ${styles.dropdownHidden}`
            }
            style={
              !showDropdown
                ? { visibility: "hidden", pointerEvents: "none" }
                : {}
            }
          >
            {/* Caret/triangle */}
            <div
              className={styles.caret}
              style={{ "--caret-left": `${caretLeft ?? 0}px` }}
            />
            <button
              className={styles.dropdownItem}
              onClick={handleOpenAvatarSelector}
            >
              <FaUser className={styles.icon} />
              <span>Change Avatar</span>
            </button>
            {isAdmin && (
              <Link to="/admin/dashboard" className={styles.adminLink}>
                <FaCog className={styles.icon} />
                <span>Admin Panel</span>
              </Link>
            )}
            <Button variant="logout" size="small" onClick={handleLogout}>
              Logg ut
            </Button>
          </div>
        )}
      </div>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onAvatarSelected={handleAvatarSelected}
      />
    </header>
  );
};

export default Header;
