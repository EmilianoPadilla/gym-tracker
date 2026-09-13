import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Incorrect email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="font-display text-4xl font-semibold mb-1">Welcome back</h1>
        <p className="text-chalkdim text-sm mb-8">Log in to keep your streaks going</p>

        <label className="block text-sm text-chalkdim mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 rounded-lg bg-panel border border-hairline px-3 py-2.5 text-chalk focus:outline-none focus:border-brass"
        />

        <label className="block text-sm text-chalkdim mb-1">Password</label>
        <input
          type="password"
          required
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
          {submitting ? "Logging in..." : "Log in"}
        </button>

        <p className="text-sm text-chalkdim mt-6 text-center">
          New here?{" "}
          <Link to="/register" className="text-brass underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
