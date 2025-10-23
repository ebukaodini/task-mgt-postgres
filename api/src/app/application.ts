import expressListEndpoints from "express-list-endpoints";
import express, { Application as ExpressApplication } from "express";

// CRITICAL: Import services.ts FIRST to register core services
import "@/bootstrap/services";

// Then import other modules
import { setupApplication } from "@/bootstrap/app";
import config from "@/bootstrap/config";
import logger from "@/middlewares/logger";
import serviceRegistry from "./service-registry";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { asValue } from "awilix";

export class Application {
  private app: ExpressApplication;
  private server: Server;
  private isShuttingDown = false;
  private shutdownPromise: Promise<void> | null = null;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.setupGracefulShutdown();
  }

  /**
   * Initialize the application
   */
  private async initialize(): Promise<void> {
    try {
      // Setup Express app first
      await this.setupExpress();

      // Start all services
      await serviceRegistry.start();
    } catch (error) {
      logger.error("Failed to initialize application:", error);
      throw error;
    }
  }

  /**
   * Setup Express application
   */
  private async setupExpress(): Promise<void> {
    try {
      await this.setupSystemRoutes();

      // Then setup app + controllers
      setupApplication(this.app, logger, config);
    } catch (error) {
      logger.error("Failed to setup Express application:", error);
      throw error;
    }
  }

  /**
   * Setup system routes
   */
  private async setupSystemRoutes(): Promise<void> {
    try {
      // Setup system routes
      const router = express.Router();

      router.get("/", (_req, res) => {
        return res.status(200).json({
          message: "Welcome to Express TypeScript API",
          version: "1.0.0",
          healthCheck: "/health",
        });
      });

      router.get("/health", async (_req, res) => {
        try {
          const healthStatus = await this.getHealthStatus();
          return res.status(200).json(healthStatus);
        } catch (error) {
          res.status(500).json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: "Health check failed",
          });
        }
      });

      this.app.use(router);
    } catch (error) {
      logger.error("Failed to configure system routes:", error);
      throw error;
    }
  }

  /**
   * Start the application server
   */
  async start(): Promise<void> {
    try {
      logger.info("Starting application...");

      serviceRegistry.singleton("server", asValue(this.server), {
        healthCheck: async () => true,
      });
      await this.initialize();

      return new Promise<void>((resolve, reject) => {
        this.server.listen(config.port);
        this.server.on("listening", () => {
          let { address, port } = this.server.address() as AddressInfo;
          address = address === "::" ? "localhost" : address;

          logger.info(`Server running at http://${address}:${port} ✨`);
          logger.info(`Health Check: http://${address}:${port}/health ✨`);
          logger.info(`Environment: ${config.nodeEnv}`);
          console.log();
          logger.info(`API routes:`);

          const routes = expressListEndpoints(this.app);
          routes.forEach((route) => {
            route.methods.forEach((method) => {
              logger.info(`\x1b[32m${method.padEnd(10)}\x1b[0m${route.path}`);
            });
          });

          resolve();
        });

        // Handle server errors
        this.server.on("error", (error: any) => {
          if (error.syscall !== "listen") {
            reject(error);
            return;
          }

          const bind =
            typeof config.port === "string"
              ? `Pipe ${config.port}`
              : `Port ${config.port}`;

          switch (error.code) {
            case "EACCES":
              logger.error(`${bind} requires elevated privileges`);
              reject(new Error(`${bind} requires elevated privileges`));
              break;
            case "EADDRINUSE":
              logger.error(`${bind} is already in use`);
              reject(new Error(`${bind} is already in use`));
              break;
            default:
              reject(error);
          }
        });
      });
    } catch (error) {
      logger.error("Failed to start application:", error);
      throw error;
    }
  }

  /**
   * Stop the application gracefully
   * Prevents concurrent shutdown attempts
   */
  async stop(): Promise<void> {
    // Return existing shutdown promise if already shutting down
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }

    if (this.isShuttingDown) {
      logger.warn("Application is already shutting down");
      return;
    }

    this.isShuttingDown = true;

    // Create and store shutdown promise to prevent concurrent shutdowns
    this.shutdownPromise = this.performShutdown();

    return this.shutdownPromise;
  }

  /**
   * Perform the actual shutdown process
   */
  private async performShutdown(): Promise<void> {
    logger.info("Starting graceful shutdown...");

    try {
      // Stop accepting new connections with timeout
      if (this.server) {
        await this.stopServer();
      }

      // Stop all services with timeout
      await this.stopServices();

      logger.info("Application stopped successfully");
    } catch (error) {
      logger.error("Error during shutdown:", error);
      throw error;
    }
  }

  /**
   * Stop the HTTP server with timeout
   */
  private async stopServer(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Set a timeout for server shutdown
      const shutdownTimeout = setTimeout(() => {
        logger.warn("Server shutdown timeout, forcing close");
        this.server.closeAllConnections();
        resolve();
      }, 10000); // 10 second timeout

      this.server.close((error: Error | undefined) => {
        clearTimeout(shutdownTimeout);

        if (error) {
          logger.error("Error closing server:", error);
          reject(error);
        } else {
          logger.info("HTTP server closed");
          resolve();
        }
      });
    });
  }

  /**
   * Stop all services with timeout
   */
  private async stopServices(): Promise<void> {
    try {
      // Add timeout for service shutdown
      await Promise.race([
        serviceRegistry.stop(),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("Service shutdown timeout")), 15000)
        ),
      ]);
    } catch (error) {
      logger.error("Error stopping services:", error);
      throw error;
    }
  }

  /**
   * Get application health status
   */
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    services: { [key: string]: boolean };
  }> {
    try {
      const services = await serviceRegistry.healthCheck();
      const allHealthy = Object.values(services).every((healthy) => healthy);

      return {
        status: allHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        services,
      };
    } catch (error) {
      logger.error("Error getting health status:", error);
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        services: {},
      };
    }
  }

  /**
   * Setup graceful shutdown handlers
   * Fixed to prevent promise rejection warnings
   */
  private setupGracefulShutdown(): void {
    let shutdownInProgress = false;

    const shutdown = (signal: string) => {
      if (shutdownInProgress) {
        logger.warn(`${signal} received, but shutdown already in progress`);
        return;
      }

      shutdownInProgress = true;
      logger.info(`${signal} received, starting graceful shutdown...`);

      this.stop()
        .then(() => {
          logger.info("Graceful shutdown completed");
          process.exit(0);
        })
        .catch((error) => {
          logger.error("Error during graceful shutdown:", error);
          process.exit(1);
        });
    };

    // Handle termination signals
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      if (!shutdownInProgress) {
        shutdownInProgress = true;
        this.stop().finally(() => {
          logger.error("Exiting due to uncaught exception");
          process.exit(1);
        });
      }
    });

    // Handle unhandled promise rejections - FIXED
    process.on("unhandledRejection", (reason, promise) => {
      // Don't await the rejected promise - this causes the warning
      logger.error("Unhandled Promise Rejection:", {
        reason:
          reason instanceof Error
            ? {
                message: reason.message,
                stack: reason.stack,
                name: reason.name,
              }
            : reason,
        // Log promise info without awaiting it
        promise: promise.toString(),
      });

      if (!shutdownInProgress) {
        shutdownInProgress = true;
        this.stop().finally(() => {
          logger.error("Exiting due to unhandled promise rejection");
          process.exit(1);
        });
      }
    });

    // Handle promise rejections that were handled after being reported
    process.on("rejectionHandled", (promise) => {
      logger.warn("Promise rejection was handled asynchronously:", {
        promise: promise.toString(),
        timestamp: new Date().toISOString(),
      });
    });

    // Handle warnings
    process.on("warning", (warning) => {
      logger.warn("Process warning:", {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
      });
    });
  }
}

// Export singleton instance
export const application = new Application();
