export class TwitterScraperClient {
  constructor() {
    console.log("constructor");
    // TODO get env var for twitter api

    // TODO set the account that you're scraping
  }

  //   get next batch based on cursor
  async getNextBatch(cursor?: any): Promise<any> {
    console.log("getNextBatch");
    // TODO use the twitter api
  }

  async processBatch(batch: any): Promise<void> {
    console.log("processBatch");

    // returns the documents to save to db
  }

  async saveToDb(client, documents: any[]): Promise<void> {
    console.log("saveToDb");
  }

  async run(cursor?: any): Promise<void> {
    const batch = await this.getNextBatch(cursor);
    const documents = await this.processBatch(batch);
    await this.saveToDb(documents);
  }
}
