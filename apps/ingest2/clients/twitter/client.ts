import { PrismaClient } from "@prisma/client";
import { Client } from "twitter-api-sdk";

export class TwitterScraperClient {
  private twitterClient: Client;

  constructor(topic: string) {
    console.log("constructor");
    // TODO get env var for twitter api

    // TODO set the account that you're scraping

    // topic is something like Nikki Haley

    if (!process.env.TWITTER_BEARER_TOKEN) {
      throw new Error("TWITTER_BEARER_TOKEN is not set");
    }
    this.twitterClient = new Client(process.env.TWITTER_BEARER_TOKEN);
  }

  //   get next batch based on cursor
  async getNextBatch(cursor?: any): Promise<any[]> {
    console.log("getNextBatch");
    // TODO use the twitter api
    const rules = await this.twitterClient.tweets.getRules();

    await this.twitterClient.tweets.addOrDeleteRules({
      add: [{ value: "from:@username" }],
    });
    const stream = this.twitterClient.tweets.searchStream({
      "tweet.fields": ["author_id", "created_at", "text"],
    });
    for await (const tweet of stream) {
      console.log(tweet.data);
    }

    return [];
  }

  async processBatch(batch: any): Promise<any[]> {
    console.log("processBatch");

    // returns the documents to save to db
    return [];
  }

  async saveToDb(dbClient: PrismaClient, documents: any[]): Promise<void> {
    console.log("saveToDb");
  }

  async run(dbClient: PrismaClient, cursor?: any): Promise<void> {
    const batch = await this.getNextBatch(cursor);
    const documents = await this.processBatch(batch);
    // await this.saveToDb(dbClient, documents);
  }
}
