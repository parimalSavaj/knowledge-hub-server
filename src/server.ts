import { App } from "./app";
import { config } from "./shared/config";
import LoggerService from "./shared/services/logger.service";
import DatabaseService from "./shared/services/database.service";

const logger = LoggerService.getInstance();
const database = DatabaseService.getInstance();

const bootstrap = async () => {
  try {
    // 1. Load environment config (already loaded via config import)

    // 2. Connect to database
    await database.connect();

    // 3. Call App.create(...) passing services in
    const appInstance = App.create();
    const app = appInstance.getApp();

    // 4. Listen on a port
    const server = app.listen(config.port, () => {
      logger.info("Server started", {
        port: config.port,
        environment: config.nodeEnv,
      });
    });

    // 5. Register shutdown handlers
    const shutdown = async () => {
      logger.info("Received kill signal, shutting down gracefully");

      server.close(async () => {
        await database.disconnect();
        logger.info("Closed out remaining connections");
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        logger.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    // 6. If anything fails during startup -> log and process.exit(1)
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
};

bootstrap();
