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

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, userData } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      // Remove admin cookie when signing out
      if (typeof document !== 'undefined') {
        document.cookie = "admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      
      await signOut();
      router.push("/auth/admin/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: "home" },
    { name: "Events", href: "/admin/events", icon: "calendar" },
    { name: "Users", href: "/admin/users", icon: "users" },
    { name: "Approvals", href: "/admin/approvals", icon: "check-circle" },
    { name: "Settings", href: "/admin/settings", icon: "settings" },
  ];

  const isActive = (path: string) => {
    // Exact match
    if (pathname === path) {
      return true;
    }
    
    // Find the most specific match for nested routes
    const currentPath = pathname || "";
    
    // Special case for dashboard - only match exact path
    if (path === "/admin/dashboard") {
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
          <h1 className="ml-2 font-semibold text-sidebar-foreground">Secure Events Admin</h1>
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
                className={`flex items-center py-3 px-4 rounded-md transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-[#89A5E8] text-white font-medium border-l-4 border-white"
                    : "text-sidebar-foreground hover:bg-[#89A5E8]/30 hover:text-white hover:translate-x-1"
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
        <div className="sidebar flex-1 flex flex-col min-h-0 bg-sidebar">
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="logo-container mb-5">
              <Image src="/ntt-logo.svg" alt="NTT Group Logo" width={60} height={40} priority className="hover-effect" />
            </div>
            <nav className="mt-2 flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-[#89A5E8] text-white font-medium border-l-4 border-white"
                      : "text-sidebar-foreground hover:bg-[#89A5E8]/30 hover:text-white hover:translate-x-1"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-sidebar-border p-4">
            <div className="flex items-center w-full">
              <Avatar className="h-10 w-10 bg-sidebar-accent">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">{user?.displayName ? getInitials(user.displayName) : "A"}</AvatarFallback>
              </Avatar>
              <div className="ml-3 min-w-0 flex-1">
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.displayName || "Admin"}
                </div>
                <Button 
                  variant="ghost" 
                  className="text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground p-0 h-auto transition-colors duration-200"
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