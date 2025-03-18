"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Event, Group, getDocument, queryDocuments, updateDocument } from "@/lib/firestore";
import { arrayUnion, arrayRemove, Timestamp, where } from "firebase/firestore";
import { toast } from "sonner";

export default function GroupEventsPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const router = useRouter();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<Event[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingEvents, setUpdatingEvents] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch group details
        const groupData = await getDocument<Group>("groups", groupId);
        if (!groupData) {
          toast.error("Group not found");
          router.push("/admin/groups");
          return;
        }
        setGroup(groupData);

        // Fetch all events
        const now = Timestamp.now();
        const eventsData = await queryDocuments<Event>("events", [
          where("datetime", ">=", now)
        ]);
        setAllEvents(eventsData);

        // Separate approved and available events
        const approvedEventsList: Event[] = [];
        const availableEventsList: Event[] = [];

        eventsData.forEach(event => {
          if (groupData.preApprovedEvents && groupData.preApprovedEvents.includes(event.id)) {
            approvedEventsList.push(event);
          } else {
            availableEventsList.push(event);
          }
        });

        setApprovedEvents(approvedEventsList);
        setAvailableEvents(availableEventsList);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load group and event data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [groupId, router]);

  // Filter available events when search query changes
  const filteredAvailableEvents = searchQuery.trim() === ""
    ? availableEvents
    : availableEvents.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const approveEventForGroup = async (eventId: string) => {
    if (!group) return;
    
    setUpdatingEvents(true);
    try {
      // First update the group document
      await updateDocument("groups", groupId, {
        preApprovedEvents: arrayUnion(eventId)
      });
      
      // Then update the event document
      await updateDocument("events", eventId, {
        preApprovedGroups: arrayUnion(groupId)
      });
      
      // Update local state
      const eventToApprove = availableEvents.find(e => e.id === eventId);
      if (eventToApprove) {
        // Move from available to approved
        setApprovedEvents([...approvedEvents, eventToApprove]);
        setAvailableEvents(availableEvents.filter(e => e.id !== eventId));
      }
      
      toast.success("Event approved for this group");
    } catch (error) {
      console.error("Error approving event for group:", error);
      toast.error("Failed to approve event");
    } finally {
      setUpdatingEvents(false);
    }
  };

  const removeEventApproval = async (eventId: string) => {
    if (!group) return;
    
    setUpdatingEvents(true);
    try {
      // First update the group document
      await updateDocument("groups", groupId, {
        preApprovedEvents: arrayRemove(eventId)
      });
      
      // Then update the event document
      await updateDocument("events", eventId, {
        preApprovedGroups: arrayRemove(groupId)
      });
      
      // Update local state
      const eventToRemove = approvedEvents.find(e => e.id === eventId);
      if (eventToRemove) {
        // Move from approved to available
        setAvailableEvents([...availableEvents, eventToRemove]);
        setApprovedEvents(approvedEvents.filter(e => e.id !== eventId));
      }
      
      toast.success("Event approval removed");
    } catch (error) {
      console.error("Error removing event approval:", error);
      toast.error("Failed to remove event approval");
    } finally {
      setUpdatingEvents(false);
    }
  };

  // Format date for display
  const formatEventDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
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

  if (!group) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <p className="text-center py-10">Group not found.</p>
          <div className="flex justify-center">
            <Button onClick={() => router.push("/admin/groups")}>
              Back to Groups
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
          <div>
            <h1 className="text-3xl font-bold">Manage Pre-approved Events</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {group.name}
            </p>
          </div>
          <div>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/admin/groups/${groupId}`)}
            >
              Back to Group
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pre-approved Events */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Pre-approved Events ({approvedEvents.length})</h2>
              {approvedEvents.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                  No pre-approved events for this group
                </p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {approvedEvents.map((event) => (
                    <div key={event.id} className="p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-slate-500">{formatEventDate(event.datetime)}</p>
                        <p className="text-xs text-slate-500">{event.location}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/events/${event.id}`)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => removeEventApproval(event.id)}
                          disabled={updatingEvents}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Events */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Available Events</h2>
              <div className="mb-4">
                <Label htmlFor="search-events">Search Events</Label>
                <Input
                  id="search-events"
                  placeholder="Search by title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {filteredAvailableEvents.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                  {searchQuery ? "No matching events found" : "No additional events available"}
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredAvailableEvents.map((event) => (
                    <div key={event.id} className="p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-slate-500">{formatEventDate(event.datetime)}</p>
                        <p className="text-xs text-slate-500">{event.location}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/events/${event.id}`)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => approveEventForGroup(event.id)}
                          disabled={updatingEvents}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex justify-center">
                <Button 
                  onClick={() => router.push("/admin/events/create")}
                >
                  Create New Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}