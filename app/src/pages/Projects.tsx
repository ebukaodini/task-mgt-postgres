import { useEffect, useState } from "react";
import { useStore } from "../hooks/use-store";
import ProjectCard from "../components/ProjectCard";
import { Project } from "../utils/types";

interface ProjectProps {}

const AdminProjects: React.FC<ProjectProps> = () => {
  const { getProjects, projects } = useStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      await getProjects().then(() => {
        setIsLoaded(true);
      });
    };

    loadProjects();
  }, [getProjects]);

  return (
    <div className="p-4 flex flex-col gap-y-3 w-full">
      <h1 className="font-bold text-xl text-primary">Projects</h1>

      {isLoaded === false ? (
        <p>Loading...</p>
      ) : (
        <div className="flex flex-col gap-y-4">
          {projects?.length! > 0 ? (
            projects?.map((project: Project) => (
              <ProjectCard project={project} key={project.id} />
            ))
          ) : (
            <p className="inline-flex justify-center text-sm py-10">
              No projects found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
