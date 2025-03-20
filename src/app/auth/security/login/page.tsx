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
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8 hover-effect">
          <Image 
            src="/ntt-logo.svg" 
            alt="NTT Group Logo" 
            width={220} 
            height={130} 
            className="mx-auto mb-4"
            priority
          />
          <h1 className="text-2xl font-bold text-primary slide-up">Secure Events Security Portal</h1>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Security Staff Sign In</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your security credentials to access the verification system
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="security@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background border-input"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
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
                  className="bg-background border-input"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-accent transition-colors duration-200" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In as Security Staff"}
              </Button>
              <div className="text-center text-sm text-foreground">
                <Button asChild variant="secondary" size="sm" className="mt-2">
                  <Link href="/auth/login">
                    Return to regular login
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
      
      <div className="w-full mt-16 footer-gradient"></div>
      <footer className="w-full text-center py-4 text-sm text-muted-foreground">
        © {new Date().getFullYear()} NTT Group. All rights reserved. | Secure Events
      </footer>
    </div>
  );
}