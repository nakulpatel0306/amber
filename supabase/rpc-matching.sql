-- RPC functions the dashboards and useMatchData call to load the other side of a match
--
-- Reconstructed in November 2026 from the frontend callers (hooks/useMatchData.ts,
-- dashboard/JobSeekerDashboard.tsx, dashboard/EmployerDashboard.tsx, pages/RolesPage.tsx) and
-- the demo stand-in (src/frontend/src/demo/client.ts). The originals lived only in the team's
-- Supabase project and never made it into the repo. This version has not been run against a
-- live project.
--
-- Run after migrations/add-employer-archetype.sql: get_employers_for_candidate returns
-- employers.archetype_name.
--
-- Candidates and employers can't read each other's rows directly: cross-visibility policies
-- referenced each other and recursed (see archive/README.md). These functions use
-- SECURITY DEFINER to read across that boundary, so each one checks the caller's role itself
-- and returns only the columns the matching UI reads: no salaries, contact links, emails or
-- raw assessment JSON.
--
-- Caveat on the role check: profiles.role is chosen by the user (RoleSelectionPage upserts it
-- from the browser, and the "Users can update own profile" policy in rls-policies.sql allows
-- any column of your own row to change). So the check stops a candidate account from calling
-- the employer function by accident, but anyone can sign up as either side. The column lists
-- are the real limit on what these functions expose.

-- ============================================
-- get_employers_for_candidate
-- Employers that finished the culture quiz. Scoring happens client-side.
-- ============================================
-- Dropped first because CREATE OR REPLACE cannot change a return type
DROP FUNCTION IF EXISTS public.get_employers_for_candidate(UUID);
CREATE OR REPLACE FUNCTION public.get_employers_for_candidate(candidate_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  company_name TEXT,
  company_website TEXT,
  company_logo_url TEXT,
  company_size TEXT,
  industry TEXT,
  description TEXT,
  location TEXT,
  culture_values TEXT[],
  openness_preference INTEGER,
  conscientiousness_preference INTEGER,
  extraversion_preference INTEGER,
  agreeableness_preference INTEGER,
  neuroticism_preference INTEGER,
  culture_quiz_completed BOOLEAN,
  archetype_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.user_id, e.company_name, e.company_website, e.company_logo_url,
         e.company_size, e.industry, e.description, e.location, e.culture_values,
         e.openness_preference, e.conscientiousness_preference, e.extraversion_preference,
         e.agreeableness_preference, e.neuroticism_preference, e.culture_quiz_completed,
         e.archetype_name, e.created_at
  FROM public.employers e
  WHERE e.culture_quiz_completed = TRUE
    AND candidate_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.candidates c ON c.user_id = p.id
      WHERE p.id = auth.uid() AND p.role = 'candidate'
    );
$$;

-- ============================================
-- get_candidates_for_employer
-- Candidates with assessment scores, excluding the employer themselves.
-- ============================================
-- Dropped first because CREATE OR REPLACE cannot change a return type
DROP FUNCTION IF EXISTS public.get_candidates_for_employer(UUID);
CREATE OR REPLACE FUNCTION public.get_candidates_for_employer(employer_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  headline TEXT,
  location TEXT,
  openness_score INTEGER,
  conscientiousness_score INTEGER,
  extraversion_score INTEGER,
  agreeableness_score INTEGER,
  neuroticism_score INTEGER,
  top_traits TEXT[],
  preferred_work_style TEXT,
  assessment_status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.user_id, c.headline, c.location,
         c.openness_score, c.conscientiousness_score, c.extraversion_score,
         c.agreeableness_score, c.neuroticism_score, c.top_traits,
         c.preferred_work_style, c.assessment_status, c.created_at
  FROM public.candidates c
  WHERE c.openness_score IS NOT NULL
    AND c.user_id <> employer_user_id
    AND employer_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.employers e ON e.user_id = p.id
      WHERE p.id = auth.uid() AND p.role = 'employer'
    );
$$;

-- ============================================
-- get_profiles_by_ids
-- Display names for the other side of a match list, without a self-referencing profiles
-- policy. Every caller only reads id and full_name, so no email. Resolves your own profile,
-- employers when you're a candidate, and assessed candidates when you're an employer;
-- other ids are silently dropped. (An earlier version in archive/fix-rls-final.sql returned
-- email for any id.)
-- ============================================
-- Dropped first because CREATE OR REPLACE cannot change a return type
DROP FUNCTION IF EXISTS public.get_profiles_by_ids(UUID[]);
CREATE OR REPLACE FUNCTION public.get_profiles_by_ids(user_ids UUID[])
RETURNS TABLE(id UUID, full_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH viewer AS (
    SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
  )
  SELECT p.id, p.full_name
  FROM public.profiles p, viewer v
  WHERE p.id = ANY(user_ids)
    AND (
      p.id = auth.uid()
      OR (v.role = 'candidate' AND p.role = 'employer'
          AND EXISTS (SELECT 1 FROM public.employers e WHERE e.user_id = p.id))
      OR (v.role = 'employer' AND p.role = 'candidate'
          AND EXISTS (SELECT 1 FROM public.candidates c
                      WHERE c.user_id = p.id AND c.openness_score IS NOT NULL))
    );
$$;

-- Signed-in users only
REVOKE ALL ON FUNCTION public.get_employers_for_candidate(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_candidates_for_employer(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_profiles_by_ids(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_employers_for_candidate(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_candidates_for_employer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_by_ids(UUID[]) TO authenticated;
