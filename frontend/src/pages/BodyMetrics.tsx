import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import { useUnits } from "../units/UnitsContext";

type Range = 30 | 90 | 180 | 365;

type Metric = {
  id: number;
  date: string;
  weight: number | null;
  muscle_mass: number | null;
  fat_percentage: number | null;
  visceral_fat: number | null;
};

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function MetricChart({
  data,
  dataKey,
  label,
  unit,
  color,
  convert,
}: {
  data: Metric[];
  dataKey: keyof Metric;
  label: string;
  unit: string;
  color: string;
  convert?: (v: number) => number;
}) {
  const points = data
    .filter((d) => d[dataKey] !== null && d[dataKey] !== undefined)
    .map((d) => {
      const raw = d[dataKey] as number;
      return { date: fmtDate(d.date), value: convert ? convert(raw) : raw };
    });

  return (
    <div className="mb-8">
      <p className="text-sm font-semibold mb-2">
        {label} <span className="text-chalkdim font-normal">({unit})</span>
      </p>
      {points.length === 0 ? (
        <p className="text-chalkdim text-sm">No data yet for this range.</p>
      ) : (
        <div className="h-40 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3A3630" />
              <XAxis dataKey="date" tick={{ fill: "#A69F92", fontSize: 11 }} axisLine={{ stroke: "#3A3630" }} />
              <YAxis tick={{ fill: "#A69F92", fontSize: 11 }} axisLine={{ stroke: "#3A3630" }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: "#26221E", border: "1px solid #3A3630", borderRadius: 8 }}
                labelStyle={{ color: "#EDE7DD" }}
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function BodyMetrics() {
  const { t } = useLanguage();
  const { unit, toDisplay, toKg } = useUnits();
  const [range, setRange] = useState<Range>(90);
  const [data, setData] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  const [weight, setWeight] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [fatPct, setFatPct] = useState("");
  const [visceralFat, setVisceralFat] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await api.getBodyMetrics(range);
      setData(result);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [range]);

  async function handleSave() {
    const fields: Record<string, number | string> = { metric_date: entryDate };
    if (weight) fields.weight = toKg(parseFloat(weight));
    if (muscleMass) fields.muscle_mass = toKg(parseFloat(muscleMass));
    if (fatPct) fields.fat_percentage = parseFloat(fatPct);
    if (visceralFat) fields.visceral_fat = parseFloat(visceralFat);
    if (Object.keys(fields).length === 1) return;

    setSaving(true);
    try {
      await api.addBodyMetric(fields as any);
      setWeight("");
      setMuscleMass("");
      setFatPct("");
      setVisceralFat("");
      setEntryDate(new Date().toISOString().slice(0, 10));
      await load();
    } finally {
      setSaving(false);
    }
  }

  const ranges: { label: string; value: Range }[] = [
    { label: t("lastMonth"), value: 30 },
    { label: t("last3Months"), value: 90 },
    { label: t("last6Months"), value: 180 },
    { label: t("lastYear"), value: 365 },
  ];

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="font-display text-3xl font-semibold">{t("bodyMetrics")}</h1>
        <Link to="/" className="text-sm text-chalkdim underline">
          {t("backToToday")}
        </Link>
      </div>

      <div className="bg-panel border border-hairline rounded-lg p-4 mb-8">
        <p className="text-sm font-semibold mb-3">{t("logTodaysReading")}</p>
        <div className="mb-3">
          <label className="block text-xs text-chalkdim mb-1">{t("date")}</label>
          <input
            type="date"
            value={entryDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full rounded-lg bg-panelraised border border-hairline px-3 py-2 text-chalk focus:outline-none focus:border-brasslight"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-chalkdim mb-1">{t("weight")} ({unit})</label>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-lg bg-panelraised border border-hairline px-3 py-2 text-chalk focus:outline-none focus:border-brasslight"
            />
          </div>
          <div>
            <label className="block text-xs text-chalkdim mb-1">{t("muscleMass")} ({unit})</label>
            <input
              type="number"
              inputMode="decimal"
              value={muscleMass}
              onChange={(e) => setMuscleMass(e.target.value)}
              className="w-full rounded-lg bg-panelraised border border-hairline px-3 py-2 text-chalk focus:outline-none focus:border-brasslight"
            />
          </div>
          <div>
            <label className="block text-xs text-chalkdim mb-1">{t("fatPercentage")}</label>
            <input
              type="number"
              inputMode="decimal"
              value={fatPct}
              onChange={(e) => setFatPct(e.target.value)}
              className="w-full rounded-lg bg-panelraised border border-hairline px-3 py-2 text-chalk focus:outline-none focus:border-brasslight"
            />
          </div>
          <div>
            <label className="block text-xs text-chalkdim mb-1">{t("visceralFat")}</label>
            <input
              type="number"
              inputMode="decimal"
              value={visceralFat}
              onChange={(e) => setVisceralFat(e.target.value)}
              className="w-full rounded-lg bg-panelraised border border-hairline px-3 py-2 text-chalk focus:outline-none focus:border-brasslight"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-brass text-chalk font-semibold py-2.5 disabled:opacity-60"
        >
          {t("save")}
        </button>
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
      ) : data.length === 0 ? (
        <p className="text-chalkdim text-sm text-center py-10">{t("noDataYet")}</p>
      ) : (
        <>
          <MetricChart data={data} dataKey="weight" label={t("weight")} unit={unit} color="#7586c3" convert={toDisplay} />
          <MetricChart data={data} dataKey="muscle_mass" label={t("muscleMass")} unit={unit} color="#6FA25E" convert={toDisplay} />
          <MetricChart data={data} dataKey="fat_percentage" label={t("fatPercentage")} unit="%" color="#CB7A32" />
          <MetricChart data={data} dataKey="visceral_fat" label={t("visceralFat")} unit="rating" color="#BD4B3F" />
        </>
      )}
    </div>
  );
}
