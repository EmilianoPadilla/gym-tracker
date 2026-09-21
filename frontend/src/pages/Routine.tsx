import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BackToStartLink from "../components/BackToStartLink";
import { Reorder, useDragControls } from "framer-motion";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import type { TranslationKey } from "../i18n/translations";
import { useUnits } from "../units/UnitsContext";
import ExercisePicker from "../components/ExercisePicker";
import MarqueeText from "../components/MarqueeText";
import { getExerciseImage } from "../data/exerciseLibrary";

const DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAYS_PLURAL_EN = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
const DAYS_PLURAL_ES = [
  "los lunes",
  "los martes",
  "los miércoles",
  "los jueves",
  "los viernes",
  "los sábados",
  "los domingos",
];

type ExerciseItem = {
  id: number;
  name: string;
  day_of_week: number;
  order_index: number;
  preferred_unit: "kg" | "lbs";
  custom_image: string | null;
  rest_seconds: number | null;
};

const REST_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240];

function formatRest(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}:00` : `${m}:${s.toString().padStart(2, "0")}`;
}

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

const LONG_PRESS_MS = 400;
const MOVE_CANCEL_THRESHOLD = 10; // px of movement before the hold is treated as a scroll, not a drag

function ExerciseRow({
  ex,
  onRemove,
  onToggleUnit,
  onRestChange,
  t,
}: {
  ex: ExerciseItem;
  onRemove: (id: number) => void;
  onToggleUnit: (id: number, unit: "kg" | "lbs") => void;
  onRestChange: (id: number, restSeconds: number) => void;
  t: (key: TranslationKey) => string;
}) {
  const controls = useDragControls();
  const image = ex.custom_image || getExerciseImage(ex.name);
  const [pressing, setPressing] = useState(false);

  // Holding still for LONG_PRESS_MS starts the drag. Scrolling past the app
  // normally cancels it immediately (real finger movement), so a quick swipe
  // through the list to scroll no longer gets mistaken for a reorder.
  function handlePointerDown(e: React.PointerEvent) {
    const startX = e.clientX;
    const startY = e.clientY;
    const nativeEvent = e.nativeEvent;
    let cancelled = false;

    function cleanup() {
      cancelled = true;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      setPressing(false);
    }

    function handleMove(ev: PointerEvent) {
      if (Math.abs(ev.clientX - startX) > MOVE_CANCEL_THRESHOLD || Math.abs(ev.clientY - startY) > MOVE_CANCEL_THRESHOLD) {
        cleanup();
      }
    }

    function handleUp() {
      cleanup();
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    setPressing(true);

    setTimeout(() => {
      if (cancelled) return;
      cleanup();
      controls.start(nativeEvent);
    }, LONG_PRESS_MS);
  }

  return (
    <Reorder.Item
      value={ex}
      dragListener={false}
      dragControls={controls}
      className={`py-3 border-t border-hairline first:border-t-0 bg-charcoal select-none transition-colors ${
        pressing ? "bg-panelraised" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Hold anywhere in this area (icon, image, name) for a moment to start
            dragging - only the unit toggle and remove button, outside this
            container, are excluded. Normal scrolling still works everywhere else. */}
        <div
          onPointerDown={handlePointerDown}
          style={{ touchAction: "pan-y" }}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-grab active:cursor-grabbing"
        >
          <div className="text-chalkdim flex-shrink-0 p-1">
            <DragHandleIcon />
          </div>
          <div className="w-8 h-8 rounded-md bg-panel border border-hairline flex-shrink-0 flex items-center justify-center text-xs text-chalkdim overflow-hidden">
            {image ? (
              <img src={image} alt="" className="w-full h-full object-cover" />
            ) : (
              ex.name[0]?.toUpperCase()
            )}
          </div>
          <MarqueeText text={ex.name} className="flex-1 min-w-0" />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggleUnit(ex.id, ex.preferred_unit === "kg" ? "lbs" : "kg")}
            className="text-sm px-3 py-1.5 rounded-lg bg-panelraised border border-brasslight text-chalk font-semibold min-w-[46px]"
          >
            {ex.preferred_unit}
          </button>
          <button onClick={() => onRemove(ex.id)} className="text-chalkdim text-xl px-1" aria-label="Remove">
            &times;
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 pl-11">
        <span className="text-xs text-chalkdim flex-shrink-0">{t("restBetweenSets")}:</span>
        <select
          value={ex.rest_seconds ?? ""}
          onChange={(e) => onRestChange(ex.id, parseInt(e.target.value))}
          className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-panelraised border border-brasslight text-chalk"
        >
          <option value="" disabled>
            --:--
          </option>
          {REST_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {formatRest(s)}
            </option>
          ))}
        </select>
      </div>
    </Reorder.Item>
  );
}

export default function Routine() {
  const { language, t } = useLanguage();
  const { unit: defaultUnit } = useUnits();
  const DAYS = language === "es" ? DAYS_ES : DAYS_EN;
  const jsDay = new Date().getDay();
  const [searchParams] = useSearchParams();
  const dayFromUrl = searchParams.get("day");
  const [activeDay, setActiveDay] = useState(
    dayFromUrl !== null ? parseInt(dayFromUrl) : jsDay === 0 ? 6 : jsDay - 1
  );
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayLabel, setDayLabel] = useState("");
  const [isRestDay, setIsRestDay] = useState(false);
  const [labelSaved, setLabelSaved] = useState(true);

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
    api.getDayLabels().then((rows: { day_of_week: number; label: string; is_rest_day: boolean }[]) => {
      const match = rows.find((r) => r.day_of_week === activeDay);
      setDayLabel(match?.label ?? "");
      setIsRestDay(match?.is_rest_day ?? false);
      setLabelSaved(true);
    });
  }, [activeDay]);

  async function handleSaveLabel(overrideRestDay?: boolean) {
    await api.setDayLabel(activeDay, dayLabel, overrideRestDay ?? isRestDay);
    setLabelSaved(true);
  }

  async function handleToggleRestDay() {
    const newValue = !isRestDay;
    setIsRestDay(newValue);
    await api.setDayLabel(activeDay, dayLabel, newValue);
  }

  async function handleAdd(name: string) {
    if (!name) return;
    await api.addExercise(name, activeDay, exercises.length, defaultUnit);
    load();
  }

  async function handleToggleUnit(id: number, unit: "kg" | "lbs") {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, preferred_unit: unit } : ex)));
    await api.updateExerciseUnit(id, unit);
  }

  async function handleRestChange(id: number, restSeconds: number) {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, rest_seconds: restSeconds } : ex)));
    await api.updateExerciseRest(id, restSeconds);
  }

  async function handleRemove(id: number) {
    await api.deleteExercise(id);
    load();
  }

  async function handleReorder(newOrder: ExerciseItem[]) {
    setExercises(newOrder);
    await Promise.all(
      newOrder.map((ex, i) => (ex.order_index === i ? null : api.updateExerciseOrder(ex.id, i)))
    );
  }

  const DAYS_PLURAL = language === "es" ? DAYS_PLURAL_ES : DAYS_PLURAL_EN;
  const routineTitle =
    language === "es" ? `Modificar rutina de ${DAYS_PLURAL[activeDay]}` : `Edit routine for ${DAYS_PLURAL[activeDay]}`;

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6 flex flex-col">
      <div className="flex justify-between items-start mb-5">
        <h1 className="font-display text-2xl font-semibold">{routineTitle}</h1>
        <BackToStartLink />
      </div>

      <div className="flex gap-1 overflow-x-auto mb-5 pb-1">
        {DAYS.map((d, i) => (
          <button
            key={d}
            onClick={() => setActiveDay(i)}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-full text-sm border ${
              i === activeDay
                ? "bg-brass text-chalk border-brass font-semibold"
                : "border-hairline text-chalkdim"
            }`}
          >
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 mb-5 text-sm text-chalkdim cursor-pointer">
        <input
          type="checkbox"
          checked={isRestDay}
          onChange={handleToggleRestDay}
          className="w-4 h-4 accent-brasslight"
        />
        {t("restDay")}
      </label>

      <p className="text-sm font-semibold mb-1.5">{t("nameThisDayLabel")}</p>
      <div className="flex gap-2 mb-5">
        <input
          value={dayLabel}
          onChange={(e) => {
            setDayLabel(e.target.value);
            setLabelSaved(false);
          }}
          onBlur={() => !labelSaved && handleSaveLabel()}
          placeholder={t("nameThisDay")}
          className="flex-1 rounded-lg bg-panel border border-hairline px-3 py-2 text-sm text-chalk focus:outline-none focus:border-brasslight"
        />
      </div>

      <div className="flex-1">
        {isRestDay ? (
          <p className="text-chalkdim text-sm text-center py-8">{t("restDayNoExercisesNeeded")}</p>
        ) : (
          <>
            <p className="text-sm font-semibold mb-1.5">{t("addYourExercisesLabel")}</p>
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
                    <ExerciseRow
                      key={ex.id}
                      ex={ex}
                      onRemove={handleRemove}
                      onToggleUnit={handleToggleUnit}
                      onRestChange={handleRestChange}
                      t={t}
                    />
                  ))}
                </Reorder.Group>
              </>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-chalkdim text-center mt-8 pb-2">
        Pictures by{" "}
        <a href="https://repdb.co" target="_blank" rel="noreferrer" className="underline">
          RepDB
        </a>
      </p>
    </div>
  );
}
