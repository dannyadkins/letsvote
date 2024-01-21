require("dotenv").config();

import prisma from "db";

import { TwitterScraperClient } from "./clients/twitter/client";

// main func
async function main() {
  console.log("main");
  const twitterClient = new TwitterScraperClient("Nikki Haley");
  const dbClient = prisma;
  await twitterClient.run(dbClient);
}

main().catch(console.error);
