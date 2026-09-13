export type Equipment = string;

export type LibraryExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: Equipment;
  image: string;
};

// Exercise data and images by RepDB (repdb.co), used under RepDB's free-tier
// license (personal/commercial in-app use with attribution). See ATTRIBUTION.
export const EXERCISE_LIBRARY: LibraryExercise[] = [
  { id: "bench-press-barbell", name: "Bench press (barbell)", muscleGroup: "Chest", equipment: "barbell", image: "/exercise-images/bench-press-barbell.webp" },
  { id: "bench-press-dumbbell", name: "Bench press (dumbbell)", muscleGroup: "Chest", equipment: "dumbbell", image: "/exercise-images/bench-press-dumbbell.webp" },
  { id: "incline-bench-press-barbell", name: "Incline bench press (barbell)", muscleGroup: "Chest", equipment: "barbell", image: "/exercise-images/incline-bench-press-barbell.webp" },
  { id: "incline-bench-press-dumbbell", name: "Incline bench press (dumbbell)", muscleGroup: "Chest", equipment: "dumbbell", image: "/exercise-images/incline-bench-press-dumbbell.webp" },
  { id: "decline-bench-press-barbell", name: "Decline bench press (barbell)", muscleGroup: "Chest", equipment: "barbell", image: "/exercise-images/decline-bench-press-barbell.webp" },
  { id: "chest-press-cable", name: "Chest press (cable)", muscleGroup: "Chest", equipment: "cable", image: "/exercise-images/chest-press-cable.webp" },
  { id: "cable-fly", name: "Cable fly", muscleGroup: "Chest", equipment: "cable", image: "/exercise-images/cable-fly.webp" },
  { id: "dumbbell-fly", name: "Dumbbell fly", muscleGroup: "Chest", equipment: "dumbbell", image: "/exercise-images/dumbbell-fly.webp" },
  { id: "push-up", name: "Push-up", muscleGroup: "Chest", equipment: "bodyweight", image: "/exercise-images/push-up.webp" },
  { id: "chest-dips", name: "Chest dips", muscleGroup: "Chest", equipment: "dip_station", image: "/exercise-images/chest-dips.webp" },
  { id: "deadlift-barbell", name: "Deadlift (barbell)", muscleGroup: "Back", equipment: "barbell", image: "/exercise-images/deadlift-barbell.webp" },
  { id: "pull-up", name: "Pull-up", muscleGroup: "Back", equipment: "pull_up_bar", image: "/exercise-images/pull-up.webp" },
  { id: "lat-pulldown", name: "Lat pulldown", muscleGroup: "Back", equipment: "cable", image: "/exercise-images/lat-pulldown.webp" },
  { id: "seated-row-cable", name: "Seated row (cable)", muscleGroup: "Back", equipment: "cable", image: "/exercise-images/seated-row-cable.webp" },
  { id: "bent-over-row-barbell", name: "Bent-over row (barbell)", muscleGroup: "Back", equipment: "barbell", image: "/exercise-images/bent-over-row-barbell.webp" },
  { id: "bent-over-row-dumbbell", name: "Bent-over row (dumbbell)", muscleGroup: "Back", equipment: "dumbbell", image: "/exercise-images/bent-over-row-dumbbell.webp" },
  { id: "back-extension", name: "Back extension", muscleGroup: "Back", equipment: "bodyweight", image: "/exercise-images/back-extension.webp" },
  { id: "t-bar-row", name: "T-bar row", muscleGroup: "Back", equipment: "barbell", image: "/exercise-images/t-bar-row.webp" },
  { id: "squat-barbell", name: "Squat (barbell)", muscleGroup: "Legs", equipment: "barbell", image: "/exercise-images/squat-barbell.webp" },
  { id: "front-squat-barbell", name: "Front squat (barbell)", muscleGroup: "Legs", equipment: "barbell", image: "/exercise-images/front-squat-barbell.webp" },
  { id: "leg-press-machine", name: "Leg press (machine)", muscleGroup: "Legs", equipment: "leg_press", image: "/exercise-images/leg-press-machine.webp" },
  { id: "leg-extension-machine", name: "Leg extension (machine)", muscleGroup: "Legs", equipment: "leg_extension", image: "/exercise-images/leg-extension-machine.webp" },
  { id: "leg-curl-machine", name: "Leg curl (machine)", muscleGroup: "Legs", equipment: "leg_curl", image: "/exercise-images/leg-curl-machine.webp" },
  { id: "lunges-dumbbell", name: "Lunges (dumbbell)", muscleGroup: "Legs", equipment: "dumbbell", image: "/exercise-images/lunges-dumbbell.webp" },
  { id: "romanian-deadlift-barbell", name: "Romanian deadlift (barbell)", muscleGroup: "Legs", equipment: "barbell", image: "/exercise-images/romanian-deadlift-barbell.webp" },
  { id: "calf-raise-barbell", name: "Calf raise (barbell)", muscleGroup: "Legs", equipment: "barbell", image: "/exercise-images/calf-raise-barbell.webp" },
  { id: "hip-thrust-barbell", name: "Hip thrust (barbell)", muscleGroup: "Legs", equipment: "barbell", image: "/exercise-images/hip-thrust-barbell.webp" },
  { id: "bodyweight-squat", name: "Bodyweight squat", muscleGroup: "Legs", equipment: "bodyweight", image: "/exercise-images/bodyweight-squat.webp" },
  { id: "overhead-press-barbell", name: "Overhead press (barbell)", muscleGroup: "Shoulders", equipment: "barbell", image: "/exercise-images/overhead-press-barbell.webp" },
  { id: "shoulder-press-dumbbell", name: "Shoulder press (dumbbell)", muscleGroup: "Shoulders", equipment: "dumbbell", image: "/exercise-images/shoulder-press-dumbbell.webp" },
  { id: "lateral-raise-dumbbell", name: "Lateral raise (dumbbell)", muscleGroup: "Shoulders", equipment: "dumbbell", image: "/exercise-images/lateral-raise-dumbbell.webp" },
  { id: "lateral-raise-cable", name: "Lateral raise (cable)", muscleGroup: "Shoulders", equipment: "cable", image: "/exercise-images/lateral-raise-cable.webp" },
  { id: "front-raise-dumbbell", name: "Front raise (dumbbell)", muscleGroup: "Shoulders", equipment: "dumbbell", image: "/exercise-images/front-raise-dumbbell.webp" },
  { id: "face-pull-cable", name: "Face pull (cable)", muscleGroup: "Shoulders", equipment: "cable", image: "/exercise-images/face-pull-cable.webp" },
  { id: "shrugs-dumbbell", name: "Shrugs (dumbbell)", muscleGroup: "Shoulders", equipment: "dumbbell", image: "/exercise-images/shrugs-dumbbell.webp" },
  { id: "shrugs-barbell", name: "Shrugs (barbell)", muscleGroup: "Shoulders", equipment: "barbell", image: "/exercise-images/shrugs-barbell.webp" },
  { id: "bicep-curl-barbell", name: "Bicep curl (barbell)", muscleGroup: "Arms", equipment: "barbell", image: "/exercise-images/bicep-curl-barbell.webp" },
  { id: "bicep-curl-dumbbell", name: "Bicep curl (dumbbell)", muscleGroup: "Arms", equipment: "dumbbell", image: "/exercise-images/bicep-curl-dumbbell.webp" },
  { id: "hammer-curl-dumbbell", name: "Hammer curl (dumbbell)", muscleGroup: "Arms", equipment: "dumbbell", image: "/exercise-images/hammer-curl-dumbbell.webp" },
  { id: "cable-curl", name: "Cable curl", muscleGroup: "Arms", equipment: "cable", image: "/exercise-images/cable-curl.webp" },
  { id: "tricep-pushdown-cable", name: "Tricep pushdown (cable)", muscleGroup: "Arms", equipment: "cable", image: "/exercise-images/tricep-pushdown-cable.webp" },
  { id: "skull-crushers-barbell", name: "Skull crushers (barbell)", muscleGroup: "Arms", equipment: "barbell", image: "/exercise-images/skull-crushers-barbell.webp" },
  { id: "overhead-tricep-extension", name: "Overhead tricep extension", muscleGroup: "Arms", equipment: "dumbbell", image: "/exercise-images/overhead-tricep-extension.webp" },
  { id: "bench-dips", name: "Bench dips", muscleGroup: "Arms", equipment: "bodyweight", image: "/exercise-images/bench-dips.webp" },
  { id: "hanging-leg-raise", name: "Hanging leg raise", muscleGroup: "Core", equipment: "pull_up_bar", image: "/exercise-images/hanging-leg-raise.webp" },
  { id: "cable-crunch", name: "Cable crunch", muscleGroup: "Core", equipment: "cable", image: "/exercise-images/cable-crunch.webp" },
  { id: "russian-twist", name: "Russian twist", muscleGroup: "Core", equipment: "bodyweight", image: "/exercise-images/russian-twist.webp" },
  { id: "crunches", name: "Crunches", muscleGroup: "Core", equipment: "bodyweight", image: "/exercise-images/crunches.webp" },
  { id: "bicycle-crunch", name: "Bicycle crunch", muscleGroup: "Core", equipment: "bodyweight", image: "/exercise-images/bicycle-crunch.webp" },
  { id: "plank", name: "Plank", muscleGroup: "Core", equipment: "bodyweight", image: "/exercise-images/plank.webp" },
];

export function searchLibrary(query: string): LibraryExercise[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return EXERCISE_LIBRARY.filter((ex) => ex.name.toLowerCase().includes(q)).slice(0, 8);
}