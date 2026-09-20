import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const isNative = Capacitor.isNativePlatform();

export default function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  // Web/PWA path: Google's JS SDK renders its own button and calls back with
  // an ID token. This does NOT work inside the installed app's embedded
  // WebView - Google blocks sign-in flows there for security, showing a
  // blank page instead. That's what the native branch below is for.
  useEffect(() => {
    if (isNative || !GOOGLE_CLIENT_ID) return;

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

  // Native app path: uses the real native Google Sign-In SDK (Credential
  // Manager on Android, Google Sign-In SDK on iOS) instead of JavaScript
  // embedded in the WebView, since Google disallows the latter.
  useEffect(() => {
    if (!isNative || !GOOGLE_CLIENT_ID) return;
    GoogleSignIn.initialize({ clientId: GOOGLE_CLIENT_ID }).catch(() => {
      // Initialization failing here surfaces as a sign-in error when tapped
    });
  }, []);

  async function handleNativeSignIn() {
    setStatus("loading");
    try {
      const result = await GoogleSignIn.signIn();
      await loginWithGoogle(result.idToken);
      navigate("/");
    } catch {
      setStatus("error");
    }
  }

  if (!GOOGLE_CLIENT_ID) return null;

  if (isNative) {
    return (
      <div>
        <button
          onClick={handleNativeSignIn}
          disabled={status === "loading"}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-hairline bg-panel text-chalk font-medium py-2.5 disabled:opacity-60"
        >
          {status === "loading" ? "..." : "Sign in with Google"}
        </button>
        {status === "error" && (
          <p className="text-center text-sm text-red-400 mt-3">Something went wrong. Please try again.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div ref={buttonRef} className="flex justify-center" style={{ opacity: status === "loading" ? 0.4 : 1 }} />
      {status === "loading" && (
        <p className="text-center text-sm text-chalkdim mt-3">
          Signing in - this can take up to a minute if the server was asleep...
        </p>
      )}
      {status === "error" && (
        <p className="text-center text-sm text-red-400 mt-3">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}
