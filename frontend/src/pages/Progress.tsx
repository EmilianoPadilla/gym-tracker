import { useEffect, useState } from "react";
import BackToStartLink from "../components/BackToStartLink";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import { useUnits } from "../units/UnitsContext";

const DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const LINE_COLORS = ["#7586c3", "#6FA25E", "#CB7A32", "#BD4B3F", "#B08FD6", "#5EA5A2", "#C9A227", "#D67AA8"];

type Range = 30 | 90 | 180 | 365;

type ProgressExercise = { id: number; name: string; history: { date: string; weight: number }[] };
type ProgressResponse = { day_of_week: number; label: string; exercises: ProgressExercise[] };

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Progress() {
  const { language, t } = useLanguage();
  const { unit, toDisplay } = useUnits();
  const DAYS = language === "es" ? DAYS_ES : DAYS_EN;

  const jsDay = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(jsDay === 0 ? 6 : jsDay - 1);
  const [range, setRange] = useState<Range>(90);
  const [labels, setLabels] = useState<Record<number, string>>({});
  const [restDays, setRestDays] = useState<Set<number>>(new Set());
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDayLabels().then((rows: { day_of_week: number; label: string; is_rest_day: boolean }[]) => {
      const map: Record<number, string> = {};
      const rest = new Set<number>();
      rows.forEach((r) => {
        map[r.day_of_week] = r.label;
        if (r.is_rest_day) rest.add(r.day_of_week);
      });
      setLabels(map);
      setRestDays(rest);
      // If today happens to be a rest day, default the view to the first
      // non-rest day instead, since there's nothing to show for rest days.
      if (rest.has(selectedDay)) {
        const firstAvailable = [0, 1, 2, 3, 4, 5, 6].find((d) => !rest.has(d));
        if (firstAvailable !== undefined) setSelectedDay(firstAvailable);
      }
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getProgress(selectedDay, range)
      .then(setData)
      .finally(() => setLoading(false));
  }, [selectedDay, range]);

  const ranges: { label: string; value: Range }[] = [
    { label: t("lastMonth"), value: 30 },
    { label: t("last3Months"), value: 90 },
    { label: t("last6Months"), value: 180 },
    { label: t("lastYear"), value: 365 },
  ];

  // Merge each exercise's sparse {date, weight} series into one array of rows
  // keyed by date, one column per exercise - the shape Recharts wants for a
  // multi-line chart sharing a single x-axis.
  const exercises = data?.exercises.filter((ex) => ex.history.length > 0) ?? [];
  const allDates = Array.from(new Set(exercises.flatMap((ex) => ex.history.map((h) => h.date)))).sort();
  const chartData = allDates.map((date) => {
    const row: Record<string, string | number> = { date: fmtDate(date) };
    exercises.forEach((ex) => {
      const point = ex.history.find((h) => h.date === date);
      if (point) row[ex.name] = toDisplay(point.weight);
    });
    return row;
  });

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="font-display text-3xl font-semibold">{t("progress")}</h1>
        <BackToStartLink />
      </div>

      <div className="flex gap-1.5 overflow-x-auto mb-4 pb-1">
        {DAYS.map((d, i) =>
          restDays.has(i) ? null : (
            <button
              key={d}
              onClick={() => setSelectedDay(i)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm border ${
                i === selectedDay
                  ? "bg-brass text-chalk border-brass font-semibold"
                  : "border-hairline text-chalkdim"
              }`}
            >
              {labels[i] || d}
            </button>
          )
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {ranges.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              range === r.value
                ? "bg-brass text-chalk border-brass font-semibold"
                : "border-hairline text-chalkdim"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-chalkdim text-sm">Loading...</p>
      ) : exercises.length === 0 ? (
        <p className="text-chalkdim text-sm text-center py-10">{t("noDataYet")}</p>
      ) : (
        <>
          <p className="text-xs text-chalkdim mb-3">
            {t("weight")} ({unit})
          </p>
          <div className="h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2C3968" />
                <XAxis dataKey="date" tick={{ fill: "#9AA3C2", fontSize: 11 }} axisLine={{ stroke: "#2C3968" }} />
                <YAxis tick={{ fill: "#9AA3C2", fontSize: 11 }} axisLine={{ stroke: "#2C3968" }} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "#1A2445", border: "1px solid #2C3968", borderRadius: 8 }}
                  labelStyle={{ color: "#EDE7DD" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9AA3C2" }} />
                {exercises.map((ex, i) => (
                  <Line
                    key={ex.id}
                    type="monotone"
                    dataKey={ex.name}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
