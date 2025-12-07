import { Router } from 'express';
import { IController } from '../common/interfaces';
import { UsersController } from '../users/users.controller';

class RouteManager {
  private router: Router;
  private controllers: IController[] = [];

  constructor() {
    this.router = Router();
    this.initializeControllers();
    this.initializeRoutes();
  }

  private initializeControllers(): void {
    this.controllers = [
      new UsersController()
    ];
  }

  private initializeRoutes(): void {
    this.router.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString()
      });
    });

    // Register all controller routes
    this.controllers.forEach(controller => {
      const routePath = this.getRoutePath(controller.constructor.name);
      this.router.use(routePath, controller.router);
    });
  }

  private getRoutePath(controllerName: string): string {
    // Convert ControllerName to /controller-name
    return '/' + controllerName
      .replace('Controller', '')
      .replace(/([A-Z])/g, (match, letter) => `-${letter.toLowerCase()}`)
      .slice(1); // Remove leading dash
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new RouteManager().getRouter();