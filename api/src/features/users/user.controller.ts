import { before, GET, route } from "awilix-router-core";
import { Request, Response, BaseResponse } from "@/middlewares/extend-express";
import UserDto from "./user.dto";
import { authenticate } from "@/middlewares/auth";
import UserRepo from "./user.repo";

@route("/users")
export default class UserController {
  constructor(private userRepo: UserRepo) {}

  @GET()
  @before(authenticate)
  async findAllUsers(req: Request, res: Response): Promise<BaseResponse> {
    try {
      const users = await this.userRepo.findAll();
      return res.success("All users.", UserDto.toArray(users));
    } catch (error: any) {
      return res.error("Users not found!");
    }
  }
}
