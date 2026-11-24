export interface TemplateVariable {
  name: string;
  type: string;
  multi?: boolean;
  includeAll?: boolean;
  allValue?: string | null;
  current?: { value?: string | string[] };
}

export type Variables = Record<string, string>;

const regexJoin = (values: string[]) => (values.length === 1 ? values[0] : `(${values.join('|')})`);

/** What Grafana substitutes for each dashboard variable on first load, `All` as a match-anything regex. */
export const defaultVariables = (variables: TemplateVariable[]): Variables => {
  const resolved: Variables = {};
  for (const variable of variables) {
    const current = variable.current?.value ?? '';
    const values = Array.isArray(current) ? current : [current];
    resolved[variable.name] =
      values.includes('$__all') || (values.length === 1 && values[0] === '' && variable.includeAll)
        ? (variable.allValue ?? '.*')
        : regexJoin(values);
  }
  return resolved;
};

export const builtinVariables = (rangeSecs: number, intervalSecs = 60): Variables => ({
  __range: `${rangeSecs}s`,
  __range_s: String(rangeSecs),
  __range_ms: String(rangeSecs * 1000),
  __interval: `${intervalSecs}s`,
  __interval_ms: String(intervalSecs * 1000),
  __rate_interval: `${intervalSecs * 4}s`,
  __auto: `${intervalSecs}s`,
});

/** Fails on anything left unresolved, so a new dashboard variable cannot slip through as a literal. */
export const interpolate = (expr: string, variables: Variables) => {
  // `$1` in label_replace is a capture group, not a variable.
  const name = '([A-Za-z_]\\w*)';
  const pattern = new RegExp(`\\$\\{${name}(?::\\w+)?\\}|\\[\\[${name}\\]\\]|\\$${name}`, 'g');
  return expr.replace(pattern, (match, braced, bracketed, bare) => {
    const key = braced ?? bracketed ?? bare;
    if (!(key in variables)) throw new Error(`Unresolved Grafana variable ${match} in: ${expr}`);
    return variables[key];
  });
};
