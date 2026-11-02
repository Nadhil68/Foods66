import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
export interface AuthRequest extends Request {
    user?: IUser;
}
/**
 * Middleware to verify JWT and attach user to request.
 *
 * SECURITY: JWT_SECRET is validated at startup via envConfig.ts.
 * No hardcoded fallback is ever used.
 */
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware for Role Based Access Control (RBAC)
 * @param roles Array of allowed roles
 */
export declare const authorize: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map