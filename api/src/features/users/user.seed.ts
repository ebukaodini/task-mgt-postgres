import { PrismaClient, Role, User } from "@prisma/client";
import { Seeder, SeedEnv } from "@/bootstrap/seeders";
import logger from "@/middlewares/logger";

export default class UserSeeder implements Seeder {
  seeds: Partial<Record<SeedEnv, Partial<User>[]>> = {
    development: [
      {
        firstName: "Jack",
        lastName: "Doe",
        email: "admin@example.com",
        role: Role.ADMIN,
      },
      {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        role: Role.USER,
      },
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        role: Role.USER,
      },
    ],
    production: [],
  };

  async seed(db: PrismaClient, environment: SeedEnv) {
    try {
      const users = this.seeds[environment];
      if (!users) return;

      const userCount = await db.user.count()
      if (userCount > 0) {
        logger.info("Users already seeded!");
        return;
      }

      // seed users
      for await (const user of users) {
        await db.user.create({ data: user as User });
      }

      logger.info("Users seeded!");
    } catch (error) {
      logger.info("Users not seeded!");
      throw error;
    }
  }
}
