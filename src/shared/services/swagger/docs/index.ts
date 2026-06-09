import { healthDocs } from "./health.docs";
import { authDocs } from "./auth.docs";

/**
 * Merge all route docs here.
 * Add new feature docs as they are created.
 */
export const swaggerPaths: Record<string, Record<string, unknown>> = {
  ...healthDocs,
  ...authDocs,
};
