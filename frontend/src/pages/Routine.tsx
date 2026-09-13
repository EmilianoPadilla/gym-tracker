import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import ExercisePicker from "../components/ExercisePicker";

const DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function Routine() {
  const { language, t } = useLanguage();
  const DAYS = language === "es" ? DAYS_ES : DAYS_EN;
  const jsDay = new Date().getDay();
  const [activeDay, setActiveDay] = useState(jsDay === 0 ? 6 : jsDay - 1);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);

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

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= exercises.length) return;

    const current = exercises[index];
    const target = exercises[targetIndex];

    const reordered = [...exercises];
    reordered[index] = target;
    reordered[targetIndex] = current;
    setExercises(reordered);
    setReordering(true);

    try {
      await Promise.all([
        api.updateExerciseOrder(current.id, target.order_index),
        api.updateExerciseOrder(target.id, current.order_index),
      ]);
      await load();
    } finally {
      setReordering(false);
    }
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6">
      <div className="flex justify-between items-start mb-5">
        <h1 className="font-display text-3xl font-semibold">{t("addModifyRoutine")}</h1>
        <Link to="/" className="text-sm text-chalkdim underline">
          {t("backToToday")}
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
        <p className="text-chalkdim text-sm text-center py-6">
          {t("noExercisesFor")} {DAYS[activeDay]}.
        </p>
      ) : (
        <>
          <p className="text-xs text-chalkdim mt-2 mb-1">{t("useArrowsToReorder")}</p>
          {exercises.map((ex, i) => (
            <div
              key={ex.id}
              className="flex items-center justify-between py-3 border-t border-hairline first:border-t-0"
            >
              <span className="flex-1 min-w-0 truncate">{ex.name}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleMove(i, -1)}
                  disabled={i === 0 || reordering}
                  className="w-8 h-8 rounded-lg border border-hairline text-chalkdim disabled:opacity-30 flex items-center justify-center"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMove(i, 1)}
                  disabled={i === exercises.length - 1 || reordering}
                  className="w-8 h-8 rounded-lg border border-hairline text-chalkdim disabled:opacity-30 flex items-center justify-center"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => handleRemove(ex.id)}
                  className="text-chalkdim text-xl px-2"
                  aria-label="Remove"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      <p className="text-xs text-chalkdim text-center mt-8">
        Exercise data by{" "}
        <a href="https://repdb.co" target="_blank" rel="noreferrer" className="underline">
          RepDB
        </a>
      </p>
    </div>
  );
}
