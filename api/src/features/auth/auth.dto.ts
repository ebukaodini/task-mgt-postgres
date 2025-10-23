import { Role } from "@prisma/client";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from "class-validator";

export default class AuthDto {
  @IsNotEmpty({ message: "First name is required", groups: ["create"] })
  firstName?: string;

  @IsNotEmpty({ message: "Last name is required", groups: ["create"] })
  lastName?: string;

  @IsEmail({}, { message: "Invalid email", groups: ["create", "authenticate"] })
  @IsNotEmpty({
    message: "Email is required",
    groups: ["create", "authenticate"],
  })
  email?: string;

  @IsEnum(Object.values(Role), {
    message: "Invalid role",
    groups: ["create"],
  })
  @IsOptional({ groups: ["create"] })
  role?: Role;

  public static fromJson(data: { [key: string]: any }): AuthDto {
    const auth: AuthDto = new AuthDto();

    // signup
    if (data?.firstName) auth.firstName = data.firstName.trim();
    if (data?.lastName) auth.lastName = data.lastName.trim();
    if (data?.email) auth.email = data.email.trim();

    return auth;
  }
}
