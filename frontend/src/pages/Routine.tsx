import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import ExercisePicker from "../components/ExercisePicker";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Routine() {
  const jsDay = new Date().getDay();
  const [activeDay, setActiveDay] = useState(jsDay === 0 ? 6 : jsDay - 1);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getRoutine(activeDay);
      setExercises(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [activeDay]);

  async function handleAdd(name: string) {
    if (!name) return;
    await api.addExercise(name, activeDay, exercises.length);
    load();
  }

  async function handleRemove(id: number) {
    await api.deleteExercise(id);
    load();
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6">
      <div className="flex justify-between items-start mb-5">
        <h1 className="font-display text-3xl font-semibold">Add/modify routine</h1>
        <Link to="/" className="text-sm text-chalkdim underline">
          Back to today
        </Link>
      </div>

      <div className="flex gap-1.5 overflow-x-auto mb-5 pb-1">
        {DAYS.map((d, i) => (
          <button
            key={d}
            onClick={() => setActiveDay(i)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm border ${
              i === activeDay
                ? "bg-brass text-charcoal border-brass font-semibold"
                : "border-hairline text-chalkdim"
            }`}
          >
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      <ExercisePicker onAdd={handleAdd} />

      {loading ? (
        <p className="text-chalkdim text-sm">Loading...</p>
      ) : exercises.length === 0 ? (
        <p className="text-chalkdim text-sm text-center py-6">No exercises added for {DAYS[activeDay]} yet.</p>
      ) : (
        exercises.map((ex) => (
          <div key={ex.id} className="flex justify-between items-center py-3 border-t border-hairline first:border-t-0">
            <span>{ex.name}</span>
            <button onClick={() => handleRemove(ex.id)} className="text-chalkdim text-xl px-1">
              &times;
            </button>
          </div>
        ))
      )}
    </div>
  );
}
