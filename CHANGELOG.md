# Changelog

All notable changes to Amber are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-11-26

### Added
- `supabase/rpc-matching.sql` and `supabase/migrations/add-employer-archetype.sql`, reconstructed from the frontend because the originals never made it into the repo. Untested against a live Supabase project.
- `src/frontend/.env.example`.

### Changed
- Landing page: an interactive fit radar replaces the hero cards, with more color and card-based sections, and a refreshed link preview and screenshot.
- Demo: "Skip with a sample profile" writes a distinct personality or culture profile, so matches spread out instead of all landing near 80%. Each role gets a past chat awaiting feedback and an upcoming one. Employers reach Roles from the sidebar, the network feed draws hobby tiles instead of hotlinked photos, and chat panels name the person, not just the company.
- Every displayed match score comes from one function (engine score plus archetype bonus), so the dashboard, Ember and deep dive agree.
- Pricing is presented as the plans we had planned, without a live checkout.
- Backend logs through `logging` instead of `print`, CORS no longer lists the removed Tauri origins, and the frontend lints against `console.log`.
- Supabase: the one-off `fix-*` scripts moved to `supabase/archive/` with a README on the RLS recursion they were fixing; seed data uses fictional companies and placeholder passwords.
- Docs corrected against the code: scoring math, assessment counts, Node 20.19+ requirement, env var lists, and the roadmap without invented figures. Contributing notes say the project is shelved.

### Fixed
- Employer culture archetypes were the same for every company because the classifier was handed the wrong keys.
- A company could show three different archetypes on different screens; it now shows its culture archetype everywhere.
- The deep dive read stability as neuroticism, inverting its trait insights, and addressed employers as if they were the candidate.
- Primary buttons lost their text color at small sizes (a class-merge bug), failing contrast in both themes.
- The network feed's job seeker label and filter never matched, and past chats were labelled as booked.

### Removed
- Unused backend Python dependencies and an unsourced research citation.
- Unused frontend components, hooks, barrel files, seed scripts and dependencies (zustand, @stripe/stripe-js, @tailwindcss/typography).
- `supabase/update-real-companies.sql`, RLS diagnostic scripts, frontend scripts that hard-coded a Supabase project, and `.cursorrules`.

## [1.0.0] - 2026-11-24

The case study. Amber is shelved and will not launch; this release turns the repository into a portfolio piece with a working demo at https://nakulpatel0306.github.io/amber/.

### Design
- One typeface (Inter) with a defined type scale, one card and button system, sentence case throughout, and quieter screens: dashboards reduced to archetype, matches and coffee chats; decorative widgets, glows, serif and italic accents removed.
- Landing page reorganized as a story: the problem, what we built (with a product tour), how matching works, where it was going, why it is shelved, what we learned and the team.
- Link previews (Open Graph image and tags), a touch icon, page titles, a not-found page, and restyled sign-in pages.
- Accessibility: labelled icon buttons, focus trapping in dialogs, reduced-motion support, and WCAG AA contrast for muted text and the accent in both themes.
- Lazy-loaded layouts and split vendor chunks, so the landing page loads less JavaScript.

### Added
- Browser-only demo mode (`VITE_DEMO=1`, `npm run build:demo`): in-browser stand-ins for supabase-js and the FastAPI client behind one seam, fictional seed data, automatic replies from seeded people, a demo banner with Reset, and a role picker at `/demo`.
- Case-study landing page at the site root, with an interactive explainer that runs the real scoring engine.
- `src/frontend/src/lib/ember/`: a line-for-line TypeScript port of the Python engine and Ember agent, and `tests/fixtures/ember-parity.json` checked by both pytest and vitest.
- Backend pytest suite, frontend vitest suite, ESLint config, `test.yml` CI and `pages.yml` GitHub Pages deploy.
- Self-hosted fonts.
- `docs/ARCHITECTURE.md`, an end-to-end architecture overview.
- `LICENSE` (MIT), `CONTRIBUTING.md`, this changelog and a pull request template.

### Changed
- Frontend scoring and archetype classification now use the TypeScript port, so client-side scores match the API exactly.
- All backend calls go through `apiFetch()` in `utils/api.ts` with `VITE_API_URL`, replacing hard-coded hosts.
- Ember insight values are listed in sorted order, so the message is stable between runs.

### Fixed
- Candidates could not leave coffee chat feedback: the modal existed but nothing opened it.
- Dashboard archetype could differ from the Ember page's archetype; the assessment now saves the Ember archetype first.
- Employer invites from Top Candidates showed "Unknown" because names were not stored on the chat.
- An archetype-pair note differed between the Python and TypeScript matrices.
- Documentation counts: culture values (17 → 20), culture-quiz questions (7 → 8), and the `globals.css` path in `CONTRIBUTING.md`.

### Removed
- Waitlist (modal, seeded counter, migration), social links, real-company logos, unsourced statistics and pages that implied a live service (blog, careers, press, status, changelog, help and legal pages).
- Unused Tauri starter files, Firebase hosting config and empty test folders.

## [0.1.0] - Initial development

Pre-release baseline built during 2026. All features below were implemented; the product was never released.

### Added
- **Frontend**: React 19 + TypeScript + Vite 7 app with Tailwind 3 and Framer Motion 12.
- **Backend**: Python 3.11 + FastAPI service with 38 API endpoints spanning auth, assessments, candidate/employer management, matching, Ember agent, coffee chats, connections, feedback, and Stripe billing.
- **Database**: Supabase (PostgreSQL) schema with 20+ tables, Row Level Security policies, and migration/seed files.
- **Matching engine**: OCEAN-based compatibility scoring with 8 archetypes and an 8×8 archetype compatibility matrix.
- **Assessments**: 16-question scenario-based Big Five assessment (and an earlier 10-question API flow), plus supplementary candidate and employer assessment types.
- **Ember agent**: rule-based compatibility analysis and ranking for candidates and employers.
- **Connections**: connection requests with optional meeting invites; accepted connections unlock coffee chats.
- **Coffee chats**: lifecycle (requested → scheduled → completed) with feedback and ratings.
- **Network hub**: role, people, and company discovery surfaces.
- **Realtime**: Supabase `postgres_changes` subscriptions for messages, connections, and coffee chats.
- **Auth**: Supabase Auth with Email, Google OAuth, and GitHub OAuth.
- **Payments**: Stripe checkout, customer portal, and webhook handling (with graceful demo-data fallback when unconfigured).
- **Documentation**: root `README.md`, `BLUEPRINT.md`, `FEATURES.md`, and per-area READMEs under `src/frontend/`, `src/backend/`, and `supabase/`.

[Unreleased]: https://github.com/nakulpatel0306/amber/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/nakulpatel0306/amber/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/nakulpatel0306/amber/releases/tag/v1.0.0
