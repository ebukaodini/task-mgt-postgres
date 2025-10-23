import { useEffect, useState } from "react";
import { useStore } from "../hooks/use-store";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";
import TaskList from "../components/TaskList";
import CreateTaskModal from "../components/modals/CreateTaskModal";
import { Project, TaskStatus } from "../utils/types";

interface TasksProps {}

const Tasks: React.FC<TasksProps> = () => {
  const { getProjectTasks, projects } = useStore();
  const { projectId } = useParams();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showingCreate, showCreate] = useState(false);
  const navigate = useNavigate();

  const project = projects?.find(
    (project: Project) => project.id === projectId
  )!;

  useEffect(() => {
    const projectPojectTasks = async () => {
      await getProjectTasks(projectId!).then(() => {
        setIsLoaded(true);
      });
    };

    projectPojectTasks();
  }, [getProjectTasks, projectId]);

  return (
    <>
      {showingCreate && (
        <CreateTaskModal projectId={projectId!} close={showCreate} />
      )}

      <div className="p-4 flex flex-col gap-y-0 w-full">
        <div className="w-full bg-white rounded shadow-md p-4 flex flex-col gap-y-2 mb-5">
          <div className="w-full flex justify-between items-start">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-primary rounded font-semibold text-sm mb-3 w-fit"
            >
              &larr; Back
            </button>

            <div className="w-fit flex flex-col gap-y-1">
              <button
                type="button"
                onClick={() => showCreate(true)}
                className="bg-primary text-white rounded font-semibold text-sm py-1 px-2 w-fit"
              >
                Add Task
              </button>
              <span className="text-gray-500 font-semibold text-xs">
                created {moment(project.createdAt).fromNow()}
              </span>
            </div>
          </div>

          <div className="w-full flex align-middle justify-between">
            <div className="flex flex-col gap-y-1">
              <h1 className="font-bold text-xl text-gray-500">
                {project.title}
              </h1>
              <p className="text-gray-500 text-sm">{project.description}</p>
            </div>
          </div>
        </div>

        <div>
          {isLoaded === false ? (
            <p>Loading...</p>
          ) : (
            <div className="h-[550px] overflow-auto flex flex-row justify-between">
              <TaskList
                tasks={useStore.getState().pendingTasks}
                status={TaskStatus.TODO}
                title="TODO"
              />
              <div className="h-full border" />
              <TaskList
                tasks={useStore.getState().onGoingTasks}
                status={TaskStatus.IN_PROGRESS}
                title="IN PROGRESS"
              />
              <div className="h-full border" />
              <TaskList
                tasks={useStore.getState().completedTasks}
                status={TaskStatus.DONE}
                title="DONE"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Tasks;
