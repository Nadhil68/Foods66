/**
 * Structured logging utility for Foods66.
 *
 * SECURITY: Never logs passwords, JWT tokens, API keys, or full payment credentials.
 * In production, stack traces and internal details are suppressed from responses.
 */
import { env } from '../config/envConfig';
/** Fields that must NEVER appear in logs */
const SENSITIVE_FIELDS = ['password', 'token', 'jwt', 'secret', 'apiKey', 'api_key', 'stripe', 'gemini'];
/**
 * Redact sensitive values from an object before logging.
 */
function redactSensitive(data) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_FIELDS.some(f => lowerKey.includes(f))) {
            cleaned[key] = '[REDACTED]';
        }
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            cleaned[key] = redactSensitive(value);
        }
        else {
            cleaned[key] = value;
        }
    }
    return cleaned;
}
function createEntry(level, event, message, extra) {
    const entry = {
        level,
        event,
        message,
        timestamp: new Date().toISOString(),
    };
    if (extra) {
        Object.assign(entry, redactSensitive(extra));
    }
    return entry;
}
export const logger = {
    info(event, message, extra) {
        const entry = createEntry('info', event, message, extra);
        console.log(JSON.stringify(entry));
    },
    warn(event, message, extra) {
        const entry = createEntry('warn', event, message, extra);
        console.warn(JSON.stringify(entry));
    },
    error(event, message, extra) {
        const entry = createEntry('error', event, message, extra);
        // Include stack trace only in development
        if (env.isDevelopment && extra?.error instanceof Error) {
            entry.stack = extra.error.stack;
        }
        console.error(JSON.stringify(entry));
    },
    /**
     * Security-specific logging for auth failures, authorization failures,
     * suspicious activity, etc.
     */
    security(event, message, extra) {
        const entry = createEntry('security', event, message, extra);
        console.error(`🔒 SECURITY: ${JSON.stringify(entry)}`);
    },
};
//# sourceMappingURL=logger.js.map