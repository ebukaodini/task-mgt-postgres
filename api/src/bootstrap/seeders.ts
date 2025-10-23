import { PrismaClient } from "@prisma/client";
import UserSeeder from "@/features/users/user.seed";
import ProjectSeeder from "@/features/projects/project.seed";

export enum SeedEnv {
  development = "development",
  production = "production",
}

export interface Seeder<T = any> {
  seeds: Partial<Record<SeedEnv, T[]>>;
  seed: (db: PrismaClient, environment: SeedEnv) => Promise<void>;
}

export default [UserSeeder, ProjectSeeder];
