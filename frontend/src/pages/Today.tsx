import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import ExerciseCard from "../components/ExerciseCard";
import HamburgerMenu from "../components/HamburgerMenu";
import MarqueeText from "../components/MarqueeText";
import FloatingTimer from "../components/FloatingTimer";

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
  const { language, t } = useLanguage();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [exercises, setExercises] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayLabel, setDayLabel] = useState("");
  const [isRestDay, setIsRestDay] = useState(false);
  const [labelsLoaded, setLabelsLoaded] = useState(false);
  const [hasAnyRoutine, setHasAnyRoutine] = useState<boolean | null>(null);
  const inputRefsMap = useRef<Record<number, HTMLInputElement | null>>({});

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
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6">
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
            <MarqueeText
              text={dayLabel ? `${DAYS[dayIndex]} (${dayLabel})` : DAYS[dayIndex]}
              className="font-display text-4xl font-semibold"
            />
            <p className="text-chalkdim text-sm mt-1 truncate">
              {dateStr} &middot; {user?.name}
            </p>
          </div>
        </div>
        <HamburgerMenu items={menuItems} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 mb-2">
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

      <div className="mt-4">
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
          exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              logDate={toISODate(viewDate)}
              onSaved={() => handleSaved(ex.id)}
              inputRef={(el) => (inputRefsMap.current[ex.id] = el)}
            />
          ))
        )}
      </div>

      {!isRestDay && <FloatingTimer />}

      <p className="text-center text-[10px] text-chalkdim mt-10 pb-2">{t("developedBy")}</p>
    </div>
  );
}
