import { authSchemas } from "./auth.schemas";

/**
 * Merge all feature schemas here.
 * Add new feature schemas as they are created.
 */
export const featureSchemas: Record<string, Record<string, unknown>> = {
  ...authSchemas,
};
