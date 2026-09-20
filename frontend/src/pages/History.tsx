import { useEffect, useState } from "react";
import BackToStartLink from "../components/BackToStartLink";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import { kgToUnit, unitToKg } from "../units/UnitsContext";

const WEEKDAY_HEADERS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const WEEKDAY_HEADERS_ES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

type DayLog = {
  id: number;
  exercise_id: number;
  exercise_name: string;
  preferred_unit: "kg" | "lbs";
  date: string;
  weight: number;
  reps: number | null;
  sets: number | null;
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  // month is 1-12. Returns a flat array of Dates (or null for leading blanks),
  // padded so the grid starts on Monday.
  const first = new Date(year, month - 1, 1);
  const jsWeekday = first.getDay(); // 0=Sunday
  const leadingBlanks = jsWeekday === 0 ? 6 : jsWeekday - 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month - 1, d));
  return cells;
}

export default function History() {
  const { language, t } = useLanguage();
  const headers = language === "es" ? WEEKDAY_HEADERS_ES : WEEKDAY_HEADERS_EN;

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-12
  const [datesWithLogs, setDatesWithLogs] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayLogs, setDayLogs] = useState<DayLog[] | null>(null);
  const [routine, setRoutine] = useState<{ id: number; name: string; preferred_unit: "kg" | "lbs" }[]>([]);
  const [restDays, setRestDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.getDayLabels().then((rows: { day_of_week: number; is_rest_day: boolean }[]) => {
      setRestDays(new Set(rows.filter((r) => r.is_rest_day).map((r) => r.day_of_week)));
    });
  }, []);

  // Limit range to the last 3 months, matching what was asked for.
  const earliestAllowed = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const canGoPrev = viewYear > earliestAllowed.getFullYear() ||
    (viewYear === earliestAllowed.getFullYear() && viewMonth > earliestAllowed.getMonth() + 1);
  const canGoNext = viewYear < today.getFullYear() || (viewYear === today.getFullYear() && viewMonth < today.getMonth() + 1);

  const monthLabel = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString(
    language === "es" ? "es-ES" : "en-US",
    { month: "long", year: "numeric" }
  );

  async function loadSummary() {
    const res = await api.getCalendarSummary(viewYear, viewMonth);
    setDatesWithLogs(new Set(res.dates_with_logs));
  }

  useEffect(() => {
    loadSummary();
  }, [viewYear, viewMonth]);

  function goPrevMonth() {
    if (!canGoPrev) return;
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (!canGoNext) return;
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  async function openDay(d: Date) {
    const iso = toISODate(d);
    setSelectedDate(iso);
    const logs = await api.getLogsByDate(iso);
    setDayLogs(logs);
    const jsWeekday = d.getDay();
    const dayOfWeek = jsWeekday === 0 ? 6 : jsWeekday - 1;
    const dayRoutine = await api.getRoutine(dayOfWeek);
    setRoutine(dayRoutine);
  }

  async function refreshDay() {
    if (!selectedDate) return;
    const logs = await api.getLogsByDate(selectedDate);
    setDayLogs(logs);
    loadSummary();
  }

  async function handleAddForExercise(exerciseId: number, displayValue: string, unit: "kg" | "lbs") {
    const value = parseFloat(displayValue);
    if (!value || !selectedDate) return;
    await api.addLog(exerciseId, unitToKg(value, unit), undefined, undefined, selectedDate);
    refreshDay();
  }

  async function handleUpdateWeight(logId: number, displayValue: string, unit: "kg" | "lbs") {
    const value = parseFloat(displayValue);
    if (!value) return;
    await api.updateLog(logId, { weight: unitToKg(value, unit) });
    refreshDay();
  }

  async function handleMoveDate(logId: number, newDate: string) {
    if (!newDate) return;
    await api.updateLog(logId, { log_date: newDate });
    refreshDay();
  }

  async function handleDelete(logId: number) {
    await api.deleteLog(logId);
    refreshDay();
  }

  const cells = buildMonthGrid(viewYear, viewMonth);
  const todayISO = toISODate(today);

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="font-display text-3xl font-semibold">{t("history")}</h1>
        <BackToStartLink />
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goPrevMonth}
          disabled={!canGoPrev}
          className="w-9 h-9 rounded-lg border border-hairline text-chalkdim disabled:opacity-30 flex items-center justify-center"
        >
          &lsaquo;
        </button>
        <p className="font-semibold capitalize">{monthLabel}</p>
        <button
          onClick={goNextMonth}
          disabled={!canGoNext}
          className="w-9 h-9 rounded-lg border border-hairline text-chalkdim disabled:opacity-30 flex items-center justify-center"
        >
          &rsaquo;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {headers.map((h) => (
          <div key={h} className="text-center text-xs text-chalkdim py-1">
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toISODate(d);
          const hasLogs = datesWithLogs.has(iso);
          const isToday = iso === todayISO;
          const isFuture = d > today;
          const jsWeekday = d.getDay(); // 0=Sunday
          const dayOfWeek = jsWeekday === 0 ? 6 : jsWeekday - 1; // 0=Monday, matches backend
          const isRest = restDays.has(dayOfWeek);
          const isMissed = !isFuture && !isRest && !hasLogs;

          return (
            <button
              key={i}
              onClick={() => !isFuture && openDay(d)}
              disabled={isFuture}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative overflow-hidden
                ${isFuture ? "text-hairline" : "text-chalk"}
                ${isToday ? "border border-brasslight" : "border border-transparent"}
                ${selectedDate === iso ? "bg-panelraised" : ""}
                ${isMissed ? "bg-red-900/20" : ""}
              `}
            >
              {isRest && !isFuture ? (
                <span className="font-display font-bold text-2xl text-chalkdim/50 absolute inset-0 flex items-center justify-center">
                  R
                </span>
              ) : null}
              <span className={isRest && !isFuture ? "relative z-10 text-xs" : ""}>{d.getDate()}</span>
              {hasLogs && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-brass z-10" />}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-6 border-t border-hairline pt-5">
          <p className="font-semibold mb-3">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>

          {dayLogs === null ? (
            <p className="text-chalkdim text-sm">Loading...</p>
          ) : routine.length === 0 ? (
            <p className="text-chalkdim text-sm mb-4">{t("noLogsThisDay")}</p>
          ) : (
            routine.map((ex) => {
              const log = dayLogs?.find((l) => l.exercise_id === ex.id);
              return (
                <div key={ex.id} className="flex items-center gap-1.5 py-2 border-t border-hairline first:border-t-0">
                  <span className="flex-1 min-w-0 truncate text-sm">{ex.name}</span>
                  <div className="relative flex-shrink-0">
                    <input
                      type="number"
                      defaultValue={log ? kgToUnit(log.weight, ex.preferred_unit) : ""}
                      placeholder="-"
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (!value) return;
                        if (log) {
                          handleUpdateWeight(log.id, value, ex.preferred_unit);
                        } else {
                          handleAddForExercise(ex.id, value, ex.preferred_unit);
                        }
                      }}
                      className="w-16 rounded-md bg-panel border border-hairline pl-2 pr-7 py-1 text-sm text-center"
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-chalkdim pointer-events-none">
                      {ex.preferred_unit}
                    </span>
                  </div>
                  {log ? (
                    <>
                      <label
                        className="w-7 h-7 rounded-md border border-hairline text-chalkdim flex items-center justify-center flex-shrink-0 cursor-pointer"
                        title={t("moveToDifferentDay")}
                      >
                        <CalendarIcon />
                        <input
                          type="date"
                          defaultValue={log.date}
                          max={todayISO}
                          onChange={(e) => handleMoveDate(log.id, e.target.value)}
                          className="sr-only"
                        />
                      </label>
                      <button onClick={() => handleDelete(log.id)} className="text-chalkdim text-lg px-1 flex-shrink-0">
                        &times;
                      </button>
                    </>
                  ) : (
                    <div className="w-7 h-7 flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}

        </div>
      )}
    </div>
  );
}
