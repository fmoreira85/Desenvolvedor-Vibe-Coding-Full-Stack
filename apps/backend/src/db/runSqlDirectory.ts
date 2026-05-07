import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { pool } from "./pool";

export const runSqlDirectory = async (directoryPath: string, label: string) => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const sqlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  if (sqlFiles.length === 0) {
    console.log(`No SQL files found for ${label} in ${directoryPath}`);
    return;
  }

  for (const sqlFile of sqlFiles) {
    const sqlPath = path.join(directoryPath, sqlFile);
    const sql = await readFile(sqlPath, "utf8");

    console.log(`Running ${label}: ${sqlFile}`);
    await pool.query(sql);
  }
};
