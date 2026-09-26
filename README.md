# Amber - Culture-First Job Matching

A hiring platform that matches candidates and companies on personality and culture fit instead of resume keywords. Matching runs on the Big Five (OCEAN) personality model, and matched users meet over informal coffee chats before any formal application.

## At a Glance

- **Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS, Framer Motion
- **Backend:** Python 3.11+, FastAPI
- **Data and auth:** Supabase (PostgreSQL, Row Level Security, Realtime, Auth with Email, Google and GitHub)
- **Payments:** Stripe
- **State:** No longer in active development

More detail lives in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) (how the code fits together), [FEATURES.md](./FEATURES.md) (full feature list) and [BLUEPRINT.md](./BLUEPRINT.md) (product vision).

## How It Works

1. **Assess:** candidates take a Big Five assessment and get one of 8 work archetypes
2. **Define culture:** employers take a culture quiz and set OCEAN ranges for each role
3. **Match:** the Ember agent scores candidates and roles against each other, trait by trait
4. **Connect:** either side sends a connection request, with an optional meeting invite
5. **Coffee chat:** accepted connections schedule a chat, message in real time, and leave feedback

## Features

- **Job seekers:** personality insights, ranked matches with a per-trait breakdown, network hub, messaging, coffee chat prep, and extra assessments (work values, situational judgment and more)
- **Employers:** culture insights, role management, AI-ranked candidates per role, connection inbox, and coffee chat scheduling with ratings
- **Platform:** light and dark themes, Stripe subscriptions, and role-based onboarding

## Project Structure

```
.
├── src/
│   ├── frontend/            # React app
│   │   └── src/
│   │       ├── components/  # UI grouped by area (auth, dashboard, ember, network, ...)
│   │       ├── contexts/    # Auth, theme, toast, messaging, connections
│   │       ├── lib/         # Supabase client, personality engine, scoring, Stripe
│   │       └── hooks/, types/, utils/, data/, styles/
│   └── backend/             # FastAPI server
│       ├── main.py          # App entry point and routes
│       ├── agent/           # Ember matching agent and archetype compatibility
│       ├── engine/          # OCEAN scoring and compatibility
│       ├── auth/            # Supabase JWT verification and role checks
│       ├── db/              # Supabase client and local SQLite for dev
│       └── scripts/         # Seed data
├── supabase/                # Schema, RLS policies, migrations, seeds
├── tests/                   # Unit, integration and end-to-end tests
└── docs/ARCHITECTURE.md
```

## Running Locally

Needs Node 18+, Python 3.11+ and a Supabase project.

1. **Database:** in the Supabase SQL editor, run `supabase/schema.sql`, then `supabase/rls-policies.sql`, then the migrations. Enable Email, Google and GitHub auth. Full steps are in [supabase/README.md](./supabase/README.md).
2. **Env files:** copy `.env.example` to `.env` in both `src/frontend` and `src/backend`, then fill in:
   - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Backend: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
   - Optional: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
3. **Backend:**
   ```bash
   cd src/backend
   python3 -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
4. **Frontend and run:** from the project root, install and start both servers together:
   ```bash
   npm install
   npm run dev
   ```
   The app runs at `http://localhost:5173` and the API at `http://127.0.0.1:8000`. Interactive API docs for all 38 endpoints are at `/docs`.

If `SUPABASE_JWT_SECRET` is not set, the API runs in dev mode and skips auth on protected routes.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend and backend together |
| `npm run frontend` / `npm run backend` | Start one side only |
| `npm run test` | Run frontend tests and backend `pytest` |
| `npm run lint` | ESLint and `ruff` |
| `npm run format` | Prettier and `black` |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch, commit and PR guidelines, and [CHANGELOG.md](./CHANGELOG.md) for release notes.

## License

[MIT](./LICENSE). Built by Nakul Patel.
