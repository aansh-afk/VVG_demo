"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add preloader
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      // If user is already logged in, redirect to dashboard
      // Using window.location for a hard redirect to ensure all state is properly refreshed
      window.location.href = "/dashboard";
    }
  }, [user, isLoading]);

  return (
    <>
      {/* Preloader */}
      <div className={`preloader ${!loading ? 'loaded' : ''}`}>
        <div className="preloader-spinner"></div>
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <main className="flex flex-col items-center max-w-5xl mx-auto text-center fade-in">
          <div className="mb-8 hover-effect">
            <Image 
              src="/ntt-logo.svg" 
              alt="NTT Group Logo" 
              width={280} 
              height={160} 
              className="mx-auto"
              priority
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-primary slide-up">
            Secure Events
          </h1>
          
          <p className="text-xl mb-8 max-w-2xl text-muted-foreground slide-up" style={{animationDelay: '0.1s'}}>
            Secure event management and guest registration platform by NTT Group
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <Card className="hover-effect border-border bg-card-lighter" style={{animationDelay: '0.2s'}}>
              <CardHeader>
                <CardTitle className="text-foreground">User Portal</CardTitle>
                <CardDescription className="text-muted-foreground">For guests and attendees</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Register for events, manage your profile, and get event QR codes for easy check-in.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-accent transition-all duration-200">
                  <Link href="/auth/login">Sign In / Register</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover-effect border-border bg-card-lighter" style={{animationDelay: '0.3s'}}>
              <CardHeader>
                <CardTitle className="text-foreground">Admin Portal</CardTitle>
                <CardDescription className="text-muted-foreground">For staff and organizers</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage events, approve registrations, create user groups, and handle security access.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-secondary transition-all duration-200">
                  <Link href="/auth/admin/login">Admin Login</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover-effect border-border bg-card-lighter" style={{animationDelay: '0.4s'}}>
              <CardHeader>
                <CardTitle className="text-foreground">Security Portal</CardTitle>
                <CardDescription className="text-muted-foreground">For security personnel</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Scan QR codes, verify attendees, and ensure secure access to events.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-secondary transition-all duration-200">
                  <Link href="/auth/security/login">Security Login</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>

        <div className="w-full mt-16 footer-gradient"></div>
        <footer className="w-full text-center py-4 text-sm text-muted-foreground">
          © {new Date().getFullYear()} NTT Group. All rights reserved. | Secure Events
        </footer>
      </div>
    </>
  );
}