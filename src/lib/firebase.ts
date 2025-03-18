import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Import needed auth functions 
import { setPersistence, browserLocalPersistence, inMemoryPersistence } from "firebase/auth";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Configure auth persistence - this is critical for session management
if (typeof window !== "undefined") {
  // We're in the browser, so use local persistence
  // IMPORTANT: This needs to be called before any auth operations
  console.log("Setting Firebase auth persistence to browserLocalPersistence");
  
  // Create a more robust initialization approach
  const initPersistence = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      console.log("Firebase auth: Successfully set browser local persistence");
      
      // Check if we have an existing user after setting persistence
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log("Firebase auth: User already authenticated:", currentUser.uid);
      } else {
        console.log("Firebase auth: No user currently authenticated");
      }
    } catch (error) {
      console.error("Error setting auth persistence:", error);
    }
  };
  
  // Execute initialization
  initPersistence();
} else {
  // We're on the server, use in-memory persistence
  console.log("Server-side Firebase initialization with in-memory persistence");
  setPersistence(auth, inMemoryPersistence).catch((error) => {
    console.error("Error setting auth persistence:", error);
  });
}

const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics conditionally (browser-only)
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics };