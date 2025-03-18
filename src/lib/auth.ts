import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User
} from "firebase/auth";
import { auth, storage, db } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc, serverTimestamp, DocumentData } from "firebase/firestore";

// Define UserData interface
export interface UserData {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string;
  createdAt: Date;
  groups: string[];
  preApprovedEvents: string[];
  role?: 'admin' | 'security' | 'user';
}

// Create a new user with email and password
export const createUser = async (email: string, password: string, displayName: string, photoFile: File) => {
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Upload the profile photo to Storage
    const photoRef = ref(storage, `profile-photos/${user.uid}`);
    const uploadResult = await uploadBytes(photoRef, photoFile);
    const photoURL = await getDownloadURL(uploadResult.ref);
    
    // Update the user profile with display name and photo URL
    await updateProfile(user, {
      displayName,
      photoURL,
    });
    
    // Create a user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      displayName,
      photoURL,
      createdAt: serverTimestamp(),
      groups: [],
      preApprovedEvents: [],
      role: 'user' // Default role
    });
    
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Set a session cookie for middleware to detect
    if (typeof document !== 'undefined') {
      document.cookie = "session=true; path=/; max-age=86400";
    }
    
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    // Sign out from Firebase
    await firebaseSignOut(auth);
    
    // Clear session cookie
    if (typeof document !== 'undefined') {
      document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Get current user data from Firestore
export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    } else {
      // Get user information from Firebase Auth
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Create a new user document in Firestore
        const userData: UserData = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || "",
          photoURL: currentUser.photoURL || "",
          createdAt: new Date(),
          groups: [],
          preApprovedEvents: [],
          role: 'user' // Default role
        };
        
        try {
          // Attempt to create the missing user document
          await setDoc(doc(db, "users", userId), userData);
          console.log("Created missing user document for:", userId);
          return userData;
        } catch (createError) {
          console.error("Error creating missing user document:", createError);
          throw new Error("Failed to create missing user document");
        }
      } else {
        throw new Error("User document not found and no authenticated user");
      }
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
};

// Auth state observer function
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Check if a user has admin role
export const checkAdminRole = async (userId: string): Promise<boolean> => {
  try {
    const userData = await getUserData(userId);
    return userData?.role === 'admin';
  } catch (error) {
    console.error("Error checking admin role:", error);
    return false;
  }
};

// Check if a user has security role
export const checkSecurityRole = async (userId: string): Promise<boolean> => {
  try {
    const userData = await getUserData(userId);
    return userData?.role === 'security';
  } catch (error) {
    console.error("Error checking security role:", error);
    return false;
  }
};

// Sign in as admin with email and password
export const signInAsAdmin = async (email: string, password: string) => {
  try {
    // First authenticate the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Then check if they have admin role
    const isAdmin = await checkAdminRole(user.uid);
    
    if (!isAdmin) {
      // If not admin, sign out and throw error
      await signOut();
      throw new Error("Access denied: User is not an admin");
    }
    
    // Set a session cookie for middleware to detect
    if (typeof document !== 'undefined') {
      document.cookie = "session=true; path=/; max-age=86400";
      document.cookie = "admin=true; path=/; max-age=86400";
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in as admin:", error);
    throw error;
  }
};

// Sign in as security staff with email and password
export const signInAsSecurity = async (email: string, password: string) => {
  try {
    // First authenticate the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Then check if they have security role
    const isSecurity = await checkSecurityRole(user.uid);
    
    if (!isSecurity) {
      // If not security, sign out and throw error
      await signOut();
      throw new Error("Access denied: User is not a security staff member");
    }
    
    // Set a session cookie for middleware to detect
    if (typeof document !== 'undefined') {
      document.cookie = "session=true; path=/; max-age=86400";
      document.cookie = "security=true; path=/; max-age=86400";
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in as security staff:", error);
    throw error;
  }
};