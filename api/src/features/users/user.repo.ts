import { PrismaClient, User } from "@prisma/client";
import { DatabaseService } from "@/services/database";
import { PrismaError } from "@/bootstrap/errors";

export default class UserRepo {
  protected db: PrismaClient;

  constructor(private database: DatabaseService) {
    this.db = this.database.db;
  }

  async exists(email: User["email"]): Promise<User> {
    try {
      return await this.db.user.findFirst({ where: { email } });
    } catch (error: any) {
      throw new PrismaError(error);
    }
  }

  async create(data: Partial<User>): Promise<User> {
    try {
      return await this.db.user.create({ data: data as User });
    } catch (error: any) {
      throw new PrismaError(error);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.db.user.findMany();
    } catch (error: any) {
      throw new PrismaError(error);
    }
  }

  async findByEmail(email: User["email"]): Promise<User> {
    try {
      return await this.db.user.findUniqueOrThrow({ where: { email } });
    } catch (error: any) {
      throw new PrismaError(error);
    }
  }

}
