import { PrismaClient } from "@prisma/client";
import { TwitterScraperClient } from "./clients/twitter/client";

// main func
async function main() {
  console.log("main");
  const twitterClient = new TwitterScraperClient("Nikki Haley");
  const dbClient = new PrismaClient();
  await twitterClient.run(dbClient);
}

main().catch(console.error);
