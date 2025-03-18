"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getEvent, updateEvent } from "@/lib/events";
import { queryDocuments } from "@/lib/firestore";
import { toast } from "sonner";
import { Event, User } from "@/lib/firestore";
import Link from "next/link";
import { Search } from "lucide-react";

export default function ManageEventUsersPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch event details
        const eventData = await getEvent(eventId);
        if (!eventData) {
          toast.error("Event not found");
          router.push("/admin/events");
          return;
        }
        setEvent(eventData);
        
        // Set initially selected users from the event data
        if (eventData.preApprovedUsers) {
          setSelectedUsers(eventData.preApprovedUsers);
        }

        // Fetch all users from Firestore
        const usersData = await queryDocuments<User>("users", []);
        setAllUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load event or users data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId, router]);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(allUsers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allUsers.filter(user => 
      user.displayName?.toLowerCase().includes(query) || 
      user.email?.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, allUsers]);

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSave = async () => {
    if (!event) return;
    
    setIsSaving(true);
    try {
      // Update the event with the selected users
      await updateEvent(eventId, {
        preApprovedUsers: selectedUsers
      });
      
      toast.success("Pre-approved users updated successfully");
      router.push(`/admin/events/${eventId}`);
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update pre-approved users");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <p className="text-center py-10">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <p className="text-center py-10">Event not found.</p>
          <div className="flex justify-center">
            <Button onClick={() => router.push("/admin/events")}>
              Back to Events
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
          <h1 className="text-3xl font-bold">Manage Pre-approved Users</h1>
          <Button variant="outline" asChild>
            <Link href={`/admin/events/${eventId}`}>Back to Event</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Users for {event.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {allUsers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500 mb-4">No users available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">
                  Select individual users that will be automatically pre-approved for this event.
                  These users will not need to request approval to register.
                </p>
                
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input
                    type="search"
                    placeholder="Search users by name or email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="divide-y max-h-96 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <p className="py-4 text-center text-slate-500">No users match your search.</p>
                  ) : (
                    filteredUsers.map(user => {
                      const isSelected = selectedUsers.includes(user.uid);
                      return (
                        <div key={user.uid} className="py-3 flex items-center">
                          <Button 
                            variant={isSelected ? "default" : "outline"} 
                            size="sm"
                            onClick={() => handleUserSelection(user.uid)}
                            className="min-w-20 mr-3"
                          >
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                          <div className="h-8 w-8 rounded-full bg-slate-200 mr-3 overflow-hidden">
                            {user.photoURL && (
                              <img 
                                src={user.photoURL} 
                                alt={user.displayName || user.email || ''} 
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="font-medium cursor-pointer flex-1" onClick={() => handleUserSelection(user.uid)}>
                            {user.displayName || "No Name"}
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/events/${eventId}`)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}