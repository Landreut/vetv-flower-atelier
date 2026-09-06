import { env } from 'cloudflare:workers';
export function orderDatabase(): D1Database {
  const database = (env as unknown as { DB?: D1Database }).DB;
  if (!database) throw new Error('Order database unavailable');
  return database;
}
