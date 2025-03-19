import { initializeApp, getApps } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

// Default dummy config for build time
const dummyConfig = {
  apiKey: "dummy-api-key",
  authDomain: "dummy-project.firebaseapp.com",
  projectId: "dummy-project",
  storageBucket: "dummy-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
  measurementId: "G-00000000"
};

// Use real config if environment variables are available, otherwise use dummy config for build
const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
} : dummyConfig;

// Import needed auth functions 
import { setPersistence, browserLocalPersistence, inMemoryPersistence } from "firebase/auth";

// Initialize Firebase - safely handle both browser and build environments
let app;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

// Only initialize Firebase if we're in a browser or if we have valid config
try {
  // Initialize Firebase
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Configure auth persistence - only in browser and only when actually needed
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "development") {
    // We're in the browser in production, so use local persistence
    const initPersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error("Error setting auth persistence:", error);
      }
    };
    
    // Execute initialization
    initPersistence();
  } else if (typeof window === "undefined") {
    // We're on the server, use in-memory persistence
    // No need to actually set persistence during build/SSR
  }

  // Initialize Analytics conditionally (browser-only)
  if (typeof window !== "undefined") {
    // Make analytics initialization async
    const initAnalytics = async () => {
      try {
        const supported = await isSupported();
        if (supported) {
          analytics = getAnalytics(app);
        }
      } catch (error) {
        // Silently ignore analytics errors
      }
    };
    
    initAnalytics();
  }
} catch (error) {
  // Provide fallbacks for build time when Firebase might not initialize properly
  console.warn("Firebase initialization error (this is normal during build):", error);
  
  // Create empty stubs for build time to prevent errors
  if (!app) app = { name: "[DEFAULT]" };
  if (!auth) auth = { currentUser: null, onAuthStateChanged: () => () => {} } as unknown as Auth;
  if (!db) db = {} as unknown as Firestore;
  if (!storage) storage = {} as unknown as FirebaseStorage;
}

export { app, auth, db, storage, analytics };