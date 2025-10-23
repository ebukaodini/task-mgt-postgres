import path from "path";
import { asClass, InjectionMode, Lifetime } from "awilix";
import serviceRegistry from "@/app/service-registry";

/**
 * Autoload Feature Modules
 *
 * This function is called during application startup to dynamically load
 * all modules (services and repositories) from the features directory into
 * the DI container.
 *
 * Note: This function is automatically invoked when this module is imported.
 * Extend the patterns and lifetimes as needed.
 *
 */
serviceRegistry.getContainer().loadModules(
  [
    // Services are scoped (new instance per request)
    ["features/**/*.service.(ts|js)", { lifetime: Lifetime.SCOPED }],
    // Repositories are singletons (one instance for app lifetime)
    ["features/**/*.repo.(ts|js)", { lifetime: Lifetime.SINGLETON }],
  ],
  {
    cwd: path.resolve(__dirname, ".."), // project root (src/)
    formatName: "camelCase",
    resolverOptions: {
      register: asClass,
      injectionMode: InjectionMode.CLASSIC,
    },
  }
);
