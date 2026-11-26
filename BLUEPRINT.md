# Blueprint - The Roadmap We Had

> **Status:** Amber was shelved in 2026 and will not launch. This is the product blueprint as we wrote it while building: what shipped, and the roadmap we planned but never built. It is kept as a record of the thinking, not a plan. For the current state of the code see the [README](./README.md).

---

## The Premise

Hiring mostly matches on keywords and job titles, while culture fit shows up only after someone starts, in exit interviews and anonymous reviews.

Amber set out to put personality science and culture intelligence at the center of the hiring process. Not as a bolt-on filter, but as the **foundation** of every match, connection and hire.

The core thesis: **if you measure who someone is — how they think, communicate, collaborate, and what they value — and compare that against the real culture of a team, you can predict whether they'll thrive before they ever submit a resume.**

---

## Table of Contents

- [What Amber Shipped](#what-amber-shipped)
  - [The Matching Engine](#the-matching-engine)
  - [The Ember Agent](#the-ember-agent)
  - [The Assessment System](#the-assessment-system)
  - [The Coffee Chat System](#the-coffee-chat-system)
  - [The Connection System](#the-connection-system)
  - [Authentication and Accounts](#authentication-and-accounts)
  - [Payments Infrastructure](#payments-infrastructure)
  - [The Design System](#the-design-system)
  - [The Tech Stack](#the-tech-stack)
  - [API Surface](#api-surface)
  - [Database Architecture](#database-architecture)
- [Where Amber Was Going (never built)](#where-amber-was-going-never-built)
  - [Phase 1: Conversational Ember AI](#phase-1-conversational-ember-ai)
  - [Phase 2: Team DNA Mapping](#phase-2-team-dna-mapping)
  - [Phase 3: Culture Verification Layer](#phase-3-culture-verification-layer)
  - [Phase 4: Predictive Retention Intelligence](#phase-4-predictive-retention-intelligence)
  - [Phase 5: Passive Culture Signals](#phase-5-passive-culture-signals)
  - [Phase 6: Blind Culture Matching](#phase-6-blind-culture-matching)
  - [Additional Roadmap Features](#additional-roadmap-features)
- [Styling Direction](#styling-direction)

---

## What Amber Shipped

### The Matching Engine

The compatibility engine is the mathematical backbone of Amber. It lives in `src/backend/engine/compatibility.py` and calculates match scores across four independent dimensions, then blends them into a single 0–100 overall score.

#### How Scoring Works

**1. Trait Match Score (40% of overall)**

Measures how closely a candidate's Big Five (OCEAN) scores align with the employer's stated personality preferences. Uses weighted Euclidean distance across all five dimensions:

- Each OCEAN dimension (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) is scored 0–100
- The engine computes the absolute difference per dimension, then calculates the Euclidean distance across all five
- That distance is normalized against the theoretical maximum (all dimensions 100 points apart) to produce a 0–100 score where 100 = perfect alignment
- Each dimension contributes equally (20% weight)
- Individual per-dimension fit scores are also returned in the breakdown for display

**2. Culture Match Score (30% of overall)**

A composite of three sub-scores:

- **Work Style Compatibility (30% of culture score)** — Compares candidate's preferred work style (remote, hybrid, onsite, flexible) against the role's work style. Exact match = 100, flexible on either side = 85, hybrid adjacent = 65, full mismatch = 40.
- **Culture Values Alignment (50% of culture score)** — The engine maps 20 employer culture values (innovation, transparency, collaboration, autonomy, growth, impact, balance, diversity, customer focus, excellence, agility, integrity, creativity, stability, speed, quality, mission, empathy, risk, trust) to OCEAN traits via a correlation matrix (`CULTURE_OCEAN_MAP`). For each value the employer selects, the engine checks how well the candidate's OCEAN scores align with the traits that correlate to that value. Positive correlations reward higher candidate scores; negative correlations reward lower scores (e.g., low neuroticism aligns with the "balance" value).
- **Role-Specific Fit (20% of culture score)** — If the employer set min/max OCEAN ranges on the role, the engine checks whether the candidate falls within those bounds. In-range = 100, out-of-range = proportional penalty at 2 points per unit of distance from the nearest boundary.

**3. Work Style Score (20% of overall)**

Same logic as the work style sub-score within culture match, but counted independently at the overall level to give work style additional weight.

**4. Communication Fit Score (10% of overall)**

Derived from extraversion and agreeableness alignment between candidate and employer. Extraversion drives communication style (55% weight), agreeableness drives communication tone (45% weight). Score = 100 minus the weighted difference.

**5. Overall Match Score**

```
Overall = (Trait Match * 0.40) + (Culture Match * 0.30) + (Work Style * 0.20) + (Communication * 0.10)
```

#### Bidirectional Matching

The engine also calculates a **reverse compatibility score** — how well the employer's culture fits the *candidate's* preferences (preferred work style, preferred company size, archetype ideal cultures). The combined bidirectional score blends forward (70%) and reverse (30%).

#### Confidence Scoring

Every match includes a confidence score (0–100) based on data completeness:
- Core OCEAN scores present: +40 points
- Profile complete (headline, bio, location): +30 points
- Each supplementary assessment completed: +7 points (up to 4)

---

### The Ember Agent

Ember is the AI agent mascot and personality intelligence engine. Defined in `src/backend/agent/ember_agent.py`, it wraps the compatibility engine with archetype classification, insight generation, and natural language summaries.

#### 8 Personality Archetypes

Every candidate is classified into one of eight archetypes based on their OCEAN signature:

| Archetype | OCEAN Signature | Ideal Cultures | Description |
|-----------|----------------|----------------|-------------|
| **The Innovator** | High openness, low-mid conscientiousness | Innovation, creativity, risk, agility | Creative thinker who thrives on new ideas and unconventional approaches |
| **The Architect** | High conscientiousness, mid openness | Excellence, quality, stability, integrity | Systematic builder who creates order and reliable structures |
| **The Connector** | High extraversion, high agreeableness | Collaboration, empathy, trust, diversity | Natural relationship builder who brings people together |
| **The Catalyst** | High extraversion, high openness, low agreeableness | Speed, autonomy, growth, impact | Bold leader who drives change and pushes boundaries |
| **The Craftsperson** | High conscientiousness, low extraversion | Quality, excellence, stability, integrity | Detail-oriented perfectionist who delivers exceptional quality |
| **The Harmonizer** | High agreeableness, low neuroticism | Collaboration, empathy, balance, mission | Empathetic mediator who creates balance and team cohesion |
| **The Explorer** | High openness, low neuroticism | Innovation, agility, autonomy, creativity | Curious adventurer who adapts quickly and embraces change |
| **The Strategist** | High conscientiousness, high openness | Growth, impact, excellence, innovation | Analytical thinker who plans deliberately and executes with purpose |

**Classification Algorithm:**
- Each OCEAN score is bucketed into levels: low (0–25), low-mid (26–40), mid (41–60), mid-high (61–75), high (76–100)
- Each archetype has an expected signature (e.g., The Innovator expects openness = "high")
- The engine scores each archetype: 10 points for exact level match, partial credit based on distance between actual and expected levels
- Highest-scoring archetype wins, with a confidence score (0–100) based on score separation from runner-up

#### 8x8 Archetype Compatibility Matrix

Defined in `src/backend/agent/archetype_compatibility.py`, this matrix maps all 64 possible candidate-archetype-to-employer-archetype pairings with:

- **Bonus modifier** (-10 to +10) applied additively to the overall compatibility score
- **Synergy note** — what works well about the pairing (e.g., "Creative minds amplify each other")
- **Friction note** — what might cause tension (e.g., "May lack grounding without structure")

Examples:
- Innovator + Innovator (employer): +10 bonus, "Creative minds amplify each other"
- Innovator + Stabilizer (employer): -8 bonus, "Innovation-averse culture feels stifling"
- Connector + Collaborator (employer): +10 bonus, "Natural fit — thrives in team-oriented cultures"
- Catalyst + Stabilizer (employer): -7 bonus, "Change-driving nature threatens stability-focused culture"

#### Insight Generation

For each candidate-employer pair, Ember generates up to 8 actionable insights, categorized as:

- **Strengths** — Where candidate traits align with employer culture values (e.g., high openness + innovation-valued culture)
- **Cautions** — Gaps exceeding 25 points between candidate OCEAN scores and employer preferences
- **Highlights** — Archetype-culture overlaps or exceptional individual scores (85+)
- **Tips** — Archetype-specific adaptation advice for succeeding in the employer's environment

#### Dimension Analysis

Per-dimension breakdown with:
- Individual fit score (0–100) per OCEAN trait
- Gap direction indicator (candidate higher vs. employer preference higher)
- Role-specific range validation (in-range, above-range, below-range)

#### Summary Generation

Natural language summaries tied to score tiers:
- 85+: Strong match language with specific strengths highlighted
- 70–84: Good match language with growth areas noted
- 55–69: Moderate match with specific gaps called out
- Below 55: Mismatch language with honest assessment of friction points

Each summary includes a hiring recommendation.

#### Coffee Chat Preparation Briefs

When a coffee chat is scheduled, Ember generates a personality-based prep brief that includes:
- Key personality traits to be aware of
- Suggested conversation topics based on shared values
- Potential friction points to navigate
- Tips for making the conversation productive

---

### The Assessment System

#### Candidate Assessment

**Core Assessment — 10 Questions**

Ten multiple-choice questions across three categories:

- **Work Style (4 questions):** How you receive feedback, how you start projects, your ideal environment, how you handle ambiguity
- **Communication (3 questions):** Your communication style, how you handle disagreement, your approach to deadlines
- **Values (3 questions):** What motivates you, how you learn, what matters in a startup

Each answer option maps to specific personality dimensions with weighted scores. Responses are aggregated into normalized 0–100 OCEAN scores through the scoring engine (`src/backend/engine/scoring.py`), which:
1. Accumulates points across 14 personality dimensions (structure, planning, autonomy, flexibility, adaptability, focus, directness, communication, collaboration, learning, impact, growth, alignment, balance)
2. Groups dimensions into three categories: Work Style (6 dims), Communication (3 dims), Values (5 dims)
3. Normalizes each category to 0–100
4. Computes Culture Fit Score = 35% work style + 35% communication + 30% values
5. Identifies top 3 traits with human-readable labels (e.g., "Direct Communicator", "Highly Adaptable", "Team Player")

**Supplementary Assessments (8 total):**

Candidate-side:
- Visual Perception Assessment — spatial reasoning and pattern recognition
- Work Values Assessment — what principles matter most in a workplace
- Situational Judgment Assessment — scenario-based decision making
- Cognitive Pattern Assessment — pattern matching and analytical thinking

Employer-side:
- Team Dynamics Assessment — how teams interact and collaborate
- Leadership Style Assessment — management and leadership approach
- Growth Philosophy Assessment — learning and development orientation
- Work Environment Assessment — physical and cultural environment preferences

#### Employer Culture Quiz

7 questions covering:
1. Work style preferences (remote, hybrid, onsite)
2. Communication norms (sync vs. async, formal vs. casual)
3. Decision-making approach (top-down vs. consensus)
4. Growth philosophy (move fast vs. deliberate)
5. Feedback culture (direct vs. supportive)
6. Core values (select from 20 predefined values)
7. Work-life balance expectations

Results produce employer OCEAN preferences and a company archetype classification.

---

### The Coffee Chat System

The coffee chat system enables informal conversations between matched candidates and employers before any formal application. Built across 13 frontend components and 7 API endpoints.

**Full Lifecycle:**

```
Connection Made → Coffee Chat Created → Pending
  → Employer/Candidate Accepts → Accepted
    → Date/Time/Link Set → Scheduled
      → Meeting Happens → Completed
        → Both Parties Leave Feedback (1-5 stars + written)
```

**Features:**
- Calendar view (month/week) and list view of all chats, grouped by status
- Chat detail modals with participant info, match score breakdown, and scheduled time
- Schedule modal for setting date, time, duration, and meeting link (Zoom, Google Meet, Teams)
- Accept-with-date modal for accepting a connection and proposing meeting times simultaneously
- Post-chat feedback form with star rating and written feedback
- Coffee chat prep briefs generated by Ember based on personality analysis
- Real-time status tracking across all states
- Bidirectional management — both candidates and employers have dedicated chat management views

---

### The Connection System

**Connection Flow:**
1. Either party sends a connection request with an optional message
2. Request can include a "meet invite" — proposed meeting duration and times
3. Recipient sees incoming request in their inbox panel
4. Accept triggers automatic coffee chat creation if a meet invite was included
5. Reject dismisses the request

**States:** pending_sent, pending_received, accepted, rejected

**Real-Time Updates:** Supabase realtime subscriptions (`postgres_changes`) on the connections table push instant updates to both parties.

---

### Authentication and Accounts

**Providers:**
- Email/password with mandatory email verification
- Google OAuth (one-click)
- GitHub OAuth (one-click)

**Post-Auth Flow:**
1. New user signs up → email verification required
2. First login → role selection (Job Seeker or Employer)
3. Role selected → onboarding wizard (profile setup, assessment/culture quiz)
4. Onboarding complete → dashboard access

**Security:**
- JWT tokens verified via Supabase JWKS endpoint
- Role-based access control middleware on protected endpoints (candidate-only, employer-only)
- Row Level Security (RLS) policies on all Supabase tables
- Service role key used server-side to bypass RLS for employer-side candidate access
- Development mode with auth bypass when `SUPABASE_JWT_SECRET` is not configured

**Account Management:**
- Password reset via email
- Account deletion with cascade (deletes profile, candidate/employer data, applications, coffee chats, connections, feedback, settings)
- Profile editing (headline, bio, location, links, work preferences, avatar)

---

### Payments Infrastructure

Stripe integration with:
- **Checkout Session Creation** — Creates Stripe checkout sessions, handles plan upgrades by checking for existing subscriptions
- **Customer Portal** — Redirects to Stripe's hosted portal for subscription management (upgrade, downgrade, cancel, update payment method)
- **Webhook Handling** — Processes 4 event types:
  - `checkout.session.completed` — Activates subscription, stores Stripe customer ID
  - `invoice.paid` — Confirms ongoing subscription
  - `invoice.payment_failed` — Marks subscription as past due
  - `customer.subscription.deleted` — Downgrades to free tier
- **Subscription Status API** — Returns current plan, status, and billing period
- **Graceful Fallback** — Returns demo subscription data when Stripe is not configured

---

### The Design System

The case-study build settled on a quiet, single-family UI. Tokens live in `src/frontend/src/styles/globals.css` and `contexts/ThemeContext.tsx`; the type scale lives in `tailwind.config.js`.

- **Type:** Inter only, at weights 400, 500 and 600, with named roles (caption, label, heading, title, headline, display). Hierarchy comes from size, weight and color, not a second face.
- **Color:** neutral surfaces with one amber accent for primary actions, selection and links (`#B45309` in light, `#F09030` in dark, both chosen to pass WCAG AA). Five trait colors mark the OCEAN dimensions in charts and bars.
- **Themes:** light and dark, following the operating system until the user picks one in Settings or the header toggle.
- **Components:** one card style (`.bento-card`), `Button` with fixed sizes, `PageBanner` for page headers and `Facts` for label/value lists, plus `Input`, `Modal`, `Toast`, `Avatar`, `Badge`, `Dropdown`, `DatePicker`, `LocationPicker`, `ScoreRing`, `RadarChart`, `Skeleton` and the `CoffeeBrewLoader`, all in `src/frontend/src/components/ui/`.
- **Motion:** Framer Motion for short fades and progress, never decorative. Everything honors `prefers-reduced-motion`.
- **Responsive:** mobile-first Tailwind breakpoints; the sidebar becomes a top bar with a menu on phones.

---

### The Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React | 19.1.0 | Functional components with hooks |
| **Language** | TypeScript | 5.8.3 | Type safety across entire frontend |
| **Build Tool** | Vite | 7.0.4 | Fast dev server and production bundling |
| **Styling** | Tailwind CSS | 3.4.19 | Utility-first styling with custom theme |
| **Styling Plugins** | @tailwindcss/forms, @tailwindcss/typography | 0.5.x | Form reset and prose styling |
| **Animation** | Framer Motion | 12.34.2 | Declarative animations and transitions |
| **Icons** | Lucide React | 0.562.0 | Consistent icon set |
| **Routing** | React Router | 7.12.0 | Client-side routing with nested layouts |
| **State** | React Context API | — | Global state (auth, theme, toast, messaging, connections) |
| **State (declared)** | Zustand | 5.0.10 | Declared in dependencies, reserved for future use |
| **Date Utilities** | date-fns | 2.30.0 | Date formatting and manipulation |
| **Class Utilities** | clsx + tailwind-merge | 2.1.1 / 3.4.0 | Conditional and merged class names |
| **Backend Framework** | FastAPI | 0.115.0 | Async Python API with automatic OpenAPI docs |
| **ASGI Server** | Uvicorn | 0.32.0 | Production-grade async server |
| **Validation** | Pydantic | 2.10.0 | Request/response data validation |
| **Database (Production)** | Supabase (PostgreSQL) | — | Auth, database, realtime, storage |
| **Database (Development)** | SQLite | — | Local development without Supabase dependency |
| **Auth** | Supabase Auth + PyJWT | 2.9.0 | JWT verification via JWKS |
| **Payments** | Stripe | 11.4.1 | Subscriptions, checkout, customer portal |
| **HTTP Client** | httpx | — | Async HTTP requests |
| **Code Formatting** | Prettier (frontend), Black (backend) | — | Consistent code style |
| **Linting** | ESLint (frontend), Ruff (backend) | — | Code quality enforcement |

---

### API Surface

38 endpoints organized by domain:

#### Health and Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | No | Root health check |
| `GET` | `/health` | No | Detailed service health (database, Supabase, auth, matching engine) with latency measurements |
| `GET` | `/api/me` | Yes | Current authenticated user info |
| `POST` | `/api/auth/check-email` | No | Check if email already registered |
| `DELETE` | `/api/auth/delete-account` | Yes | Full account deletion with cascade |

#### Assessment
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/assessment/start` | No | Start or resume a 10-question assessment session |
| `POST` | `/api/assessment/answer` | No | Submit answer, advance progress, trigger scoring on completion |
| `GET` | `/api/assessment/results/{candidate_id}` | No | Retrieve computed OCEAN scores, top traits, culture fit |
| `GET` | `/api/assessment/question/{question_id}` | No | Get a specific question by ID |
| `GET` | `/api/assessment/questions` | No | Get all 10 questions |

#### Candidates
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/candidates` | Yes* | List all candidates with scores (employer access) |
| `GET` | `/api/candidates/{candidate_id}` | Yes* | Individual candidate profile with full OCEAN data |

#### Matching Engine
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/matching/calculate` | No | Score a single candidate-role pair |
| `GET` | `/api/matching/candidates/{role_id}` | No | Rank all candidates for a specific role |
| `GET` | `/api/matching/roles/{candidate_id}` | No | Rank all roles for a specific candidate |
| `POST` | `/api/matching/batch-calculate/{role_id}` | No | Score all candidates against one role |
| `GET` | `/api/matching/employer-candidates` | No | Employer-wide candidate ranking across all roles |

#### Ember Agent
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/ember/candidate-matches/{candidate_id}` | No | Personality-ranked role matches with archetypes and insights |
| `GET` | `/api/ember/employer-matches/{employer_id}` | No | Personality-ranked candidate matches, optionally filtered by role |
| `GET` | `/api/ember/analysis` | No | Deep analysis for a specific candidate-employer pair |

#### Coffee Chats
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/coffee-chats` | No | Create a coffee chat request |
| `GET` | `/api/coffee-chats/candidate/{id}` | No | Get all coffee chats for a candidate |
| `GET` | `/api/coffee-chats/employer/{id}` | No | Get all coffee chats for an employer |
| `PATCH` | `/api/coffee-chats/{id}/status` | No | Update status (accept, cancel, complete) |
| `PATCH` | `/api/coffee-chats/{id}/schedule` | No | Set date, time, duration, and meeting link |
| `PATCH` | `/api/coffee-chats/{id}/feedback` | No | Submit post-chat feedback with rating |
| `POST` | `/api/coffee-chats/{id}/prep` | No | Generate personality-based prep brief |

#### Connections
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/connections` | No | Create connection request with optional meet invite |
| `PATCH` | `/api/connections/{id}/accept` | No | Accept connection, auto-create coffee chat if meet invite exists |
| `PATCH` | `/api/connections/{id}/reject` | No | Reject connection request |
| `GET` | `/api/connections/me` | No | Get all connections grouped by status |

#### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/stripe/create-checkout-session` | No | Create Stripe checkout for subscription |
| `POST` | `/api/stripe/create-portal-session` | No | Create Stripe billing portal session |
| `POST` | `/api/stripe/webhook` | No | Handle Stripe webhook events (4 event types) |
| `GET` | `/api/stripe/subscription` | No | Get current subscription status |

#### Utilities
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/feedback` | No | Submit user feedback (bug reports, feature requests) |
| `GET` | `/api/feedback` | No | Get all feedback (admin) |
| `GET` | `/api/logo` | No | Company logo proxy with disk caching and rate limiting |

---

### Database Architecture

#### Production (Supabase PostgreSQL)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | Extends `auth.users` | role, avatar_url, onboarding_completed, subscription_tier |
| `candidates` | Candidate personality data | All 5 OCEAN scores (0–100), archetype, top_traits, headline, bio, location, work_preferences, social_links, assessment_completed |
| `employers` | Company culture data | company_name, industry, size, culture_values (array), OCEAN preferences (5 scores), archetype, quiz_completed |
| `roles` | Job listings | title, description, location, work_style, salary_min/max, employment_type, OCEAN min/max requirements (10 fields), status (draft/active/paused/closed) |
| `applications` | Match records | candidate_id, role_id, employer_id, trait_match_score, culture_match_score, overall_match_score, status |
| `coffee_chats` | Chat scheduling | candidate_id, employer_id, role_id, status, scheduled_date, scheduled_time, duration, meeting_link, candidate_feedback, employer_feedback, candidate_rating, employer_rating |
| `connections` | Social connections | requester_id, recipient_id, status, message, meet_invite_duration, meet_invite_proposed_times |
| `connection_meet_invites` | Meeting proposals | connection_id, duration, proposed_times (JSON array) |
| `questions` | Assessment questions | question_text, category, type, options (JSON), trait_mappings |
| `assessments` | Session tracking | user_id, current_question, status, started_at, completed_at |
| `assessment_responses` | Individual answers | assessment_id, question_id, selected_option, trait_scores |
| `feedback` | User feedback | user_id, type (bug/feature/general), message, rating, status |
| `user_settings` | Preferences | user_id, theme, email_notifications, privacy_settings |
| `stripe_customers` | Payment mapping | user_id, stripe_customer_id, subscription_id, plan, status |

#### Row Level Security

- Users can only read/update their own profile, settings, and feedback
- Employers can view candidates who have completed assessments
- Candidates can view active job listings and their own applications
- Applications visible to both the candidate and the employer involved
- Coffee chats visible to both participants
- Connections visible to both requester and recipient

#### Development (SQLite Fallback)

For local development without Supabase:
- `candidates` — Name, email, created_at
- `assessment_responses` — Question responses with timestamps
- `scores` — Computed culture_fit, work_style, communication, values scores
- `assessment_sessions` — Progress tracking (current_question, status)
- `feedback` — User feedback collection

---

## Where Amber Was Going (never built)

Nothing in this section was built. It is the roadmap as it stood when Amber was shelved: the path from a matching platform to a **hiring intelligence system**. It's kept in the conditional, as the plan it was.

---

### Phase 1: Conversational Ember AI

**Status:** Never built. OpenAI, LangChain and Ollama were added as backend dependencies early on but never wired in; they were removed when Amber became a case study.

**The Problem:** The shipped multiple-choice assessment captured personality dimensions accurately, but the experience felt like a form. Users complete it and move on. There's no engagement, no memorability, no reason to tell anyone about it.

**The plan:** Transform Ember from a scoring engine into a **conversational AI agent** that conducts natural, open-ended personality interviews.

#### How It Would Have Worked

1. **Conversational Assessment Flow**
   - Candidate opens the assessment and is greeted by Ember as a conversational partner, not a quiz
   - Ember asks open-ended questions: "Tell me about a time you disagreed with your team's direction. What did you do?" rather than "When you disagree with a decision, you: (a) Voice concerns immediately..."
   - Based on the candidate's response, Ember follows up with contextual probing questions
   - The conversation lasts 10–15 minutes, feels like talking to a thoughtful career coach
   - Behind the scenes, Ember's prompt engineering extracts OCEAN trait signals from language patterns, reasoning style, values expression, and emotional tone

2. **Trait Extraction Pipeline**
   - LangChain orchestrates a multi-step chain:
     - Step 1: Conversation management (context window, follow-up generation)
     - Step 2: Per-response trait extraction (which OCEAN dimensions does this response signal, and at what confidence?)
     - Step 3: Cross-response aggregation (combine all signals into final OCEAN scores with confidence intervals)
     - Step 4: Archetype classification (same 8 archetypes, but with richer supporting evidence from actual quotes)
   - The existing scoring engine remains the source of truth — the AI pipeline feeds into the same OCEAN score format, ensuring backward compatibility with all matching logic

3. **Hybrid Mode**
   - Candidates can choose: quick 10-question assessment (existing) or full Ember conversation (new)
   - Conversational assessment produces higher-confidence scores (more data points) and unlocks richer insights
   - The structured assessment remains as a fallback and calibration tool

4. **Ongoing Ember Interactions**
   - After initial assessment, Ember would have become a persistent career advisor:
     - "I noticed your top match this week is a Connector-culture company. Based on our conversation, here's why I think you'd thrive there..."
     - "You mentioned you value autonomy highly. This role at [Company] has a micromanagement flag from employee reviews. Want me to dig deeper?"
     - Pre-coffee-chat coaching: "You're meeting with [Employer] tomorrow. Based on their Architect culture and your Explorer personality, here are three things to discuss and two things to be careful about."

5. **Technical Architecture**
   - OpenAI GPT-4 for conversation and trait extraction
   - LangChain for chain orchestration and memory management
   - Ollama as optional local inference for cost-sensitive deployments
   - Conversation transcripts stored in Supabase with trait annotations
   - Real-time streaming responses via WebSocket for natural conversation feel

#### Why It Would Have Mattered

- **Engagement:** People remember conversations. "I talked to Ember and it told me I'm an Explorer" is viral in a way "I took a quiz" is not.
- **Data Moat:** Conversation transcripts with trait annotations create a proprietary dataset that improves extraction accuracy over time. No competitor can replicate this without building the same conversation history.
- **Defensibility:** The prompt engineering, trait extraction chains, and calibration models become core IP.
- **Retention:** Ember as an ongoing advisor gives users a reason to come back, not just complete an assessment and wait.

---

### Phase 2: Team DNA Mapping

**The Problem:** Amber matched candidates to **companies**. But people don't quit companies — they quit teams. A candidate who thrives in the engineering team's culture might struggle in the same company's sales team. And the most valuable hire isn't always someone who mirrors the existing team — it's someone who **complements** the team's gaps.

**The plan:** Let employers map the personality composition of their existing teams, then match candidates who balance and strengthen team dynamics.

#### How It Would Have Worked

1. **Team Personality Mapping**
   - Employers invite existing team members to take a lightweight personality assessment (5 minutes, not the full 10-question flow)
   - Or: employers manually input approximate OCEAN scores for team members based on their knowledge
   - The system aggregates individual scores into a **Team DNA Profile**: average OCEAN scores, score distribution, dominant archetypes, and identified gaps

2. **Team Composition Analysis**
   - Visual breakdown of team archetype distribution (e.g., "3 Architects, 2 Craftspeople, 1 Connector, 0 Innovators")
   - Identification of personality gaps: "Your team is heavy on conscientiousness and low on openness — you may struggle with creative problem-solving and adaptability"
   - Team balance score (0–100): how well-rounded is the team across all personality dimensions?

3. **Complementary Matching**
   - Instead of "find candidates who match our culture," the matching algorithm adds a **complement score**: "find candidates who fill our team's gaps"
   - New scoring dimension: Team Balance Impact — how much does adding this candidate improve the team's overall balance score?
   - Employers can toggle between "culture fit" mode (find someone who fits in) and "culture add" mode (find someone who brings what we're missing)

4. **Team-Level Insights**
   - "Your product team is 4 Architects and 2 Craftspeople. Adding an Innovator would increase your team's creative output potential by an estimated 35%."
   - "This candidate's Connector archetype would bridge the communication gap between your engineering and design sub-teams."
   - Friction warnings: "Adding another Catalyst to a team of 3 Catalysts may create leadership tension. Consider a Harmonizer to balance the dynamic."

5. **Sub-Team and Department Mapping**
   - Companies with multiple teams can map each one independently
   - Candidates matched to the specific team they'd join, not just the company
   - Cross-team compatibility: "This candidate fits your backend team (87%) but would be a weaker match for your frontend team (52%)"

#### Technical Implementation

- New Supabase tables: `teams`, `team_members`, `team_profiles` (aggregated OCEAN), `team_gaps`
- New API endpoints: team CRUD, team assessment invites, team composition analysis, team-aware matching
- Extended compatibility engine: add `calculate_team_complement_score()` alongside existing `calculate_compatibility()`
- Frontend: Team management UI for employers, team composition visualizations (radar charts, archetype distribution bars), toggle between fit/add modes in candidate browsing

#### Why It Would Have Mattered

- **Unique Positioning:** No hiring platform offers team-level personality matching. LinkedIn, Indeed, Greenhouse — none of them. This is Amber's wedge.
- **Enterprise Value:** Team DNA mapping is a feature enterprise HR teams would have paid a premium for. It transforms Amber from a matching tool into a **team intelligence platform**.
- **Stickiness:** Once an employer maps their teams, they're deeply invested in the platform. The data is unique to Amber and creates massive switching costs.

---

### Phase 3: Culture Verification Layer

**The Problem:** Every company says they have great culture. Employer self-reported culture profiles are aspirational, not actual. Candidates have no way to verify culture claims before accepting a job. Glassdoor reviews are unstructured, outdated, and not connected to personality science.

**The plan:** Build an anonymous verification system where current and former employees validate employer culture claims against the same OCEAN-based framework Amber uses for matching.

#### How It Would Have Worked

1. **Employee Culture Micro-Survey**
   - Short (2-minute) anonymous survey sent to current/former employees
   - Questions mirror the employer culture quiz but from the employee perspective: "How does your company *actually* handle feedback?" vs. how the employer *said* they handle feedback
   - Results scored on the same OCEAN framework, producing an **Employee-Reported Culture Profile**

2. **Gap Score Visualization**
   - Side-by-side comparison: Employer-Claimed Culture vs. Employee-Reported Culture
   - Per-dimension gap scores:
     ```
     Openness:          Employer says 82  |  Employees say 61  |  Gap: -21 (Overstated)
     Conscientiousness:  Employer says 75  |  Employees say 78  |  Gap: +3  (Accurate)
     Collaboration:      Employer says 90  |  Employees say 55  |  Gap: -35 (Significant Overstatement)
     ```
   - Overall **Culture Authenticity Score** (0–100): How closely does the employer's self-image match reality?
   - Trend line showing how the gap changes over time (are they getting more authentic or less?)

3. **Verified Match Scoring**
   - Candidates can choose to match against the **verified** culture profile (employee-reported) instead of the employer-claimed profile
   - Match results show both scores: "Your match with [Company]'s claimed culture: 84%. Your match with their verified culture: 67%."
   - Significant gaps trigger warnings: "Heads up: employees at [Company] report significantly less autonomy than the company claims. Your Explorer personality may find this challenging."

4. **Employer Incentives**
   - Employers with high Culture Authenticity Scores get a "Verified Culture" badge on their profile and job listings
   - Badge is visible to candidates and serves as a trust signal
   - Employers can see their gap report and use it as an internal tool to improve culture alignment
   - Companies that improve their scores over time get featured in Amber's "Most Authentic Cultures" ranking

5. **Privacy and Integrity**
   - All employee responses are anonymous — employers never see individual responses
   - Minimum 5 responses required before a verified profile is published (prevents identification)
   - Statistical outlier detection to filter gaming attempts
   - Responses weighted by recency (last 6 months weighted higher than 2 years ago)

#### Technical Implementation

- New tables: `culture_verifications` (anonymous employee responses), `culture_gap_scores` (computed gaps per employer), `verification_invites`
- New API endpoints: verification survey submission, gap score calculation, verified culture profiles, authenticity score computation
- Extended matching engine: `calculate_compatibility()` gains an optional `use_verified_culture` flag
- Frontend: verification survey page (anonymous, no login required), gap visualization component, verified badge display, dual match score display

#### Why It Would Have Mattered

- **Trust Moat:** This data is incredibly hard to replicate. Every employee response makes Amber's culture intelligence more accurate. Over time, Amber would have become the **source of truth** for company culture.
- **Network Effect:** Candidates prefer platforms that show verified data. More candidates attract more employers. More employers attract more employee verifiers. Flywheel.
- **Press and Virality:** "Company X claims they value work-life balance, but employees rate it 3/10" is headline-worthy content. Culture gap reports generate organic press coverage.
- **Revenue:** Premium employers pay for access to their gap report and improvement recommendations. Enterprise analytics tier.

---

### Phase 4: Predictive Retention Intelligence

**The Problem:** A bad hire is expensive, and more so the more senior the role. Amber's matching told you "will they fit?" but not "will they stay?" or "will they thrive long-term?"

**The plan:** Build a predictive model that estimates retention probability and long-term success based on personality-culture alignment patterns.

#### How It Would Have Worked

1. **Outcome Tracking**
   - After a hire is made through Amber, track key outcomes over time:
     - 30/60/90-day check-ins: "How's it going?" micro-surveys to both candidate and employer
     - 6-month retention check: still at the company?
     - 12-month retention check: still at the company? Promoted? Looking elsewhere?
     - Exit interviews when someone leaves: what went wrong? What were the friction points?
   - All outcome data is linked back to the original match scores, personality profiles, and culture data

2. **Pattern Recognition**
   - As outcome data accumulates, build pattern models:
     - "Candidates with high openness (80+) matched to low-openness cultures (<40) have a 72% chance of leaving within 12 months"
     - "Connector archetypes in Stabilizer cultures report highest satisfaction when the team has at least one other Connector"
     - "The strongest predictor of 2-year retention is culture values alignment score above 75, not overall match score"
   - These patterns feed back into the matching algorithm as **learned weights** — the system gets smarter with every hire and every outcome

3. **Retention Risk Score**
   - Every match gets a Retention Probability alongside the compatibility score:
     ```
     Overall Match: 82%
     Retention Probability (12 months): 89%
     Retention Probability (24 months): 71%
     Risk Factors: 
       - Candidate's high autonomy preference vs. role's structured reporting (moderate risk)
       - Strong values alignment offsets work style friction (protective factor)
     ```
   - Employers see risk-adjusted candidate rankings, not just compatibility rankings

4. **Proactive Intervention Alerts**
   - After hire, if 30/60/90-day check-in scores drop below threshold:
     - Alert to HR: "Retention risk detected for [Employee]. Key friction: work style mismatch identified at hire."
     - Suggested interventions based on personality data: "This Explorer may benefit from more autonomous project ownership. Consider adjusting their role scope."
   - Pre-hire: "This is a high match (85%) but has a 40% 12-month retention risk due to a known pattern: Catalyst archetypes in Nurturer cultures show high initial satisfaction but frequent burnout at 8–12 months."

#### Technical Implementation

- New tables: `hire_outcomes`, `check_in_responses`, `retention_events`, `pattern_models`
- Outcome tracking pipeline: scheduled check-in emails, survey endpoints, exit interview integration
- ML model: logistic regression initially (personality features + culture features → retention probability), upgraded to gradient boosted trees as data grows
- Model retraining: weekly batch job with latest outcome data
- API: retention score endpoint, risk factor breakdown, intervention recommendations

#### Why It Would Have Mattered

- **Premium Revenue:** Retention prediction is the feature enterprise HR teams would have paid the most for. The ROI is immediately quantifiable: "Amber saved us $240K by flagging 3 high-risk hires that traditional interviews missed."
- **Self-Improving System:** Every hire and every outcome makes the model better. After 1,000 tracked hires, Amber's predictions become genuinely hard to compete with.
- **Market Positioning:** Moves Amber from "matching platform" to "hiring intelligence platform." Direct competitor to industrial-organizational psychology consulting firms charging $50K+ per engagement.

---

### Phase 5: Passive Culture Signals

**The Problem:** Amber has a chicken-and-egg marketplace problem. Employers must complete a culture quiz before candidates can match with them. Most employers won't do this on day one. Meanwhile, candidates who sign up and see zero matches leave immediately.

**The plan:** Auto-generate preliminary culture profiles for companies using publicly available data, before the employer ever signs up.

#### How It Would Have Worked

1. **Data Ingestion Pipeline**
   - Glassdoor reviews: sentiment analysis and theme extraction mapped to OCEAN dimensions
   - LinkedIn job postings: language analysis (words like "fast-paced," "collaborative," "detail-oriented" map to specific OCEAN traits)
   - Company blog posts and about pages: tone analysis, values extraction
   - Employee testimonials and Glassdoor "pros/cons": culture value identification
   - News articles: recent events that signal culture (layoffs, awards, leadership changes)

2. **AI Culture Profile Generation**
   - LangChain pipeline processes all ingested data through a multi-step analysis:
     - Step 1: Extract culture signals from each source (e.g., "7 of 12 Glassdoor reviews mention 'micromanagement' → low autonomy signal")
     - Step 2: Map signals to OCEAN dimensions with confidence weights
     - Step 3: Aggregate into a preliminary OCEAN profile with per-dimension confidence intervals
     - Step 4: Classify into employer archetype
     - Step 5: Generate natural language culture summary
   - Each data source contributes with a known reliability weight (employee reviews weighted higher than marketing copy)

3. **Pre-Filled Employer Experience**
   - When an employer signs up, they see: "Based on public data, here's what we think your culture looks like. How accurate is this?"
   - Slider adjustments on each dimension with explanations: "We scored your openness at 72 based on frequent mentions of 'innovation' in your job postings and employee reviews. Adjust if this doesn't match your experience."
   - Corrections feed back into the model to improve future predictions for similar companies

4. **Candidate Experience Without Waiting**
   - Candidates can browse auto-profiled companies immediately, even before those companies sign up
   - Match scores show confidence level: "Match: 78% (based on public data — moderate confidence)" vs. "Match: 78% (verified profile — high confidence)"
   - When a company completes their official profile, all matches are recalculated and candidates are notified of score changes

#### Technical Implementation

- Data ingestion microservice: scheduled crawlers for public data sources, rate-limited and respectful of robots.txt
- LangChain analysis pipeline: multi-step chain with source-specific extractors and aggregation layer
- New tables: `passive_culture_profiles`, `culture_signals` (individual data points), `signal_sources`
- Confidence scoring: based on data freshness, source reliability, volume of signals, and inter-source agreement
- API: passive profile lookup, correction submission, confidence metrics
- Frontend: "preliminary profile" badge, confidence indicators, employer correction flow

#### Why It Would Have Mattered

- **Solves Cold Start:** Candidates see matches from day one. No empty state. No waiting for employers to finish onboarding.
- **Employer Acquisition:** Companies see their auto-generated profile and think "I should claim this and make it accurate" — similar to how businesses claim Google Business profiles.
- **Scale:** Can auto-profile thousands of companies without any of them signing up, immediately creating a browsable marketplace for candidates.

---

### Phase 6: Blind Culture Matching

**The Problem:** Unconscious bias corrupts hiring decisions. Candidates chase brand names (Google, Meta) regardless of culture fit. Employers judge candidates on pedigree (Stanford, ex-FAANG) regardless of personality alignment. The result: prestigious hires who leave in 6 months because the culture was wrong.

**The plan:** A matching mode that strips away all identifying information and forces both sides to evaluate on culture and personality alone.

#### How It Would Have Worked

1. **For Candidates: Blind Role Discovery**
   - Toggle "Blind Mode" in the Ember matching gallery
   - All identifying information is hidden: no company name, no logo, no brand
   - What's shown: match score, archetype compatibility, culture values, work style, role description, salary range
   - Candidates rank roles purely on personality fit
   - After expressing interest, the company identity is revealed

2. **For Employers: Blind Candidate Review**
   - Toggle "Blind Mode" in the candidate browsing interface
   - All identifying information is hidden: no name, no photo, no school, no previous employers
   - What's shown: match score, archetype, OCEAN breakdown, work style preferences, assessment confidence
   - Employers rank candidates purely on personality and culture fit
   - After expressing interest, the candidate's full profile is revealed

3. **Mutual Blind Matching**
   - When both sides express interest while in Blind Mode, it's a "Blind Match"
   - Blind Matches get a special badge and are prioritized in the coffee chat queue
   - The reveal moment would have become a positive experience: "You both chose each other based purely on personality — now meet the person behind the profile"

4. **Blind Match Analytics**
   - Track outcomes of Blind Matches vs. standard matches:
     - Do Blind Matches have higher coffee chat acceptance rates?
     - Do Blind Matches lead to more successful hires?
     - Do Blind Matches have better retention rates?
   - Publish anonymized insights: "Blind Matches on Amber result in 40% higher 12-month retention than standard matches"

#### Why It Would Have Mattered

- **Virality:** "I found my dream job without knowing the company name" is an inherently shareable story. This is the feature that gets press coverage and social media virality.
- **Differentiation:** No other hiring platform offers this. It's a bold, category-defining feature that positions Amber as genuinely different, not just "another job board with extra steps."
- **Bias Reduction:** Measurable reduction in hiring bias is a compliance and PR win for employers. HR teams can point to Blind Match adoption rates in diversity reports.
- **Data Story:** Comparing blind vs. standard match outcomes produces compelling content for blog posts, press releases, and sales conversations.

---

### Additional Roadmap Features

A few items from this list shipped before Amber was shelved and are no longer roadmap: **in-app messaging** (realtime chat on every coffee chat, persistent threads with read state, up to three floating chat panels, unread counts) and the **in-app notification center**. The annotations below mark what else was partly built. Everything without one was never built.

#### Notification System (in-app center shipped; push and email never built)
- In-app notification center: new matches, coffee chat requests, status changes, messages
- Browser push notifications for time-sensitive updates
- Email digests: daily (new matches), weekly (activity summary), monthly (insights report)
- Notification preferences per channel (in-app, push, email) in settings

#### Public Job Board (partly shipped: a signed-in roles page with filters, and saved matches)
- Searchable, filterable job listings accessible without login
- Filters: location, work style, salary range, company size, industry, personality fit score (requires assessment)
- Individual role pages with full descriptions, requirements, and compatibility preview
- Save/bookmark roles for later
- SEO-optimized role pages for organic search traffic

#### Application System
- One-click apply with personality profile attached (no resume required for initial application)
- Application status tracking: pending, reviewing, shortlisted, interview, offer, rejected, accepted
- Behavioral interview questions auto-generated by Ember based on candidate personality and role requirements
- Optional cover notes for personal context

#### Employer Analytics Dashboard
- Hiring funnel visualization: views → matches → connections → coffee chats → hires
- Time-to-hire metrics per role
- Candidate pipeline by personality type and archetype
- Culture fit distribution charts (how well does your candidate pool match your culture?)
- Diversity and inclusion insights: are personality requirements inadvertently filtering out diverse candidates?

#### Multi-User Employer Accounts
- Role-based permissions: admin, recruiter, hiring manager, interviewer
- Shared candidate notes visible to the hiring team
- Collaborative evaluation: multiple team members rate and comment on candidates
- Activity log: who did what, when

#### Calendar Integrations
- Google Calendar and Outlook sync for coffee chat scheduling
- Automatic calendar event creation when a chat is scheduled
- Availability sharing: "Here are my open slots this week"
- Timezone-aware scheduling

#### AI Mock Interview Preparation (not built; the app has a scripted, non-AI practice coffee chat)
- Ember conducts practice interviews tailored to the specific company and role
- Questions based on the employer's culture values and the candidate's personality gaps
- Real-time feedback: "Your answer emphasized autonomy, but this company values collaboration. Here's how to reframe..."
- Practice score and improvement tracking across sessions

#### Resume Parsing and LinkedIn Import
- Upload resume → AI extracts experience, skills, education → pre-fills profile
- LinkedIn import: one-click profile population
- Skills extracted from resume mapped alongside personality data for holistic matching

#### Personality Growth Tracking
- Retake assessment every 6 months
- Timeline view of OCEAN score evolution
- Growth insights: "Your openness has increased 12 points since your last assessment — you may now match with more innovation-focused roles"
- Archetype transition tracking: "You've shifted from Craftsperson to Strategist"

#### Referral Network
- Current employees can refer candidates with a "culture vouched" badge
- Referrer provides personality-based notes: "I've worked with them for 3 years and they're a natural Connector"
- Referred candidates get prioritized matching
- Referral analytics for employers: which referrers produce the best culture-fit hires?

#### Employer Branding Pages
- Rich public-facing culture showcase: photos, videos, employee testimonials, culture value deep-dives
- Linked from job listings and match cards
- Employee-contributed content: "What's it really like here?" stories
- Culture metrics display: team composition, archetype distribution, values in action

#### Gamification
- Achievement badges: assessment completed, first coffee chat, first match, 5-star feedback received
- Progress levels: Culture Explorer → Connection Builder → Match Master → Amber Ambassador
- Streak tracking: consecutive days of platform engagement
- Leaderboards: global and role-specific rankings

---

## Styling Direction

While building we planned a louder identity: a display face paired with a body sans, glows and gradients in dark mode, and an animated Ember character. The case-study build went the other way, to a single sans (Inter) and a quieter interface where the accent marks only actions and selection. See [The Design System](#the-design-system) for what shipped.

---

## Project Structure and Quick Start

See the [README](./README.md#project-structure) for the current layout, the browser demo and full-stack setup.

---

## Authors

- **Nakul Patel** ([@nakulpatel0306](https://github.com/nakulpatel0306)) — Creator and lead engineer
- **Arsh Patel** ([@Arshpatel10](https://github.com/Arshpatel10))
- **Neel** ([@neelp04](https://github.com/neelp04))

---

*Amber: where personality meets opportunity.*
