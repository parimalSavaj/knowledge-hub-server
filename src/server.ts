import { App } from "./app";
import { config } from "./shared/config";
import { LoggerService } from "./shared/services/logger.service";
import { DatabaseService } from "./shared/services/database.service";
import { SwaggerService } from "./shared/services/swagger.service";

const logger = LoggerService.getInstance();
const database = DatabaseService.getInstance();
const swagger = SwaggerService.getInstance();

const bootstrap = async () => {
  try {
    await database.connect();

    const appInstance = App.create(logger, database, swagger);
    const app = appInstance.getApp();

    const server = app.listen(config.port, () => {
      logger.info("Server started", {
        port: config.port,
        environment: config.nodeEnv,
      });
    });

    const shutdown = async () => {
      logger.info("Received kill signal, shutting down gracefully");

      server.close(async () => {
        await database.disconnect();
        logger.info("Closed out remaining connections");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

bootstrap();
