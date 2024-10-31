import { randomUUID, UUID } from "node:crypto";
import { save } from "https://deno.land/x/gtts@0.1.1/mod.ts";

export default async function say(sentence: string): Promise<string> {
  const uuid: UUID = randomUUID();
  const filePath = `cache/${uuid}.wav`;
  await save(filePath, sentence, { language: "fr" });
  return filePath;
}
