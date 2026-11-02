/**
 * Structured logging utility for Foods66.
 *
 * SECURITY: Never logs passwords, JWT tokens, API keys, or full payment credentials.
 * In production, stack traces and internal details are suppressed from responses.
 */
export declare const logger: {
    info(event: string, message: string, extra?: Record<string, unknown>): void;
    warn(event: string, message: string, extra?: Record<string, unknown>): void;
    error(event: string, message: string, extra?: Record<string, unknown>): void;
    /**
     * Security-specific logging for auth failures, authorization failures,
     * suspicious activity, etc.
     */
    security(event: string, message: string, extra?: Record<string, unknown>): void;
};
//# sourceMappingURL=logger.d.ts.map