export type Equipment = "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight";

export type LibraryExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: Equipment;
};

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Chest
  { id: "bench-press-barbell", name: "Bench press (barbell)", muscleGroup: "Chest", equipment: "barbell" },
  { id: "bench-press-dumbbell", name: "Bench press (dumbbell)", muscleGroup: "Chest", equipment: "dumbbell" },
  { id: "incline-bench-press-barbell", name: "Incline bench press (barbell)", muscleGroup: "Chest", equipment: "barbell" },
  { id: "incline-bench-press-dumbbell", name: "Incline bench press (dumbbell)", muscleGroup: "Chest", equipment: "dumbbell" },
  { id: "decline-bench-press", name: "Decline bench press (barbell)", muscleGroup: "Chest", equipment: "barbell" },
  { id: "chest-press-machine", name: "Chest press (machine)", muscleGroup: "Chest", equipment: "machine" },
  { id: "pec-fly-machine", name: "Pec fly (machine)", muscleGroup: "Chest", equipment: "machine" },
  { id: "cable-crossover", name: "Cable crossover", muscleGroup: "Chest", equipment: "cable" },
  { id: "push-up", name: "Push-up", muscleGroup: "Chest", equipment: "bodyweight" },
  { id: "dips-chest", name: "Dips (chest focus)", muscleGroup: "Chest", equipment: "bodyweight" },

  // Back
  { id: "deadlift", name: "Deadlift (barbell)", muscleGroup: "Back", equipment: "barbell" },
  { id: "pull-up", name: "Pull-up", muscleGroup: "Back", equipment: "bodyweight" },
  { id: "lat-pulldown", name: "Lat pulldown (cable)", muscleGroup: "Back", equipment: "cable" },
  { id: "seated-row-cable", name: "Seated row (cable)", muscleGroup: "Back", equipment: "cable" },
  { id: "seated-row-machine", name: "Seated row (machine)", muscleGroup: "Back", equipment: "machine" },
  { id: "bent-over-row-barbell", name: "Bent-over row (barbell)", muscleGroup: "Back", equipment: "barbell" },
  { id: "one-arm-row-dumbbell", name: "One-arm row (dumbbell)", muscleGroup: "Back", equipment: "dumbbell" },
  { id: "back-extension", name: "Back extension", muscleGroup: "Back", equipment: "bodyweight" },
  { id: "t-bar-row", name: "T-bar row", muscleGroup: "Back", equipment: "barbell" },

  // Legs
  { id: "squat-barbell", name: "Squat (barbell)", muscleGroup: "Legs", equipment: "barbell" },
  { id: "front-squat", name: "Front squat (barbell)", muscleGroup: "Legs", equipment: "barbell" },
  { id: "leg-press", name: "Leg press (machine)", muscleGroup: "Legs", equipment: "machine" },
  { id: "leg-extension", name: "Leg extension (machine)", muscleGroup: "Legs", equipment: "machine" },
  { id: "leg-curl", name: "Leg curl (machine)", muscleGroup: "Legs", equipment: "machine" },
  { id: "lunges-dumbbell", name: "Lunges (dumbbell)", muscleGroup: "Legs", equipment: "dumbbell" },
  { id: "romanian-deadlift", name: "Romanian deadlift (barbell)", muscleGroup: "Legs", equipment: "barbell" },
  { id: "calf-raise-machine", name: "Calf raise (machine)", muscleGroup: "Legs", equipment: "machine" },
  { id: "hip-thrust", name: "Hip thrust (barbell)", muscleGroup: "Legs", equipment: "barbell" },
  { id: "bodyweight-squat", name: "Bodyweight squat", muscleGroup: "Legs", equipment: "bodyweight" },

  // Shoulders
  { id: "overhead-press-barbell", name: "Overhead press (barbell)", muscleGroup: "Shoulders", equipment: "barbell" },
  { id: "shoulder-press-dumbbell", name: "Shoulder press (dumbbell)", muscleGroup: "Shoulders", equipment: "dumbbell" },
  { id: "shoulder-press-machine", name: "Shoulder press (machine)", muscleGroup: "Shoulders", equipment: "machine" },
  { id: "lateral-raise-dumbbell", name: "Lateral raise (dumbbell)", muscleGroup: "Shoulders", equipment: "dumbbell" },
  { id: "lateral-raise-cable", name: "Lateral raise (cable)", muscleGroup: "Shoulders", equipment: "cable" },
  { id: "front-raise-dumbbell", name: "Front raise (dumbbell)", muscleGroup: "Shoulders", equipment: "dumbbell" },
  { id: "rear-delt-fly-machine", name: "Rear delt fly (machine)", muscleGroup: "Shoulders", equipment: "machine" },
  { id: "face-pull", name: "Face pull (cable)", muscleGroup: "Shoulders", equipment: "cable" },
  { id: "shrugs-barbell", name: "Shrugs (barbell)", muscleGroup: "Shoulders", equipment: "barbell" },

  // Arms
  { id: "bicep-curl-barbell", name: "Bicep curl (barbell)", muscleGroup: "Arms", equipment: "barbell" },
  { id: "bicep-curl-dumbbell", name: "Bicep curl (dumbbell)", muscleGroup: "Arms", equipment: "dumbbell" },
  { id: "hammer-curl-dumbbell", name: "Hammer curl (dumbbell)", muscleGroup: "Arms", equipment: "dumbbell" },
  { id: "cable-curl", name: "Cable curl", muscleGroup: "Arms", equipment: "cable" },
  { id: "tricep-pushdown-cable", name: "Tricep pushdown (cable)", muscleGroup: "Arms", equipment: "cable" },
  { id: "skull-crushers", name: "Skull crushers (barbell)", muscleGroup: "Arms", equipment: "barbell" },
  { id: "overhead-tricep-extension", name: "Overhead tricep extension (dumbbell)", muscleGroup: "Arms", equipment: "dumbbell" },
  { id: "dips-triceps", name: "Dips (triceps focus)", muscleGroup: "Arms", equipment: "bodyweight" },
  { id: "preacher-curl-machine", name: "Preacher curl (machine)", muscleGroup: "Arms", equipment: "machine" },

  // Core
  { id: "plank", name: "Plank", muscleGroup: "Core", equipment: "bodyweight" },
  { id: "hanging-leg-raise", name: "Hanging leg raise", muscleGroup: "Core", equipment: "bodyweight" },
  { id: "cable-woodchopper", name: "Cable woodchopper", muscleGroup: "Core", equipment: "cable" },
  { id: "ab-crunch-machine", name: "Ab crunch (machine)", muscleGroup: "Core", equipment: "machine" },
  { id: "russian-twist", name: "Russian twist", muscleGroup: "Core", equipment: "bodyweight" },
  { id: "sit-up", name: "Sit-up", muscleGroup: "Core", equipment: "bodyweight" },
];

export function searchLibrary(query: string): LibraryExercise[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return EXERCISE_LIBRARY.filter((ex) => ex.name.toLowerCase().includes(q)).slice(0, 8);
}
