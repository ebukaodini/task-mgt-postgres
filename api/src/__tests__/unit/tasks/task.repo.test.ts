import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { PrismaClient, Task } from "@prisma/client";
import { mockDeep } from "jest-mock-extended";
import { DatabaseService } from "@/services/database";
import { globalTestSetup } from "../../config";
import { randomUUID } from "crypto";
import TaskRepo from "@/features/tasks/task.repo";
import { PrismaError } from "@/bootstrap/errors";

describe("TaskRepo", () => {
  globalTestSetup();

  let taskRepo: TaskRepo;
  let mockPrisma: ReturnType<typeof mockDeep<PrismaClient>>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockPrisma = mockDeep<PrismaClient>();
    mockDatabaseService = {
      db: mockPrisma,
    } as unknown as jest.Mocked<DatabaseService>;
    taskRepo = new TaskRepo(mockDatabaseService);
  });

  describe("create", () => {
    it("should create a task successfully", async () => {
      // Arrange
      const task: Partial<Task> = {
        title: "Sample",
        description: "sample description",
        assigneeId: randomUUID(),
        projectId: randomUUID(),
        status: "TODO",
      };
      const expectedTask: Partial<Task> = {
        id: randomUUID(),
        ...task,
      };

      mockPrisma.task.create.mockResolvedValue(expectedTask as Task);

      // Act
      const result = await taskRepo.create(task as Task);

      // Assert
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: task,
      });
      expect(result).toEqual(expectedTask);
    });

    it("should throw error when create fails", async () => {
      // Arrange
      const task: Partial<Task> = {
        title: "Sample",
        description: "sample description",
        assigneeId: randomUUID(),
        projectId: randomUUID(),
        status: "TODO",
      };
      const error = new Error("Database error");

      mockPrisma.task.create.mockRejectedValue(error);

      // Act & Assert
      await expect(taskRepo.create(task as Task)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("findProjectTasks", () => {
    it("should return all project tasks", async () => {
      // Arrange
      const tasks: Partial<Task>[] = [
        {
          id: randomUUID(),
          title: "Sample",
          description: "sample description",
        },
        {
          id: randomUUID(),
          title: "Sample 2",
          description: "sample 2 description",
        },
      ];

      mockPrisma.task.findMany.mockResolvedValue(tasks as Task[]);

      // Act
      const projectId = randomUUID();
      const result = await taskRepo.findProjectTasks(projectId);

      // Assert
      expect(mockPrisma.task.findMany).toHaveBeenCalled();
      expect(result).toEqual(tasks);
    });

    it("should throw error when findProjectTasks fails", async () => {
      // Arrange
      const error = new Error("Database error");
      mockPrisma.task.findMany.mockRejectedValue(error);

      // Act & Assert
      const projectId = randomUUID();
      await expect(taskRepo.findProjectTasks(projectId)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("update", () => {
    it("should update task successfully", async () => {
      // Arrange
      const taskId = randomUUID();
      const task: Partial<Task> = {
        title: "Sample",
        description: "sample description",
        assigneeId: randomUUID(),
        status: "TODO",
        priority: "HIGH",
      };
      const updatedTask: Partial<Task> = {
        id: taskId,
        ...task,
        title: "Updated",
      };

      mockPrisma.task.update.mockResolvedValue(updatedTask as Task);

      // Act
      const result = await taskRepo.update(taskId, task as Task);

      // Assert
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        data: task,
        where: { id: taskId },
      });
      expect(result).toEqual(updatedTask);
    });

    it("should throw error when update fails", async () => {
      // Arrange
      const taskId = randomUUID();
      const task: Partial<Task> = {
        title: "Sample",
        description: "sample description",
        assigneeId: randomUUID(),
        status: "TODO",
        priority: "HIGH",
      };
      const error = new Error("Task not found");

      mockPrisma.task.update.mockRejectedValue(error);

      // Act & Assert
      await expect(taskRepo.update(taskId, task as Task)).rejects.toThrow(
        "Task not found"
      );
    });
  });

  describe("delete", () => {
    it("should delete task successfully", async () => {
      // Arrange
      const taskId = randomUUID();
      const deletedTask: Partial<Task> = {
        title: "Sample",
        description: "sample description",
        assigneeId: randomUUID(),
        status: "TODO",
        priority: "HIGH",
      };

      mockPrisma.task.delete.mockResolvedValue(deletedTask as Task);

      // Act
      await taskRepo.delete(taskId);

      // Assert
      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: { id: taskId },
        include: { timelines: true },
      });
      expect(mockPrisma.timeline.deleteMany).toHaveBeenCalledWith({
        where: { taskId },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
