import { startServer } from "./src/server/app.mjs";

try {
  startServer();
} catch (error) {
  console.error(`Social Jarvis Dashboard konnte nicht gestartet werden: ${error.message}`);
  process.exit(1);
}
