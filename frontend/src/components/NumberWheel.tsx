import { useEffect, useRef } from "react";

const ITEM_HEIGHT = 32;

export default function NumberWheel({
  min,
  max,
  step = 1,
  value,
  onChange,
  pad = false,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  pad?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const values: number[] = [];
  for (let v = min; v <= max; v += step) values.push(v);

  // Keep the wheel scrolled to match `value` whenever it changes from outside
  // (e.g. initial mount, or a reset) rather than from the user's own scroll.
  useEffect(() => {
    const idx = values.indexOf(value);
    if (idx >= 0 && containerRef.current) {
      containerRef.current.scrollTop = idx * ITEM_HEIGHT;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleScroll() {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      if (!containerRef.current) return;
      const idx = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      containerRef.current.scrollTop = clamped * ITEM_HEIGHT;
      const newValue = values[clamped];
      if (newValue !== value) onChange(newValue);
    }, 100);
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-y-auto no-scrollbar"
      style={{
        height: ITEM_HEIGHT * 3,
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div style={{ height: ITEM_HEIGHT }} />
      {values.map((v) => (
        <div
          key={v}
          style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center" }}
          className="flex items-center justify-center font-display text-2xl font-semibold text-chalk"
        >
          {pad ? v.toString().padStart(2, "0") : v}
        </div>
      ))}
      <div style={{ height: ITEM_HEIGHT }} />
    </div>
  );
}
