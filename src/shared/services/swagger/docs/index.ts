import { healthDocs } from "./health.docs";

/**
 * Merge all route docs here.
 * Add new feature docs as they are created.
 */
export const swaggerPaths: Record<string, Record<string, unknown>> = {
  ...healthDocs,
};
