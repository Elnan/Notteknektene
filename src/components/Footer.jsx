import React from "react";
import styles from "./Footer.module.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.divider}>
        <div className={styles.dividermask}></div>
        <span>NK</span>
      </div>

      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <p className={styles.copyright}>© {currentYear} Notteknektene.</p>
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
          <p className={styles.footerText}>Olav Elnan</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
