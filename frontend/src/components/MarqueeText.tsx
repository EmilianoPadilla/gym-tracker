import { useEffect, useRef, useState } from "react";

export default function MarqueeText({ text, className = "" }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    function measure() {
      if (!containerRef.current || !textRef.current) return;
      const overflow = textRef.current.scrollWidth - containerRef.current.clientWidth;
      setDistance(overflow > 4 ? overflow : 0);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap ${className}`}>
      <span
        ref={textRef}
        className={`inline-block ${distance > 0 ? "marquee-scroll" : ""}`}
        style={distance > 0 ? ({ "--marquee-distance": `-${distance}px` } as React.CSSProperties) : undefined}
      >
        {text}
      </span>
    </div>
  );
}
