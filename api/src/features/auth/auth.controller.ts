import { before, POST, route } from "awilix-router-core";
import { Request, Response, BaseResponse } from "@/middlewares/extend-express";
import { validator } from "@/middlewares/class-validator";
import AuthService from "./auth.service";
import AuthDto from "./auth.dto";
import UserDto from "../users/user.dto";

@route("/auth")
export default class AuthController {
  constructor(private authService: AuthService) {}

  @POST()
  @route("/sign-up")
  @before(
    validator(AuthDto, "create", { message: "User account not created!" })
  )
  async signUp(req: Request, res: Response): Promise<BaseResponse> {
    try {
      const data = req.context.dtoData;
      const { user, auth } = await this.authService.signUp(data);

      return res.success("User account created.", {
        user: UserDto.toJson(user),
        token: auth.accessToken,
      });
    } catch (error: any) {
      return res.error("User account not created!", error.message);
    }
  }

  @POST()
  @route("/sign-in")
  @before(validator(AuthDto, "authenticate"))
  async signIn(req: Request, res: Response): Promise<BaseResponse> {
    try {
      const data = req.context.dtoData;
      const { user, auth } = await this.authService.signIn(data);

      return res.success("Sign in successful.", {
        user: UserDto.toJson(user),
        token: auth.accessToken,
      });
    } catch (error: any) {
      return res.error("Profile not found!", error.message);
    }
  }
}
