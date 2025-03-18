import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

// Types for our collections
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp;
  groups: string[];
  preApprovedEvents: string[];
  role?: 'user' | 'admin' | 'security';
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  preApprovedEvents: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  datetime: Timestamp;
  location: string;
  capacity: number;
  requiresApproval: boolean;
  preApprovedGroups: string[];
  preApprovedUsers: string[];
  attendees: string[];
}

export interface ApprovalRequest {
  id: string;
  eventId: string;
  userId: string;
  status: "pending" | "approved" | "denied";
  requestedAt: Timestamp;
  processedAt: Timestamp | null;
  processedBy: string | null;
}

export interface SecurityStaff {
  uid: string;
  email: string;
  displayName: string;
  assignedEvents: string[];
}

// Generic function to add a document to a collection
export const addDocument = async <T extends DocumentData>(
  collectionName: string, 
  data: T
) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to update a document
export const updateDocument = async <T extends Partial<DocumentData>>(
  collectionName: string, 
  docId: string, 
  data: T
) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to delete a document
export const deleteDocument = async (
  collectionName: string, 
  docId: string
) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to get a document by ID
export const getDocument = async <T>(
  collectionName: string, 
  docId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to query documents
export const queryDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  try {
    const collectionRef = collection(db, collectionName);
    const q = constraints.length > 0 
      ? query(collectionRef, ...constraints) 
      : query(collectionRef);
    
    const querySnapshot = await getDocs(q);
    const documents: T[] = [];
    
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() } as T);
    });
    
    return documents;
  } catch (error) {
    console.error(`Error querying documents from ${collectionName}:`, error);
    throw error;
  }
};

// Event-specific functions
export const getEvents = async () => {
  return queryDocuments<Event>("events");
};

export const getUserApprovedEvents = async (userId: string) => {
  return queryDocuments<Event>("events", [
    where("preApprovedUsers", "array-contains", userId)
  ]);
};

export const getGroupApprovedEvents = async (groupIds: string[]) => {
  if (groupIds.length === 0) return [];
  
  return queryDocuments<Event>("events", [
    where("preApprovedGroups", "array-contains-any", groupIds)
  ]);
};

// Approval request functions
export const getUserApprovalRequests = async (userId: string) => {
  return queryDocuments<ApprovalRequest>("approvalRequests", [
    where("userId", "==", userId)
  ]);
};

export const getPendingApprovalRequests = async () => {
  return queryDocuments<ApprovalRequest>("approvalRequests", [
    where("status", "==", "pending")
  ]);
};

// Group functions
export const getUserGroups = async (userId: string) => {
  return queryDocuments<Group>("groups", [
    where("members", "array-contains", userId)
  ]);
};