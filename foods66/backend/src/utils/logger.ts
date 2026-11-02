/**
 * Structured logging utility for Foods66.
 * 
 * SECURITY: Never logs passwords, JWT tokens, API keys, or full payment credentials.
 * In production, stack traces and internal details are suppressed from responses.
 */

import { env } from '../config/envConfig';

type LogLevel = 'info' | 'warn' | 'error' | 'security';

interface LogEntry {
  level: LogLevel;
  event: string;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

/** Fields that must NEVER appear in logs */
const SENSITIVE_FIELDS = ['password', 'token', 'jwt', 'secret', 'apiKey', 'api_key', 'stripe', 'gemini'];

/**
 * Redact sensitive values from an object before logging.
 */
function redactSensitive(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(f => lowerKey.includes(f))) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      cleaned[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function createEntry(level: LogLevel, event: string, message: string, extra?: Record<string, unknown>): LogEntry {
  const entry: LogEntry = {
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
  info(event: string, message: string, extra?: Record<string, unknown>) {
    const entry = createEntry('info', event, message, extra);
    console.log(JSON.stringify(entry));
  },

  warn(event: string, message: string, extra?: Record<string, unknown>) {
    const entry = createEntry('warn', event, message, extra);
    console.warn(JSON.stringify(entry));
  },

  error(event: string, message: string, extra?: Record<string, unknown>) {
    const entry = createEntry('error', event, message, extra);
    // Include stack trace only in development
    if (env.isDevelopment && extra?.error instanceof Error) {
      (entry as any).stack = (extra.error as Error).stack;
    }
    console.error(JSON.stringify(entry));
  },

  /**
   * Security-specific logging for auth failures, authorization failures,
   * suspicious activity, etc.
   */
  security(event: string, message: string, extra?: Record<string, unknown>) {
    const entry = createEntry('security', event, message, extra);
    console.error(`🔒 SECURITY: ${JSON.stringify(entry)}`);
  },
};
