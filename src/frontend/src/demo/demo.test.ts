import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoClient } from './client';
import { demoFetch } from './backend';
import { parseSelect } from './query';
import { SEED_IDS } from './seed';
import { resetDemo, subscribe } from './store';

const supabase = createDemoClient();

beforeEach(async () => {
  resetDemo();
  await supabase.auth.signOut();
});

async function signUp(role: 'candidate' | 'employer') {
  const { data } = await supabase.auth.signUp({
    email: `${role}@demo.example.com`,
    password: 'pw',
    options: { data: { role, full_name: 'Test Visitor' } },
  });
  return data.user!.id;
}

describe('select parsing', () => {
  it('reads columns, aliases and embeds', () => {
    const nodes = parseSelect('id, title, employers!inner(id, company_name), owner:profiles(full_name), profiles:user_id(role)');
    expect(nodes.map((n) => [n.kind, n.alias, n.name])).toEqual([
      ['column', 'id', 'id'],
      ['column', 'title', 'title'],
      ['embed', 'employers', 'employers'],
      ['embed', 'owner', 'profiles'],
      ['embed', 'profiles', 'profiles'],
    ]);
    expect(nodes[2].inner).toBe(true);
    expect(nodes[4].fkColumn).toBe('user_id');
  });
});

describe('demo query builder', () => {
  it('embeds many-to-one and one-to-many relations', async () => {
    const { data: roles } = await supabase.from('roles').select('id, title, employers!inner(company_name)').eq('status', 'active');
    expect((roles as { employers: { company_name: string } }[])[0].employers.company_name).toBeTruthy();

    const { data: employer } = await supabase
      .from('employers')
      .select('company_name, roles(id, status)')
      .eq('id', SEED_IDS.employer('northwind'))
      .single();
    expect((employer as { roles: unknown[] }).roles).toHaveLength(2);
  });

  it('filters, orders, limits and counts', async () => {
    const { data } = await supabase
      .from('candidates')
      .select('openness_score')
      .not('openness_score', 'is', null)
      .gte('openness_score', 80)
      .order('openness_score', { ascending: false })
      .limit(3);
    const scores = (data as { openness_score: number }[]).map((r) => r.openness_score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(scores.every((s) => s >= 80)).toBe(true);

    const { count } = await supabase.from('roles').select('*', { count: 'exact', head: true }).in('work_style', ['remote']);
    expect(count).toBeGreaterThan(0);
  });

  it('returns PGRST116 from single() when no row matches', async () => {
    const { data, error } = await supabase.from('roles').select('*').eq('id', 'missing').single();
    expect(data).toBeNull();
    expect(error?.code).toBe('PGRST116');
  });

  it('upserts on the conflict columns', async () => {
    const userId = await signUp('candidate');
    await supabase.from('candidates').upsert({ user_id: userId, headline: 'First' }, { onConflict: 'user_id' });
    await supabase.from('candidates').upsert({ user_id: userId, headline: 'Second' }, { onConflict: 'user_id' });
    const { data } = await supabase.from('candidates').select('headline').eq('user_id', userId);
    expect(data).toEqual([{ headline: 'Second' }]);
  });

  it('hides other users rows the way RLS does', async () => {
    await signUp('candidate');
    const { data } = await supabase.from('user_settings').select('*');
    expect(data).toHaveLength(1);
  });
});

describe('demo auth', () => {
  it('creates profile, settings and role row on signup like handle_new_user()', async () => {
    const userId = await signUp('employer');
    const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', userId).single();
    expect(profile).toEqual({ role: 'employer', full_name: 'Test Visitor' });
    const { data: employer } = await supabase.from('employers').select('company_name').eq('user_id', userId).single();
    expect(employer).toEqual({ company_name: 'My Company' });
  });

  it('refuses OAuth and wrong passwords', async () => {
    await signUp('candidate');
    await supabase.auth.signOut();
    expect((await supabase.auth.signInWithOAuth()).error).not.toBeNull();
    expect((await supabase.auth.signInWithPassword({ email: 'candidate@demo.example.com', password: 'nope' })).error).not.toBeNull();
    expect((await supabase.auth.signInWithPassword({ email: 'candidate@demo.example.com', password: 'pw' })).error).toBeNull();
  });
});

describe('demo realtime', () => {
  it('delivers filtered postgres_changes inserts', async () => {
    const seen: string[] = [];
    const channel = supabase
      .channel('t')
      .on('postgres_changes', { event: 'INSERT', table: 'messages', filter: 'coffee_chat_id=eq.chat-1' }, (p) => {
        seen.push((p.new as { content: string }).content);
      })
      .subscribe();
    await supabase.from('messages').insert({ coffee_chat_id: 'chat-1', sender_id: 'x', content: 'hello' });
    await supabase.from('messages').insert({ coffee_chat_id: 'chat-2', sender_id: 'x', content: 'other' });
    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toEqual(['hello']);
    await supabase.removeChannel(channel);
  });
});

describe('demo backend', () => {
  it('serves Ember analysis with the same shape as FastAPI', async () => {
    const res = await demoFetch(`/api/ember/analysis?candidate_id=${SEED_IDS.candidate(0)}&employer_id=${SEED_IDS.employer('kestrel')}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.candidate_name).toBe('Aisha Rahman');
    expect(body.company_name).toBe('Kestrel Studio');
    expect(body.overall_score).toBeGreaterThan(0);
    expect(body.dimension_analysis).toHaveLength(5);
  });

  it('ranks every seeded candidate for an employer, best first', async () => {
    const body = await (await demoFetch(`/api/ember/employer-matches/${SEED_IDS.employer('harbor')}`)).json();
    const scores = body.candidates.map((c: { overall_score: number }) => c.overall_score);
    expect(scores.length).toBe(16);
    expect(scores).toEqual([...scores].sort((a: number, b: number) => b - a));
  });

  it('creates a coffee chat when a connection carries a meet invite', async () => {
    const userId = await signUp('candidate');
    const res = await demoFetch('/api/connections', {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: SEED_IDS.profile('fernleaf'),
        sender_role: 'candidate',
        meet_invite: { proposed_times: ['2030-01-01T15:00:00Z'], duration_minutes: 30 },
      }),
    });
    expect(res.status).toBe(200);
    const { data: chats } = await supabase.from('coffee_chats').select('status, preferred_dates');
    expect(chats).toEqual([{ status: 'pending', preferred_dates: ['2030-01-01T15:00:00Z'] }]);

    const dup = await demoFetch('/api/connections', { method: 'POST', body: JSON.stringify({ receiver_id: SEED_IDS.profile('fernleaf'), sender_role: 'candidate' }) });
    expect(dup.status).toBe(409);
    expect(userId).toBeTruthy();
  });

  it('turns Stripe checkout away with an explanation', async () => {
    const res = await demoFetch('/api/stripe/create-checkout-session', { method: 'POST', body: '{}' });
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toMatch(/Stripe/);
  });

  it('broadcasts store changes', async () => {
    const tables: string[] = [];
    const stop = subscribe((c) => tables.push(c.table));
    await supabase.from('feedback').insert({ message: 'hi' });
    await new Promise((r) => setTimeout(r, 0));
    stop();
    expect(tables).toContain('feedback');
  });
});
