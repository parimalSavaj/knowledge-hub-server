/**
 * Route prefixes - used directly in app.ts for mounting routers.
 * No route file should need to import these.
 */
export const ROUTE_PREFIXES = {
  BASE_PATH: "/api/v1",
  DOCS: "/docs",
  HEALTH: "/health",
};

/**
 * Feature routes - each feature module has its own group.
 * Route files import only their own section.
 * ROOT represents the "/" path within that module.
 */
export const ROUTES = {
  HEALTH: {
    ROOT: "/",
    ERROR: "/error",
  },
};
