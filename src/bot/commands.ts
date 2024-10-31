import { REST, Routes } from "npm:discord.js";
import { CLIENT_ID, TOKEN } from "../utils/env.ts";

const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
  {
    name: "join",
    description: "I will join your voice chat",
  },
  {
    name: "say",
    description: "say something and I will speak it to others",
  },
];

export default async function initCommands(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}
