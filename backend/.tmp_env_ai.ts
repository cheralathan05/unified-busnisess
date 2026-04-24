import { env } from "./src/config/env";
console.log(JSON.stringify({ OLLAMA_MODEL: env.OLLAMA_MODEL, OLLAMA_TIMEOUT_MS: env.OLLAMA_TIMEOUT_MS }, null, 2));
