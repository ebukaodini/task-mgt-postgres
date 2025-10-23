import { NotFoundError } from "@/bootstrap/errors";
import { NextFunction, Request, Response } from "@/middlewares/extend-express";

export function notFound(req: Request, res: Response, next: NextFunction) {
  next(new NotFoundError());
}
