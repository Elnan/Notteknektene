import { onAuthStateChanged, signOut } from "firebase/auth";
import React, { useContext, useEffect, useState } from "react";
import { notteknekteneAuth } from "../../firebase/firebase-config-notteknektene.js";
import { createUserProfileDocument } from "../../firebase/notteknektene-firebase-utils";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshUserData = async (user) => {
    if (user) {
      const userDoc = await getDoc(
        doc(getFirestore(notteknekteneAuth.app), "users", user.uid)
      );
      setCurrentUser({ ...user, ...userDoc.data() });
      // Check if user is admin (either by email or admin flag)
      const adminEmail =
        import.meta.env.VITE_ADMIN_EMAIL || "olavelnan@gmail.com";
      const userData = userDoc.data();
      const isAdminUser =
        user.email === adminEmail || userData?.isAdmin === true;
      setIsAdmin(isAdminUser);
    }
  };

  useEffect(() => {
    let roundTableManagerCleanup = null;

    const unsubscribe = onAuthStateChanged(notteknekteneAuth, async (user) => {
      if (user) {
        await createUserProfileDocument(user);
        await refreshUserData(user);
        setUserLoggedIn(true);

        // Initialize round table manager for automatic game updates
        try {
          const { initializeRoundTableManager } = await import(
            "../../utils/roundTableManager.js"
          );
          roundTableManagerCleanup = initializeRoundTableManager();
          console.log(
            "✅ Round Table Manager initialized for automatic game updates"
          );
        } catch (error) {
          console.error("❌ Failed to initialize Round Table Manager:", error);
        }
      } else {
        setCurrentUser(null);
        setUserLoggedIn(false);
        setIsAdmin(false);

        // Clean up round table manager when user logs out
        if (roundTableManagerCleanup) {
          roundTableManagerCleanup();
          roundTableManagerCleanup = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (roundTableManagerCleanup) {
        roundTableManagerCleanup();
      }
    };
  }, []);

  async function logout() {
    await signOut(notteknekteneAuth);
    setCurrentUser(null);
    setUserLoggedIn(false);
    setIsAdmin(false);
  }

  const value = {
    currentUser,
    userLoggedIn,
    isAdmin,
    loading,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
