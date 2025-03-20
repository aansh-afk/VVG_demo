"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryDocuments, User } from "@/lib/firestore";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const usersData = await queryDocuments<User>("users");
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          (user.displayName && user.displayName.toLowerCase().includes(lowercaseQuery)) ||
          (user.email && user.email.toLowerCase().includes(lowercaseQuery)) ||
          (user.uid && user.uid.includes(lowercaseQuery))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Get user role display
  const getUserRoleDisplay = (role?: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 bg-[#EDF2FF] text-primary text-xs rounded-full">Admin</span>;
      case 'security':
        return <span className="px-2 py-1 bg-[#EDF2FF] text-accent text-xs rounded-full">Security</span>;
      default:
        return <span className="px-2 py-1 bg-[#F7EFE6] text-foreground text-xs rounded-full">User</span>;
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => router.push("/admin/groups")}
            >
              Manage Groups
            </Button>
            <Button onClick={() => router.push("/admin/users/create")}>
              Add New User
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search users by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-lg"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  No users found matching your search.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.uid} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                          <AvatarFallback>{user.displayName ? getInitials(user.displayName) : "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-lg font-semibold">{user.displayName || "No Name"}</h2>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {user.email}
                          </p>
                          <div className="mt-1">
                            {getUserRoleDisplay(user.role)}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin/users/${user.uid}/groups`}>Manage Groups</Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin/users/${user.uid}`}>User Details</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}