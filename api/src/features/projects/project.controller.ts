import { before, GET, POST, route } from "awilix-router-core";
import { Request, Response, BaseResponse } from "@/middlewares/extend-express";
import { authenticate, authorize } from "@/middlewares/auth";
import { validator } from "@/middlewares/class-validator";
import ProjectRepo from "./project.repo";
import { ProjectDto } from "./project.dto";
import { Role } from "@prisma/client";

@route("/projects")
export default class UserController {
  constructor(private projectRepo: ProjectRepo) {}

  @POST()
  @before(validator(ProjectDto, "create"))
  @before(authorize([Role.ADMIN]))
  @before(authenticate)
  async createProject(req: Request, res: Response): Promise<BaseResponse> {
    try {
      const data = req.context.dtoData;
      const project = await this.projectRepo.create(data);

      return res.success("Project created.", ProjectDto.toJson(project));
    } catch (error: any) {
      return res.error("Project not created!", error.message);
    }
  }

  @GET()
  @before(authenticate)
  async findAllProjects(req: Request, res: Response): Promise<BaseResponse> {
    try {
      const projects = await this.projectRepo.findAll();
      return res.success("All projects.", ProjectDto.toArray(projects));
    } catch (error: any) {
      return res.error("Projects not found!");
    }
  }
}
