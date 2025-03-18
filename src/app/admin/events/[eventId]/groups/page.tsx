"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvent, updateEvent } from "@/lib/events";
import { queryDocuments } from "@/lib/firestore";
import { toast } from "sonner";
import { Event, Group } from "@/lib/firestore";
import Link from "next/link";

export default function ManageEventGroupsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
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
        
        // Set initially selected groups from the event data
        if (eventData.preApprovedGroups) {
          setSelectedGroups(eventData.preApprovedGroups);
        }

        // Fetch all groups from Firestore
        const groupsData = await queryDocuments<Group>("groups", []);
        setAllGroups(groupsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load event or groups data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId, router]);

  const handleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleSave = async () => {
    if (!event) return;
    
    setIsSaving(true);
    try {
      // Update the event with the selected groups
      await updateEvent(eventId, {
        preApprovedGroups: selectedGroups
      });
      
      toast.success("Pre-approved groups updated successfully");
      router.push(`/admin/events/${eventId}`);
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update pre-approved groups");
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
          <h1 className="text-3xl font-bold">Manage Pre-approved Groups</h1>
          <Button variant="outline" asChild>
            <Link href={`/admin/events/${eventId}`}>Back to Event</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Groups for {event.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {allGroups.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500 mb-4">No groups available.</p>
                <Button asChild>
                  <Link href="/admin/groups/new">Create a Group</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">
                  Select groups that will be automatically pre-approved for this event.
                  Members of these groups will not need to request approval to register.
                </p>
                
                <div className="divide-y">
                  {allGroups.map(group => {
                    const isSelected = selectedGroups.includes(group.id);
                    return (
                      <div key={group.id} className="py-3 flex items-center">
                        <Button 
                          variant={isSelected ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleGroupSelection(group.id)}
                          className="min-w-20 mr-3"
                        >
                          {isSelected ? "Selected" : "Select"}
                        </Button>
                        <div className="font-medium flex-1 cursor-pointer" onClick={() => handleGroupSelection(group.id)}>
                          {group.name}
                          <p className="text-sm text-slate-500">{group.description}</p>
                        </div>
                        <div className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {group.members ? group.members.length : 0} members
                        </div>
                      </div>
                    );
                  })}
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