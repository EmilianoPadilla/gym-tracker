import { useEffect, useRef, useState } from "react";
import { primeAudioContext, playDoubleBeep } from "../lib/beep";
import { scheduleRestNotification, cancelRestNotification } from "../lib/nativeTimer";
import { useLanguage } from "../i18n/LanguageContext";

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Curves text along an arc below a circle by rotating each letter individually
// around a shared pivot point - pure CSS, no SVG textPath (which didn't render
// reliably across environments). The pivot sits at the circle's own center,
// so letters land just outside its rim, following the curve. Angles are based
// on each character's actual measured width (via canvas), not just an equal
// split per letter - otherwise narrow letters like "i" end up with the same
// gap as wide ones like "m", looking visibly uneven.
function CurvedCaption({ text, radius }: { text: string; radius: number }) {
  const [letters, setLetters] = useState<{ char: string; angle: number }[]>([]);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.font = "500 11px 'Work Sans', sans-serif";
    const chars = text.split("");
    const widths = chars.map((c) => ctx.measureText(c === " " ? "\u00A0" : c).width + 1.5);
    const totalWidth = widths.reduce((a, b) => a + b, 0);
    let cumulative = 0;
    setLetters(
      chars.map((c, i) => {
        const center = cumulative + widths[i] / 2;
        cumulative += widths[i];
        const angleRad = (center - totalWidth / 2) / radius;
        return { char: c, angle: (angleRad * 180) / Math.PI };
      })
    );
  }, [text, radius]);

  return (
    <div className="absolute left-1/2 top-1/2 w-0 h-0 pointer-events-none">
      {letters.map(({ char, angle }, i) => (
        <span
          key={i}
          className="absolute left-0 top-0 text-chalkdim font-medium"
          style={{
            fontSize: 11,
            transformOrigin: "0 0",
            transform: `rotate(${-angle}deg) translateY(${radius}px)`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}

// Negative ID reserved for the floating timer, since real exercise IDs (used
// as notification IDs in ExerciseCard) are always positive - guarantees no collision.
const FLOATING_TIMER_NOTIFICATION_ID = -1;

const MINUTE_OPTIONS = Array.from({ length: 11 }, (_, i) => i); // 0-10 min - rest never needs more
const SECOND_OPTIONS = [0, 10, 20, 30, 40, 50];

export default function FloatingTimer() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startTimer() {
    primeAudioContext(); // unlocks audio now, during the real user tap, for the beep later
    const total = minutes * 60 + seconds;
    if (total <= 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(total);
    setOpen(false);
    scheduleRestNotification(FLOATING_TIMER_NOTIFICATION_ID, total, t("restComplete"), t("startTimer"));
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          playDoubleBeep();
          setTimeout(() => setSecondsLeft(null), 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancelTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setSecondsLeft(null);
    cancelRestNotification(FLOATING_TIMER_NOTIFICATION_ID);
  }

  const running = secondsLeft !== null;
  const displaySeconds = secondsLeft !== null ? secondsLeft : minutes * 60 + seconds;

  return (
    <div
      className="fixed right-5 z-40 flex flex-col items-center"
      style={{ bottom: "calc(1.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {open && (
        <div className="mb-3 bg-panel border border-hairline rounded-2xl p-4 shadow-lg flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <select
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value))}
              className="font-display text-2xl font-semibold rounded-lg bg-panelraised border border-hairline px-3 py-2 text-center"
            >
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            <span className="font-display text-2xl font-semibold">:</span>
            <select
              value={seconds}
              onChange={(e) => setSeconds(parseInt(e.target.value))}
              className="font-display text-2xl font-semibold rounded-lg bg-panelraised border border-hairline px-3 py-2 text-center"
            >
              {SECOND_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-hairline text-chalkdim text-sm py-2"
            >
              {t("cancel")}
            </button>
            <button
              onClick={startTimer}
              className="flex-1 rounded-lg bg-brass text-chalk font-semibold text-sm py-2"
            >
              {t("startTimer")}
            </button>
          </div>
        </div>
      )}

      <div className="relative w-16 h-16">
        <button
          onClick={() => (running ? cancelTimer() : setOpen((o) => !o))}
          className={`w-16 h-16 rounded-full border shadow-lg flex flex-col items-center justify-center gap-0.5 ${
            running ? "bg-panelraised border-brasslight text-chalk" : "bg-panel border-hairline text-chalkdim"
          }`}
        >
          <ClockIcon />
          <span className="font-display font-semibold text-xs">{formatClock(displaySeconds)}</span>
        </button>
        <CurvedCaption text={t("customTimer")} radius={44} />
      </div>
    </div>
  );
}
