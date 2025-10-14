import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import { TaskProvider } from "./context/TaskContext";
import { SaveStateProvider } from "./context/SaveStateContext";
import "./styles.css";

// Debug utilities removed to clean up console output

// Lazy load components
const Login = lazy(() => import("./components/auth/Login"));
const Register = lazy(() => import("./components/auth/Register"));
const MainRoutes = lazy(() => import("./components/MainRoutes"));
const AdminRoutes = lazy(() => import("./admin/routes/AdminRoutes"));

// Loading component
const LoadingSpinner = () => <div className="loading">Loading...</div>;

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <TaskProvider>
          <SaveStateProvider>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Redirect root to scoreboard */}
                <Route
                  path="/"
                  element={<Navigate to="/scoreboard" replace />}
                />

                {/* Authentication routes */}
                <Route
                  path="/auth/*"
                  element={
                    <Routes>
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />
                      <Route
                        path="*"
                        element={<Navigate to="/auth/login" replace />}
                      />
                    </Routes>
                  }
                />

                {/* Main game routes */}
                <Route path="/*" element={<MainRoutes />} />

                {/* Admin routes */}
                <Route path="/admin/*" element={<AdminRoutes />} />

                {/* Catch all - redirect to scoreboard */}
                <Route
                  path="*"
                  element={<Navigate to="/scoreboard" replace />}
                />
              </Routes>
            </Suspense>
          </SaveStateProvider>
        </TaskProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
