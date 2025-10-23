import { before, DELETE, GET, PATCH, POST, route } from "awilix-router-core";
import { Request, Response, BaseResponse } from "@/middlewares/extend-express";
import { authenticate, authorize } from "@/middlewares/auth";
import { validator } from "@/middlewares/class-validator";
import { TaskDto } from "./task.dto";
import { Priority, Role, TaskAction, TaskStatus } from "@prisma/client";
import TaskRepo from "./task.repo";
import TimelineRepo from "./timeline.repo";
import { Socket } from "socket.io";
import TaskService from "./task.service";

@route("/tasks")
export default class TaskController {
  constructor(
    private taskRepo: TaskRepo,
    private timelineRepo: TimelineRepo,
    private taskService: TaskService
  ) {}

  @POST()
  @before(validator(TaskDto, "create"))
  @before(authenticate)
  async createTask(req: Request, res: Response): Promise<BaseResponse> {
    try {
      const userId = req.context.user.id;
      const data = req.context.dtoData;

      const task = await this.taskRepo
        .create({
          ...data,
          status: TaskStatus.TODO,
          priority: data.priority ?? Priority.LOW,
        })
        .then(async (task) => {
          // add the initial task timelines
          await this.timelineRepo.createMany(
            [
              {
                action: TaskAction.CREATED,
                actorId: userId,
                taskId: task.id,
              },
              {
                action: TaskAction.MOVED_TO_TODO,
                actorId: userId,
                taskId: task.id,
              },
            ].filter(Boolean)
          );

          return { ...task };
        });

      return res.success("Task created.", TaskDto.toJson(task));
    } catch (error: any) {
      return res.error("Task not created!", error.message);
    }
  }

  @GET()
  @before(validator(TaskDto, "fetch", { input: "query" }))
  @before(authenticate)
  async findProjectTasks(req: Request, res: Response): Promise<BaseResponse> {
    try {
      const data = req.context.dtoData;

      const tasks = await this.taskRepo.findProjectTasks(data.projectId);
      return res.success("All tasks.", TaskDto.toArray(tasks));
    } catch (error: any) {
      return res.error("Tasks not found!", error.message);
    }
  }

  @PATCH()
  @route("/:id")
  @before(validator(TaskDto, "update"))
  @before(validator(TaskDto, "taskId", { input: "params" }))
  @before(authenticate)
  async updateTask(req: Request, res: Response): Promise<BaseResponse> {
    try {
      const userId = req.context.user.id;
      const taskId = TaskDto.fromJson(req.params).id;
      const data = req.context.dtoData;

      const task = await this.taskRepo
        .update(taskId, data)
        .then(async (task) => {
          await this.timelineRepo.create({
            action: TaskAction.UPDATED,
            actorId: userId,
            taskId: task.id,
          });
          return task;
        });

      return res.success("Task updated.", TaskDto.toJson(task));
    } catch (error: any) {
      return res.error("Task not updated!", error.message);
    }
  }

  @DELETE()
  @route("/:id")
  @before(authorize([Role.ADMIN]))
  @before(authenticate)
  @before(validator(TaskDto, "taskId", { input: "params" }))
  async deleteTask(req: Request, res: Response): Promise<BaseResponse> {
    try {
      const taskId = TaskDto.fromJson(req.params).id;
      await this.taskRepo.delete(taskId);

      return res.success("Task deleted.");
    } catch (error: any) {
      return res.error("Task not deleted!", error.message);
    }
  }
}
