import { db } from "./firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";
import { Event } from "./firestore";

// Create a new event
export const createEvent = async (eventData: Omit<Event, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "events"), {
      ...eventData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

// Update an existing event
export const updateEvent = async (
  eventId: string, 
  eventData: Partial<Omit<Event, 'id'>>
): Promise<void> => {
  try {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const eventRef = doc(db, "events", eventId);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

// Get a single event by ID
export const getEvent = async (eventId: string): Promise<Event | null> => {
  try {
    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (eventSnap.exists()) {
      return { id: eventSnap.id, ...eventSnap.data() } as Event;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting event:", error);
    throw error;
  }
};

// Format date string for datetime-local input
export const formatDateForInput = (timestamp: Timestamp | null): string => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Parse date string from datetime-local input to Timestamp
export const parseInputToTimestamp = (dateTimeString: string): Timestamp => {
  if (!dateTimeString) {
    return Timestamp.now();
  }
  
  const date = new Date(dateTimeString);
  return Timestamp.fromDate(date);
};