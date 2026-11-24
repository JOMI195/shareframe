import { API_URL, composeExec } from './stack';

const BACKEND_URL = new URL(API_URL).origin;

type ExporterPath = '/metrics' | '/metrics/business';

const parseLabels = (raw: string) =>
  Object.fromEntries([...raw.matchAll(/(\w+)="((?:[^"\\]|\\.)*)"/g)].map(([, key, value]) => [key, value]));

/**
 * Samples straight from the backend's exporter, the source Prometheus scrapes.
 * Comparing a panel with them checks the scrape, the query and the panel, not the collector itself.
 */
export const exporterSamples = async (path: ExporterPath, name: string, labels: Record<string, string> = {}) =>
  parseSamples(await (await fetch(`${BACKEND_URL}${path}`)).text(), name, labels);

const parseSamples = (body: string, name: string, labels: Record<string, string>) => {
  const samples: { labels: Record<string, string>; value: number }[] = [];
  for (const line of body.split('\n')) {
    const match = line.match(/^(\w+)(?:\{(.*)\})? (\S+)$/);
    if (!match || match[1] !== name) continue;
    const sample = parseLabels(match[2] ?? '');
    if (Object.entries(labels).every(([key, value]) => sample[key] === value)) {
      samples.push({ labels: sample, value: Number(match[3]) });
    }
  }
  return samples;
};

export const exporterValue = async (path: ExporterPath, name: string, labels: Record<string, string> = {}) =>
  (await exporterSamples(path, name, labels))[0]?.value ?? null;

/** node-exporter is only reachable inside the stack's network. */
export const nodeExporterValue = async (name: string, labels: Record<string, string> = {}) => {
  const body = await composeExec('prometheus', ['wget', '-qO-', 'http://node-exporter:9100/metrics']);
  return parseSamples(body, name, labels)[0]?.value ?? null;
};
