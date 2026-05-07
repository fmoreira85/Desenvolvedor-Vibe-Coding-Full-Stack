import type { PoolClient, QueryResult, QueryResultRow } from "pg";

import { pool } from "./pool";

export type DatabaseExecutor = {
  query: <TRow extends QueryResultRow>(
    text: string,
    values?: unknown[]
  ) => Promise<QueryResult<TRow>>;
};

export const withTransaction = async <T>(callback: (client: PoolClient) => Promise<T>) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const query = async <TRow extends QueryResultRow>(
  text: string,
  values?: unknown[]
): Promise<QueryResult<TRow>> => {
  return pool.query<TRow>(text, values);
};

export const database: DatabaseExecutor = {
  query
};
