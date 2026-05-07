import { Pool } from "pg";

import { databaseConfig } from "./config";

export const pool = new Pool({
  connectionString: databaseConfig.url
});
