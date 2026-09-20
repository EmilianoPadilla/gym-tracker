import { useState, useRef, useEffect } from "react";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import { kgToUnit, unitToKg, type Unit } from "../units/UnitsContext";
import { getExerciseImage } from "../data/exerciseLibrary";
import { primeAudioContext, playDoubleBeep } from "../lib/beep";
import { scheduleRestNotification, cancelRestNotification } from "../lib/nativeTimer";
import MarqueeText from "./MarqueeText";

type LogEntry = { id: number; date: string; weight: number; reps: number | null; sets: number | null };

type ExerciseWithStreak = {
  id: number;
  name: string;
  preferred_unit: Unit;
  custom_image: string | null;
  rest_seconds: number | null;
  latest_weight: number | null;
  latest_date: string | null;
  streak: number;
  history: LogEntry[];
};

type ColoredEntry = LogEntry & { color: "green" | "orange" | "red" };

// Streak coloring is computed on the raw (kg) values stored on the backend -
// unit conversion is purely a display concern and must never affect whether
// two logged weights count as "the same weight" for progressive overload.
function colorHistory(history: LogEntry[]): ColoredEntry[] {
  const chronological = [...history].sort((a, b) => a.date.localeCompare(b.date));
  let runWeight: number | null = null;
  let runCount = 0;
  const colored: ColoredEntry[] = chronological.map((entry) => {
    if (entry.weight === runWeight) {
      runCount += 1;
    } else {
      runWeight = entry.weight;
      runCount = 1;
    }
    const color = runCount === 1 ? "green" : runCount === 2 ? "orange" : "red";
    return { ...entry, color };
  });
  return colored.reverse();
}

const colorClasses: Record<ColoredEntry["color"], string> = {
  green: "text-[#8FC97A]",
  orange: "text-[#E29B57]",
  red: "text-[#E37568]",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtDate(d: string, language: string, todayLabel: string): string {
  const dateObj = new Date(d + "T00:00:00");
  const todayISO = new Date().toLocaleDateString("en-CA");
  const weekday = capitalize(
    dateObj.toLocaleDateString(language === "es" ? "es-ES" : "en-US", { weekday: "short" })
  );
  const weekdayDay = `${weekday} ${dateObj.getDate()}`;
  return d === todayISO ? `${todayLabel}, ${weekdayDay}` : weekdayDay;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ExerciseCard({
  exercise,
  onSaved,
  inputRef,
  logDate,
}: {
  exercise: ExerciseWithStreak;
  onSaved: () => void;
  inputRef?: (el: HTMLInputElement | null) => void;
  logDate?: string;
}) {
  const { t, language } = useLanguage();
  const unit = exercise.preferred_unit;
  const entryForViewedDate = logDate ? exercise.history.find((h) => h.date === logDate) : undefined;
  const initialWeightKg = entryForViewedDate?.weight ?? exercise.latest_weight;
  const [weight, setWeight] = useState(
    initialWeightKg != null ? kgToUnit(initialWeightKg, unit).toString() : ""
  );
  const [saving, setSaving] = useState(false);
  const image = exercise.custom_image || getExerciseImage(exercise.name);

  const restDuration = exercise.rest_seconds ?? 90; // sensible default if never set
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleSave() {
    const displayValue = parseFloat(weight);
    if (!displayValue || displayValue <= 0) return;
    setSaving(true);
    try {
      await api.addLog(exercise.id, unitToKg(displayValue, unit), undefined, undefined, logDate);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  function startTimer() {
    primeAudioContext(); // unlocks audio now, during the real user tap, for the beep later
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(restDuration);
    scheduleRestNotification(exercise.id, restDuration, t("restComplete"), exercise.name);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          playDoubleBeep();
          setTimeout(() => setSecondsLeft(null), 1200); // briefly show 0:00, then reset
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancelTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setSecondsLeft(null);
    cancelRestNotification(exercise.id);
  }

  const coloredHistory = colorHistory(exercise.history);
  const hasHistory = coloredHistory.length > 0;
  const timerRunning = secondsLeft !== null;

  return (
    <div className="border-t border-hairline py-2.5 first:border-t-0">
      <div className="flex gap-3 items-start">
        {image ? (
          <img src={image} alt="" className="w-24 h-24 rounded-lg object-cover flex-shrink-0 bg-panel" />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-panel border border-hairline flex-shrink-0 flex items-center justify-center text-2xl text-chalkdim">
            {exercise.name[0]?.toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <MarqueeText text={exercise.name} className="font-bold text-lg leading-none" />

          <div className="grid grid-cols-2 gap-1.5">
            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
                className="w-full font-display text-base font-semibold rounded-lg bg-panel border border-hairline pl-2 pr-8 py-1 focus:outline-none focus:border-brasslight"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-chalkdim text-sm">{unit}</span>
            </div>
            <div
              className={`font-display text-base font-semibold rounded-lg border py-1 text-center whitespace-nowrap ${
                timerRunning ? "bg-panelraised border-brasslight" : "bg-panel border-hairline text-chalkdim"
              }`}
            >
              {formatClock(secondsLeft ?? restDuration)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brass text-chalk font-semibold text-sm py-1 disabled:opacity-60"
            >
              {t("save")}
            </button>
            <button
              onClick={timerRunning ? cancelTimer : startTimer}
              className="rounded-lg border border-hairline text-chalk font-semibold text-sm py-1 whitespace-nowrap"
            >
              {timerRunning ? t("cancel") : t("timerLabel")}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2">
        {!hasHistory ? (
          <span className="text-chalkdim text-xs">{t("noHistoryYet")}</span>
        ) : (
          <>
            <p className="text-xs text-chalkdim mb-1">{t("previousWeights")}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {coloredHistory.slice(0, 12).map((h) => (
                <div
                  key={h.id}
                  className="flex-shrink-0 bg-panel border border-hairline rounded-lg px-2.5 py-1 text-center min-w-[54px]"
                >
                  <span className={`font-display block text-sm font-semibold ${colorClasses[h.color]}`}>
                    {kgToUnit(h.weight, unit)}
                  </span>
                  <span className="block text-[10px] text-chalkdim mt-0.5">{fmtDate(h.date, language, t("today"))}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
