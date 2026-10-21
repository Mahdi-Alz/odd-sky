import { handle } from "hono/vercel";
import { createApp, createDeps } from "@odd-sky/api";

const app = createApp(createDeps(process.env));

export const GET = handle(app);
