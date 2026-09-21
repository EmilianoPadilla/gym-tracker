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

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
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
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-hairline bg-white text-[#1F1F1F] font-medium py-2.5 disabled:opacity-60"
        >
          {status === "loading" ? (
            "..."
          ) : (
            <>
              <GoogleLogo />
              <span>Sign in with Google</span>
            </>
          )}
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
