-- OPTIONAL, run ONCE in the Supabase SQL editor, right after deploying.
-- Old logs for exercises currently set to lbs were stored converted to kg.
-- This turns them back into the lbs numbers you originally typed.
UPDATE logs
SET weight = ROUND((logs.weight * 2.20462)::numeric, 1)
FROM exercises
WHERE exercises.id = logs.exercise_id AND exercises.preferred_unit = 'lbs';
