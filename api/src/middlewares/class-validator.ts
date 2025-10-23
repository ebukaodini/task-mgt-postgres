import { AppError } from "@/bootstrap/errors";
import { NextFunction, Request, Response } from "./extend-express";
import {
  ValidationError as ClassValidationError,
  validate,
} from "class-validator";
import * as cookie from "cookie";

type ValidatorInput = "body" | "params" | "query" | "headers" | "cookies";

export function validator(
  Dto: any,
  group: string,
  options?: {
    message?: string;
    input?: ValidatorInput;
  }
): any {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inputData = parseInput(req, options?.input ?? "body");
      const dtoData = Dto.fromJson(inputData!);

      const errors = await validate(dtoData, {
        groups: [group],
        strictGroups: true,
        validationError: {
          target: false,
          value: false,
        },
      });

      // Handle validation error
      if (errors.length > 0) {
        const validationErrors = mapErrors(errors);
        return res.error(
          options?.message ?? "Validation failed",
          validationErrors,
          422
        );
      }

      // update context with dto data
      req.updateContext({ dtoData: { ...req.context.dtoData, ...dtoData } });

      next();
    } catch (error: any) {
      throw new AppError("Validator middleware error: " + error.message, 500);
    }
  };
}

const parseInput = (req: Request, input: ValidatorInput) => {
  switch (input) {
    case "body":
      return req.body;
    case "headers":
      return req.headers;
    case "params":
      return req.params;
    case "query":
      return req.query;
    case "cookies":
      if (cookie.parse) return cookie.parse(req.headers.cookie, {});
  }
};

const mapErrors = (errors: ClassValidationError[]) => {
  const mappedErrors: any = {};

  for (const error of errors) {
    const { property, children, constraints } = error;

    if (constraints) {
      mappedErrors[property] = Object.values(constraints)[0];
    } else if (children?.length! > 0) {
      mappedErrors[property] = mapErrors(children!);
    }
  }

  return mappedErrors;
};
