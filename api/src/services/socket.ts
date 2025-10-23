import { Service } from "@/app/service-registry";
import { Config } from "@/bootstrap/config";
import TaskService from "@/features/tasks/task.service";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { Logger } from "winston";

export class SocketService implements Service {
  public io: SocketIOServer | null = null;

  constructor(
    private logger: Logger,
    private config: Config,
    private server: HttpServer,
    private taskService: TaskService
  ) {}

  async initialize(): Promise<void> {
    if (this.io) {
      this.logger.warn("Socket service already initialized");
      return;
    }

    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: this.config.socket.corsOrigins,
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.on("connection", (socket) => {
      this.logger.info(`Socket connected: ${socket.id}`);

      this.taskService.socketHandler(socket);

      socket.on("disconnect", (reason) => {
        this.logger.info(
          `Socket disconnected: ${socket.id}, reason: ${reason}`
        );
      });
    });

    this.logger.info("Socket service initialized ✓");
  }

  async destroy(): Promise<void> {
    if (this.io) {
      this.io.close();
      this.io = null;
      this.logger.info("Socket service disconnected");
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.io !== null;
  }

  emit(event: string, data: any): void {
    if (!this.io) throw new Error("Socket service not initialized");
    this.io.emit(event, data);
  }

  to(room: string): any {
    if (!this.io) throw new Error("Socket service not initialized");
    return this.io.to(room);
  }
}
