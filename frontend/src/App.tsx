import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Today from "./pages/Today";
import Routine from "./pages/Routine";
import Settings from "./pages/Settings";
import BodyMetrics from "./pages/BodyMetrics";

export default function App() {
  return (
    <LanguageProvider>
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
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}
