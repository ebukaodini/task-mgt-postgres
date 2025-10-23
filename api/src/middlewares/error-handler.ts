import {
  BaseResponse,
  NextFunction,
  Request,
  Response,
} from "./extend-express";
import { AppError } from "@/bootstrap/errors";
import { HttpError } from "http-errors";
import logger from "@/middlewares/logger";
import config from "@/bootstrap/config";

export function errorHandler(
  error: Error | HttpError | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): BaseResponse {
  let statusCode = 500;
  let message = "Internal Server Error";

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof HttpError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === "ValidationError") {
    statusCode = 422;
    message = error.message;
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Log error
  logger.error({
    message: `🚨 ${error.message ?? message}`,
    stack: error.stack,
    statusCode: statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Don't leak error details in production
  const isDevelopment = config.nodeEnv === "development";
  const isTest = config.nodeEnv === "test";

  return res.error(
    isDevelopment || isTest
      ? (error.message ?? message)
      : "Something went wrong!",
    error,
    statusCode,
    isDevelopment && error.stack.split("\n").map((e) => e.trim())
  );
}
