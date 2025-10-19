import React from "react";
import styles from "./Footer.module.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.divider}>
        <div className={styles.dividermask}></div>
        <span className={styles.logoContainer}>
          <span className={styles.logoText}>NK</span>
          <img
            src="/NK_ishihara.png"
            alt="NK Ishihara"
            className={styles.logoImage}
          />
        </span>
      </div>

      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <p className={styles.copyright}>© {currentYear} Notteknektene</p>
        </div>
        <div className={styles.footerSection}>
          <div className={styles.footerLinks}>
            <a
              href="https://olavelnan.no"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Homepage
            </a>
            <a
              href="https://github.com/elnan"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              GitHub
            </a>
            <a
              href="https://instagram.com/oelnan"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Instagram
            </a>
          </div>
        </div>
        <div className={styles.footerSection}>
          <div className={styles.authorInfo}>
            <div className={styles.authorText}>
              <div className={styles.authorWithBadge}>
                <img
                  src="/NK_army_badge_colored.svg"
                  alt="NK Army Badge"
                  className={styles.armyBadge}
                />
                <p className={styles.authorName}>Olav Elnan</p>
              </div>
              <p className={styles.authorTitle}>Der Nussführer</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
