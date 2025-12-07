import { AppDataSource } from "../config/data-source";
import { User } from "./user.entity";
import { CreateUserDto, UpdateUserDto } from "./users.dto";
import { AppError } from "../middleware/error.middleware";

export class UsersService {
  private userRepository = AppDataSource.getRepository(User);

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find({
      order: { id: 'ASC' }
    });
  }

  async getUserById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id }
    });
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    const user = this.userRepository.create(dto);
    return await this.userRepository.save(user);
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<User | null> {
    // Check if user exists
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      return null;
    }

    // Check if email is being updated and if it conflicts with another user
    if (dto.email && dto.email !== existingUser.email) {
      const emailConflict = await this.userRepository.findOne({
        where: { email: dto.email }
      });
      
      if (emailConflict) {
        throw new AppError("User with this email already exists", 409);
      }
    }

    // Update only provided fields
    Object.assign(existingUser, dto);
    return await this.userRepository.save(existingUser);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
