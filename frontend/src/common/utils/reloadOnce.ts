// A reload that still serves the same bundle must not loop, so each value reloads once per tab.
export const reloadOnce = (key: string, value: string): boolean => {
  try {
    if (sessionStorage.getItem(key) === value) return false;
    sessionStorage.setItem(key, value);
  } catch {
    return false;
  }
  window.location.reload();
  return true;
};
