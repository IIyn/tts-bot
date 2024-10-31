import { TOKEN } from "./utils/env.ts";
import initClient from "./bot/client.ts";
import initCommands from "./bot/commands.ts";
import clearCache from "./utils/file.utils.ts";

if (import.meta.main) {
  const client = initClient();
  initCommands();
  client.login(TOKEN);
  clearCache();
}
