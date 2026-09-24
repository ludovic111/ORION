import { createServer } from "node:http";
import { handle } from "./app.mjs";
import { attachRelay } from "./relay.mjs";

const server = createServer(handle);
attachRelay(server);
server.listen(
  Number(process.env.PORT || 4311),
  process.env.HOST || "127.0.0.1",
  () =>
    console.log(
      `orion aic · http://${process.env.HOST || "127.0.0.1"}:${server.address().port}`,
    ),
);
