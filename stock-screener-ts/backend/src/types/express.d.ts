import type { JwtUser } from "../auth.js";


declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export {};
