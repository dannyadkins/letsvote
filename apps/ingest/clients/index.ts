// abstract class BaseScraperClient {
//   protected cursor: any;

//   // We can start either from a cursor (if it crashes and needs to restart)
//   // or from the beginning.
//   // This can be called by a cron job or a long-running process.
//   //   here, we provide both the abstract methods that contain the logic for the
//   //   clients to implement, and the concrete methods that call the abstract methods.
//   abstract async start(cursor?: any): Promise<void>;
//   abstract async stop(): Promise<void>;

//   // This is the concrete method that calls the abstract method.
//   async run(cursor?: any): Promise<void> {
//     await this.start(cursor);
//     await this.stop();
//   }
// }
