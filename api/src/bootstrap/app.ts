import "reflect-metadata";
import express, { Application } from "express";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { Logger } from "winston";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { loadControllers, scopePerRequest } from "awilix-express";
import serviceRegistry from "@/app/service-registry";
import { Config } from "@/bootstrap/config";
import { extendExpress } from "@/middlewares/extend-express";
import { notFound } from "@/middlewares/not-found";
import { errorHandler } from "@/middlewares/error-handler";

/**
 * Setup express application with all middleware and routes
 */
export function setupApplication(
  app: Application,
  logger: Logger,
  config: Config
) {
  // Integrate middlewares

  // Extend express
  app.use(extendExpress);

  // Trust proxy for rate limiting
  app.set("trust proxy", config.nodeEnv === "development" ? "127.0.0.1" : true);

  // Logging middleware
  app.use(
    morgan("dev", {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    })
  );

  // CORS middleware
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    })
  );

  // Compression middleware
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Awilix dependency injection middleware
  app.use(scopePerRequest(serviceRegistry.getContainer()));

  // Load all your controllers from the specified glob pattern
  app.use(
    loadControllers("features/**/*.controller.(ts|js)", {
      cwd: path.resolve(__dirname, ".."),
    })
  );

  // catch 404 and forward to error handler
  app.use(notFound);
  // error handler
  app.use(errorHandler);
}
