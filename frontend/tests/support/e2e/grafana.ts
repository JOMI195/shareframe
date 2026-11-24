import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { builtinVariables, defaultVariables, interpolate, type TemplateVariable, type Variables } from './grafanaInterpolate';

export const GRAFANA_URL = process.env.E2E_GRAFANA_URL ?? 'http://localhost:3101';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..');
const DASHBOARDS_DIR = path.join(REPO_ROOT, 'monitoring/grafana/dashboards');

const envTest = (key: string) => {
  const line = readFileSync(path.join(REPO_ROOT, '.env.test'), 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'));
  if (!line) throw new Error(`${key} missing from .env.test`);
  return line[1].trim();
};

export const grafanaAdmin = {
  user: envTest('GF_SECURITY_ADMIN_USER'),
  password: envTest('GF_SECURITY_ADMIN_PASSWORD'),
};

const AUTH = `Basic ${Buffer.from(`${grafanaAdmin.user}:${grafanaAdmin.password}`).toString('base64')}`;

const api = async <T>(route: string, body?: unknown): Promise<T> => {
  const response = await fetch(`${GRAFANA_URL}${route}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok && response.status !== 400) throw new Error(`Grafana ${route}: HTTP ${response.status} ${text}`);
  return JSON.parse(text) as T;
};

export interface Target {
  refId: string;
  expr: string;
  datasource: { type: string; uid: string };
  hide?: boolean;
  [key: string]: unknown;
}

export interface Panel {
  id: number;
  title: string;
  type: string;
  targets?: Target[];
  panels?: Panel[];
}

export interface Dashboard {
  uid: string;
  title: string;
  panels: Panel[];
  templating?: { list: TemplateVariable[] };
}

/** Every dashboard in the repo, so a new one is covered without touching the specs. */
export const dashboardUids = () =>
  readdirSync(DASHBOARDS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => (JSON.parse(readFileSync(path.join(DASHBOARDS_DIR, file), 'utf8')) as Dashboard).uid)
    .sort();

/** The provisioned copy, which is what users see. */
export const loadDashboard = async (uid: string) =>
  (await api<{ dashboard: Dashboard }>(`/api/dashboards/uid/${uid}`)).dashboard;

export const panelsOf = (dashboard: Dashboard): Panel[] =>
  dashboard.panels.flatMap((panel) => (panel.type === 'row' ? (panel.panels ?? []) : [panel]));

export const panelByTitle = (dashboard: Dashboard, title: string) => {
  const panel = panelsOf(dashboard).find((candidate) => candidate.title === title);
  if (!panel) throw new Error(`No panel "${title}" on ${dashboard.uid}`);
  return panel;
};

type Cell = number | string | null;

export interface Series {
  name: string;
  labels: Record<string, string>;
  values: Cell[];
  last: Cell;
}

export interface TargetResult {
  refId: string;
  expr: string;
  error?: string;
  rows: number;
  series: Series[];
}

interface Frame {
  schema: { fields: { name: string; type: string; labels?: Record<string, string> }[] };
  data: { values: Cell[][] };
}

interface QueryResponse {
  results?: Record<string, { error?: string; frames?: Frame[] }>;
  message?: string;
}

const lastValue = (values: Cell[]) => [...values].reverse().find((value) => value !== null) ?? null;

const flatten = (frames: Frame[]) => {
  let rows = 0;
  const series: Series[] = [];
  for (const frame of frames) {
    rows += frame.data.values[0]?.length ?? 0;
    frame.schema.fields.forEach((field, index) => {
      if (field.type === 'time') return;
      const values = frame.data.values[index] ?? [];
      series.push({ name: field.name, labels: field.labels ?? {}, values, last: lastValue(values) });
    });
  }
  return { rows, series };
};

export interface QueryOptions {
  variables?: Variables;
  /** Start of the time range; defaults to an hour ago. */
  fromMs?: number;
  intervalSecs?: number;
}

const rangeOf = ({ fromMs, intervalSecs = 60 }: QueryOptions) => {
  const to = Date.now();
  const from = fromMs ?? to - 3_600_000;
  return { from, to, rangeSecs: Math.ceil((to - from) / 1000), intervalSecs };
};

export const variablesFor = (dashboard: Dashboard, options: QueryOptions = {}) => {
  const { rangeSecs, intervalSecs } = rangeOf(options);
  return {
    ...builtinVariables(rangeSecs, intervalSecs),
    ...defaultVariables(dashboard.templating?.list ?? []),
    ...options.variables,
  };
};

export const queryTarget = async (
  dashboard: Dashboard,
  target: Target,
  options: QueryOptions = {},
): Promise<TargetResult> => {
  const { from, to, intervalSecs } = rangeOf(options);
  const expr = interpolate(target.expr, variablesFor(dashboard, options));
  const body = await api<QueryResponse>('/api/ds/query', {
    queries: [{ ...target, expr, interval: `${intervalSecs}s`, intervalMs: intervalSecs * 1000, maxDataPoints: 2000 }],
    from: String(from),
    to: String(to),
  });
  const result = body.results?.[target.refId];
  const error = result?.error ?? (result ? undefined : (body.message ?? 'no result'));
  return { refId: target.refId, expr, error, ...flatten(result?.frames ?? []) };
};

export const queryPanel = async (dashboard: Dashboard, panel: Panel, options: QueryOptions = {}) => {
  const results: TargetResult[] = [];
  for (const target of panel.targets ?? []) {
    if (!target.hide) results.push(await queryTarget(dashboard, target, options));
  }
  return results;
};

/** First numeric value of a panel target, optionally narrowed to one series by its labels. */
export const panelNumber = async (
  dashboard: Dashboard,
  title: string,
  { refId, labels = {}, ...options }: QueryOptions & { refId?: string; labels?: Record<string, string> } = {},
) => {
  const panel = panelByTitle(dashboard, title);
  const targets = (panel.targets ?? []).filter((target) => !refId || target.refId === refId);
  for (const target of targets) {
    const result = await queryTarget(dashboard, target, options);
    if (result.error) throw new Error(`${title} ${target.refId}: ${result.error}`);
    const match = result.series.find(
      (series) =>
        typeof series.last === 'number' &&
        Object.entries(labels).every(([key, value]) => series.labels[key] === value),
    );
    if (match) return match.last as number;
  }
  return null;
};

/** Sum over every point of the matching series, for counters bucketed per interval. */
export const panelSum = async (
  dashboard: Dashboard,
  title: string,
  { refId, labels = {}, ...options }: QueryOptions & { refId?: string; labels?: Record<string, string> } = {},
) => {
  const panel = panelByTitle(dashboard, title);
  let total = 0;
  for (const target of (panel.targets ?? []).filter((candidate) => !refId || candidate.refId === refId)) {
    const result = await queryTarget(dashboard, target, options);
    if (result.error) throw new Error(`${title} ${target.refId}: ${result.error}`);
    for (const series of result.series) {
      if (!Object.entries(labels).every(([key, value]) => series.labels[key] === value)) continue;
      total += series.values.reduce<number>((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
    }
  }
  return total;
};

/** Rows a log or table panel returns, optionally only those whose line contains the text. */
export const panelRows = async (dashboard: Dashboard, title: string, options: QueryOptions & { contains?: string } = {}) => {
  let rows = 0;
  for (const result of await queryPanel(dashboard, panelByTitle(dashboard, title), options)) {
    if (result.error) throw new Error(`${title} ${result.refId}: ${result.error}`);
    if (!options.contains) {
      rows += result.rows;
      continue;
    }
    rows += result.series
      .flatMap((series) => series.values)
      .filter((value) => typeof value === 'string' && value.includes(options.contains!)).length;
  }
  return rows;
};

/** A sign-in through Grafana's login form, the path its auth log lines come from. */
export const grafanaFormLogin = async (password: string) =>
  (
    await fetch(`${GRAFANA_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: grafanaAdmin.user, password }),
    })
  ).status;
