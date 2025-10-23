import serviceRegistry from "@/app/service-registry";
import { Prisma } from "@prisma/client";
import {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} from "jsonwebtoken";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, error: any) {
    super(message, 422);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, 500);
  }
}

export class PrismaError extends AppError {
  constructor(error: any) {
    const message = String(error.message).split("\n").reverse()[0];

    switch (error.code) {
      case "P1000":
        super(
          `Authentication failed: Occurs when Prisma cannot authenticate with the database using the provided credentials. ${message}`,
          500
        );
        break;
      case "P1001":
        super(
          `Cannot reach database server: The database server is not running or is unreachable at the provided host or port. Can also be caused by firewall or network issues. ${message}`,
          500
        );
        break;
      case "P1002":
        super(
          `Authentication failed against database: The provided credentials for the database are not valid. ${message}`,
          500
        );
        break;
      case "P1003":
        super(
          `Database does not exist: The specified database does not exist. ${message}`,
          500
        );
        break;
      case "P1008":
        super(
          `Operations timed out: The database operation took longer than the configured time limit. ${message}`,
          500
        );
        break;
      case "P1010":
        super(
          `User denied access: The database user lacks the necessary permissions. ${message}`,
          500
        );
        break;
      case "P1011":
        super(
          `Too many connections: The number of open connections has reached the database's limit. ${message}`,
          500
        );
        break;
      case "P1012":
        super(
          `Schema validation error: Your Prisma schema has a syntax error or is misconfigured. ${message}`,
          500
        );
        break;
      case "P1013":
        super(
          `Invalid database string: The DATABASE_URL is incorrectly formatted. ${message}`,
          500
        );
        break;
      case "P1014":
        super(
          `Model does not exist: The underlying database table for a model does not exist. A migration is likely needed. ${message}`,
          500
        );
        break;
      case "P1015":
        super(
          `Incompatible database version: Your database version is too old to support a Prisma feature you are trying to use. ${message}`,
          500
        );
        break;
      case "P1016":
        super(
          `Incorrect number of parameters in raw query: The parameters provided to a $queryRaw call do not match the query. ${message}`,
          500
        );
        break;
      case "P1017":
        super(
          `Connection closed by server: The database forcefully closed the connection.  ${message}`,
          500
        );
        break;
      case "P2000":
        super(
          `Value too long: The provided value for a column is too long for the column's data type. ${message}`,
          500
        );
        break;
      case "P2001":
        super(
          `Record not found in where: A findUnique or findFirst query found no record. ${message}`,
          500
        );
        break;
      case "P2002":
        super(
          `Unique constraint failed: An item with the same unique value already exists in the database. ${message}`,
          500
        );
        break;
      case "P2003":
        super(
          `Foreign key constraint failed: You tried to create a record that references a non-existent record in another table. ${message}`,
          500
        );
        break;
      case "P2004":
        super(
          `Constraint failed: A database constraint other than unique or foreign key failed during a query. ${message}`,
          500
        );
        break;
      case "P2005":
        super(
          `Invalid database value: The value stored in the database is invalid for the field's type. ${message}`,
          500
        );
        break;
      case "P2006":
        super(
          `Invalid field value: A provided value is not valid for the field's expected type. ${message}`,
          500
        );
        break;
      case "P2007":
        super(
          `Data validation error: A general data validation error occurred. ${message}`,
          500
        );
        break;
      case "P2011":
        super(
          `Null constraint violation: A required field that cannot be null was not provided with a value. ${message}`,
          500
        );
        break;
      case "P2014":
        super(
          `Required relation violated: The change you are trying to make would violate a required relationship between models, such as trying to delete a parent record that still has connected child records. ${message}`,
          500
        );
        break;
      case "P2015":
        super(
          `Related record not found: A record that was required for a relation could not be found. ${message}`,
          500
        );
        break;
      case "P2018":
        super(
          `Required connected records not found: One or more required records in a relation were not found. ${message}`,
          500
        );
        break;
      case "P2020":
        super(
          `Value out of range: A provided value is outside the valid range for its data type. ${message}`,
          500
        );
        break;
      case "P2025":
        super(
          `Dependent record not found: A required operation failed because it depended on one or more records that were not found.  ${message}`,
          500
        );
        break;
      case "P2024":
        super(
          `Connection pool timeout: Prisma timed out while waiting to borrow a connection from the connection pool. ${message}`,
          500
        );
        break;
      case "P2026":
        super(
          `Unsupported feature: The database provider does not support a feature used in the query. ${message}`,
          500
        );
        break;
      case "P2027":
        super(
          `Multiple query execution errors: More than one error occurred during a query execution. ${message}`,
          500
        );
        break;
      case "P6004":
        super(
          `Query timeout: The database query took too long and timed out. ${message}`,
          500
        );
        break;
      case "P6008":
        super(
          `Engine start error: Prisma's engine failed to start. ${message}`,
          500
        );
        break;
      case "P6009":
        super(
          `Response size limit exceeded: The response from a query was too large.  ${message}`,
          500
        );
        break;
      default:
        super(`An unexpected error occurred. ${message}`, 500);
        break;
    }
  }
}

export class JwtError extends AppError {
  constructor(error: JsonWebTokenError) {
    if (error instanceof TokenExpiredError)
      super("Unauthorized. Token expired!", 401);
    if (error instanceof NotBeforeError)
      super("Unauthorized. Invalid token!", 401);
  }
}
