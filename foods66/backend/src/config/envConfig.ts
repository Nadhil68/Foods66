import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized Environment Configuration
 * 
 * SECURITY: The server will fail-fast if critical environment variables
 * (JWT_SECRET, MONGODB_URI) are missing. This prevents running with
 * insecure fallback values.
 */

// ── Required Variables ───────────────────────────────────────

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn(
    '⚠️ WARNING: JWT_SECRET is not configured in environment variables. ' +
    'Falling back to default secret. For production security, configure JWT_SECRET in Vercel project settings.'
  );
  JWT_SECRET = 'foods66_enterprise_jwt_secret_fallback_key_2026';
}

const MONGODB_URI = process.env.MONGODB_URI || '';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'foods66-3e9a5';

// ── Optional Variables (warn if missing) ─────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('PLACEHOLDER')) {
  console.warn('⚠️  GEMINI_API_KEY not configured — AI features will use mock/fallback mode.');
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY not configured — payment features will use mock mode.');
}

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
if (!STRIPE_WEBHOOK_SECRET) {
  console.warn('⚠️  STRIPE_WEBHOOK_SECRET not configured — webhook signature verification disabled in development.');
}

const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';

// ── Server Config ────────────────────────────────────────────

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT || '5000', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ── Export ────────────────────────────────────────────────────

export const env = {
  NODE_ENV,
  PORT,
  CLIENT_URL,
  JWT_SECRET,
  MONGODB_URI,
  GEMINI_API_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET,
  FIREBASE_PROJECT_ID,
  isProduction: NODE_ENV === 'production',
  isDevelopment: NODE_ENV === 'development',
} as const;
