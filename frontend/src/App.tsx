import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { UnitsProvider } from "./units/UnitsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Today from "./pages/Today";
import Routine from "./pages/Routine";
import Settings from "./pages/Settings";
import BodyMetrics from "./pages/BodyMetrics";
import History from "./pages/History";
import Progress from "./pages/Progress";

export default function App() {
  return (
    <LanguageProvider>
      <UnitsProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Today />
                </ProtectedRoute>
              }
            />
            <Route
              path="/routine"
              element={
                <ProtectedRoute>
                  <Routine />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/body-metrics"
              element={
                <ProtectedRoute>
                  <BodyMetrics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      </UnitsProvider>
    </LanguageProvider>
  );
}
