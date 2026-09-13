import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import ExerciseCard from "../components/ExerciseCard";

const DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function Today() {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();
  const [exercises, setExercises] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  const DAYS = language === "es" ? DAYS_ES : DAYS_EN;
  const jsDay = new Date().getDay(); // 0=Sunday
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // 0=Monday ... matches backend's day_of_week
  const dateStr = new Date().toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
    month: "long",
    day: "numeric",
  });

  async function load() {
    setLoading(true);
    try {
      const data = await api.getToday(dayIndex);
      setExercises(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6">
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-3">
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
          <div>
            <h1 className="font-display text-4xl font-semibold">{DAYS[dayIndex]}</h1>
            <p className="text-chalkdim text-sm mt-1">
              {dateStr} &middot; {user?.name}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link to="/settings" className="text-sm text-chalkdim underline">
            {t("settings")}
          </Link>
          <Link to="/routine" className="text-sm text-chalkdim underline">
            {t("addModifyRoutine")}
          </Link>
          <Link to="/body-metrics" className="text-sm text-chalkdim underline">
            {t("bodyMetrics")}
          </Link>
          <button onClick={logout} className="text-sm text-chalkdim underline">
            {t("logOut")}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
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
          exercises.map((ex) => <ExerciseCard key={ex.id} exercise={ex} onLogged={load} />)
        )}
      </div>
    </div>
  );
}
