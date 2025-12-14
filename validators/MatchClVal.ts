import { registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";

export function MatchClVal(property: string, validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: "MatchClVal",
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedProperty] = args.constraints;
          return value === (args.object as any)[relatedProperty];
        },
      },
    });
  };
}
