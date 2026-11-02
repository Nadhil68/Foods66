import { Application } from 'express';
export declare const globalLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Configure global security middlewares for the Express application.
 */
export declare const setupSecurityMiddlewares: (app: Application) => void;
//# sourceMappingURL=security.d.ts.map