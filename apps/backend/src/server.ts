import "dotenv/config";

import { createApp } from "./app";

const DEFAULT_PORT = 3001;
const port = Number(process.env.PORT ?? DEFAULT_PORT);

const app = createApp();

app.listen(port, () => {
  console.log(`SDR CRM backend listening on port ${port}`);
});
