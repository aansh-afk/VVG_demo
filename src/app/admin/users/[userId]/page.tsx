"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Group, Event, getDocument, queryDocuments, updateDocument } from "@/lib/firestore";
import { where } from "firebase/firestore";

export default function UserDetailPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch user details
        const userData = await getDocument<User>("users", userId);
        if (!userData) {
          toast.error("User not found");
          router.push("/admin/users");
          return;
        }
        setUser(userData);

        // Fetch groups this user belongs to
        const userGroupsData = await queryDocuments<Group>("groups", [
          where("members", "array-contains", userId)
        ]);
        setUserGroups(userGroupsData);

        // Fetch events this user has pre-approval for
        const eventsData = await queryDocuments<Event>("events", [
          where("preApprovedUsers", "array-contains", userId)
        ]);
        setApprovedEvents(eventsData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, router]);

  const handleRoleChange = async (newRole: 'user' | 'admin' | 'security') => {
    if (!user) return;
    
    // Prevent changing role if it's the same
    if (user.role === newRole) return;
    
    // Confirmation for role changes
    const confirmMessage = 
      newRole === 'admin' 
        ? "Are you sure you want to make this user an admin? They will have full access to the system."
        : `Are you sure you want to change this user's role to ${newRole}?`;
    
    if (!confirm(confirmMessage)) return;
    
    setRoleChangeLoading(true);
    try {
      await updateDocument("users", userId, { role: newRole });
      
      // Update local state
      setUser({
        ...user,
        role: newRole
      });
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    } finally {
      setRoleChangeLoading(false);
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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <p className="text-center py-10">Loading user details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <p className="text-center py-10">User not found.</p>
          <div className="flex justify-center">
            <Button onClick={() => router.push("/admin/users")}>
              Back to Users
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Details</h1>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => router.push("/admin/users")}
            >
              Back to Users
            </Button>
            <Button 
              onClick={() => router.push(`/admin/users/${userId}/groups`)}
            >
              Manage User Groups
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                <AvatarFallback className="text-2xl">
                  {user.displayName ? getInitials(user.displayName) : "U"}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{user.displayName}</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-4">{user.email}</p>
              
              <div className="w-full mt-4">
                <Label className="block mb-2">User Role</Label>
                <div className="flex space-x-2 mt-2">
                  <Button 
                    variant={user.role === 'user' || !user.role ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRoleChange('user')}
                    disabled={roleChangeLoading || user.role === 'user' || !user.role}
                  >
                    User
                  </Button>
                  <Button 
                    variant={user.role === 'admin' ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRoleChange('admin')}
                    disabled={roleChangeLoading || user.role === 'admin'}
                  >
                    Admin
                  </Button>
                  <Button 
                    variant={user.role === 'security' ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRoleChange('security')}
                    disabled={roleChangeLoading || user.role === 'security'}
                  >
                    Security
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* User Groups Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Groups ({userGroups.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {userGroups.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                  User is not assigned to any groups
                </p>
              ) : (
                <div className="space-y-3">
                  {userGroups.map((group) => (
                    <div key={group.id} className="p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {group.members.length} members
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={`/admin/groups/${group.id}`}>View Group</a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/admin/users/${userId}/groups`)}
                >
                  Manage Groups
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Pre-approved Events Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Pre-approved Events ({approvedEvents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {approvedEvents.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                  User has no direct event pre-approvals
                </p>
              ) : (
                <div className="space-y-3">
                  {approvedEvents.map((event) => (
                    <div key={event.id} className="p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {event.location}
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={`/admin/events/${event.id}`}>View Event</a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/admin/users/${userId}/events`)}
                >
                  Manage Event Approvals
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}