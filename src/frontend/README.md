# Amber Frontend

React web application for the Amber platform. Built with React 19, TypeScript, Vite 7, Tailwind CSS 3, and Framer Motion 12. The entry point is `src/main.tsx`, which renders `App.tsx`.

## Application Sections

- **Case study** — The site root: what Amber was, why it is shelved, an animated product tour, an interactive scoring explainer, architecture, lessons and team.
- **Demo** — In demo builds, `/demo` lets visitors pick a side; `src/demo` stands in for Supabase and the backend.
- **Authentication** — Signup, login, OAuth (Google/GitHub), password reset, email verification, role selection, and onboarding.
- **Job Seeker App** — Dashboard, personality assessment, insights, top matches, Ember agent gallery, network hub, connections, coffee chats with real-time messaging (under `/app`).
- **Employer App** — Dashboard, culture quiz, culture insights, role management, candidate browsing, Ember agent, connection inbox, coffee chats with real-time messaging (under `/app/employer`).
- **Settings** — Profile management, appearance, notifications, privacy, account, subscription, and feedback.

## How It Works

### Routing

React Router is configured in `App.tsx`. Routes are organized into three groups:

1. **Public routes** (`/`, `/pricing`, `/auth/*`, and `/demo` in demo builds) — Accessible to everyone. `/pricing` uses `PublicLayout` for the shared nav and footer.
2. **Protected routes** (`/app/*`) — Wrapped in `ProtectedRoute`, which requires authentication and completed onboarding. Role-specific routes use the `allowedRoles` prop to restrict access to either candidates or employers.
3. **Guest-only routes** (`/auth/login`, `/auth/signup`) — Wrapped in `GuestRoute`, which redirects authenticated users to their dashboard.

### Authentication

`AuthContext` wraps the entire app and manages the Supabase Auth session. It handles:
- Session initialization and persistence
- User profile fetching from the `profiles` table
- Onboarding redirect logic (sends incomplete users to the setup wizard)
- Role-based navigation (candidates go to `/app/dashboard`, employers go to `/app/employer`)

`ProtectedRoute` and `GuestRoute` components enforce access rules at the route level.

### Theming

`ThemeContext` manages light/dark mode by setting the theme's color tokens as CSS variables on `:root`. The selected theme is remembered in local storage.

Two built-in themes:
- **Amber Light** — near-white background (`#FAFAFA`) with amber accents
- **Amber Dark** — black background (`#000000`) with amber highlights

### API Communication

Every backend call goes through `apiFetch()` in `utils/api.ts`, which prefixes `VITE_API_URL` (default `http://localhost:8000`) or, in demo builds, hands the request to `src/demo/backend.ts`. Don't call `fetch` with a backend URL directly.

### State Management

- **React Context** — Used for global concerns:
  - `AuthContext` — Authentication, session, profile, onboarding
  - `ThemeContext` — Light/dark mode toggle and persistence
  - `ToastContext` — Success/error/info notification banners
  - `MessagingContext` — Open chat panels, real-time message syncing via Supabase subscriptions, unread counts
  - `ConnectionsContext` — Connection requests (pending/accepted/rejected), sending and managing connections
- **Custom Hooks** — Encapsulate complex data fetching and state logic (see Hooks section below)
- **Local Storage** — Theme preference, sidebar state, dev mode flags
- **Session Storage** — Temporary state like setup modal dismissal

### Real-Time Features

Supabase realtime subscriptions (`postgres_changes`) power:
- **Messages** — Instant message delivery in floating chat panels (INSERT on `messages` table)
- **Connections** — Live inbox updates when connection requests are sent/accepted/rejected
- **Coffee Chats** — Status change notifications

Up to 3 floating chat panels can be open simultaneously with minimize/maximize, unread counts, and timestamp grouping.

## Component Structure

All components are organized by feature domain. There are no loose files at the `components/` root.

```
components/
├── ui/               # Design system primitives
│                     # Button, Input, Modal, Toast, Avatar, AvatarPicker,
│                     # DatePicker, LocationPicker, GradientProgressBar,
│                     # RadarChart, ArchetypeCard, PersonalitySnapshotCard,
│                     # PageBanner, Facts, CoffeeBrewLoader, SplashScreen, AmberLogo
│
├── auth/             # Authentication flow
│                     # LoginPage, SignupPage, AuthShell, AuthCallback,
│                     # PasswordResetPage, EmailVerificationPage,
│                     # RoleSelectionPage, Onboarding, ProtectedRoute (and GuestRoute)
│
├── landing/          # Case-study landing page
│                     # CaseStudy, HeroRadar, FeatureBento, MatchingExplainer,
│                     # ArchitectureDiagram, Section, LandingNav, LandingFooter
│
├── layout/           # App shell
│                     # AppLayout, PublicLayout, Sidebar, MobileTopBar,
│                     # NotificationDropdown, BookmarkDropdown, ErrorBoundary,
│                     # RouteTitleSync
│
├── candidate/        # Job seeker features
│                     # Assessment, AssessmentFlow, AssessmentResults,
│                     # PersonalityInsights, CandidateSetupModal
│
├── employer/         # Employer features
│                     # CultureQuiz, CultureAssessment, CultureInsights,
│                     # EmployerAssessmentResults, CreateRole, ManageRoles,
│                     # TopCandidates, EmployerSetupModal
│
├── dashboard/        # Role-specific dashboards
│                     # JobSeekerDashboard, EmployerDashboard, DashboardHeader,
│                     # ArchetypeStrip, EmployerArchetypeStrip, MatchingTable,
│                     # EmployerCandidateTable, RankedList, SummaryCard
│
├── ember/            # Ember agent interface
│                     # EmberAgent (match gallery), EmberEmployerPage,
│                     # TopMatchCard, EmberFirefly (mascot),
│                     # gallery/: PlayerCard, PlayerCardGrid, GalleryFilterBar,
│                     # DeepDive, CompareView, CoffeeBrewModal
│
├── assessments/      # Supplementary assessments
│                     # VisualPerception, WorkValues, SituationalJudgment,
│                     # CognitivePattern (candidate); TeamDynamics,
│                     # LeadershipStyle, GrowthPhilosophy, WorkEnvironment
│                     # (employer); shared QuestionParts and results template
│
├── coffee-chats/     # Coffee chat scheduling and management
│                     # CandidateCoffeeChats, EmployerCoffeeChats,
│                     # CoffeeChatsCalendar, CoffeeChatCard, CoffeeChatDetailModal,
│                     # CoffeeChatPrep, CoffeeChatFollowUp, ScheduleModal,
│                     # AcceptWithDateModal, FeedbackModal, RequestsButton
│
├── connections/      # Connection system
│                     # InboxPanel, ConnectModal, ConnectButton
│
├── network/          # Network hub
│                     # NetworkHub, FilterBar, PostCard, PostSkeleton,
│                     # NewPostModal, ProfileEditModal, PracticeCoffeeChat
│
├── matches/          # Saved-match pipeline
│                     # MatchPipeline, PipelineCard, MatchDetailModal
│
├── messaging/        # Real-time messaging
│                     # MessagePanelContainer (floating panel manager), MessagePanel
│
├── pricing/          # Subscription and billing
│                     # PricingPage, BillingSuccessPage, BillingCancelPage
│
├── pages/            # RolesPage (/app/roles), NotFoundPage
│
└── settings/         # Settings sections
                      # SettingsPage, ProfileSection, AccountSection,
                      # CandidateProfileSection, EmployerProfileSection,
                      # AppearanceSection, NotificationSection, PrivacySection,
                      # SubscriptionSection, FeedbackSection
```

Components are imported from their own files. A few folders (`auth`, `landing` and others) also have an `index.ts` barrel.

## Hooks

Custom hooks in `src/hooks/`:

| Hook | Purpose |
|------|---------|
| `useMatchData` (`useMatchData.ts`) | Load candidate or employer match data with compatibility calculations. Fetches profiles from Supabase and runs scoring. |
| `useSavedMatches` (`useSavedMatches.ts`) | Load, save, and manage bookmarked matches with status tracking |
| `usePageTitle` (`usePageTitle.ts`) | Set the document title for a page |
| `useDialogFocus` (`useDialogFocus.ts`) | Dialog keyboard behavior: focus trap, Escape to close, focus return |

`useMinLoader`, which keeps a loader on screen long enough to avoid a flash, lives next to the loader in `components/ui/CoffeeBrewLoader.tsx`.

Context-based hooks (accessed via their respective contexts):
| Hook | Context | Purpose |
|------|---------|---------|
| `useAuth()` | `AuthContext` | Access auth state, session, profile, sign in/out methods |
| `useMessaging()` | `MessagingContext` | Open/close chat panels, send messages, mark as read |
| `useConnections()` | `ConnectionsContext` | Send/accept/reject connections, list connections by status |

## Other Key Folders

| Folder | Purpose |
|--------|---------|
| `contexts/` | 5 React context providers: Auth, Theme, Toast, Messaging, Connections |
| `lib/` | Supabase client initialization (`supabase.ts`, which returns the demo stand-in in demo builds), TypeScript port of the scoring engine and Ember agent (`ember/`), personality engine (`personalityEngine.ts`), compatibility scoring (`compatibilityScoring.ts`), archetype definitions (`archetypes.ts`), archetype compatibility matrix (`archetypeCompatibility.ts`), Stripe configuration (`stripe/`) |
| `types/` | TypeScript type definitions: `auth.types.ts` (user, session), `matching.types.ts` (OCEAN scores, compatibility), `connections.types.ts` (connection, meet invite), `database.types.ts` (Supabase table shapes) |
| `utils/` | `api.ts` (backend HTTP client with auth headers), `cn.ts` (class name utility using clsx + tailwind-merge), `constants.ts` (app-wide constants), `motion.ts` (Framer Motion presets: emberFadeUp, emberStagger), `matchHelpers.ts` (match score formatting), `coffeeChatStatus.ts` (status labels and colors) |
| `data/` | Assessment question definitions with trait mappings and scoring weights, employer archetypes, hobbies |
| `styles/` | Global CSS with Tailwind directives and CSS variable definitions for theming (light/dark) |

## Environment Variables

Copy `src/frontend/.env.example` to `src/frontend/.env` and set:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `VITE_API_URL` | FastAPI base URL (default `http://localhost:8000`) |
| `VITE_STRIPE_PRICE_*` | Optional Stripe price IDs for the eight paid plan and interval combinations |

The demo build needs no environment variables.

## Demo Mode

`npm run dev:demo` and `npm run build:demo` use Vite's `demo` mode: `VITE_DEMO=1`, base path `/amber/`, and a `404.html` copy of `index.html` for GitHub Pages deep links. `src/demo/` holds the stand-ins (`client.ts`, `query.ts`, `backend.ts`), the localStorage store and seed data, automatic replies from seeded people, the banner and the `/demo` role picker. Production code reaches it only through `lib/supabase.ts` and `utils/api.ts`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server (default: http://localhost:5173) |
| `npm run dev:demo` | Start the browser-only demo at http://localhost:5173/amber/ |
| `npm run build` | Type-check with TypeScript and build for production (output: `dist/`) |
| `npm run build:demo` | Build the GitHub Pages demo into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest: scoring, archetypes, Python parity, demo adapter |
| `npm run lint` | Run ESLint on all TypeScript and TSX files |
| `npm run format` | Format all source files with Prettier |

## Design Conventions

- **Tailwind CSS** is used for all styling, with theme-aware colors read from the CSS variables `ThemeContext` sets.
- **Sentence case** for in-app labels and headings, Inter as the only typeface, and the named type scale in `tailwind.config.js`.
- Cards use the `.bento-card` class and buttons use `ui/Button`. The `components/ui/` folder holds the other primitives; use them instead of one-off styled elements.
- New components go in the appropriate feature folder.
- **Framer Motion** is used for all animations. Shared presets are defined in `utils/motion.ts` (`emberFadeUp`, `emberStagger`, etc.).

## Ember Agent

The Ember agent UI (`components/ember/`) provides the frontend interface for the matching engine:

- **Animated Flame Mascot** — `EmberFirefly` renders the Ember character with mood-based animations (neutral, happy, thinking, excited).
- **Dimension Bars** — Side-by-side comparison of candidate vs. employer OCEAN scores.
- **Gallery** — A card grid with filter and sort controls (best match, culture fit, work style, recent), plus `CompareView` for side-by-side matches.
- **Deep Dive Modals** — `CoffeeBrewModal` and `DeepDive` for detailed match analysis with trait breakdowns and insights.
- **Candidate View** (`EmberAgent`) — Ranked employer/role matches with compatibility insights.
- **Employer View** (`EmberEmployerPage`) — Ranked candidate matches with culture fit analysis.
- **Client-Side Scoring** — Match lists are scored in the browser with `lib/ember`, the TypeScript port of the backend engine, so they show the same numbers as the API.
