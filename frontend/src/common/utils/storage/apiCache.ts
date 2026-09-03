// Logout must drop cached authenticated payloads.
// Shape-matched so unrelated settings keys survive.
export const clearApiCache = (): void => {
  Object.keys(localStorage).forEach((key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "");
      if (value && typeof value === "object" && "data" in value && "timestamp" in value) {
        localStorage.removeItem(key);
      }
    } catch {
      // Not JSON, so not a cache entry.
    }
  });
};
