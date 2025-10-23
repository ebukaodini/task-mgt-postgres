import serviceRegistry from "@/app/service-registry";
import { DatabaseService } from "@/services/database";
import { PrismaClient } from "@prisma/client";
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

type PropertyType = {
  entity: string;
  field?: string;
  transform?: (v: ValidationArguments["value"]) => any;
};

@ValidatorConstraint({ async: true, name: "Exists" })
export class ExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly database: DatabaseService) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    try {
      const { entity, field, transform } = args.constraints[0] as PropertyType;

      return await this.database.db[entity]
        .findFirst({
          where: {
            [field ?? args.property]: transform ? transform(value) : value,
          },
        })
        .then((result: any) => {
          if (result) return true;
          else return false;
        });
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const { entity, field } = args.constraints[0] as PropertyType;
    return `${entity} ${[field ?? args.property]} does not exist`;
  }
}

export function Exists(
  property: PropertyType,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    const database = serviceRegistry.resolve("database") as DatabaseService;

    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: new ExistsConstraint(database),
    });
  };
}
