"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

type AdminContextType = {
  isAdmin: boolean;
  isLoading: boolean;
};

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  isLoading: true,
});

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, userData, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);
      
      // First check if user is authenticated
      if (authLoading) {
        return; // Wait for auth to load
      }
      
      if (!user || !userData) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      
      // Check if user has admin role
      if (userData.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    };
    
    checkAdminStatus();
  }, [user, userData, authLoading]);
  
  return (
    <AdminContext.Provider value={{ isAdmin, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);

// Higher-order component to protect admin routes
export function withAdminProtection<T>(Component: React.ComponentType<T>) {
  return function ProtectedComponent(props: T) {
    const { isAdmin, isLoading } = useAdmin();
    const router = useRouter();
    
    useEffect(() => {
      if (!isLoading && !isAdmin) {
        router.push("/dashboard");
      }
    }, [isAdmin, isLoading, router]);
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    return isAdmin ? <Component {...props} /> : null;
  };
}