import serviceRegistry from "@/app/service-registry";
import { NextFunction, Request, Response } from "@/middlewares/extend-express";
import AuthService, { AuthPayload } from "@/features/auth/auth.service";
import { Role } from "@prisma/client";
import { AppError } from "@/bootstrap/errors";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authService = serviceRegistry.resolve("authService") as AuthService;

    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (accessToken == null)
      return res.error("Unauthorized. Please sign in.", undefined, 401);

    const { sub: id, role } = authService.verifyToken(
      accessToken
    ) as AuthPayload;

    req.updateContext({ user: { id, role } });
    next();
  } catch (error) {
    throw new AppError("Authenticate middleware error: " + error.message, 500);
  }
}

export function authorize(roles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.context?.user?.role;

      console.log({ userRole });

      if (!userRole) {
        return res.error("Unauthorized: Missing user context.", undefined, 401);
      }

      if (roles.includes(userRole)) {
        return next();
      }

      return res.error("Access Denied.", undefined, 403);
    } catch (error) {
      throw new AppError("Authorize middleware error: " + error.message, 500);
    }
  };
}
