import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/health.routes";
import { errorHandler } from "./shared/middlewares/error-handler.middleware";

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/v1/health", healthRoutes);

// Error handling
app.use(errorHandler);

export default app;
