import { AuthenticatedUser } from "../services/types/jwt.types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
