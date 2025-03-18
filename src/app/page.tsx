"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // If user is already logged in, redirect to dashboard
      // Using window.location for a hard redirect to ensure all state is properly refreshed
      window.location.href = "/dashboard";
    }
  }, [user, isLoading]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-white dark:from-slate-950 dark:to-slate-900">
      <main className="flex flex-col items-center max-w-5xl mx-auto text-center">
        <div className="mb-8">
          <Image 
            src="/vvg-logo.png" 
            alt="VVG Logo" 
            width={140} 
            height={140} 
            className="mx-auto"
            priority
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{color: '#000000'}}>
          VVG Demo
        </h1>
        
        <p className="text-xl mb-8 max-w-2xl text-gray-500 dark:text-gray-400">
          Secure event management and guest registration platform
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>User Portal</CardTitle>
              <CardDescription>For guests and event attendees</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Register for events, manage your profile, and get event QR codes for easy check-in.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/auth/login">Sign In / Register</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Portal</CardTitle>
              <CardDescription>For staff and organizers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage events, approve registrations, create user groups, and handle security access.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/admin/login">Admin Login</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Portal</CardTitle>
              <CardDescription>For security personnel</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Scan QR codes, verify attendees, and ensure secure access to events.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/security/login">Security Login</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="mt-16 text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} VVG. All rights reserved. | Demo Version
      </footer>
    </div>
  );
}