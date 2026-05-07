import path from "node:path";

const DEFAULT_DATABASE_URL = "postgresql://sdrcrm:sdrcrm123@localhost:5433/sdrcrm";

export const databaseConfig = {
  url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  migrationsDir:
    process.env.MIGRATIONS_DIR ?? path.resolve(process.cwd(), "../../supabase/migrations"),
  seedsDir: process.env.SEEDS_DIR ?? path.resolve(process.cwd(), "src/db/seeds")
};
