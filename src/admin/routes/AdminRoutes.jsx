import React, { useState, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import AdminLayout from "../components/AdminLayout";

// Lazy load admin components
const Dashboard = lazy(() => import("../components/Dashboard/Dashboard"));
const UserManagement = lazy(
  () => import("../components/UserManagement/UserManagement")
);
const SeasonManagement = lazy(
  () => import("../components/SeasonManagement/SeasonManagement")
);
const GameManagement = lazy(
  () => import("../components/GameManagement/GameManagement")
);
const ScoreManagement = lazy(
  () => import("../components/ScoreManagement/ScoreManagement")
);
const LiveSchedule = lazy(
  () => import("../components/LiveSchedule/LiveSchedule")
);
const DatabaseMigration = lazy(
  () => import("../components/DatabaseMigration/DatabaseMigration")
);
// TestDashboard removed for production
const GameResultsViewer = lazy(
  () => import("../components/GameResultsViewer/GameResultsViewer")
);
const GameIdMismatchFixer = lazy(
  () => import("../components/GameIdMismatchFixer/GameIdMismatchFixer")
);
const SeasonIntegrityChecker = lazy(
  () => import("../components/SeasonIntegrityChecker/SeasonIntegrityChecker")
);
const SaveStateExample = lazy(
  () => import("../../components/SaveStateExample/SaveStateExample")
);

// Loading component for admin routes
const AdminLoadingSpinner = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "50vh",
      fontSize: "16px",
    }}
  >
    Loading admin panel...
  </div>
);

const AdminRoutes = () => {
  const location = useLocation();
  const [refreshFunction, setRefreshFunction] = useState(null);
  const { currentUser, isAdmin } = useAuth();

  // Check if user is authenticated and is admin
  if (!currentUser) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/nk" replace />;
  }

  return (
    <AdminLayout onRefresh={refreshFunction}>
      <Suspense fallback={<AdminLoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={<Dashboard setRefreshFunction={setRefreshFunction} />}
          />
          <Route path="users" element={<UserManagement />} />
          <Route path="seasons" element={<SeasonManagement />} />
          <Route path="games" element={<GameManagement />} />
          <Route path="scores" element={<ScoreManagement />} />
          <Route path="results" element={<GameResultsViewer />} />
          <Route path="schedule" element={<LiveSchedule />} />
          <Route path="migration" element={<DatabaseMigration />} />
          {/* TestDashboard route removed for production */}
          {/* Debug routes - only available in development */}
          {import.meta.env.DEV && (
            <>
              <Route path="fix-game-ids" element={<GameIdMismatchFixer />} />
              <Route
                path="season-integrity"
                element={<SeasonIntegrityChecker />}
              />
              <Route path="save-state-test" element={<SaveStateExample />} />
            </>
          )}

          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
};

export default AdminRoutes;
