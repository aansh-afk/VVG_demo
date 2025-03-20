"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createUser } from "@/lib/auth";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (!photoFile) {
      toast.error("Please upload a photo");
      return;
    }
    
    setIsLoading(true);

    try {
      await createUser(email, password, displayName, photoFile);
      toast.success("Account created successfully");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8 hover-effect">
          <Image 
            src="/ntt-logo.svg" 
            alt="NTT Group Logo" 
            width={140} 
            height={80} 
            className="mx-auto mb-4"
            priority
          />
          <h1 className="text-2xl font-bold text-primary slide-up">Secure Events</h1>
        </div>

        <Card className="bg-card border-border slide-up">
          <CardHeader>
            <CardTitle className="text-foreground">Create an account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your details to register for the Secure Events platform
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="bg-background border-input"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background border-input"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
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
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background border-input"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="photo" className="text-sm font-medium text-foreground">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-20 h-20 border rounded-full flex items-center justify-center overflow-hidden bg-muted cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoPreview ? (
                      <Image 
                        src={photoPreview} 
                        alt="Profile preview" 
                        width={80} 
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-3xl text-muted-foreground">+</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      ref={fileInputRef}
                      id="photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                      required
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-primary text-primary hover:bg-secondary transition-colors duration-200"
                    >
                      Upload Photo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please upload a clear photo for identification
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground hover:bg-accent transition-colors duration-200" 
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
              <div className="text-center text-sm text-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:text-accent transition-colors duration-200">
                  Sign in
                </Link>
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