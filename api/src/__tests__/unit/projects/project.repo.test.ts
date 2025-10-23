import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { PrismaClient, Project } from "@prisma/client";
import { mockDeep } from "jest-mock-extended";
import { DatabaseService } from "@/services/database";
import { globalTestSetup } from "../../config";
import { randomUUID } from "crypto";
import ProjectRepo from "@/features/projects/project.repo";

describe("ProjectRepo", () => {
  globalTestSetup();

  let projectRepo: ProjectRepo;
  let mockPrisma: ReturnType<typeof mockDeep<PrismaClient>>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockPrisma = mockDeep<PrismaClient>();
    mockDatabaseService = {
      db: mockPrisma,
    } as unknown as jest.Mocked<DatabaseService>;
    projectRepo = new ProjectRepo(mockDatabaseService);
  });

  describe("create", () => {
    it("should create a project successfully", async () => {
      // Arrange
      const project: Partial<Project> = {
        title: "Sample",
        description: "sample description",
      };
      const expectedProject: Partial<Project> = {
        id: randomUUID(),
        ...project,
      };

      mockPrisma.project.create.mockResolvedValue(expectedProject as Project);

      // Act
      const result = await projectRepo.create(project);

      // Assert
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: project,
      });
      expect(result).toEqual(expectedProject);
    });

    it("should throw error when create fails", async () => {
      // Arrange
      const project: Partial<Project> = {
        title: "Sample",
        description: "sample description",
      };
      const error = new Error("Database error");

      mockPrisma.project.create.mockRejectedValue(error);

      // Act & Assert
      await expect(projectRepo.create(project)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("findAll", () => {
    it("should return all projects", async () => {
      // Arrange
      const projects: Partial<Project>[] = [
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

      mockPrisma.project.findMany.mockResolvedValue(projects as Project[]);

      // Act
      const result = await projectRepo.findAll();

      // Assert
      expect(mockPrisma.project.findMany).toHaveBeenCalled();
      expect(result).toEqual(projects);
    });

    it("should throw error when findAll fails", async () => {
      // Arrange
      const error = new Error("Database error");
      mockPrisma.project.findMany.mockRejectedValue(error);

      // Act & Assert
      await expect(projectRepo.findAll()).rejects.toThrow("Database error");
    });
  });
});
