import "./config/loadEnv";

import { env } from "./config/env";
import { createApp } from "./app";

const app = createApp();
const PORT = process.env.PORT || String(env.port);

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`SDR CRM backend listening on port ${PORT}`);
});
