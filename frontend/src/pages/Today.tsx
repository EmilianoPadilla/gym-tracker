import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import ExerciseCard from "../components/ExerciseCard";
import HamburgerMenu from "../components/HamburgerMenu";
import MarqueeText from "../components/MarqueeText";
import FloatingTimer from "../components/FloatingTimer";
import SessionRecapModal from "../components/SessionRecapModal";

const DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function toISODate(d: Date): string {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time, not UTC
}

function dayOfWeekOf(d: Date): number {
  const jsDay = d.getDay(); // 0=Sunday
  return jsDay === 0 ? 6 : jsDay - 1; // 0=Monday ... matches backend's day_of_week
}

function formatSavedSession(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function Today() {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [exercises, setExercises] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayLabel, setDayLabel] = useState("");
  const [isRestDay, setIsRestDay] = useState(false);
  const [labelsLoaded, setLabelsLoaded] = useState(false);
  const [hasAnyRoutine, setHasAnyRoutine] = useState<boolean | null>(null);
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [sessionTotalMinutes, setSessionTotalMinutes] = useState<number | null>(null);
  const [liveElapsedLabel, setLiveElapsedLabel] = useState("");
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const inputRefsMap = useRef<Record<number, HTMLInputElement | null>>({});

  const todayISO = toISODate(new Date());

  // The session timer uses a stored real-world start TIMESTAMP rather than a
  // running JS counter, so the actual elapsed time is always correct no
  // matter how long the phone was locked or the app was backgrounded - we
  // simply compare "now" to that stored timestamp whenever it matters,
  // instead of relying on a setInterval that pauses in the background.
  useEffect(() => {
    const storedDate = localStorage.getItem("gymtracker_session_date");
    if (storedDate !== todayISO) {
      // A new day - clear out anything left over from a previous session.
      localStorage.removeItem("gymtracker_session_date");
      localStorage.removeItem("gymtracker_session_startedAt");
      localStorage.removeItem("gymtracker_session_totalMinutes");
      return;
    }
    const startedAt = localStorage.getItem("gymtracker_session_startedAt");
    const totalMinutes = localStorage.getItem("gymtracker_session_totalMinutes");
    if (startedAt) setSessionRunning(true);
    if (totalMinutes) setSessionTotalMinutes(parseInt(totalMinutes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Purely cosmetic live ticker while the session is running and the app is
  // in the foreground - has no bearing on the actual recorded duration.
  useEffect(() => {
    if (!sessionRunning) return;
    function updateLabel() {
      const startedAt = parseInt(localStorage.getItem("gymtracker_session_startedAt") || "0");
      if (!startedAt) return;
      const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      const h = Math.floor(elapsedSec / 3600);
      const m = Math.floor((elapsedSec % 3600) / 60);
      const s = elapsedSec % 60;
      setLiveElapsedLabel(
        h > 0
          ? `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`
          : `${m}m ${s.toString().padStart(2, "0")}s`
      );
    }
    updateLabel();
    const interval = setInterval(updateLabel, 1000);
    return () => clearInterval(interval);
  }, [sessionRunning]);

  function startSessionTimer() {
    localStorage.setItem("gymtracker_session_date", todayISO);
    localStorage.setItem("gymtracker_session_startedAt", Date.now().toString());
    localStorage.removeItem("gymtracker_session_totalMinutes");
    setSessionTotalMinutes(null);
    setSessionRunning(true);
  }

  function endSessionTimer() {
    const startedAt = parseInt(localStorage.getItem("gymtracker_session_startedAt") || "0");
    const totalMinutes = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 60000)) : 0;
    localStorage.setItem("gymtracker_session_totalMinutes", totalMinutes.toString());
    localStorage.removeItem("gymtracker_session_startedAt");
    setSessionTotalMinutes(totalMinutes);
    setSessionRunning(false);
  }

  const DAYS = language === "es" ? DAYS_ES : DAYS_EN;
  const dayIndex = dayOfWeekOf(viewDate);
  const isActuallyToday = toISODate(viewDate) === toISODate(new Date());
  const dateStr = viewDate.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
    month: "long",
    day: "numeric",
  });

  async function loadForDate(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await api.getToday(dayIndex);
      setExercises(data);
    } catch {
      // silent refreshes shouldn't surface an error
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function loadDayMeta() {
    setLabelsLoaded(false);
    const rows: { day_of_week: number; label: string; is_rest_day: boolean }[] = await api.getDayLabels();
    const match = rows.find((r) => r.day_of_week === dayIndex);
    setDayLabel(match?.label ?? "");
    setIsRestDay(match?.is_rest_day ?? false);
    setLabelsLoaded(true);
  }

  // Reload everything whenever the viewed date's weekday changes (navigating
  // with the arrows), and once at the very start.
  useEffect(() => {
    loadForDate();
    loadDayMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayIndex]);

  useEffect(() => {
    api.getRoutine().then((all: any[]) => setHasAnyRoutine(all.length > 0));
  }, []);

  function goToPreviousDay() {
    setViewDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() - 1);
      return next;
    });
  }

  function goToNextDay() {
    if (isActuallyToday) return; // never allow logging into the future
    setViewDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }

  function handleSaved(exerciseId: number) {
    loadForDate(true);
    if (!exercises) return;
    const idx = exercises.findIndex((e) => e.id === exerciseId);
    if (idx >= 0 && idx < exercises.length - 1) {
      const nextId = exercises[idx + 1].id;
      setTimeout(() => {
        const el = inputRefsMap.current[nextId];
        if (el) {
          el.focus();
          el.select();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }
  }

  const menuItems = [
    { to: "/history", label: t("history") },
    { to: "/routine", label: t("addModifyRoutine") },
    { to: "/progress", label: t("progress") },
    { to: "/body-metrics", label: t("bodyMetrics") },
    { to: "/settings", label: t("settings") },
    { label: t("logOut"), onClick: logout },
  ];

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6 flex flex-col">
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/settings" className="flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-panel border border-hairline overflow-hidden flex items-center justify-center">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-lg text-chalkdim">
                  {user?.name?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
          </Link>
          <div className="min-w-0 flex-1">
            <Link to={`/routine?day=${dayIndex}`} className="block">
              <MarqueeText
                text={dayLabel ? `${DAYS[dayIndex]} (${dayLabel})` : DAYS[dayIndex]}
                className="font-display text-4xl font-semibold"
              />
            </Link>
            <p className="text-chalkdim text-sm mt-1 truncate">
              {dateStr} &middot; {user?.name}
            </p>
          </div>
        </div>
        <HamburgerMenu items={menuItems} />
      </div>

      <div className="flex items-center justify-between gap-2 mt-4 mb-2">
        <button
          onClick={goToPreviousDay}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-hairline text-chalkdim text-sm"
        >
          &lsaquo; {t("previousDay")}
        </button>
        {!isActuallyToday && (
          <button
            onClick={() => setViewDate(new Date())}
            className="text-xs px-3 py-1.5 rounded-full border border-brasslight text-brasslight font-medium flex-shrink-0"
          >
            {t("today")}
          </button>
        )}
        {!isActuallyToday && (
          <button
            onClick={goToNextDay}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-hairline text-chalkdim text-sm"
          >
            {t("nextDay")} &rsaquo;
          </button>
        )}
      </div>

      {isActuallyToday && (
        <div className="flex justify-center mb-2">
          <button
            onClick={() => {
              if (sessionRunning) {
                setShowEndConfirm(true);
              } else if (sessionTotalMinutes !== null) {
                setShowRestartConfirm(true);
              } else {
                startSessionTimer();
              }
            }}
            className="rounded-lg font-semibold py-2 px-5 text-sm text-white shadow-md"
            style={{
              background:
                "linear-gradient(180deg, rgba(120, 116, 182, 0.65) 0%, rgba(221, 221, 228, 0) 45%), linear-gradient(180deg, #2320d8 0%, #2232c0 100%)",
            }}
          >
            {sessionRunning
              ? `${t("endTimer")} (${liveElapsedLabel})`
              : sessionTotalMinutes !== null
                ? `${t("sessionLabel")}: ${formatSavedSession(sessionTotalMinutes)}`
                : t("startSessionTimer")}
          </button>
        </div>
      )}

      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-panel border border-hairline rounded-xl p-5 max-w-xs w-full">
            <p className="text-chalk text-sm mb-4">{t("endTimerQuestion")}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="rounded-lg border border-hairline text-chalkdim py-2 text-sm font-semibold"
              >
                {t("continueTimer")}
              </button>
              <button
                onClick={() => {
                  setShowEndConfirm(false);
                  endSessionTimer();
                }}
                className="rounded-lg bg-brass text-chalk py-2 text-sm font-semibold"
              >
                {t("stopCurrentTimer")}
              </button>
              <button
                onClick={() => {
                  setShowEndConfirm(false);
                  startSessionTimer();
                }}
                className="rounded-lg border border-hairline text-chalkdim py-2 text-sm font-semibold"
              >
                {t("startNewSession")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-panel border border-hairline rounded-xl p-5 max-w-xs w-full">
            <p className="text-chalk text-sm mb-4">{t("restartSessionQuestion")}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="rounded-lg border border-hairline text-chalkdim py-2 text-sm font-semibold"
              >
                {t("keepSavedSession")}
              </button>
              <button
                onClick={() => {
                  setShowRestartConfirm(false);
                  startSessionTimer();
                }}
                className="rounded-lg bg-brass text-chalk py-2 text-sm font-semibold"
              >
                {t("startNewSession")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex-1 pb-28">
        {!labelsLoaded ? null : isRestDay ? (
          <div className="text-center py-16">
            <p className="font-display text-3xl mb-2">{t("restDayTitle")}</p>
            <p className="text-chalkdim">{t("restDayMessage")}</p>
          </div>
        ) : loading ? (
          <p className="text-chalkdim text-sm">Loading...</p>
        ) : hasAnyRoutine === false ? (
          <div className="text-center py-14">
            <p className="font-display text-2xl mb-2">{t("welcomeNoRoutineTitle")}</p>
            <p className="text-chalkdim text-sm mb-6">{t("welcomeNoRoutineMessage")}</p>
            <Link
              to="/routine"
              className="inline-block rounded-xl bg-brass text-chalk font-semibold px-8 py-4 text-base shadow-lg"
            >
              {t("addModifyRoutine")}
            </Link>
          </div>
        ) : !exercises || exercises.length === 0 ? (
          <div className="text-center py-10 text-chalkdim">
            <p>
              {t("nothingSetFor")} {DAYS[dayIndex]} {t("yet")}
            </p>
            <Link
              to="/routine"
              className="inline-block mt-4 rounded-lg bg-brass text-chalk font-semibold px-4 py-2.5 text-sm"
            >
              {t("addModifyRoutine")}
            </Link>
          </div>
        ) : (
          <>
            {exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                logDate={toISODate(viewDate)}
                onSaved={() => handleSaved(ex.id)}
                inputRef={(el) => (inputRefsMap.current[ex.id] = el)}
              />
            ))}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowRecapModal(true)}
                aria-label={t("generateSessionImage")}
                className="w-14 h-14 rounded-xl flex items-center justify-center text-chalk"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4" />
                  <path d="M8 8l4-4 4 4" />
                  <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {!isRestDay && <FloatingTimer />}
      {showRecapModal && (
        <SessionRecapModal
          dayName={dayLabel || DAYS[dayIndex]}
          sessionMinutes={sessionTotalMinutes ?? 0}
          onClose={() => setShowRecapModal(false)}
        />
      )}

      <p className="text-center text-[10px] text-chalkdim mt-4 pb-2">{t("developedBy")}</p>
    </div>
  );
}
