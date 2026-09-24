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

export default function Today() {
  const { user, logout } = useAuth();
  const sessionKey = (name: string) => `gymtracker_session_${user?.id ?? "anon"}_${name}`;
  const { language, t } = useLanguage();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [exercises, setExercises] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayLabel, setDayLabel] = useState("");
  const [isRestDay, setIsRestDay] = useState(false);
  const [labelsLoaded, setLabelsLoaded] = useState(false);
  const [hasAnyRoutine, setHasAnyRoutine] = useState<boolean | null>(null);
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [sessionState, setSessionState] = useState<"idle" | "running" | "paused" | "finished">("idle");
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [liveTimeLabel, setLiveTimeLabel] = useState("0h 0m 0s");
  const inputRefsMap = useRef<Record<number, HTMLInputElement | null>>({});

  function formatHMS(totalMs: number): string {
    const totalSeconds = Math.floor(totalMs / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  }

  const todayISO = toISODate(new Date());

  // The session timer accumulates time across pause/resume cycles. Each
  // running segment is tracked by a real-world start TIMESTAMP (not a JS
  // counter), so elapsed time stays correct no matter how long the phone was
  // locked or backgrounded - completed segments are folded into an
  // accumulated total in localStorage, and resuming just starts a new
  // segment on top of that total.
  useEffect(() => {
    const storedDate = localStorage.getItem(sessionKey("date"));
    if (storedDate !== todayISO) {
      localStorage.removeItem(sessionKey("date"));
      localStorage.removeItem(sessionKey("startedAt"));
      localStorage.removeItem(sessionKey("accumulatedMs"));
      localStorage.removeItem(sessionKey("finished"));
      setLiveTimeLabel("0h 0m 0s");
      setSessionMinutes(0);
      setSessionState("idle");
      return;
    }
    const startedAt = localStorage.getItem(sessionKey("startedAt"));
    const accumulatedMs = parseInt(localStorage.getItem(sessionKey("accumulatedMs")) || "0");
    const finished = localStorage.getItem(sessionKey("finished")) === "true";
    setSessionMinutes(Math.floor(accumulatedMs / 60000));
    setLiveTimeLabel(formatHMS(accumulatedMs));
    if (finished) setSessionState("finished");
    else if (startedAt) setSessionState("running");
    else if (accumulatedMs > 0) setSessionState("paused");
    else setSessionState("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Live ticker while running, down to the second - has no bearing on the
  // actual recorded duration, which is always recomputed from the stored
  // timestamp whenever it matters (pausing, finalizing, generating the PNG).
  useEffect(() => {
    if (sessionState !== "running") return;
    function updateLiveDisplay() {
      const startedAt = parseInt(localStorage.getItem(sessionKey("startedAt")) || "0");
      const accumulatedMs = parseInt(localStorage.getItem(sessionKey("accumulatedMs")) || "0");
      if (!startedAt) return;
      const totalMs = accumulatedMs + (Date.now() - startedAt);
      setLiveTimeLabel(formatHMS(totalMs));
      setSessionMinutes(Math.floor(totalMs / 60000));
    }
    updateLiveDisplay();
    const interval = setInterval(updateLiveDisplay, 1000);
    return () => clearInterval(interval);
  }, [sessionState]);

  function handleStartSession() {
    localStorage.setItem(sessionKey("date"), todayISO);
    localStorage.setItem(sessionKey("accumulatedMs"), "0");
    localStorage.setItem(sessionKey("startedAt"), Date.now().toString());
    localStorage.removeItem(sessionKey("finished"));
    setSessionMinutes(0);
    setLiveTimeLabel("0h 0m 0s");
    setSessionState("running");
  }

  function handlePauseSession() {
    const startedAt = parseInt(localStorage.getItem(sessionKey("startedAt")) || "0");
    const prevAccumulated = parseInt(localStorage.getItem(sessionKey("accumulatedMs")) || "0");
    const newAccumulated = prevAccumulated + (startedAt ? Date.now() - startedAt : 0);
    localStorage.setItem(sessionKey("accumulatedMs"), newAccumulated.toString());
    localStorage.removeItem(sessionKey("startedAt"));
    setSessionMinutes(Math.floor(newAccumulated / 60000));
    setLiveTimeLabel(formatHMS(newAccumulated));
    setSessionState("paused");
  }

  function handleResumeSession() {
    localStorage.setItem(sessionKey("startedAt"), Date.now().toString());
    setSessionState("running");
  }

  function handleFinalizeSession() {
    localStorage.setItem(sessionKey("finished"), "true");
    setSessionState("finished");
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
        <div className="flex flex-col items-center gap-2 mb-2">
          <p className="text-sm text-chalkdim">
            {t("sessionTimerLabel")}: {liveTimeLabel}
          </p>

          {sessionState === "idle" && (
            <button
              onClick={handleStartSession}
              aria-label={t("startSessionTimer")}
              className="w-14 h-14 flex items-center justify-center text-chalk"
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}

          {sessionState === "running" && (
            <button
              onClick={handlePauseSession}
              aria-label={t("pauseSessionTimer")}
              className="w-14 h-14 flex items-center justify-center text-chalk"
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            </button>
          )}

          {sessionState === "paused" && (
            <div className="flex gap-2">
              <button
                onClick={handleResumeSession}
                className="flex items-center gap-1.5 rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-chalk"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {t("resume")}
              </button>
              <button
                onClick={() => setShowFinalizeConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-chalk"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 3v18" />
                  <path d="M4 4h13l-2.5 3.5L17 11H4" />
                </svg>
                {t("finalize")}
              </button>
            </div>
          )}

          {sessionState === "finished" && <p className="text-sm font-semibold text-chalk">{t("wellDone")}</p>}
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
      {showFinalizeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-panel border border-hairline rounded-xl p-5 max-w-xs w-full">
            <p className="text-chalk text-sm mb-4">{t("confirmFinalizeQuestion")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFinalizeConfirm(false)}
                className="flex-1 rounded-lg border border-hairline text-chalkdim py-2 text-sm font-semibold"
              >
                {t("no")}
              </button>
              <button
                onClick={() => {
                  setShowFinalizeConfirm(false);
                  handleFinalizeSession();
                }}
                className="flex-1 rounded-lg bg-brass text-chalk py-2 text-sm font-semibold"
              >
                {t("yes")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecapModal && (
        <SessionRecapModal
          dayName={dayLabel || DAYS[dayIndex]}
          sessionMinutes={sessionMinutes}
          onClose={() => setShowRecapModal(false)}
        />
      )}

      <p className="text-center text-[10px] text-chalkdim mt-4 pb-2">{t("developedBy")}</p>
    </div>
  );
}
