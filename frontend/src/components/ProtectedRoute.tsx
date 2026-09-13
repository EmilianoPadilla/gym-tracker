import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Checking the saved token against the backend - brief, avoids a login-screen flash
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-chalkdim text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
