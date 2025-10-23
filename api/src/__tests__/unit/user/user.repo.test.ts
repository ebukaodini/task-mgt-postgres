import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { PrismaClient, User } from "@prisma/client";
import { mockDeep } from "jest-mock-extended";
import UserRepo from "@/features/users/user.repo";
import { DatabaseService } from "@/services/database";
import { globalTestSetup } from "../../config";
import { randomUUID } from "crypto";

describe("UserRepo", () => {
  globalTestSetup();

  let userRepo: UserRepo;
  let mockPrisma: ReturnType<typeof mockDeep<PrismaClient>>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockPrisma = mockDeep<PrismaClient>();
    mockDatabaseService = {
      db: mockPrisma,
    } as unknown as jest.Mocked<DatabaseService>;
    userRepo = new UserRepo(mockDatabaseService);
  });

  describe("create", () => {
    it("should create a user successfully", async () => {
      // Arrange
      const user: Partial<User> = {
        firstName: "John",
        lastName: "Doe",
        email: "j.doe@example.com",
      };
      const expectedUser: Partial<User> = {
        id: randomUUID(),
        ...user,
      };

      mockPrisma.user.create.mockResolvedValue(expectedUser as User);

      // Act
      const result = await userRepo.create(user);

      // Assert
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: user,
      });
      expect(result).toEqual(expectedUser);
    });

    it("should throw error when create fails", async () => {
      // Arrange
      const user: Partial<User> = { firstName: "John" };
      const error = new Error("Database error");

      mockPrisma.user.create.mockRejectedValue(error);

      // Act & Assert
      await expect(userRepo.create(user)).rejects.toThrow("Database error");
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      // Arrange
      const users: Partial<User>[] = [
        {
          id: randomUUID(),
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
        },
        {
          id: randomUUID(),
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(users as User[]);

      // Act
      const result = await userRepo.findAll();

      // Assert
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
      expect(result).toEqual(users);
    });

    it("should throw error when findAll fails", async () => {
      // Arrange
      const error = new Error("Database error");
      mockPrisma.user.findMany.mockRejectedValue(error);

      // Act & Assert
      await expect(userRepo.findAll()).rejects.toThrow("Database error");
    });
  });

  describe("exists", () => {
    it("should return user if email exists", async () => {
      // Arrange
      const email = "john.doe@example.com";
      const user: Partial<User> = {
        id: randomUUID(),
        email: "john.doe@example.com",
      };

      mockPrisma.user.findFirst.mockResolvedValue(user as User);

      // Act
      const result = await userRepo.exists(email);

      // Assert
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(user);
    });

    it("should return null if name does not exist", async () => {
      // Arrange
      const email = "NonExistent";
      mockPrisma.user.findFirst.mockResolvedValue(null);

      // Act
      const result = await userRepo.exists(email);

      // Assert
      expect(result).toBeNull();
    });
  });

  // describe("findOne", () => {
  //   it("should return user by id", async () => {
  //     // Arrange
  //     const userId = 1;
  //     const user: User = {
  //       id: userId,
  //       name: "John",
  //     };

  //     mockPrisma.user.findFirstOrThrow.mockResolvedValue(user);

  //     // Act
  //     const result = await userRepo.findOne(userId);

  //     // Assert
  //     expect(mockPrisma.user.findFirstOrThrow).toHaveBeenCalledWith({
  //       where: { id: userId },
  //     });
  //     expect(result).toEqual(user);
  //   });

  //   it("should throw error when user not found", async () => {
  //     // Arrange
  //     const userId = 999;
  //     const error = new Error("User not found");
  //     mockPrisma.user.findFirstOrThrow.mockRejectedValue(error);

  //     // Act & Assert
  //     await expect(userRepo.findOne(userId)).rejects.toThrow("User not found");
  //   });
  // });
});
