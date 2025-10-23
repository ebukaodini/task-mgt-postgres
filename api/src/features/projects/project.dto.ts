import { Project } from "@prisma/client";
import { IsMongoId, IsNotEmpty, IsString, Length } from "class-validator";

export class ProjectDto {
  @Length(1, 50, {
    message: "Title must be 1 to 50 character length",
    groups: ["create", "update"],
  })
  @IsString({ message: "Title is invalid", groups: ["create", "update"] })
  @IsNotEmpty({ message: "Title is required", groups: ["create", "update"] })
  title: string;

  @IsString({ message: "Description is invalid", groups: ["create", "update"] })
  @IsNotEmpty({
    message: "Description is required",
    groups: ["create", "update"],
  })
  description: string;

  public static fromJson(data: { [key: string]: any }): ProjectDto {
    const project: ProjectDto = new ProjectDto();

    if (data?.title) project.title = data.title;
    if (data?.description) project.description = data.description;

    return project;
  }

  public static toJson(project: Project): object {
    if (!project) {
      return;
    }

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      createdAt: project.createdAt,
      tasks: (project as any).tasks,
    };
  }

  public static toArray(projects: Project[]): object[] {
    return projects.map((project) => this.toJson(project));
  }
}
