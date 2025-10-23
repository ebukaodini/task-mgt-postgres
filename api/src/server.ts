// import "module-alias/register";
import { application } from "@/app/application";

/**
 * Start the application
 */
async function startApplication(): Promise<void> {
  try {
    await application.start();
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  startApplication();
}

export { application };
export default application;
