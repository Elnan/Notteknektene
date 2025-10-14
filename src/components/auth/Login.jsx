import React, { useState, useEffect } from "react";
import { useNavigate, Navigate, Link, useSearchParams } from "react-router-dom";
import {
  notteknekteneAuth,
  notteknekteneDb,
} from "../../firebase/firebase-config-notteknektene.js";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { useAuth } from "../../context/authContext";
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/scoreboard";

  useEffect(() => {
    const inputs = document.querySelectorAll(`.${styles.formInput}`);
    inputs.forEach((input) => {
      input.addEventListener("input", handleInput);
      if (input.value) {
        input.classList.add(styles.hasText);
      }
    });

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener("input", handleInput);
      });
    };
  }, []);

  const handleInput = (e) => {
    if (e.target.value) {
      e.target.classList.add(styles.hasText);
    } else {
      e.target.classList.remove(styles.hasText);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsSigningIn(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(notteknekteneAuth, email, password);
      navigate(redirectTo);
    } catch (error) {
      setError("Invalid email or password");
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      const result = await signInWithPopup(
        notteknekteneAuth,
        new GoogleAuthProvider()
      );
      const user = result.user;

      // Check if user document exists, if not create it
      const userDocRef = doc(notteknekteneDb, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          Participating: false,
        });
      }

      navigate(redirectTo);
    } catch (error) {
      setError("Google sign-in failed. Please try again.");
      setIsSigningIn(false);
    }
  };

  if (currentUser) {
    return <Navigate to={redirectTo} />;
  }

  return (
    <div className={styles.loginWrapper}>
      <Link to="/" className={styles.backButton}>
        <IoArrowBackCircleOutline />
      </Link>
      <div className={styles.loginContainer}>
        <h2 className={styles.loginTitle}>Logg inn</h2>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSigningIn}
          className={styles.googleSigninButton}
        >
          <img
            src="/LogoGoogle.webp"
            alt="Google"
            className={styles.googleIcon}
          />
          {isSigningIn ? "Logger inn..." : "Fortsett med Google"}
        </button>

        <div className={styles.separator}>
          <div className={styles.separatorLine}></div>
          <span className={styles.separatorText}>eller</span>
          <div className={styles.separatorLine}></div>
        </div>

        {/* Email/Password Form */}
        <form className={styles.loginForm} onSubmit={handleEmailLogin}>
          <div className={styles.formGroup}>
            <input
              type="email"
              id="email"
              className={styles.formInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder=""
            />
            <label className={styles.formLabel} htmlFor="email">
              Epost
            </label>
          </div>
          <div className={styles.formGroup}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.formInput}
              placeholder=""
            />
            <label className={styles.formLabel}>Passord</label>
          </div>
          {error && <div className={styles.errorMessage}>{error}</div>}
          <button
            type="submit"
            disabled={isSigningIn}
            className={`${styles.submitButton} ${isSigningIn ? styles.buttonDisabled : ""}`}
          >
            {isSigningIn ? "Logger inn..." : "Logg inn"}
          </button>
        </form>

        <div className={styles.textCenter}>
          <p>
            Har du ikke bruker?{" "}
            <Link to="/auth/register" className={styles.registerLink}>
              Registrer deg her
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
