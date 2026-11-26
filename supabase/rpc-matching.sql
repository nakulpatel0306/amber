-- RPC functions the dashboards and useMatchData call to load the other side of a match
--
-- Reconstructed in November 2026 from the frontend callers (hooks/useMatchData.ts,
-- dashboard/JobSeekerDashboard.tsx, dashboard/EmployerDashboard.tsx) and the demo stand-in
-- (src/frontend/src/demo/client.ts). The originals lived only in the team's Supabase project
-- and never made it into the repo. This version has not been run against a live project.
--
-- Candidates and employers can't read each other's rows directly: cross-visibility policies
-- referenced each other and recursed (see archive/README.md). These functions use
-- SECURITY DEFINER to read across that boundary, and check the caller themselves instead.

-- ============================================
-- get_employers_for_candidate
-- Every employer that finished the culture quiz, as full rows. Scoring happens client-side.
-- ============================================
CREATE OR REPLACE FUNCTION public.get_employers_for_candidate(candidate_user_id UUID)
RETURNS SETOF public.employers
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.*
  FROM public.employers e
  WHERE e.culture_quiz_completed = TRUE
    AND candidate_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.candidates c WHERE c.user_id = auth.uid());
$$;

-- ============================================
-- get_candidates_for_employer
-- Every candidate with assessment scores, as full rows, excluding the employer themselves.
-- ============================================
CREATE OR REPLACE FUNCTION public.get_candidates_for_employer(employer_user_id UUID)
RETURNS SETOF public.candidates
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.*
  FROM public.candidates c
  WHERE c.openness_score IS NOT NULL
    AND c.user_id <> employer_user_id
    AND employer_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.employers e WHERE e.user_id = auth.uid());
$$;

-- ============================================
-- get_profiles_by_ids
-- Display names for a batch of users, without a self-referencing profiles policy.
-- Previously defined in archive/fix-rls-final.sql.
-- ============================================
CREATE OR REPLACE FUNCTION public.get_profiles_by_ids(user_ids UUID[])
RETURNS TABLE(id UUID, full_name TEXT, email TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.email
  FROM public.profiles p
  WHERE p.id = ANY(user_ids);
$$;

-- Signed-in users only
REVOKE ALL ON FUNCTION public.get_employers_for_candidate(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_candidates_for_employer(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_profiles_by_ids(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_employers_for_candidate(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_candidates_for_employer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_by_ids(UUID[]) TO authenticated;
