import { AppDataSource } from "./config/data-source";
import app from "./app";

async function start() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected successfully");

    const port = process.env.PORT || 3000;
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('HTTP server closed');
        try {
          await AppDataSource.destroy();
          console.log('Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

start();
