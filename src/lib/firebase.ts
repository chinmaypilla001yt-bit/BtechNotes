/* ------------------------------------------------------------------ *
 * FIREBASE CONFIGURATION
 * ------------------------------------------------------------------
 * Replace these values with your own Firebase project's credentials.
 * The recommended way is to create a `.env` file (see `.env.example`)
 * with the VITE_FIREBASE_* variables. You can also paste the values
 * directly into the fallbacks below.
 * ------------------------------------------------------------------ */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

function configuredValue(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized && !normalized.startsWith("YOUR_") ? normalized : fallback;
}

export const firebaseConfig = {
  apiKey: configuredValue(import.meta.env['VITE_FIREBASE_API_KEY'], "AIzaSyBxALOdDrswHqmiFURQLWOsMcNJ3wzR7kU"),
  authDomain: configuredValue(import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'], "studyforge-01.firebaseapp.com"),
  projectId: configuredValue(import.meta.env['VITE_FIREBASE_PROJECT_ID'], "studyforge-01"),
  storageBucket: configuredValue(import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'], "studyforge-01.firebasestorage.app"),
  messagingSenderId: configuredValue(import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'], "1053802488820"),
  appId: configuredValue(import.meta.env['VITE_FIREBASE_APP_ID'], "1:1053802488820:web:a4dc9b42ddb70673a68fa1"),
};


/** True only when every config value has been replaced with a real value. */
export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.length > 0 && !value.startsWith("YOUR_"),
);

/** Maximum upload size (bytes). Change freely. */
export const MAX_FILE_SIZE = Number(import.meta.env['VITE_MAX_FILE_SIZE_MB'] || 25) * 1024 * 1024;

class FirebaseNotConfiguredError extends Error {
  constructor() {
    super("Firebase is not configured yet. Add your credentials to the .env file.");
    this.name = "FirebaseNotConfiguredError";
  }
}

let app: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) throw new FirebaseNotConfiguredError();
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export const getFirebaseAuth = (): Auth => getAuth(getFirebaseApp());
export const getDb = (): Firestore => getFirestore(getFirebaseApp());
export const getFirebaseStorage = (): FirebaseStorage => getStorage(getFirebaseApp());
export const googleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
};
