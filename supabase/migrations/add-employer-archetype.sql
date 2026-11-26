-- Migration: employers.archetype_name
-- The Ember agent adds an archetype-pair bonus (-10 to +10) using the employer's archetype name
-- (ember_agent.py and lib/ember/agent.ts read employers.archetype_name). The column was never in
-- schema.sql, so outside the demo the bonus was always 0.
--
-- Reconstructed in November 2026 and not run against a live project. A trigger keeps the name in
-- sync with the employer's OCEAN preferences, using the trait ranges and fit formula from
-- src/frontend/src/data/employerArchetypes.ts (best-scoring archetype wins, ties go to the
-- earlier entry in that file).

ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS archetype_name TEXT;

CREATE OR REPLACE FUNCTION public.employer_archetype_for(
  o INTEGER, c INTEGER, e INTEGER, a INTEGER, n INTEGER
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  WITH archetypes(ord, name, o_min, o_max, c_min, c_max, e_min, e_max, a_min, a_max, n_min, n_max) AS (
    VALUES
      (1, 'The Innovator',    70, 100, 30,  70, 40,  80, 40,  70, 20, 50),
      (2, 'The Optimizer',    30,  60, 70, 100, 30,  60, 50,  80, 20, 50),
      (3, 'The Collaborator', 40,  70, 50,  80, 50,  90, 70, 100, 30, 60),
      (4, 'The Driver',       40,  70, 60,  90, 60, 100, 30,  60, 20, 50),
      (5, 'The Stabilizer',   20,  50, 60,  90, 30,  60, 50,  80, 10, 40),
      (6, 'The Visionary',    70, 100, 40,  70, 60,  90, 40,  70, 20, 50),
      (7, 'The Nurturer',     50,  80, 50,  80, 40,  70, 70, 100, 30, 60),
      (8, 'The Challenger',   60,  90, 50,  80, 50,  80, 20,  50, 30, 60)
  ),
  -- Same as `scores[trait] || 50` in the TypeScript: missing or 0 counts as 50
  input AS (
    SELECT COALESCE(NULLIF(o, 0), 50)::NUMERIC AS o,
           COALESCE(NULLIF(c, 0), 50)::NUMERIC AS c,
           COALESCE(NULLIF(e, 0), 50)::NUMERIC AS e,
           COALESCE(NULLIF(a, 0), 50)::NUMERIC AS a,
           COALESCE(NULLIF(n, 0), 50)::NUMERIC AS n
  ),
  fits AS (
    SELECT ar.ord, ar.name, t.score, t.lo, t.hi
    FROM archetypes ar, input i,
    LATERAL (VALUES
      (i.o, ar.o_min, ar.o_max),
      (i.c, ar.c_min, ar.c_max),
      (i.e, ar.e_min, ar.e_max),
      (i.a, ar.a_min, ar.a_max),
      (i.n, ar.n_min, ar.n_max)
    ) AS t(score, lo, hi)
  )
  SELECT name
  FROM fits
  GROUP BY ord, name
  ORDER BY AVG(
    CASE
      WHEN score BETWEEN lo AND hi
        THEN 100 - (ABS(score - (lo + hi) / 2.0) / ((hi - lo) / 2.0)) * 30
      ELSE GREATEST(0, 70 - CASE WHEN score < lo THEN lo - score ELSE score - hi END)
    END
  ) DESC, ord
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.set_employer_archetype_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.openness_preference IS NULL THEN
    NEW.archetype_name := NULL;
  ELSE
    NEW.archetype_name := public.employer_archetype_for(
      NEW.openness_preference,
      NEW.conscientiousness_preference,
      NEW.extraversion_preference,
      NEW.agreeableness_preference,
      NEW.neuroticism_preference
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_employers_archetype_name ON public.employers;
CREATE TRIGGER trigger_employers_archetype_name
  BEFORE INSERT OR UPDATE OF openness_preference, conscientiousness_preference,
    extraversion_preference, agreeableness_preference, neuroticism_preference
  ON public.employers
  FOR EACH ROW EXECUTE FUNCTION public.set_employer_archetype_name();

-- Backfill existing employers
UPDATE public.employers
SET archetype_name = public.employer_archetype_for(
  openness_preference, conscientiousness_preference, extraversion_preference,
  agreeableness_preference, neuroticism_preference
)
WHERE openness_preference IS NOT NULL;
