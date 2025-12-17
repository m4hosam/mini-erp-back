// utils/jwt-key-loader.ts
export function getRSAKey(envKey: string): string {
  const raw = process.env[envKey];
  if (!raw) throw new Error(`Missing env var: ${envKey}`);
  return raw.replace(/\\n/g, '\n');
}
