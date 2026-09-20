import { useEffect, useRef, useState } from "react";
import { primeAudioContext, playDoubleBeep } from "../lib/beep";
import { scheduleRestNotification, cancelRestNotification } from "../lib/nativeTimer";
import { useLanguage } from "../i18n/LanguageContext";
import NumberWheel from "./NumberWheel";

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

// Negative ID reserved for the floating timer, since real exercise IDs (used
// as notification IDs in ExerciseCard) are always positive - guarantees no collision.
const FLOATING_TIMER_NOTIFICATION_ID = -1;

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
          <div className="relative flex items-center">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-panelraised rounded-lg pointer-events-none" />
            <NumberWheel min={0} max={59} value={minutes} onChange={setMinutes} />
            <span className="font-display text-2xl font-semibold px-1">:</span>
            <NumberWheel min={0} max={55} step={5} value={seconds} onChange={setSeconds} pad />
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

      <button
        onClick={() => (running ? cancelTimer() : setOpen((o) => !o))}
        className={`w-16 h-16 rounded-full border shadow-lg flex flex-col items-center justify-center gap-0.5 ${
          running ? "bg-panelraised border-brasslight text-chalk" : "bg-panel border-hairline text-chalkdim"
        }`}
      >
        <ClockIcon />
        <span className="font-display font-semibold text-xs">{formatClock(displaySeconds)}</span>
      </button>

      {/* Curved caption hugging the bottom of the circle, like a badge label */}
      <svg width="80" height="22" viewBox="0 0 80 22" className="-mt-1 pointer-events-none">
        <path id="floatingTimerCurve" d="M 5 5 A 35 35 0 0 1 75 5" fill="transparent" />
        <text textAnchor="middle" className="fill-chalkdim" style={{ fontSize: 9, letterSpacing: 1 }}>
          <textPath href="#floatingTimerCurve" xlinkHref="#floatingTimerCurve" startOffset="50%">
            {t("customTimer")}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
