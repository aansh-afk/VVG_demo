"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { onAuthStateChange, getUserData, UserData } from "@/lib/auth";

type AuthContextType = {
  user: User | null;
  userData: UserData | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip auth during build/SSR to prevent errors
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return () => {};
    }

    // Safe version for client-side execution
    let unsubscribe: () => void;
    try {
      unsubscribe = onAuthStateChange(async (authUser) => {
        setIsLoading(true);
        setUser(authUser);
        
        if (authUser) {
          try {
            const userDataResult = await getUserData(authUser.uid);
            setUserData(userDataResult);
          } catch (error) {
            console.error("Error fetching user data:", error);
            // If user document is not found, still allow authentication to proceed
            // but with empty user data
            if (error instanceof Error && error.message === "User document not found") {
              setUserData({
                uid: authUser.uid,
                email: authUser.email,
                displayName: authUser.displayName || "",
                photoURL: authUser.photoURL || "",
                createdAt: new Date(),
                groups: [],
                preApprovedEvents: [],
                role: 'user'
              });
            }
          }
        } else {
          setUserData(null);
        }
        
        setIsLoading(false);
      });
    } catch (error) {
      console.warn("Auth initialization error (this is normal during build):", error);
      setIsLoading(false);
      return () => {};
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);