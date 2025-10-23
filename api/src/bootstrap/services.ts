import { asClass, asValue } from "awilix";
import { serviceRegistry } from "@/app/service-registry";
import logger from "@/middlewares/logger";
import config from "@/bootstrap/config";
import { DatabaseService } from "@/services/database";
import { SocketService } from "@/services/socket";

/**
 * Register Core Services
 *
 * These services are registered as singletons in the DI container
 * and can be injected into other services or controllers.
 */
serviceRegistry
  .singleton("logger", asValue(logger))
  .singleton("config", asValue(config))
  .singleton("database", asClass(DatabaseService))
  .singleton("socket", asClass(SocketService));
