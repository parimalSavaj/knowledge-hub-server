import app from "./app";
import { config } from "./shared/config";
import LoggerService from "./shared/services/logger.service";

const logger = LoggerService.getInstance();

const startServer = () => {
  app.listen(config.port, () => {
    logger.info("Server started", {
      port: config.port,
      environment: config.nodeEnv,
    });
  });
};

startServer();
