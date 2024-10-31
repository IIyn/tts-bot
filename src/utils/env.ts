import "jsr:@std/dotenv/load";

export const TOKEN = Deno.env.get("TOKEN") ?? "";
export const CLIENT_ID = Deno.env.get("CLIENT_ID") ?? "";
