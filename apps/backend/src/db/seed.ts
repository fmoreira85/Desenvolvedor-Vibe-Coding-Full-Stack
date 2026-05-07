import "dotenv/config";

import { databaseConfig } from "./config";
import { pool } from "./pool";
import { runSqlDirectory } from "./runSqlDirectory";

const runSeeds = async () => {
  await runSqlDirectory(databaseConfig.seedsDir, "seed");
};

runSeeds()
  .then(async () => {
    console.log("Database seeds completed successfully.");
    await pool.end();
  })
  .catch(async (error: unknown) => {
    console.error("Database seeds failed.", error);
    await pool.end();
    process.exitCode = 1;
  });
