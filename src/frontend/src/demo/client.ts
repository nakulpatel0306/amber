/**
 * Stand-in for the supabase-js client in demo builds: auth, table queries,
 * RPCs, realtime channels and storage, all backed by the in-browser store.
 * lib/supabase.ts hands this to the app instead of the real client, so every
 * component and context runs its normal code path.
 */
import { DemoQuery, type QueryResult } from './query';
import {
  addUser,
  fileUrl,
  insertRow,
  newId,
  saveFile,
  sessionUserId,
  setSessionUserId,
  subscribe,
  table,
  users,
  type Change,
  type DemoUser,
} from './store';

type AuthEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED';
type AuthListener = (event: AuthEvent, session: DemoSession | null) => void;

export interface DemoSession {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: ReturnType<typeof toAuthUser>;
}

const authListeners = new Set<AuthListener>();

function toAuthUser(user: DemoUser) {
  return {
    id: user.id,
    email: user.email,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'email' },
    user_metadata: user.user_metadata,
    created_at: user.created_at,
    email_confirmed_at: user.created_at,
  };
}

function currentSession(): DemoSession | null {
  const id = sessionUserId();
  const user = id ? users().find((u) => u.id === id) : undefined;
  if (!user) return null;
  return {
    access_token: `demo-token-${user.id}`,
    refresh_token: 'demo-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    user: toAuthUser(user),
  };
}

function notify(event: AuthEvent): void {
  const session = currentSession();
  setTimeout(() => authListeners.forEach((l) => l(event, session)), 0);
}

function authError(message: string) {
  return { name: 'AuthApiError', message, status: 400 };
}

/** Mirrors handle_new_user() in supabase/schema.sql. */
function createUserRecords(user: DemoUser): void {
  const role = (user.user_metadata.role as string | undefined) ?? null;
  insertRow('profiles', {
    id: user.id,
    email: user.email,
    full_name: (user.user_metadata.full_name as string | undefined) ?? null,
    avatar_url: (user.user_metadata.avatar_url as string | undefined) ?? null,
    role,
    email_verified: true,
    onboarding_completed: false,
    subscription_plan: 'free',
    subscription_status: 'inactive',
  });
  insertRow('user_settings', { user_id: user.id, theme: 'amber-light', profile_visible: true });
  if (role === 'candidate') insertRow('candidates', { user_id: user.id, assessment_status: 'not_started', hobbies: [], catalog_photos: [] });
  if (role === 'employer') insertRow('employers', { user_id: user.id, company_name: 'My Company', culture_values: [] });
}

const auth = {
  async getSession() {
    return { data: { session: currentSession() }, error: null };
  },

  async getUser() {
    const session = currentSession();
    return session
      ? { data: { user: session.user }, error: null }
      : { data: { user: null }, error: authError('Auth session missing!') };
  },

  onAuthStateChange(listener: AuthListener) {
    authListeners.add(listener);
    return { data: { subscription: { id: newId(), unsubscribe: () => authListeners.delete(listener) } } };
  },

  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
    const normalized = email.trim().toLowerCase();
    if (users().some((u) => u.email === normalized)) {
      return { data: { user: null, session: null }, error: authError('User already registered') };
    }
    const user: DemoUser = {
      id: newId(),
      email: normalized,
      password,
      user_metadata: options?.data ?? {},
      created_at: new Date().toISOString(),
    };
    addUser(user);
    createUserRecords(user);
    setSessionUserId(user.id);
    notify('SIGNED_IN');
    const session = currentSession();
    return { data: { user: session?.user ?? null, session }, error: null };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const user = users().find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      return { data: { user: null, session: null }, error: authError('Invalid login credentials') };
    }
    setSessionUserId(user.id);
    notify('SIGNED_IN');
    const session = currentSession();
    return { data: { user: session?.user ?? null, session }, error: null };
  },

  async signInWithOAuth() {
    return { data: { provider: null, url: null }, error: authError('Google and GitHub sign-in are turned off in the demo.') };
  },

  async signOut() {
    setSessionUserId(null);
    notify('SIGNED_OUT');
    return { error: null };
  },

  async resetPasswordForEmail() {
    return { data: {}, error: null };
  },

  async resend() {
    return { data: {}, error: null };
  },

  async updateUser(attributes: { password?: string; data?: Record<string, unknown> }) {
    const id = sessionUserId();
    const user = users().find((u) => u.id === id);
    if (!user) return { data: { user: null }, error: authError('Auth session missing!') };
    if (attributes.password) user.password = attributes.password;
    if (attributes.data) user.user_metadata = { ...user.user_metadata, ...attributes.data };
    notify('USER_UPDATED');
    return { data: { user: toAuthUser(user) }, error: null };
  },
};

type RpcHandler = (args: Record<string, unknown>) => unknown;

const rpcHandlers: Record<string, RpcHandler> = {
  get_profiles_by_ids: ({ user_ids }) => {
    const ids = new Set(user_ids as string[]);
    return table('profiles')
      .filter((p) => ids.has(p.id))
      .map((p) => ({ id: p.id, full_name: p.full_name, email: p.email }));
  },
  get_employers_for_candidate: () => table('employers').filter((e) => e.culture_quiz_completed),
  get_candidates_for_employer: ({ employer_user_id }) =>
    table('candidates').filter((c) => c.openness_score != null && c.user_id !== employer_user_id),
  get_employer_with_roles: ({ employer_uuid }) => {
    const employer = table('employers').find((e) => e.id === employer_uuid);
    if (!employer) return { employer: null, roles: [] };
    const roles = table('roles')
      .filter((r) => r.employer_id === employer.id && r.status === 'active')
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return { employer, roles };
  },
};

async function rpc(name: string, args: Record<string, unknown> = {}): Promise<QueryResult> {
  const handler = rpcHandlers[name];
  if (!handler) {
    return {
      data: null,
      count: null,
      status: 404,
      statusText: 'Not Found',
      error: { code: 'PGRST202', message: `Function ${name} is not part of the demo`, details: null, hint: null },
    };
  }
  return { data: handler(args), error: null, count: null, status: 200, statusText: 'OK' };
}

interface ChangeFilter {
  event: string;
  table: string;
  filter?: string;
}

type ChangeHandler = (payload: Change & { schema: 'public'; commit_timestamp: string }) => void;

class DemoChannel {
  private handlers: { filter: ChangeFilter; callback: ChangeHandler }[] = [];
  private unsubscribe: (() => void) | null = null;

  constructor(readonly topic: string) {}

  on(_type: 'postgres_changes', filter: ChangeFilter, callback: ChangeHandler): this {
    this.handlers.push({ filter, callback });
    return this;
  }

  subscribe(status?: (state: string) => void): this {
    this.unsubscribe = subscribe((change) => {
      for (const { filter, callback } of this.handlers) {
        if (filter.table !== change.table) continue;
        if (filter.event !== '*' && filter.event !== change.eventType) continue;
        if (filter.filter && !matchesFilter(filter.filter, change)) continue;
        callback({ ...change, schema: 'public', commit_timestamp: new Date().toISOString() });
      }
    });
    status?.('SUBSCRIBED');
    return this;
  }

  close(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}

function matchesFilter(filter: string, change: Change): boolean {
  const [column, rest] = filter.split('=');
  const value = rest?.replace(/^eq\./, '');
  const row = (change.eventType === 'DELETE' ? change.old : change.new) as Record<string, unknown>;
  return String(row[column]) === value;
}

const MAX_UPLOAD_BYTES = 1_500_000;

function storageBucket(bucket: string) {
  return {
    async upload(path: string, file: Blob) {
      if (file.size > MAX_UPLOAD_BYTES) {
        return { data: null, error: { message: 'Images over 1.5 MB are too large for the in-browser demo.' } };
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      saveFile(`${bucket}/${path}`, dataUrl);
      return { data: { path }, error: null };
    },
    getPublicUrl(path: string) {
      return { data: { publicUrl: fileUrl(`${bucket}/${path}`) } };
    },
    async remove() {
      return { data: [], error: null };
    },
  };
}

export function createDemoClient() {
  return {
    auth,
    from: (name: string) => new DemoQuery(name),
    rpc,
    channel: (topic: string) => new DemoChannel(topic),
    removeChannel: async (channel: DemoChannel) => {
      channel.close();
      return 'ok';
    },
    storage: { from: storageBucket },
  };
}
