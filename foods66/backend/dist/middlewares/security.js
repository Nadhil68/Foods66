import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
// Global Rate Limiter to prevent brute-force and DDoS attacks
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Stricter Rate Limiter for Authentication routes
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 auth requests per hour
    message: { error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Configure global security middlewares for the Express application.
 */
export const setupSecurityMiddlewares = (app) => {
    // Helmet sets secure HTTP headers (HSTS, NoSniff, XSS Filter, etc.)
    app.use(helmet());
    // Prevent NoSQL Injection by sanitizing incoming request bodies, queries, and params
    app.use(mongoSanitize());
    // Apply the global rate limiter
    app.use('/api/', globalLimiter);
    // Apply stricter rate limit to auth routes
    app.use('/api/users/login', authLimiter);
    app.use('/api/users/register', authLimiter);
};
//# sourceMappingURL=security.js.map