import { useState } from "react";
import { Dumbbell, Weight, Cable, PersonStanding } from "lucide-react";
import { searchLibrary, type Equipment } from "../data/exerciseLibrary";

function EquipmentIcon({ equipment }: { equipment: Equipment }) {
  const common = { size: 20, strokeWidth: 1.75 };
  switch (equipment) {
    case "dumbbell":
      return <Dumbbell {...common} />;
    case "cable":
      return <Cable {...common} />;
    case "bodyweight":
      return <PersonStanding {...common} />;
    default:
      return <Weight {...common} />;
  }
}

export default function ExercisePicker({ onAdd }: { onAdd: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const results = searchLibrary(query);
  const exactMatch = results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase());

  function handleAdd(name: string) {
    onAdd(name);
    setQuery("");
  }

  return (
    <div className="mb-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exercises, e.g. Bench pr..."
        className="w-full rounded-lg bg-panel border border-hairline px-3 py-2.5 text-chalk focus:outline-none focus:border-brass"
      />

      {query.trim() && (
        <div className="mt-2 flex flex-col gap-2">
          {results.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center gap-3 bg-panel border border-hairline rounded-lg px-3 py-2.5"
            >
              <div className="w-9 h-9 rounded-lg bg-panelraised flex items-center justify-center text-chalkdim flex-shrink-0">
                <EquipmentIcon equipment={ex.equipment} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ex.name}</p>
                <p className="text-xs text-chalkdim">{ex.muscleGroup}</p>
              </div>
              <button
                onClick={() => handleAdd(ex.name)}
                className="flex-shrink-0 rounded-lg bg-brass text-charcoal text-xs font-semibold px-3 py-2"
              >
                Add to routine
              </button>
            </div>
          ))}

          {!exactMatch && (
            <button
              onClick={() => handleAdd(query.trim())}
              className="text-left text-sm text-chalkdim underline px-1 py-1"
            >
              Add "{query.trim()}" as a custom exercise
            </button>
          )}
        </div>
      )}
    </div>
  );
}
