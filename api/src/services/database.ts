import { Config } from "@/bootstrap/config";
import { Service } from "@/app/service-registry";
import { PrismaClient } from "@prisma/client";
import { Logger } from "winston";

export class DatabaseService implements Service {
  public db: PrismaClient | null = null;

  constructor(
    private logger: Logger,
    private config: Config
  ) {}

  async initialize(): Promise<void> {
    if (this.db) {
      this.logger.warn("Database already connected");
      return;
    }

    this.db = new PrismaClient({
      errorFormat: "pretty",
      log:
        this.config.nodeEnv === "production"
          ? ["error"]
          : ["error", "warn", "query", "info"],
    });

    await this.db.$connect();
    this.logger.info("Database connected ✓");
  }

  async destroy(): Promise<void> {
    if (this.db) {
      await this.db.$disconnect();
      this.db = null;
      this.logger.info("Database disconnected");
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.db) {
      this.logger.error("Database not connected");
      return false;
    }

    try {
      await this.db.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error("Database health check failed:", error);
      return false;
    }
  }
}
