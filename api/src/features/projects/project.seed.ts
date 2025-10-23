import { PrismaClient, Role, Project } from "@prisma/client";
import { Seeder, SeedEnv } from "@/bootstrap/seeders";
import logger from "@/middlewares/logger";
import { faker } from "@faker-js/faker";

export default class ProjectSeeder implements Seeder {
  seeds: Partial<Record<SeedEnv, Partial<Project>[]>> = {
    development: [
      {
        title: faker.lorem.sentence(),
        description: faker.lorem.sentences(),
      },
      {
        title: faker.lorem.sentence(),
        description: faker.lorem.sentences(),
      },
      {
        title: faker.lorem.sentence(),
        description: faker.lorem.sentences(),
      },
    ],
    production: [],
  };

  async seed(db: PrismaClient, environment: SeedEnv) {
    try {
      const projects = this.seeds[environment];
      if (!projects) return;

      const projectCount = await db.project.count()
      if (projectCount > 0) {
        logger.info("Projects already seeded!");
        return;
      }

      // seed projects
      await db.project.createMany({ data: projects as Project[] });

      logger.info("Projects seeded!");
    } catch (error) {
      logger.info("Projects not seeded!");
      throw error;
    }
  }
}
