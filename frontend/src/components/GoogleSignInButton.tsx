import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return; // not configured yet - button just won't render

    function renderButton() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          setStatus("loading");
          try {
            await loginWithGoogle(response.credential);
            navigate("/");
          } catch {
            setStatus("error");
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
      });
    }

    // The Google script is loaded globally in index.html; it may not be ready yet
    if (window.google) {
      renderButton();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          renderButton();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loginWithGoogle, navigate]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div>
      <div ref={buttonRef} className="flex justify-center" style={{ opacity: status === "loading" ? 0.4 : 1 }} />
      {status === "loading" && (
        <p className="text-center text-sm text-chalkdim mt-3">
          Signing in - this can take up to a minute if the server was asleep...
        </p>
      )}
      {status === "error" && (
        <p className="text-center text-sm text-red-400 mt-3">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
