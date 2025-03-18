"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { onAuthStateChange, getUserData } from "@/lib/auth";

type AuthContextType = {
  user: User | null;
  userData: any | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
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
              groups: [],
              preApprovedEvents: []
            });
          }
        }
      } else {
        setUserData(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);