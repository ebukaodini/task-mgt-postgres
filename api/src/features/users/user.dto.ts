import { User, Role } from "@prisma/client";

export default class UserDto {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt: Date;

  public static toJson(user: User): object {
    if (!user) {
      return;
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  public static toArray(users: User[]): object[] {
    return users.map((user) => this.toJson(user));
  }
}
