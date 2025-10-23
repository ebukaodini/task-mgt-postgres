import { Role, User } from "@prisma/client";
import { Config } from "@/bootstrap/config";
import { JwtError } from "@/bootstrap/errors";
import jwt from "jsonwebtoken";
import AuthDto from "./auth.dto";
import UserRepo from "../users/user.repo";

export type AuthPayload = {
  sub: string;
  role: Role;
};

type AuthTokens = {
  accessToken: string;
};

export default class AuthService {
  constructor(
    private userRepo: UserRepo,
    private config: Config
  ) {}

  async signUp(data: AuthDto): Promise<{ user: User; auth: AuthTokens }> {
    try {
      const exists = await this.userRepo.exists(data.email);
      if (exists) {
        throw new Error("User with email already exists.");
      }

      // create user account
      const user = await this.userRepo.create({
        ...data,
        role: Role.USER,
      });
      const { accessToken } = await this.generateToken(user);

      return {
        user,
        auth: {
          accessToken,
        },
      };
    } catch (error: any) {
      throw error;
    }
  }

  async signIn(data: AuthDto): Promise<{ user: User; auth: AuthTokens }> {
    try {
      const user = await this.userRepo.findByEmail(data.email);
      if (!user) {
        throw new Error("User not found");
      }

      const { accessToken } = await this.generateToken(user);

      return {
        user,
        auth: {
          accessToken,
        },
      };
    } catch (error: any) {
      throw error;
    }
  }

  verifyToken(token: string): jwt.JwtPayload | string {
    try {
      return jwt.verify(token, this.config.auth.jwtSecret, {
        algorithms: ["HS256"],
      });
    } catch (error: any) {
      throw new JwtError(error);
    }
  }

  private async generateToken(user: User) {
    const payload = { sub: user.id, role: user.role };

    const accessToken = jwt.sign(payload, this.config.auth.jwtSecret, {
      expiresIn: this.config.auth.expiresIn,
      algorithm: "HS256",
      mutatePayload: false,
    });

    return { accessToken };
  }
}
