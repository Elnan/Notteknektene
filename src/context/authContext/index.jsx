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
      
      // Debug logging (remove after fixing)
      if (import.meta.env.DEV) {
        console.log("🔍 Admin Check Debug:", {
          userEmail: user.email,
          adminEmail: adminEmail,
          userData: userData,
          isAdminFlag: userData?.isAdmin,
          emailMatch: user.email === adminEmail,
          isAdminUser: isAdminUser
        });
      }
      
      setIsAdmin(isAdminUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(notteknekteneAuth, async (user) => {
      if (user) {
        await createUserProfileDocument(user);
        await refreshUserData(user);
        setUserLoggedIn(true);
      } else {
        setCurrentUser(null);
        setUserLoggedIn(false);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
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
