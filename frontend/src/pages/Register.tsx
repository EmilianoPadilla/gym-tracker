import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function Register() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [last_name, setLast_Name] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(email, password, name, last_name);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <h1 className="font-display text-4xl font-semibold mb-1">{t("createAccount")}</h1>
          <p className="text-chalkdim text-sm mb-8">{t("createAccountSubtitle")}</p>

          <label className="block text-sm text-chalkdim mb-1">{t("name")} (nombre) </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mb-4 rounded-lg bg-panel border border-hairline px-3 py-2.5 text-chalk focus:outline-none focus:border-brass"
          />

          <label className="block text-sm text-chalkdim mb-1">{t("lastName")} (apellido)</label>
          <input
            required
            value={last_name}
            onChange={(e) => setLast_Name(e.target.value)}
            className="w-full mb-4 rounded-lg bg-panel border border-hairline px-3 py-2.5 text-chalk focus:outline-none focus:border-brass"
          />

          <label className="block text-sm text-chalkdim mb-1">{t("email")}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 rounded-lg bg-panel border border-hairline px-3 py-2.5 text-chalk focus:outline-none focus:border-brass"
          />

          <label className="block text-sm text-chalkdim mb-1">{t("password")}</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-2 rounded-lg bg-panel border border-hairline px-3 py-2.5 text-chalk focus:outline-none focus:border-brass"
          />

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 rounded-lg bg-brass text-charcoal font-semibold py-2.5 disabled:opacity-60"
          >
            {submitting ? t("creatingAccount") : t("createAccount")}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-hairline" />
          <span className="text-xs text-chalkdim">{t("orContinueWith")}</span>
          <div className="flex-1 h-px bg-hairline" />
        </div>
        <GoogleSignInButton />

        <p className="text-sm text-chalkdim mt-6 text-center">
          {t("alreadyHaveAccount")}{" "}
          <Link to="/login" className="text-brass underline">
            {t("logIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
