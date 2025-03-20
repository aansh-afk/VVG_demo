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
    // Exact match
    if (pathname === path) {
      return true;
    }
    
    // Find the most specific match for nested routes
    const currentPath = pathname || "";
    
    // Special case for dashboard - only match exact path
    if (path === "/dashboard") {
      return currentPath === path;
    }
    
    // For other paths, check if it's a direct parent (but not a partial match)
    if (currentPath.startsWith(path + "/")) {
      // Make sure no other nav item is a better (more specific) match
      const moreSpecificMatch = navItems.some(item => 
        item.href !== path && 
        item.href.startsWith(path + "/") && 
        currentPath.startsWith(item.href)
      );
      
      return !moreSpecificMatch;
    }
    
    return false;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-sidebar p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <Image src="/ntt-logo.svg" alt="NTT Group Logo" width={40} height={30} priority />
          <h1 className="ml-2 font-semibold text-sidebar-foreground">Secure Events</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-sidebar-foreground"
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
        <div className="md:hidden bg-sidebar shadow-md z-20 absolute top-16 inset-x-0">
          <div className="flex flex-col p-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center py-3 px-4 rounded-md transition-colors duration-200 ${
                  isActive(item.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            ))}
            <Button 
              variant="outline" 
              className="mt-4 border-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar (desktop) */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="sidebar flex-1 flex flex-col min-h-0 bg-sidebar text-sidebar-foreground">
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="logo-container mb-5">
              <Image src="/ntt-logo.svg" alt="NTT Group Logo" width={60} height={40} priority className="hover-effect" />
            </div>
            <nav className="mt-2 flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive(item.href)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-sidebar-border p-4">
            <div className="flex items-center w-full">
              <Avatar className="h-10 w-10 bg-sidebar-accent text-sidebar-accent-foreground">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                <AvatarFallback>{user?.displayName ? getInitials(user.displayName) : "U"}</AvatarFallback>
              </Avatar>
              <div className="ml-3 min-w-0 flex-1">
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.displayName || "User"}
                </div>
                <Button 
                  variant="ghost" 
                  className="text-xs text-sidebar-foreground p-0 h-auto hover:text-sidebar-accent-foreground"
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
      <div className="md:pl-64 flex flex-col flex-1 main-content">
        <main className="flex-1 p-4 md:p-6 fade-in">
          <div className="content-area">
            {children}
          </div>
        </main>
        <div className="footer-gradient"></div>
        <footer className="text-center py-4 text-sm text-muted-foreground">
          © {new Date().getFullYear()} NTT Group. All rights reserved. | Secure Events
        </footer>
      </div>
    </div>
  );
}