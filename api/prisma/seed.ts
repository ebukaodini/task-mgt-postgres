import { argv } from "node:process";
import { PrismaClient } from "@prisma/client";
import logger from "../src/middlewares/logger";
import config from "../src/bootstrap/config";
import seeders, { SeedEnv } from "../src/bootstrap/seeders";

const db = new PrismaClient();
async function main(environment: SeedEnv) {
  try {
    logger.info(`Seeding ${environment} environment.`);
    if (config.nodeEnv !== environment) {
      logger.warn("Seeding the wrong environment. Check your environment!");
      return;
    }

    for await (const seeder of seeders) {
      const instance = new seeder();

      if (instance.seed) {
        await instance.seed(db, environment);
      }
    }

    logger.info("Database seeded successfully! 🌱");
  } catch (error) {
    logger.info(`Error seeding database: ${error}`);
    await db.$disconnect();
  } finally {
    await db.$disconnect();
  }
}

// call the seed function with the environment passed in the command
main(argv[2] as SeedEnv);
