import { AuthenticatedUser } from "../services/jwt/jwt.types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
