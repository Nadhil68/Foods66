import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DEFAULT_FIREBASE_CREDENTIALS_B64 } from './defaultCredentials';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

let appInstance: App | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export const initFirebase = () => {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    appInstance = existingApps[0];
    firestoreInstance = getAdminFirestore(appInstance);
    authInstance = getAdminAuth(appInstance);
    return {
      db: firestoreInstance,
      auth: authInstance,
    };
  }

  try {
    let credential;

    // Try multiple file locations for the service account key
    const possiblePaths = [
      path.join(_dirname, 'serviceAccountKey.json'),
      path.join(_dirname, '..', 'serviceAccountKey.json'),
      path.join(_dirname, '..', '..', 'serviceAccountKey.json'),
      path.join(process.cwd(), 'serviceAccountKey.json'),
      path.join(process.cwd(), 'backend', 'serviceAccountKey.json'),
    ];

    let fileLoaded = false;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const fileData = JSON.parse(fs.readFileSync(p, 'utf8'));
        credential = cert(fileData);
        console.log(`🔑 Firebase credentials loaded from file: ${p}`);
        fileLoaded = true;
        break;
      }
    }

    if (!fileLoaded && process.env.FIREBASE_SERVICE_ACCOUNT) {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = cert(parsed);
      console.log('🔑 Firebase credentials loaded from FIREBASE_SERVICE_ACCOUNT env var');
    } else if (!fileLoaded && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      credential = cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'foods66-3e9a5',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
      console.log('🔑 Firebase credentials loaded from individual env vars');
    } else if (!fileLoaded && DEFAULT_FIREBASE_CREDENTIALS_B64) {
      try {
        const decoded = Buffer.from(DEFAULT_FIREBASE_CREDENTIALS_B64, 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);
        credential = cert(parsed);
        console.log('🔑 Firebase credentials loaded from embedded default fallback');
      } catch (err: any) {
        console.error('⚠️ Could not parse embedded fallback credentials:', err.message);
      }
    }

    if (!credential) {
      console.error('❌ No Firebase credentials found! Set FIREBASE_SERVICE_ACCOUNT env var on Vercel.');
      throw new Error('Firebase credentials not configured. Set FIREBASE_SERVICE_ACCOUNT environment variable.');
    }

    appInstance = initializeApp({
      credential,
      projectId: 'foods66-3e9a5',
    });

    const db = getAdminFirestore(appInstance);
    db.settings({ ignoreUndefinedProperties: true, preferRest: true });

    firestoreInstance = db;
    authInstance = getAdminAuth(appInstance);

    console.log('🔥 Live Firebase Firestore connected successfully for project: foods66-3e9a5');
    return { db, auth: authInstance };
  } catch (error: any) {
    console.error('❌ Error initializing Firebase Admin:', error.message || error);
    throw error;
  }
};

export const getFirestore = (): Firestore => {
  if (!firestoreInstance) {
    const { db } = initFirebase();
    return db;
  }
  return firestoreInstance;
};

export const getFirebaseAuth = (): Auth => {
  if (!authInstance) {
    const { auth } = initFirebase();
    return auth;
  }
  return authInstance;
};

export default {
  initFirebase,
  getFirestore,
  getFirebaseAuth,
};
