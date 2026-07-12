/** Typed localStorage helpers */
const PREFIX = 'wilde_';

export const local = {
  get: <T>(key: string): T | null => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  set: (key: string, value: unknown) => {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  remove: (key: string) => {
    localStorage.removeItem(PREFIX + key);
  },
};
