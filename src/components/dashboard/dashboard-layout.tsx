"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, userData } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "home" },
    { name: "Events", href: "/dashboard/events", icon: "calendar" },
    { name: "My Registrations", href: "/dashboard/registrations", icon: "check-square" },
    { name: "QR Codes", href: "/dashboard/qr-codes", icon: "qrcode" },
    { name: "Profile", href: "/dashboard/profile", icon: "user" },
  ];

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-slate-800 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <Image src="/vvg-icon.png" alt="VVG Logo" width={40} height={40} />
          <h1 className="ml-2 font-semibold">VVG Demo</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-600 dark:text-slate-300"
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          )}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-800 shadow-md z-20 absolute top-16 inset-x-0">
          <div className="flex flex-col p-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center py-3 px-4 rounded-md ${
                  isActive(item.href)
                    ? "bg-slate-100 dark:bg-slate-700 text-black dark:text-white font-medium"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            ))}
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar (desktop) */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center justify-center flex-shrink-0 px-4 mb-5">
              <Image src="/vvg-icon.png" alt="VVG Logo" width={50} height={50} />
              <h1 className="ml-2 text-lg font-semibold">VVG Demo</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? "bg-slate-100 dark:bg-slate-700 text-black dark:text-white font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center w-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                <AvatarFallback>{user?.displayName ? getInitials(user.displayName) : "U"}</AvatarFallback>
              </Avatar>
              <div className="ml-3 min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {user?.displayName || "User"}
                </div>
                <Button 
                  variant="ghost" 
                  className="text-xs text-black dark:text-white p-0 h-auto hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={handleSignOut}
                >
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}