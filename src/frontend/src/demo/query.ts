/**
 * A small PostgREST stand-in: the subset of supabase-js's query builder the
 * app actually calls (select with embedded relations, filters, ordering,
 * single rows, counts, insert/update/upsert/delete with returning), evaluated
 * against the in-browser tables.
 *
 * Row visibility mirrors the Row Level Security policies in supabase/ so a
 * component that relies on RLS to scope a query sees the same rows here.
 */
import { deleteRow, insertRow, sessionUserId, table, updateRow, type Row } from './store';

export interface PostgrestError {
  message: string;
  code: string;
  details: string | null;
  hint: string | null;
}

export interface QueryResult {
  data: unknown;
  error: PostgrestError | null;
  count: number | null;
  status: number;
  statusText: string;
}

/** Foreign keys: table -> { embedded table name: local column }. */
const MANY_TO_ONE: Record<string, Record<string, string>> = {
  roles: { employers: 'employer_id' },
  candidates: { profiles: 'user_id' },
  employers: { profiles: 'user_id' },
  activity_posts: { profiles: 'user_id' },
  post_likes: { activity_posts: 'post_id', profiles: 'user_id' },
  applications: { roles: 'role_id', candidates: 'candidate_id' },
  coffee_chats: { candidates: 'candidate_id', employers: 'employer_id', roles: 'role_id', connections: 'connection_id' },
  saved_matches: { roles: 'role_id', employers: 'employer_id', candidates: 'candidate_id' },
  messages: { coffee_chats: 'coffee_chat_id' },
  assessment_responses: { assessments: 'assessment_id' },
  connection_meet_invites: { connections: 'connection_id' },
};

const DEFAULTS: Record<string, Record<string, unknown>> = {
  candidates: { assessment_status: 'not_started', hobbies: [], catalog_photos: [], setup_step: 0 },
  employers: { culture_quiz_completed: false, culture_values: [], setup_step: 0 },
  roles: { status: 'draft' },
  coffee_chats: { status: 'pending', duration_minutes: 30 },
  connections: { status: 'pending' },
  saved_matches: { status: 'saved' },
  activity_posts: { like_count: 0, hobby_tags: [] },
  messages: { read_at: null },
  user_settings: { theme: 'amber-light', profile_visible: true },
};

function ownedBy(uid: string | null, ...ids: unknown[]): boolean {
  return uid !== null && ids.includes(uid);
}

function coffeeChatVisible(uid: string | null, chat: Row | undefined): boolean {
  if (!chat) return false;
  const candidate = table('candidates').find((c) => c.id === chat.candidate_id);
  const employer = table('employers').find((e) => e.id === chat.employer_id);
  return ownedBy(uid, candidate?.user_id, employer?.user_id);
}

const VISIBILITY: Record<string, (row: Row, uid: string | null) => boolean> = {
  user_settings: (r, uid) => ownedBy(uid, r.user_id),
  saved_matches: (r, uid) => ownedBy(uid, r.user_id),
  assessments: (r, uid) => ownedBy(uid, r.user_id),
  assessment_responses: (r, uid) => ownedBy(uid, r.user_id),
  connections: (r, uid) => ownedBy(uid, r.sender_id, r.receiver_id),
  coffee_chats: (r, uid) => coffeeChatVisible(uid, r),
  messages: (r, uid) => coffeeChatVisible(uid, table('coffee_chats').find((c) => c.id === r.coffee_chat_id)),
};

function visibleRows(name: string, serviceRole = false): Row[] {
  const rule = serviceRole ? undefined : VISIBILITY[name];
  const uid = sessionUserId();
  return rule ? table(name).filter((r) => rule(r, uid)) : [...table(name)];
}

interface SelectNode {
  kind: 'all' | 'column' | 'embed';
  name: string;
  alias: string;
  inner?: boolean;
  fkColumn?: string;
  children?: SelectNode[];
}

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of input) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function parseSelect(input: string): SelectNode[] {
  return splitTopLevel(input.replace(/\s+/g, ' ')).map((token) => {
    if (token === '*') return { kind: 'all', name: '*', alias: '*' };
    const open = token.indexOf('(');
    if (open === -1) {
      const [alias, name] = token.includes(':') ? token.split(':') : [token, token];
      return { kind: 'column', name: name.trim(), alias: alias.trim() };
    }
    const head = token.slice(0, open).trim();
    const children = parseSelect(token.slice(open + 1, token.lastIndexOf(')')));
    const [left, right] = head.includes(':') ? head.split(':') : [head, null];
    const [rawName, hint] = (right ?? left).split('!');
    // "profiles:user_id(...)" names the embed by alias and joins through a column
    const throughColumn = right !== null && rawName.endsWith('_id');
    return {
      kind: 'embed',
      name: throughColumn ? left : rawName,
      alias: right !== null ? left : rawName,
      inner: hint === 'inner',
      fkColumn: throughColumn ? rawName : undefined,
      children,
    };
  });
}

function resolveEmbed(parentTable: string, parent: Row, node: SelectNode): Row | Row[] | null {
  const forward = MANY_TO_ONE[parentTable] ?? {};
  const column = node.fkColumn ?? forward[node.name];
  if (column) {
    const target = node.fkColumn
      ? Object.entries(forward).find(([, col]) => col === node.fkColumn)?.[0] ?? node.name
      : node.name;
    const match = table(target).find((r) => r.id === parent[column]);
    return match ? project(target, match, node.children ?? []) : null;
  }
  const backColumn = MANY_TO_ONE[node.name]?.[parentTable];
  if (backColumn) {
    return visibleRows(node.name)
      .filter((r) => r[backColumn] === parent.id)
      .map((r) => project(node.name, r, node.children ?? []));
  }
  return null;
}

function project(tableName: string, row: Row, nodes: SelectNode[]): Row {
  const out: Record<string, unknown> = {};
  for (const node of nodes) {
    if (node.kind === 'all') Object.assign(out, row);
    else if (node.kind === 'column') out[node.alias] = row[node.name] ?? null;
    else out[node.alias] = resolveEmbed(tableName, row, node);
  }
  return out as Row;
}

function passesInner(row: Row, nodes: SelectNode[]): boolean {
  return nodes.every((node) => {
    if (node.kind !== 'embed' || !node.inner) return true;
    const value = row[node.alias];
    return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined;
  });
}

function same(a: unknown, b: unknown): boolean {
  if (a === null || a === undefined || b === null || b === undefined) return a == b;
  return String(a) === String(b);
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

function parseListValue(raw: string): string[] {
  return raw.replace(/^\(|\)$/g, '').split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
}

type Predicate = (row: Row) => boolean;

function operatorPredicate(column: string, operator: string, value: unknown): Predicate {
  switch (operator) {
    case 'eq':
      return (r) => same(r[column], value);
    case 'neq':
      return (r) => !same(r[column], value);
    case 'gt':
      return (r) => r[column] != null && compare(r[column], value) > 0;
    case 'gte':
      return (r) => r[column] != null && compare(r[column], value) >= 0;
    case 'lt':
      return (r) => r[column] != null && compare(r[column], value) < 0;
    case 'lte':
      return (r) => r[column] != null && compare(r[column], value) <= 0;
    case 'is':
      return (r) => (value === null || value === 'null' ? r[column] == null : same(r[column], value));
    case 'in': {
      const list = Array.isArray(value) ? value : parseListValue(String(value));
      return (r) => list.some((v) => same(r[column], v));
    }
    case 'like':
    case 'ilike': {
      const pattern = new RegExp(`^${String(value).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*')}$`, operator === 'ilike' ? 'i' : '');
      return (r) => pattern.test(String(r[column] ?? ''));
    }
    case 'cs':
    case 'contains': {
      const wanted = Array.isArray(value) ? value : parseListValue(String(value));
      return (r) => Array.isArray(r[column]) && wanted.every((v) => (r[column] as unknown[]).some((x) => same(x, v)));
    }
    default:
      throw new Error(`Demo query: unsupported operator "${operator}"`);
  }
}

/** Parses supabase's .or() syntax: "a.eq.1,b.is.null". */
function orPredicate(expression: string): Predicate {
  const clauses = splitTopLevel(expression).map((clause) => {
    const [column, operator, ...rest] = clause.split('.');
    const raw = rest.join('.');
    return operatorPredicate(column, operator, raw === 'null' ? null : raw);
  });
  return (r) => clauses.some((p) => p(r));
}

type Operation = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

export class DemoQuery implements PromiseLike<QueryResult> {
  private operation: Operation = 'select';
  private columns = '*';
  private returning = false;
  private predicates: Predicate[] = [];
  private orders: { column: string; ascending: boolean; nullsFirst: boolean }[] = [];
  private limitCount: number | null = null;
  private rangeBounds: [number, number] | null = null;
  private singleMode: 'single' | 'maybe' | null = null;
  private countMode = false;
  private headOnly = false;
  private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private conflictColumns: string[] = ['id'];

  /** serviceRole skips RLS, like the backend's service-role Supabase client. */
  constructor(
    private readonly tableName: string,
    private readonly serviceRole = false,
  ) {}

  select(columns = '*', options?: { count?: string; head?: boolean }): this {
    if (this.operation !== 'select') this.returning = true;
    this.columns = columns;
    this.countMode = Boolean(options?.count);
    this.headOnly = Boolean(options?.head);
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]): this {
    this.operation = 'insert';
    this.payload = values;
    return this;
  }

  update(values: Record<string, unknown>): this {
    this.operation = 'update';
    this.payload = values;
    return this;
  }

  upsert(values: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string }): this {
    this.operation = 'upsert';
    this.payload = values;
    if (options?.onConflict) this.conflictColumns = options.onConflict.split(',').map((c) => c.trim());
    return this;
  }

  delete(): this {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: unknown) { return this.where(column, 'eq', value); }
  neq(column: string, value: unknown) { return this.where(column, 'neq', value); }
  gt(column: string, value: unknown) { return this.where(column, 'gt', value); }
  gte(column: string, value: unknown) { return this.where(column, 'gte', value); }
  lt(column: string, value: unknown) { return this.where(column, 'lt', value); }
  lte(column: string, value: unknown) { return this.where(column, 'lte', value); }
  is(column: string, value: unknown) { return this.where(column, 'is', value); }
  in(column: string, values: unknown[]) { return this.where(column, 'in', values); }
  like(column: string, value: string) { return this.where(column, 'like', value); }
  ilike(column: string, value: string) { return this.where(column, 'ilike', value); }
  contains(column: string, value: unknown[]) { return this.where(column, 'contains', value); }
  filter(column: string, operator: string, value: unknown) { return this.where(column, operator, value); }

  not(column: string, operator: string, value: unknown): this {
    const inner = operatorPredicate(column, operator, value);
    this.predicates.push((r) => !inner(r));
    return this;
  }

  or(expression: string): this {
    this.predicates.push(orPredicate(expression));
    return this;
  }

  match(query: Record<string, unknown>): this {
    Object.entries(query).forEach(([column, value]) => this.where(column, 'eq', value));
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    const ascending = options?.ascending ?? true;
    this.orders.push({ column, ascending, nullsFirst: options?.nullsFirst ?? !ascending });
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): this {
    this.rangeBounds = [from, to];
    return this;
  }

  single(): this {
    this.singleMode = 'single';
    return this;
  }

  maybeSingle(): this {
    this.singleMode = 'maybe';
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return new Promise<QueryResult>((resolve) => resolve(this.execute())).then(onfulfilled, onrejected);
  }

  private where(column: string, operator: string, value: unknown): this {
    this.predicates.push(operatorPredicate(column, operator, value));
    return this;
  }

  private matching(): Row[] {
    return visibleRows(this.tableName, this.serviceRole).filter((r) => this.predicates.every((p) => p(r)));
  }

  private execute(): QueryResult {
    let rows: Row[];
    switch (this.operation) {
      case 'insert':
        rows = this.rowsFromPayload().map((values) => insertRow(this.tableName, this.withDefaults(values)));
        break;
      case 'update':
        rows = this.matching()
          .map((r) => updateRow(this.tableName, r.id, this.payload as Record<string, unknown>))
          .filter((r): r is Row => r !== null);
        break;
      case 'upsert':
        rows = this.rowsFromPayload().map((values) => this.upsertOne(values));
        break;
      case 'delete':
        rows = this.matching()
          .map((r) => deleteRow(this.tableName, r.id))
          .filter((r): r is Row => r !== null);
        break;
      default:
        rows = this.matching();
    }

    if (this.operation !== 'select' && !this.returning) {
      return ok(null, null);
    }
    return this.shape(rows);
  }

  private shape(rows: Row[]): QueryResult {
    const nodes = parseSelect(this.columns);
    let result = rows.map((r) => project(this.tableName, r, nodes)).filter((r) => passesInner(r, nodes));

    for (const { column, ascending, nullsFirst } of [...this.orders].reverse()) {
      result = [...result].sort((a, b) => {
        const av = a[column];
        const bv = b[column];
        if (av == null || bv == null) {
          if (av == bv) return 0;
          return (av == null) === nullsFirst ? -1 : 1;
        }
        const diff = compare(av, bv);
        return ascending ? diff : -diff;
      });
    }

    const count = result.length;
    if (this.rangeBounds) result = result.slice(this.rangeBounds[0], this.rangeBounds[1] + 1);
    if (this.limitCount !== null) result = result.slice(0, this.limitCount);

    if (this.headOnly) return ok(null, count);

    if (this.singleMode) {
      if (result.length === 1) return ok(result[0], this.countMode ? 1 : null);
      if (result.length === 0 && this.singleMode === 'maybe') return ok(null, null);
      return {
        data: null,
        count: null,
        status: 406,
        statusText: 'Not Acceptable',
        error: {
          code: 'PGRST116',
          message: 'JSON object requested, multiple (or no) rows returned',
          details: `The result contains ${result.length} rows`,
          hint: null,
        },
      };
    }
    return ok(result, this.countMode ? count : null);
  }

  private rowsFromPayload(): Record<string, unknown>[] {
    if (!this.payload) return [];
    return Array.isArray(this.payload) ? this.payload : [this.payload];
  }

  private withDefaults(values: Record<string, unknown>): Record<string, unknown> {
    return { ...(DEFAULTS[this.tableName] ?? {}), ...values };
  }

  private upsertOne(values: Record<string, unknown>): Row {
    const keys = this.conflictColumns.filter((c) => values[c] !== undefined);
    const existing = keys.length
      ? table(this.tableName).find((r) => keys.every((k) => same(r[k], values[k])))
      : undefined;
    if (existing) return updateRow(this.tableName, existing.id, values) as Row;
    return insertRow(this.tableName, this.withDefaults(values));
  }
}

function ok(data: unknown, count: number | null): QueryResult {
  return { data, error: null, count, status: 200, statusText: 'OK' };
}
