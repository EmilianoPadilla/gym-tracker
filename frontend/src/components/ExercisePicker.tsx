import { useState } from "react";
import { searchLibrary } from "../data/exerciseLibrary";
import { useLanguage } from "../i18n/LanguageContext";

export default function ExercisePicker({ onAdd }: { onAdd: (name: string) => void }) {
  const { t } = useLanguage();
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
        placeholder={t("searchExercisesPlaceholder")}
        className="w-full rounded-lg bg-panel border border-hairline px-3 py-2.5 text-chalk focus:outline-none focus:border-brass"
      />

      {query.trim() && (
        <div className="mt-2 flex flex-col gap-2 max-h-[420px] overflow-y-auto">
          {results.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center gap-3 bg-panel border border-hairline rounded-lg px-3 py-2.5"
            >
              <img
                src={ex.image}
                alt={ex.name}
                className="w-12 h-12 rounded-lg object-cover bg-panelraised flex-shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ex.name}</p>
                <p className="text-xs text-chalkdim">{ex.muscleGroup}</p>
              </div>
              <button
                onClick={() => handleAdd(ex.name)}
                className="flex-shrink-0 rounded-lg bg-brass text-charcoal text-xs font-semibold px-3 py-2"
              >
                {t("addToRoutine")}
              </button>
            </div>
          ))}

          {results.length === 0 && (
            <p className="text-chalkdim text-sm px-1">{t("noMatches")}</p>
          )}

          {!exactMatch && (
            <button
              onClick={() => handleAdd(query.trim())}
              className="text-left text-sm text-chalkdim underline px-1 py-1"
            >
              {t("addAsCustom")}: "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
