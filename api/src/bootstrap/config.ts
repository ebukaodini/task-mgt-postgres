import dotenv from "dotenv";
import ms from "ms";
import path from "path";

// Load environment variables
const nodeEnv = process.env.NODE_ENV || "development";
const envFile = nodeEnv === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export type nodeEnvType = "development" | "staging" | "test" | "production";

export interface Config {
  appName: string;
  port: number;
  nodeEnv: nodeEnvType;
  logging: {
    level: string;
  };
  cors?: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  database?: {
    url: string;
  };
  socket?: {
    corsOrigins: string[];
  };
  auth?: {
    jwtSecret: string;
    expiresIn: ms.StringValue;
    saltRounds: number;
  };
}

const config: Config = {
  appName: process.env.APP_NAME!,
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: nodeEnv as nodeEnvType,
  logging: {
    level:
      process.env.LOG_LEVEL || (nodeEnv === "production" ? "info" : "debug"),
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: process.env.CORS_CREDENTIALS === "true",
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10), // limit each IP to 100 requests per windowMs
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  socket: {
    corsOrigins: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3000",
    ],
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    expiresIn: (process.env.JWT_EXPIRES_IN as ms.StringValue) || "7d",
    saltRounds: 10,
  },
};

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export default config;
