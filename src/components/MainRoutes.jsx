import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import MainLayout from "./MainLayout";

// Lazy load main components
const MainPage = lazy(() => import("./MainPage"));
const ScoreboardPage = lazy(() => import("./ScoreboardPage"));
const Rules = lazy(() => import("./Rules/Rules"));

// Loading component for main routes
const MainLoadingSpinner = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "50vh",
      fontSize: "16px",
    }}
  >
    Loading game...
  </div>
);

const MainRoutes = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <Suspense fallback={<MainLoadingSpinner />}>
      <Routes>
        {/* Everything under MainLayout keeps header + progressbar alive */}
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/scoreboard" replace />} />
          <Route path="/scoreboard" element={<ScoreboardPage />} />
          <Route path="/games" element={<MainPage />} />
          <Route path="/games/:gameId" element={<MainPage />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="*" element={<Navigate to="/scoreboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default MainRoutes;
