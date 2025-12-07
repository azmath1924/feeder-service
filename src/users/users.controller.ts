import { Router, Request, Response } from "express";
import { BaseController } from "../common/base.controller";
import { IController } from "../common/interfaces";
import { UsersService } from "./users.service";
import { validateBody, ValidationSchema } from "../middleware/validation.middleware";
import { AppError } from "../middleware/error.middleware";

export class UsersController extends BaseController implements IController {
  public router: Router;
  private usersService: UsersService;

  constructor() {
    super();
    this.router = Router();
    this.usersService = new UsersService();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get("/", this.handleAsyncRoute(this.getUsers));
    this.router.get("/:id", this.handleAsyncRoute(this.getUserById));
    this.router.post("/", validateBody(this.createUserValidation), this.handleAsyncRoute(this.createUser));
    this.router.put("/:id", validateBody(this.updateUserValidation), this.handleAsyncRoute(this.updateUser));
    this.router.delete("/:id", this.handleAsyncRoute(this.deleteUser));
  }

  private createUserValidation: ValidationSchema = {
    firstName: { required: true, type: "string", minLength: 2, maxLength: 50 },
    lastName: { required: true, type: "string", minLength: 2, maxLength: 50 },
    email: { required: true, type: "email", maxLength: 255 }
  };

  private updateUserValidation: ValidationSchema = {
    firstName: { type: "string", minLength: 2, maxLength: 50 },
    lastName: { type: "string", minLength: 2, maxLength: 50 },
    email: { type: "email", maxLength: 255 }
  };

  private getUsers = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.usersService.getAllUsers();
    this.sendSuccess(res, users, "Users retrieved successfully");
  };

  private getUserById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      throw new AppError("Invalid user ID", 400);
    }

    const user = await this.usersService.getUserById(Number(id));
    
    if (!user) {
      throw new AppError("User not found", 404);
    }

    this.sendSuccess(res, user, "User retrieved successfully");
  };

  private createUser = async (req: Request, res: Response): Promise<void> => {
    const user = await this.usersService.createUser(req.body);
    this.sendCreated(res, user, "User created successfully");
  };

  private updateUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      throw new AppError("Invalid user ID", 400);
    }

    const user = await this.usersService.updateUser(Number(id), req.body);
    
    if (!user) {
      throw new AppError("User not found", 404);
    }

    this.sendSuccess(res, user, "User updated successfully");
  };

  private deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      throw new AppError("Invalid user ID", 400);
    }

    const deleted = await this.usersService.deleteUser(Number(id));
    
    if (!deleted) {
      throw new AppError("User not found", 404);
    }

    this.sendNoContent(res, "User deleted successfully");
  };
}
