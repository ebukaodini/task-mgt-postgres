import { Task, TaskAction, TaskStatus, User } from "@prisma/client";
import TaskRepo from "./task.repo";
import TimelineRepo from "./timeline.repo";
import AuthService, { AuthPayload } from "../auth/auth.service";
import { Socket } from "socket.io";

export default class TaskService {
  constructor(
    private authService: AuthService,
    private taskRepo: TaskRepo,
    private timelineRepo: TimelineRepo
  ) {}

  async socketHandler(socket: Socket) {
    try {
      socket.on("tasks", await this.getTasksHandler.bind(this));
      socket.on(
        "task_status_update",
        await this.updateTaskStatusHandler.bind(this)
      );
    } catch (error) {}
  }

  async updateTaskStatusHandler(_arg1: any, data: any, callback: any) {
    try {
      const authPayload = this.authService.verifyToken(
        data.token
      ) as AuthPayload;

      if (!authPayload) return;
      const { sub: id } = authPayload;

      const updatedTask = await this.updateTaskStatus(id, data.task);
      const projectTasks = await this.taskRepo.findProjectTasks(
        updatedTask.projectId
      );

      callback({
        status: "ok",
        tasks: projectTasks,
      });
    } catch (error) {
      callback({
        status: "ok",
        error: error.message,
      });
    }
  }

  async getTasksHandler(_arg1: any, data: any, callback: any) {
    try {
      const authPayload = this.authService.verifyToken(
        data.token
      ) as AuthPayload;
      if (!authPayload) return;

      const projectTasks = await this.taskRepo.findProjectTasks(data.projectId);

      callback({
        status: "ok",
        tasks: projectTasks,
      });
    } catch (error) {
      callback({
        status: "ok",
        error: error.message,
      });
    }
  }

  async updateTaskStatus(userId: User["id"], task: Task): Promise<Task> {
    try {
      return await this.taskRepo
        .updateStatus(task.id, task.status)
        .then(async (task) => {
          let statusAction: TaskAction;
          switch (task.status) {
            case TaskStatus.TODO:
              statusAction = TaskAction.MOVED_TO_TODO;
              break;
            case TaskStatus.IN_PROGRESS:
              statusAction = TaskAction.MOVED_TO_IN_PROGRESS;
              break;
            case TaskStatus.DONE:
              statusAction = TaskAction.MOVED_TO_DONE;
              break;
          }
          await this.timelineRepo.create({
            action: statusAction,
            actorId: userId,
            taskId: task.id,
          });
          return task;
        });
    } catch (error: any) {
      throw error;
    }
  }
}
