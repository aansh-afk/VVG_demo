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
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-white dark:bg-slate-900">
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
        
        <p className="text-xl mb-8 max-w-2xl text-gray-700 dark:text-gray-300">
          Secure event management and guest registration platform
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-black">User Portal</CardTitle>
              <CardDescription className="text-gray-700">For guests and event attendees</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Register for events, manage your profile, and get event QR codes for easy check-in.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-black text-white hover:bg-gray-800">
                <Link href="/auth/login">Sign In / Register</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-black">Admin Portal</CardTitle>
              <CardDescription className="text-gray-700">For staff and organizers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Manage events, approve registrations, create user groups, and handle security access.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full border-black text-black hover:bg-gray-100">
                <Link href="/auth/admin/login">Admin Login</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-black">Security Portal</CardTitle>
              <CardDescription className="text-gray-700">For security personnel</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Scan QR codes, verify attendees, and ensure secure access to events.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full border-black text-black hover:bg-gray-100">
                <Link href="/auth/security/login">Security Login</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="mt-16 text-sm text-gray-700 dark:text-gray-300">
        © {new Date().getFullYear()} VVG. All rights reserved. | Demo Version
      </footer>
    </div>
  );
}