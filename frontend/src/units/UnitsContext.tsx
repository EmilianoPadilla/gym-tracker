import { createContext, useContext, useState, type ReactNode } from "react";

export type Unit = "kg" | "lbs";

type UnitsContextType = {
  unit: Unit;
  setUnit: (u: Unit) => void;
  unitLabel: string;
  // Convert a value stored in kg to the display unit, rounded sensibly.
  toDisplay: (kgValue: number) => number;
  // Convert a value the person typed (in the display unit) back to kg for storage.
  toKg: (displayValue: number) => number;
};

const UnitsContext = createContext<UnitsContextType | null>(null);

const KG_TO_LBS = 2.20462;
const STORAGE_KEY = "gym_tracker_units";

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Standalone conversions that take an explicit unit - used for per-exercise
// units, which are independent of the device-wide preference below (that one
// is now only used for the Body Metrics page).
export function kgToUnit(kgValue: number, unit: Unit): number {
  return unit === "kg" ? round(kgValue, 1) : round(kgValue * KG_TO_LBS, 1);
}

export function unitToKg(value: number, unit: Unit): number {
  return unit === "kg" ? round(value, 2) : round(value / KG_TO_LBS, 2);
}

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<Unit>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "lbs" ? "lbs" : "kg";
  });

  function setUnit(u: Unit) {
    localStorage.setItem(STORAGE_KEY, u);
    setUnitState(u);
  }

  function toDisplay(kgValue: number): number {
    if (unit === "kg") return round(kgValue, 1);
    return round(kgValue * KG_TO_LBS, 1);
  }

  function toKg(displayValue: number): number {
    if (unit === "kg") return round(displayValue, 2);
    return round(displayValue / KG_TO_LBS, 2);
  }

  return (
    <UnitsContext.Provider value={{ unit, setUnit, unitLabel: unit, toDisplay, toKg }}>
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error("useUnits must be used inside UnitsProvider");
  return ctx;
}
