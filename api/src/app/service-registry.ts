import logger from "@/middlewares/logger";
import {
  createContainer,
  InjectionMode,
  AwilixContainer,
  Lifetime,
  LifetimeType,
} from "awilix";

export interface ServiceMetadata {
  name: string;
  lifetime: LifetimeType;
  disposer?: (instance: any) => Promise<void>;
  initializer?: (instance: any) => Promise<void>;
  healthCheck?: (instance: any) => Promise<boolean>;
  dependencies?: string[];
}

export interface Service {
  initialize?(): Promise<void>;
  destroy?(): Promise<void>;
  healthCheck?(): Promise<boolean>;
}

class ServiceRegistry {
  private container: AwilixContainer;
  private services = new Map<string, ServiceMetadata>();
  private instances = new Map<string, any>();
  private initialized = false;
  private initializationOrder: string[] = [];

  constructor() {
    this.container = createContainer({
      injectionMode: InjectionMode.CLASSIC,
    });
  }

  /**
   * Get the underlying Awilix container
   */
  getContainer(): AwilixContainer {
    return this.container;
  }

  /**
   * Register a service as singleton
   */
  singleton<T>(
    name: string,
    resolver: any,
    options?: {
      disposer?: (instance: T) => Promise<void>;
      initializer?: (instance: T) => Promise<void>;
      healthCheck?: (instance: T) => Promise<boolean>;
      dependencies?: string[];
    }
  ): this {
    let registration;

    if (options?.disposer) {
      registration = resolver.disposer(options.disposer).singleton();
    } else if (resolver.singleton) {
      registration = resolver.singleton();
    } else {
      registration = resolver;
    }

    this.container.register(name, registration);
    this.services.set(name, {
      name,
      lifetime: "SINGLETON",
      disposer: options?.disposer,
      initializer: options?.initializer,
      healthCheck: options?.healthCheck,
      dependencies: options?.dependencies || [],
    });

    return this;
  }

  /**
   * Register a service as transient
   */
  transient<T>(
    name: string,
    resolver: any,
    options?: {
      dependencies?: string[];
    }
  ): this {
    this.container.register(name, resolver.transient());
    this.services.set(name, {
      name,
      lifetime: "TRANSIENT",
      dependencies: options?.dependencies || [],
    });
    return this;
  }

  /**
   * Register a service as scoped (per-request)
   */
  scoped<T>(
    name: string,
    resolver: any,
    options?: {
      dependencies?: string[];
    }
  ): this {
    this.container.register(name, resolver.scoped());
    this.services.set(name, {
      name,
      lifetime: "SCOPED",
      dependencies: options?.dependencies || [],
    });
    return this;
  }

  /**
   * Register a service with custom lifetime
   */
  register<T>(
    name: string,
    resolver: any,
    lifetime: LifetimeType = Lifetime.SINGLETON,
    options?: {
      disposer?: (instance: T) => Promise<void>;
      initializer?: (instance: T) => Promise<void>;
      healthCheck?: (instance: T) => Promise<boolean>;
      dependencies?: string[];
    }
  ): this {
    switch (lifetime) {
      case Lifetime.SINGLETON:
        return this.singleton(name, resolver, options);
      case Lifetime.TRANSIENT:
        return this.transient(name, resolver, {
          dependencies: options?.dependencies,
        });
      case Lifetime.SCOPED:
        return this.scoped(name, resolver, {
          dependencies: options?.dependencies,
        });
      default:
        throw new Error(`Unknown lifetime: ${lifetime}`);
    }
  }

  /**
   * Load feature modules and register their metadata
   */
  private async loadFeatureModules(): Promise<void> {
    try {
      // Import the loader function
      await import("@/bootstrap/modules");

      // Register metadata for all loaded modules
      const registrations = this.container.registrations;

      for (const [name, registration] of Object.entries(registrations)) {
        if (!this.services.has(name)) {
          this.services.set(name, {
            name,
            lifetime: registration.lifetime as LifetimeType,
            dependencies: [],
          });
        }
      }
    } catch (error) {
      logger.error("Failed to load feature modules:", error);
      throw new Error(`Failed to load feature modules: ${error}`);
    }
  }

  /**
   * Calculate initialization order based on dependencies
   */
  private calculateInitializationOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (serviceName: string) => {
      if (visiting.has(serviceName)) {
        throw new Error(
          `Circular dependency detected involving service: ${serviceName}`
        );
      }

      if (visited.has(serviceName)) {
        return;
      }

      visiting.add(serviceName);

      const service = this.services.get(serviceName);
      if (service?.dependencies) {
        for (const dep of service.dependencies) {
          if (this.services.has(dep)) {
            visit(dep);
          }
        }
      }

      visiting.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };

    // Only initialize singleton services during startup
    const singletonServices = Array.from(this.services.values())
      .filter((s) => s.lifetime === "SINGLETON")
      .map((s) => s.name);

    for (const serviceName of singletonServices) {
      visit(serviceName);
    }

    return order;
  }

  /**
   * Resolve a service from the container
   */
  resolve<T = any>(name: string): T {
    try {
      return this.container.resolve<T>(name);
    } catch (error) {
      throw new Error(`Failed to resolve service '${name}': ${error}`);
    }
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.container.hasRegistration(name);
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Initialize all singleton services in dependency order
   */
  async initializeAll(): Promise<void> {
    if (this.initialized) {
      logger.warn("Services already initialized, skipping...");
      return;
    }

    try {
      logger.info("Initializing services...");

      // Calculate initialization order
      this.initializationOrder = this.calculateInitializationOrder();

      if (this.initializationOrder.length > 0) {
        // Initialize services in dependency order
        for (const serviceName of this.initializationOrder) {
          await this.initializeService(serviceName);
        }
      }

      this.initialized = true;
      logger.info("Initialized services successfully");
    } catch (error) {
      logger.error("Failed to initialize services:", error);
      // Cleanup partially initialized services
      await this.destroyAll();
      throw error;
    }
  }

  /**
   * Initialize a single service
   */
  private async initializeService(serviceName: string): Promise<void> {
    const serviceMetadata = this.services.get(serviceName);
    if (!serviceMetadata) {
      logger.warn(`Service metadata not found for: ${serviceName}`);
      return;
    }

    try {
      // Resolve the service instance from Awilix
      const instance = this.resolve(serviceName);

      // Store instance for later cleanup
      this.instances.set(serviceName, instance);

      // Call custom initializer if provided
      if (serviceMetadata.initializer) {
        await serviceMetadata.initializer(instance);
      }

      // Call service's own initialize method if it exists
      if (instance && typeof instance.initialize === "function") {
        await instance.initialize();
      }
    } catch (error) {
      logger.error(`Failed to initialize service '${serviceName}':`, error);
      throw new Error(
        `Failed to initialize service '${serviceName}': ${error}`
      );
    }
  }

  /**
   * Start all core services
   */
  async start(): Promise<void> {
    try {
      await this.loadFeatureModules();
      await this.initializeAll();
    } catch (error) {
      logger.error("Failed to start service registry:", error);
      throw error;
    }
  }

  /**
   * Stop all services
   */
  async stop(): Promise<void> {
    try {
      logger.info("Stopping service registry...");

      await this.destroyAll();

      // Dispose the Awilix container
      await this.container.dispose();

      logger.info("Service registry stopped successfully");
    } catch (error) {
      logger.error("Failed to stop service registry:", error);
      throw error;
    }
  }

  /**
   * Destroy all initialized services in reverse order
   */
  async destroyAll(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    logger.info("Destroying services...");

    // Destroy in reverse order
    const destroyOrder = [...this.initializationOrder].reverse();

    for (const serviceName of destroyOrder) {
      await this.destroyService(serviceName);
    }

    this.instances.clear();
    this.initialized = false;

    logger.info("All services destroyed");
  }

  /**
   * Destroy a single service
   */
  private async destroyService(serviceName: string): Promise<void> {
    const instance = this.instances.get(serviceName);
    if (!instance) {
      return;
    }

    const serviceMetadata = this.services.get(serviceName);

    try {
      // Call service's own destroy method if it exists
      if (typeof instance.destroy === "function") {
        await instance.destroy();
      }

      // Call custom disposer if provided
      if (serviceMetadata?.disposer) {
        await serviceMetadata.disposer(instance);
      }

      this.instances.delete(serviceName);
    } catch (error) {
      logger.error(`Failed to destroy service '${serviceName}':`, error);
      // Continue with other services even if one fails
    }
  }

  /**
   * Health check all singleton services
   */
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    for (const [serviceName, serviceMetadata] of this.services) {
      try {
        if (serviceMetadata.lifetime === "SINGLETON") {
          const instance = this.instances.get(serviceName);

          if (!instance) {
            results[serviceName] = false;
            continue;
          }

          // Use custom health check if provided
          if (serviceMetadata.healthCheck) {
            results[serviceName] = await serviceMetadata.healthCheck(instance);
          }
          // Use service's own health check method
          else if (typeof instance.healthCheck === "function") {
            results[serviceName] = await instance.healthCheck();
          }
        }
      } catch (error) {
        logger.error(
          `Health check failed for service '${serviceName}':`,
          error
        );
        results[serviceName] = false;
      }
    }

    return results;
  }

  /**
   * Get service information
   */
  getServiceInfo(name: string): ServiceMetadata | undefined {
    return this.services.get(name);
  }

  /**
   * Get service instance (only for singletons)
   */
  getInstance<T = any>(name: string): T | undefined {
    return this.instances.get(name);
  }

  /**
   * Create a child container for request scoping
   */
  createScope(): AwilixContainer {
    return this.container.createScope();
  }

  /**
   * Get initialization statistics
   */
  getStats(): {
    totalServices: number;
    initializedServices: number;
    singletonServices: number;
    scopedServices: number;
    transientServices: number;
    initializationOrder: string[];
  } {
    const services = Array.from(this.services.values());

    return {
      totalServices: services.length,
      initializedServices: this.instances.size,
      singletonServices: services.filter((s) => s.lifetime === "SINGLETON")
        .length,
      scopedServices: services.filter((s) => s.lifetime === "SCOPED").length,
      transientServices: services.filter((s) => s.lifetime === "TRANSIENT")
        .length,
      initializationOrder: [...this.initializationOrder],
    };
  }
}

export const serviceRegistry = new ServiceRegistry();
export default serviceRegistry;
