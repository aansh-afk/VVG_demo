"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signInAsAdmin } from "@/lib/auth";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await signInAsAdmin(email, password);
      console.log("Admin login successful, user:", user);
      
      // Show success message
      toast.success("Logged in as admin successfully");
      
      // Force a delay before redirect to ensure Firebase auth state is properly initialized
      setTimeout(() => {
        console.log("Redirecting to admin dashboard...");
        // Use a direct window redirect (not a Next.js navigation)
        window.location.href = "/admin/dashboard";
      }, 1000);
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast.error(error.message || "Failed to log in as admin");
      setIsLoading(false);
    }
    // We don't set isLoading to false here to avoid UI flicker during redirect
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-white dark:bg-black">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8 hover-effect">
          <Image 
            src="/vvg-logo.svg" 
            alt="VVG Logo" 
            width={100} 
            height={100} 
            className="mx-auto mb-4"
            priority
          />
          <h1 className="text-2xl font-bold text-black dark:text-white slide-up">VVG Admin Portal</h1>
        </div>

        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">Admin Sign In</CardTitle>
            <CardDescription className="text-gray-700 dark:text-gray-400">
              Enter your admin credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Link href="/auth/forgot-password" className="text-xs text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In as Admin"}
              </Button>
              <div className="text-center text-sm">
                <Link href="/auth/login" className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 hover:underline">
                  Return to regular login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
      
      <div className="w-full mt-16 footer-gradient"></div>
      <footer className="w-full text-center py-4 text-sm text-gray-700 dark:text-gray-300">
        © {new Date().getFullYear()} VVG. All rights reserved. | Demo Version
      </footer>
    </div>
  );
}