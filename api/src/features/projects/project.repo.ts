import { PrismaClient, Project } from "@prisma/client";
import { DatabaseService } from "@/services/database";
import { PrismaError } from "@/bootstrap/errors";

export default class ProjectRepo {
  protected db: PrismaClient;

  constructor(private database: DatabaseService) {
    this.db = this.database.db;
  }

  async create(data: Partial<Project>): Promise<Project> {
    try {
      return await this.db.project.create({ data: data as Project });
    } catch (error: any) {
      throw new PrismaError(error);
    }
  }

  async findAll(): Promise<Project[]> {
    try {
      return await this.db.project.findMany({
        include: { tasks: true },
        orderBy: { createdAt: "desc" },
      });
    } catch (error: any) {
      throw new PrismaError(error);
    }
  }
}
