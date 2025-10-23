import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ async: false })
export class OneOfConstraint implements ValidatorConstraintInterface {
  validate(object: any, args: ValidationArguments) {
    const [propertyNames] = args.constraints;
    let oneOfPresent = false;
    for (const propName of propertyNames) {
      if (object[propName] !== undefined && object[propName] !== null) {
        oneOfPresent = true;
        break;
      }
    }
    return oneOfPresent;
  }

  defaultMessage(args: ValidationArguments) {
    const [propertyNames] = args.constraints;
    return `At least one of the following properties must be provided: ${propertyNames.join(", ")}`;
  }
}

/**
 * Apply the oneOf decorator to the class
 *
 * Eg: @OneOf(['fieldA', 'fieldB'])
 *
 * @param propertyNames
 * @param validationOptions
 * @returns
 */
export function OneOf(
  propertyNames: string[],
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [propertyNames],
      validator: OneOfConstraint,
    });
  };
}
