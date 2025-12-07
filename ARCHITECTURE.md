# Scalable Architecture Guide

This project follows a scalable, modular architecture pattern for Express.js with TypeORM.

## Architecture Overview

### Core Components

1. **Base Controller** (`src/common/base.controller.ts`)
   - Provides common functionality for all controllers
   - Standardized response methods
   - Async route error handling

2. **Centralized Routing** (`src/routes/index.ts`)
   - Auto-registers controllers based on naming convention
   - Provides health check endpoint
   - Route path generation from controller names

3. **Middleware Layer**
   - **Error Handling**: Global error handler with custom AppError class
   - **Validation**: Schema-based request validation
   - **Authentication**: (Ready to be added)

4. **Service Layer Pattern**
   - Business logic separated from controllers
   - Repository pattern with TypeORM
   - Proper error handling and validation

## File Structure

```
src/
├── common/
│   ├── base.controller.ts     # Base controller with common methods
│   └── interfaces.ts          # Common interfaces and types
├── middleware/
│   ├── error.middleware.ts    # Global error handling
│   └── validation.middleware.ts # Request validation
├── routes/
│   └── index.ts              # Centralized route management
├── users/                    # Example module
│   ├── user.entity.ts        # TypeORM entity
│   ├── users.controller.ts   # Controller implementation
│   ├── users.service.ts      # Business logic
│   └── users.dto.ts          # Data transfer objects
├── app.ts                    # Express app configuration
└── server.ts                 # Server startup
```

## Adding New Modules

### 1. Create Entity
```typescript
// src/products/product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column('decimal')
  price!: number;
}
```

### 2. Create DTOs
```typescript
// src/products/products.dto.ts
export interface CreateProductDto {
  name: string;
  price: number;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
}
```

### 3. Create Service
```typescript
// src/products/products.service.ts
import { AppDataSource } from "../config/data-source";
import { Product } from "./product.entity";
import { CreateProductDto, UpdateProductDto } from "./products.dto";
import { AppError } from "../middleware/error.middleware";

export class ProductsService {
  private productRepository = AppDataSource.getRepository(Product);

  async getAllProducts(): Promise<Product[]> {
    return await this.productRepository.find();
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(dto);
    return await this.productRepository.save(product);
  }

  // Add other CRUD methods...
}
```

### 4. Create Controller
```typescript
// src/products/products.controller.ts
import { Router, Request, Response } from "express";
import { BaseController } from "../common/base.controller";
import { IController } from "../common/interfaces";
import { ProductsService } from "./products.service";
import { validateBody, ValidationSchema } from "../middleware/validation.middleware";

export class ProductsController extends BaseController implements IController {
  public router: Router;
  private productsService: ProductsService;

  constructor() {
    super();
    this.router = Router();
    this.productsService = new ProductsService();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get("/", this.handleAsyncRoute(this.getProducts));
    this.router.post("/", validateBody(this.createProductValidation), this.handleAsyncRoute(this.createProduct));
  }

  private createProductValidation: ValidationSchema = {
    name: { required: true, type: "string", minLength: 1, maxLength: 100 },
    price: { required: true, type: "number", min: 0 }
  };

  private getProducts = async (_req: Request, res: Response): Promise<void> => {
    const products = await this.productsService.getAllProducts();
    this.sendSuccess(res, products, "Products retrieved successfully");
  };

  private createProduct = async (req: Request, res: Response): Promise<void> => {
    const product = await this.productsService.createProduct(req.body);
    this.sendCreated(res, product, "Product created successfully");
  };
}
```

### 5. Register in Routes
```typescript
// Update src/routes/index.ts - add to initializeControllers():
this.controllers = [
  new UsersController(),
  new ProductsController()  // Auto-registered as /api/products
];
```

### 6. Update Entity Registration
```typescript
// Update src/config/data-source.ts
entities: [User, Product],
```

## Features

### Automatic Route Registration
Controllers are automatically registered based on their class names:
- `UsersController` → `/api/users`
- `ProductsController` → `/api/products`
- `OrderItemsController` → `/api/order-items`

### Standardized Responses
All responses follow a consistent format:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

### Error Handling
- Custom `AppError` class for operational errors
- Global error handler with proper HTTP status codes
- Validation error formatting
- Development vs production error details

### Validation
- Schema-based request validation
- Type checking (string, number, email, etc.)
- Length and range validation
- Pattern matching support

## Best Practices

1. **Controllers**: Keep thin, delegate to services
2. **Services**: Handle business logic and data access
3. **Entities**: Keep focused on data structure
4. **DTOs**: Define clear input/output contracts
5. **Error Handling**: Use AppError for operational errors
6. **Validation**: Define schemas close to route handlers

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Health Check
- `GET /api/health` - API health status

## Environment Variables

- `NODE_ENV` - Controls error detail level in responses
- Database configuration in `src/config/data-source.ts`