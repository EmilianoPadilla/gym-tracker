import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";

const WEEKDAY_HEADERS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const WEEKDAY_HEADERS_ES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

type DayLog = {
  id: number;
  exercise_id: number;
  exercise_name: string;
  date: string;
  weight: number;
  reps: number | null;
  sets: number | null;
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
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
  const [routine, setRoutine] = useState<{ id: number; name: string }[]>([]);
  const [addExerciseId, setAddExerciseId] = useState<string>("");
  const [addWeight, setAddWeight] = useState("");

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

  useEffect(() => {
    api.getRoutine().then(setRoutine);
  }, []);

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
  }

  async function refreshDay() {
    if (!selectedDate) return;
    const logs = await api.getLogsByDate(selectedDate);
    setDayLogs(logs);
    loadSummary();
  }

  async function handleUpdateWeight(logId: number, weight: string) {
    const value = parseFloat(weight);
    if (!value) return;
    await api.updateLog(logId, { weight: value });
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

  async function handleAddEntry() {
    if (!addExerciseId || !addWeight || !selectedDate) return;
    await api.addLog(parseInt(addExerciseId), parseFloat(addWeight), undefined, undefined, selectedDate);
    setAddExerciseId("");
    setAddWeight("");
    refreshDay();
  }

  const cells = buildMonthGrid(viewYear, viewMonth);
  const todayISO = toISODate(today);

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="font-display text-3xl font-semibold">{t("history")}</h1>
        <Link to="/" className="text-sm text-chalkdim underline">
          {t("backToToday")}
        </Link>
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
          return (
            <button
              key={i}
              onClick={() => !isFuture && openDay(d)}
              disabled={isFuture}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative
                ${isFuture ? "text-hairline" : "text-chalk"}
                ${isToday ? "border border-brasslight" : "border border-transparent"}
                ${selectedDate === iso ? "bg-panelraised" : ""}
              `}
            >
              {d.getDate()}
              {hasLogs && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-brass" />}
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
          ) : dayLogs.length === 0 ? (
            <p className="text-chalkdim text-sm mb-4">{t("noLogsThisDay")}</p>
          ) : (
            dayLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-2 py-2 border-t border-hairline first:border-t-0">
                <span className="flex-1 min-w-0 truncate text-sm">{log.exercise_name}</span>
                <input
                  type="number"
                  defaultValue={log.weight}
                  onBlur={(e) => handleUpdateWeight(log.id, e.target.value)}
                  className="w-16 rounded-md bg-panel border border-hairline px-2 py-1 text-sm text-center"
                />
                <input
                  type="date"
                  defaultValue={log.date}
                  max={todayISO}
                  onChange={(e) => handleMoveDate(log.id, e.target.value)}
                  className="rounded-md bg-panel border border-hairline px-2 py-1 text-xs"
                  title={t("moveToDifferentDay")}
                />
                <button onClick={() => handleDelete(log.id)} className="text-chalkdim text-lg px-1">
                  &times;
                </button>
              </div>
            ))
          )}

          <div className="flex gap-2 mt-4">
            <select
              value={addExerciseId}
              onChange={(e) => setAddExerciseId(e.target.value)}
              className="flex-1 rounded-lg bg-panel border border-hairline px-2 py-2 text-sm"
            >
              <option value="">{t("addAnExercise")}</option>
              {routine.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="kg"
              value={addWeight}
              onChange={(e) => setAddWeight(e.target.value)}
              className="w-16 rounded-lg bg-panel border border-hairline px-2 py-2 text-sm text-center"
            />
            <button onClick={handleAddEntry} className="rounded-lg bg-brass text-chalk font-semibold px-3 text-sm">
              {t("save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
