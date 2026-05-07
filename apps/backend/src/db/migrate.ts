import "dotenv/config";

import { databaseConfig } from "./config";
import { pool } from "./pool";
import { runSqlDirectory } from "./runSqlDirectory";

const runMigrations = async () => {
  await runSqlDirectory(databaseConfig.migrationsDir, "migration");
};

runMigrations()
  .then(async () => {
    console.log("Database migrations completed successfully.");
    await pool.end();
  })
  .catch(async (error: unknown) => {
    console.error("Database migrations failed.", error);
    await pool.end();
    process.exitCode = 1;
  });
