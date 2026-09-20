import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

type MenuItem = { to?: string; label: string; onClick?: () => void };

export default function HamburgerMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-10 rounded-lg border border-hairline flex items-center justify-center flex-shrink-0"
        aria-label="Menu"
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <rect width="18" height="2" rx="1" fill="currentColor" />
          <rect y="6" width="18" height="2" rx="1" fill="currentColor" />
          <rect y="12" width="18" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-panel border border-hairline rounded-lg shadow-lg py-2 z-50">
          {items.map((item, i) =>
            item.to ? (
              <Link
                key={i}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-chalk hover:bg-panelraised"
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={i}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-chalk hover:bg-panelraised"
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
