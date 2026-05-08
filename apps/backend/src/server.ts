import "./config/loadEnv";

import { env } from "./config/env";
import { createApp } from "./app";

const app = createApp();

app.listen(env.port, () => {
  console.log(`SDR CRM backend listening on port ${env.port}`);
});
