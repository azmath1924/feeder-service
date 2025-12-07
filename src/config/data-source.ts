import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../users/user.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "feeds-db",
    synchronize: process.env.NODE_ENV !== "production", // Only sync in development
    logging: process.env.NODE_ENV === "development",
    entities: [User],
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    connectTimeoutMS: 10000,
    extra: {
        max: 10, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
        connectionTimeoutMillis: 2000, // How long to wait when connecting to PostgreSQL
    }
});
