import { PrismaClient, Project, Task } from "@prisma/client";
import { DatabaseService } from "@/services/database";
import { PrismaError } from "@/bootstrap/errors";

export default class TaskRepo {
  protected db: PrismaClient;

  constructor(private database: DatabaseService) {
    this.db = this.database.db;
  }

  async create(task: Task): Promise<Task> {
    try {
      return this.db.task.create({
        data: task,
      });
    } catch (error: any) {
      throw new PrismaError(error);
    }
  }

  async findProjectTasks(projectId: Task["projectId"]): Promise<Task[]> {
    try {
      return this.db.task.findMany({
        where: { projectId },
        select: {
          id: true,
          title: true,
          description: true,
          assignee: { select: { id: true, firstName: true, lastName: true } },
          priority: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          projectId: true,
          timelines: {
            select: {
              actor: { select: { firstName: true, lastName: true } },
              action: true,
              timestamp: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }) as any as Task[];
    } catch (error: any) {
      throw new PrismaError(error);
    }
  }

  async update(taskId: Task["id"], task: Task): Promise<Task> {
    try {
      return this.db.task.update({
        where: { id: taskId },
        data: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          assigneeId: task.assigneeId,
        },
      });
    } catch (error: any) {
      throw new PrismaError(error);
    }
  }

  async updateStatus(
    taskId: Task["id"],
    status: Task["status"]
  ): Promise<Task> {
    try {
      return this.db.task.update({
        where: { id: taskId },
        data: {
          status: status,
        },
      });
    } catch (error: any) {
      throw new PrismaError(error);
    }
  }

  async delete(taskId: Task["id"]): Promise<any> {
    try {
      const deleteTask = this.db.task.delete({
        where: { id: taskId },
        include: { timelines: true },
      });
      const deleteTaskTimelines = this.db.timeline.deleteMany({
        where: { taskId },
      });

      return await this.db.$transaction([deleteTaskTimelines, deleteTask]);
    } catch (error: any) {
      throw new PrismaError(error);
    }
  }
}
