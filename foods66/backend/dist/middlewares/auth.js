import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/envConfig';
import { logger } from '../utils/logger';
/**
 * Middleware to verify JWT and attach user to request.
 *
 * SECURITY: JWT_SECRET is validated at startup via envConfig.ts.
 * No hardcoded fallback is ever used.
 */
export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            // Verify token
            const decoded = jwt.verify(token, env.JWT_SECRET);
            // Get user from the token
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                logger.security('AUTH_USER_NOT_FOUND', 'Token valid but user not found in database', { decodedId: decoded.id });
                res.status(401).json({ success: false, message: 'Not authorized, user not found', code: 'USER_NOT_FOUND' });
                return;
            }
            req.user = user;
            next();
            return;
        }
        catch (error) {
            logger.security('AUTH_TOKEN_FAILED', 'JWT verification failed', { ip: req.ip });
            res.status(401).json({ success: false, message: 'Not authorized, token failed', code: 'TOKEN_INVALID' });
            return;
        }
    }
    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token', code: 'NO_TOKEN' });
    }
};
/**
 * Middleware for Role Based Access Control (RBAC)
 * @param roles Array of allowed roles
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            logger.security('AUTHORIZATION_DENIED', `Role '${req.user?.role}' denied access`, {
                userId: req.user?._id?.toString(),
                requiredRoles: roles,
                path: req.originalUrl,
            });
            res.status(403).json({
                success: false,
                message: `User role '${req.user?.role}' is not authorized to access this route`,
                code: 'FORBIDDEN'
            });
            return;
        }
        next();
    };
};
//# sourceMappingURL=auth.js.map