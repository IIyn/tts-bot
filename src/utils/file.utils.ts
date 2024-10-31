export default async function clearCache() {
  for await (const filePath of Deno.readDir("cache")) {
    if (filePath.name === ".gitkeep") continue;
    await Deno.remove(`cache/${filePath.name}`);
  }
}
