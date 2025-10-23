import { PrismaClient, Timeline } from "@prisma/client";
import { DatabaseService } from "@/services/database";
import { PrismaError } from "@/bootstrap/errors";

export default class TimelineRepo {
  protected db: PrismaClient;

  constructor(private database: DatabaseService) {
    this.db = this.database.db;
  }

  async create(timeline: Partial<Timeline>): Promise<Timeline> {
    try {
      return this.db.timeline.create({
        data: timeline as Timeline,
      });
    } catch (error: any) {
      throw new PrismaError(error);
    }
  }

  async createMany(timelines: Partial<Timeline>[]): Promise<Timeline[]> {
    try {
      return this.db.timeline.createMany({
        data: timelines as Timeline[],
      }) as any;
    } catch (error: any) {
      throw error;
    }
  }
}
