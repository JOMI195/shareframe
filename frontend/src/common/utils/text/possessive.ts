// German genitive for names: "Anna" → "Annas", but "Klaus" → "Klaus’".
export const possessive = (name: string) => (/[sßxz]$/i.test(name) ? `${name}’` : `${name}s`);
