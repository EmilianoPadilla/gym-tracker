import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import ExerciseCard from "../components/ExerciseCard";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Today() {
  const { user, logout } = useAuth();
  const [exercises, setExercises] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  const jsDay = new Date().getDay(); // 0=Sunday
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // 0=Monday ... matches backend's day_of_week
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });

  async function load() {
    setLoading(true);
    try {
      const data = await api.getToday();
      setExercises(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6">
      <div className="flex justify-between items-start mb-1">
        <div>
          <h1 className="font-display text-4xl font-semibold">{DAYS[dayIndex]}</h1>
          <p className="text-chalkdim text-sm mt-1">
            {dateStr} &middot; {user?.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link to="/routine" className="text-sm text-chalkdim underline">
            Add/modify routine
          </Link>
          <button onClick={logout} className="text-sm text-chalkdim underline">
            Log out
          </button>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-chalkdim text-sm">Loading...</p>
        ) : !exercises || exercises.length === 0 ? (
          <div className="text-center py-10 text-chalkdim">
            <p>Nothing set for {DAYS[dayIndex]} yet.</p>
            <Link
              to="/routine"
              className="inline-block mt-4 rounded-lg bg-brass text-charcoal font-semibold px-4 py-2.5 text-sm"
            >
              Add/modify routine
            </Link>
          </div>
        ) : (
          exercises.map((ex) => <ExerciseCard key={ex.id} exercise={ex} onLogged={load} />)
        )}
      </div>
    </div>
  );
}
