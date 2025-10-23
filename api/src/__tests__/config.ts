import { beforeEach, jest } from "@jest/globals";

export function globalTestSetup() {
  // Global test setup
  process.env.NODE_ENV = "test";
  process.env.LOG_LEVEL = "error";

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
}
