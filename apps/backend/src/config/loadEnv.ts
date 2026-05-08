import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

const candidatePaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env")
];

for (const candidatePath of candidatePaths) {
  if (fs.existsSync(candidatePath)) {
    dotenv.config({ path: candidatePath });
    break;
  }
}
