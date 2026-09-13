import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Reorder, useDragControls } from "framer-motion";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import ExercisePicker from "../components/ExercisePicker";

const DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

type ExerciseItem = { id: number; name: string; day_of_week: number; order_index: number };

function DragHandleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="6" cy="4" r="1.4" fill="currentColor" />
      <circle cx="12" cy="4" r="1.4" fill="currentColor" />
      <circle cx="6" cy="9" r="1.4" fill="currentColor" />
      <circle cx="12" cy="9" r="1.4" fill="currentColor" />
      <circle cx="6" cy="14" r="1.4" fill="currentColor" />
      <circle cx="12" cy="14" r="1.4" fill="currentColor" />
    </svg>
  );
}

function ExerciseRow({
  ex,
  onRemove,
}: {
  ex: ExerciseItem;
  onRemove: (id: number) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={ex}
      dragListener={false}
      dragControls={controls}
      className="flex items-center justify-between py-3 border-t border-hairline first:border-t-0 bg-charcoal"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          onPointerDown={(e) => controls.start(e)}
          className="text-chalkdim cursor-grab active:cursor-grabbing touch-none flex-shrink-0 p-1"
        >
          <DragHandleIcon />
        </div>
        <span className="flex-1 min-w-0 truncate">{ex.name}</span>
      </div>
      <button onClick={() => onRemove(ex.id)} className="text-chalkdim text-xl px-2 flex-shrink-0" aria-label="Remove">
        &times;
      </button>
    </Reorder.Item>
  );
}

export default function Routine() {
  const { language, t } = useLanguage();
  const DAYS = language === "es" ? DAYS_ES : DAYS_EN;
  const jsDay = new Date().getDay();
  const [activeDay, setActiveDay] = useState(jsDay === 0 ? 6 : jsDay - 1);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
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

  // Called by Reorder.Group whenever a drag finishes with a new order.
  // We persist every item's new order_index in the background - cheap since
  // routines are short lists, and it keeps the UI feeling instant.
  async function handleReorder(newOrder: ExerciseItem[]) {
    setExercises(newOrder);
    await Promise.all(
      newOrder.map((ex, i) =>
        ex.order_index === i ? null : api.updateExerciseOrder(ex.id, i)
      )
    );
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
          <p className="text-xs text-chalkdim mt-2 mb-1">{t("dragToReorder")}</p>
          <Reorder.Group axis="y" values={exercises} onReorder={handleReorder}>
            {exercises.map((ex) => (
              <ExerciseRow key={ex.id} ex={ex} onRemove={handleRemove} />
            ))}
          </Reorder.Group>
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
