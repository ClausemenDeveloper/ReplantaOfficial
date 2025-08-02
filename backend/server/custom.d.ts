declare module "./routes/demo.js" {
  import type { Request, Response, NextFunction } from "express";
  export function handleDemo(req: Request, res: Response, next: NextFunction): void;
}

declare module "./config/database.js" {
  import type { DatabaseService } from "./index";
  const db: DatabaseService;
  export default db;
}

declare module "./routes/auth.js" {
  import type { Request, Response, NextFunction } from "express";
  function handler(req: Request, res: Response, next: NextFunction): void;
  export default handler;
}

declare module "./routes/notifications.js" {
  import type { Router } from "express";
  const router: Router;
  export default router;
}

declare module "./fallback/memoryStore.js" {
  import type { DatabaseService } from "./index";
  const memoryStore: DatabaseService;
  export default memoryStore;
}

declare module "./routes/auth.js" {
  import type { Router } from "express";
  const router: Router;
  export default router;
}

declare module "./models/User.js" {
  export interface IUserData {
    name: string;
    email: string;
    password: string;
    role: string;
    emailVerified: boolean;
    isActive: boolean;
  }
  export interface IUser {
    save(): Promise<any>;
  update(data: Partial<IUserData>): Promise<IUser>;
  deactivate(): Promise<void>;
  activate(): Promise<void>;
    comparePassword(password: string): Promise<boolean>;
    toJSON(): IUserData;
  }
  export interface UserConstructor {
    findOne(query: { email: string }): Promise<IUser | null>;
    new (data: IUserData): IUser;
  }
  const User: UserConstructor;
  export default User;
}