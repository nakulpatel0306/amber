# Archived fix scripts

These are one-off scripts the team ran against its own Supabase project while building Amber. None of them are part of setup, and several drop and recreate policies, so don't run them on a fresh database. They're kept because they show how the RLS design changed.

## The RLS recursion lesson

Amber let the browser read Postgres directly through supabase-js, so Row Level Security was the whole authorization layer. Matching needed each side to see the other: candidates reading employers, employers reading candidates, and both reading names from `profiles`. The first cross-visibility policies checked a user's role by querying `profiles` or the other side's table from inside a policy on that table, and Postgres raised `infinite recursion detected in policy`.

These scripts are the attempts at fixing it, committed in February and March 2026:

| File | What it tried |
|------|---------------|
| `fix-rls-policies.sql` | Restore "own data" access after the cross-visibility migration, keeping cross-visibility policies |
| `fix-infinite-recursion.sql` | Stop `profiles` policies from querying `profiles`, checking role through `candidates`/`employers` instead |
| `fix-all-recursion.sql` | Break the longer `profiles -> candidates -> profiles` chain by dropping every policy in it |
| `fix-rls-no-recursion.sql` | Remove cross-visibility policies entirely and move matching reads to the backend's service role |
| `fix-rls-complete.sql` | Rebuild every SELECT policy from a clean slate |
| `fix-rls-final.sql` | Keep cross-visibility on `candidates`/`employers` only, and look up names through a `SECURITY DEFINER` function |
| `revert-candidate-view-employer.sql` | Drop a coffee-chat-based employer policy that brought the recursion back |
| `fix-candidate-coffee-chat-insert.sql` | Add the missing candidate INSERT policy on `coffee_chats` (now in `rls-policies.sql`) |

Where it ended up: in `rls-policies.sql`, users can only read their own `candidates` or `employers` row, and reads that cross sides go through `SECURITY DEFINER` functions or through FastAPI with the service role. The functions the app calls are in [`../rpc-matching.sql`](../rpc-matching.sql) and [`../rpc-get-employer-with-roles.sql`](../rpc-get-employer-with-roles.sql).

## Data fixes

| File | What it did |
|------|-------------|
| `fix-test-data.sql` | Set assessment status and OCEAN scores on the seeded test candidates |
| `fix-existing-candidate-scores.sql` | Backfill OCEAN scores for specific seeded candidates by email |
| `fix-candidate-assessment-status.sql` | Repair candidates whose assessment data and status disagreed |
