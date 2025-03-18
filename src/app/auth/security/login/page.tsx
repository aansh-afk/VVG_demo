"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signInAsSecurity } from "@/lib/auth";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SecurityLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await signInAsSecurity(email, password);
      console.log("Security login successful, user:", user);
      
      // Show success message
      toast.success("Logged in as security staff successfully");
      
      // Force a delay before redirect to ensure Firebase auth state is properly initialized
      setTimeout(() => {
        console.log("Redirecting to security dashboard...");
        // Use a direct window redirect (not a Next.js navigation)
        window.location.href = "/security/dashboard";
      }, 1000);
    } catch (error: any) {
      console.error("Security login error:", error);
      
      // Display specific error messages based on error code
      if (error.message.includes("User is not a security staff member")) {
        toast.error("Access denied: You are not authorized as security staff");
      } else if (error.message.includes("auth/invalid-credential")) {
        toast.error("Invalid email or password");
      } else if (error.message.includes("auth/invalid-email")) {
        toast.error("Invalid email format");
      } else if (error.message.includes("auth/too-many-requests")) {
        toast.error("Too many attempts. Please try again later");
      } else {
        toast.error(error.message || "Failed to log in as security staff");
      }
      
      setIsLoading(false);
    }
    // We don't set isLoading to false here to avoid UI flicker during redirect
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-white dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image 
            src="/vvg-logo.png" 
            alt="VVG Logo" 
            width={100} 
            height={100} 
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-black dark:text-white">VVG Security Portal</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Security Staff Sign In</CardTitle>
            <CardDescription>
              Enter your security credentials to access the verification system
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
                  placeholder="security@example.com"
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
                {isLoading ? "Signing in..." : "Sign In as Security Staff"}
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
    </div>
  );
}