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

export default function Today() {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();
  const [exercises, setExercises] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayLabel, setDayLabel] = useState("");
  const [isRestDay, setIsRestDay] = useState(false);
  const [labelsLoaded, setLabelsLoaded] = useState(false);
  const inputRefsMap = useRef<Record<number, HTMLInputElement | null>>({});

  const DAYS = language === "es" ? DAYS_ES : DAYS_EN;
  const jsDay = new Date().getDay(); // 0=Sunday
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // 0=Monday ... matches backend's day_of_week
  const dateStr = new Date().toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
    month: "long",
    day: "numeric",
  });

  // Used only for the very first load - shows the "Loading..." state.
  async function loadInitial() {
    setLoading(true);
    try {
      const data = await api.getToday(dayIndex);
      setExercises(data);
    } finally {
      setLoading(false);
    }
  }

  // Used to refresh data after saving a weight, WITHOUT touching `loading` -
  // this is what keeps the save seamless instead of flashing back to a
  // "Loading..." screen and losing scroll position every time.
  async function refreshSilently() {
    try {
      const data = await api.getToday(dayIndex);
      setExercises(data);
    } catch {
      // A silent background refresh failing isn't worth surfacing an error for
    }
  }

  useEffect(() => {
    loadInitial();
    api.getDayLabels().then((rows: { day_of_week: number; label: string; is_rest_day: boolean }[]) => {
      const match = rows.find((r) => r.day_of_week === dayIndex);
      setDayLabel(match?.label ?? "");
      setIsRestDay(match?.is_rest_day ?? false);
      setLabelsLoaded(true);
    });
  }, []);

  function handleSaved(exerciseId: number) {
    refreshSilently();
    if (!exercises) return;
    const idx = exercises.findIndex((e) => e.id === exerciseId);
    if (idx >= 0 && idx < exercises.length - 1) {
      const nextId = exercises[idx + 1].id;
      // Small delay so this runs after the current render settles.
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

      <div className="mt-6">
        {!labelsLoaded ? null : isRestDay ? (
          <div className="text-center py-16">
            <p className="font-display text-3xl mb-2">{t("restDayTitle")}</p>
            <p className="text-chalkdim">{t("restDayMessage")}</p>
          </div>
        ) : loading ? (
          <p className="text-chalkdim text-sm">Loading...</p>
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
              onSaved={() => handleSaved(ex.id)}
              inputRef={(el) => (inputRefsMap.current[ex.id] = el)}
            />
          ))
        )}
      </div>

      {!isRestDay && <FloatingTimer />}
    </div>
  );
}
