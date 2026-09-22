import { env } from 'cloudflare:workers';
export function getDatabase() {
  if (!env.DB) throw new Error('Inspection storage is unavailable.');
  return env.DB;
}
