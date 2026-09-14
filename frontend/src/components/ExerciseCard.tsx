import { useState } from "react";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import { kgToUnit, unitToKg, type Unit } from "../units/UnitsContext";
import { getExerciseImage } from "../data/exerciseLibrary";
import MarqueeText from "./MarqueeText";

type LogEntry = { id: number; date: string; weight: number; reps: number | null; sets: number | null };

type ExerciseWithStreak = {
  id: number;
  name: string;
  preferred_unit: Unit;
  custom_image: string | null;
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

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ExerciseCard({
  exercise,
  onLogged,
}: {
  exercise: ExerciseWithStreak;
  onLogged: () => void;
}) {
  const { t } = useLanguage();
  const unit = exercise.preferred_unit;
  const [weight, setWeight] = useState(
    exercise.latest_weight != null ? kgToUnit(exercise.latest_weight, unit).toString() : ""
  );
  const [saving, setSaving] = useState(false);
  const image = exercise.custom_image || getExerciseImage(exercise.name);

  async function handleSave() {
    const displayValue = parseFloat(weight);
    if (!displayValue || displayValue <= 0) return;
    setSaving(true);
    try {
      await api.addLog(exercise.id, unitToKg(displayValue, unit));
      onLogged();
    } finally {
      setSaving(false);
    }
  }

  const coloredHistory = colorHistory(exercise.history);
  const hasHistory = coloredHistory.length > 0;

  return (
    <div className="border-t border-hairline py-4 first:border-t-0">
      <div className="flex items-center gap-3 mb-3">
        {image ? (
          <img src={image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-panel" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-panel border border-hairline flex-shrink-0 flex items-center justify-center text-sm text-chalkdim">
            {exercise.name[0]?.toUpperCase()}
          </div>
        )}
        <MarqueeText text={exercise.name} className="font-semibold flex-1 min-w-0" />
      </div>
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
            className="w-full font-display text-2xl font-semibold rounded-lg bg-panel border border-hairline pl-3 pr-14 py-2 focus:outline-none focus:border-brasslight"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-chalkdim text-sm">{unit}</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-4 rounded-lg bg-brass text-chalk font-semibold text-sm flex-shrink-0 disabled:opacity-60"
        >
          {t("save")}
        </button>
      </div>

      <div className="mt-3">
        {!hasHistory ? (
          <span className="text-chalkdim text-sm">{t("noHistoryYet")}</span>
        ) : (
          <>
            <p className="text-xs text-chalkdim mb-1.5">{t("previousWeights")}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {coloredHistory.slice(0, 12).map((h) => (
                <div
                  key={h.id}
                  className="flex-shrink-0 bg-panel border border-hairline rounded-lg px-2.5 py-1.5 text-center min-w-[54px]"
                >
                  <span className={`font-display block text-base font-semibold ${colorClasses[h.color]}`}>
                    {kgToUnit(h.weight, unit)}
                  </span>
                  <span className="block text-[10px] text-chalkdim mt-0.5">{fmtDate(h.date)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
