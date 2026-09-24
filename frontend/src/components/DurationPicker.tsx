const HOUR_OPTIONS = [0, 1, 2, 3];
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function DurationPicker({
  hours,
  minutes,
  onChangeHours,
  onChangeMinutes,
}: {
  hours: number;
  minutes: number;
  onChangeHours: (h: number) => void;
  onChangeMinutes: (m: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <select
        value={hours}
        onChange={(e) => onChangeHours(parseInt(e.target.value))}
        className="font-display text-2xl font-semibold rounded-lg bg-panelraised border border-hairline px-3 py-2 text-center"
      >
        {HOUR_OPTIONS.map((h) => (
          <option key={h} value={h}>
            {h}h
          </option>
        ))}
      </select>
      <select
        value={minutes}
        onChange={(e) => onChangeMinutes(parseInt(e.target.value))}
        className="font-display text-2xl font-semibold rounded-lg bg-panelraised border border-hairline px-3 py-2 text-center"
      >
        {MINUTE_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {m.toString().padStart(2, "0")}m
          </option>
        ))}
      </select>
    </div>
  );
}
