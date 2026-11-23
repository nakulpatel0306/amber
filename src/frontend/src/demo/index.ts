/**
 * The demo seam. A demo build swaps exactly two things for in-browser versions:
 *   - the Supabase client (lib/supabase.ts) -> createDemoClient()
 *   - backend HTTP calls (utils/api.ts)     -> demoFetch()
 * Everything else, components, contexts and scoring, is the production code.
 */
import { startAutoReplies } from './autoReply';
import { createDemoClient } from './client';

export { demoFetch } from './backend';

export function createDemoSupabase() {
  startAutoReplies();
  return createDemoClient();
}
