/**
 * Cloudflare D1 Database Client
 * Usage in Pages Functions or Workers
 */

import type { D1Database } from "@cloudflare/workers-types";

let dbInstance: D1Database;

export function initializeD1(db: D1Database) {
  dbInstance = db;
}

export function getD1() {
  if (!dbInstance) {
    throw new Error("D1 database not initialized. Call initializeD1() first.");
  }
  return dbInstance;
}

/**
 * Execute a query with parameters
 * @example
 * await query('SELECT * FROM users WHERE id = ?', [userId])
 */
export async function query(
  sql: string,
  params: (string | number | boolean | null)[] = []
) {
  const db = getD1();
  const result = await db.prepare(sql).bind(...params).all();
  return result.results || [];
}

/**
 * Execute a single row query
 * @example
 * await queryOne('SELECT * FROM users WHERE id = ?', [userId])
 */
export async function queryOne(
  sql: string,
  params: (string | number | boolean | null)[] = []
) {
  const db = getD1();
  const result = await db.prepare(sql).bind(...params).first();
  return result || null;
}

/**
 * Insert and return metadata
 * @example
 * await insert('users', { name: 'John', email: 'john@example.com' })
 */
export async function insert(table: string, data: Record<string, unknown>) {
  const db = getD1();
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => "?").join(",");

  const sql = `INSERT INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`;
  const result = await db.prepare(sql).bind(...values).run();

  return {
    success: result.success,
    id: result.meta.last_row_id,
    changes: result.meta.changes,
  };
}

/**
 * Update records
 * @example
 * await update('users', { name: 'Jane' }, 'WHERE id = ?', [userId])
 */
export async function update(
  table: string,
  data: Record<string, unknown>,
  where: string,
  params: (string | number | boolean | null)[] = []
) {
  const db = getD1();
  const sets = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(",");

  const sql = `UPDATE ${table} SET ${sets} ${where}`;
  const result = await db.prepare(sql).bind(...Object.values(data), ...params).run();

  return {
    success: result.success,
    changes: result.meta.changes,
  };
}

/**
 * Delete records
 * @example
 * await deleteRecords('users', 'WHERE id = ?', [userId])
 */
export async function deleteRecords(
  table: string,
  where: string,
  params: (string | number | boolean | null)[] = []
) {
  const db = getD1();
  const sql = `DELETE FROM ${table} ${where}`;
  const result = await db.prepare(sql).bind(...params).run();

  return {
    success: result.success,
    changes: result.meta.changes,
  };
}

/**
 * Execute batch operations
 * @example
 * await batch([
 *   { sql: 'INSERT INTO users VALUES (?, ?)', params: ['John', 'john@example.com'] },
 *   { sql: 'INSERT INTO users VALUES (?, ?)', params: ['Jane', 'jane@example.com'] }
 * ])
 */
export async function batch(
  statements: Array<{
    sql: string;
    params?: (string | number | boolean | null)[];
  }>
) {
  const db = getD1();
  const batch = db.batch(statements);
  const results = await batch;
  return results;
}
