"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvent, deleteEvent } from "@/lib/events";
import { queryDocuments } from "@/lib/firestore";
import { toast } from "sonner";
import { Event, User, ApprovalRequest } from "@/lib/firestore";
import { Timestamp, where } from "firebase/firestore";
import Link from "next/link";

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<User[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
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

        // Fetch attendees if there are any
        if (eventData.attendees && eventData.attendees.length > 0) {
          const attendeeData = await Promise.all(
            eventData.attendees.map(async (userId) => {
              const userData = await queryDocuments<User>("users", [where("uid", "==", userId)]);
              return userData[0];
            })
          );
          setAttendees(attendeeData.filter(Boolean)); // Filter out any undefined values
        }

        // Fetch approval requests for this event
        const requestsData = await queryDocuments<ApprovalRequest>("approvalRequests", [
          where("eventId", "==", eventId)
        ]);
        setApprovalRequests(requestsData);
      } catch (error) {
        console.error("Error fetching event data:", error);
        toast.error("Failed to load event details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, router]);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteEvent(eventId);
        toast.success("Event deleted successfully");
        router.push("/admin/events");
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event");
        setIsDeleting(false);
      }
    }
  };

  // Format date for display
  const formatEventDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
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
          <p className="text-center py-10">Loading event details...</p>
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
          <h1 className="text-3xl font-bold">Event Details</h1>
          <div className="flex space-x-3">
            <Button variant="outline" asChild>
              <Link href={`/admin/events/${eventId}/edit`}>Edit Event</Link>
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Event Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Date & Time</h3>
                <p>{formatEventDate(event.datetime)}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Location</h3>
                <p>{event.location}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Capacity</h3>
                <p>{event.capacity} attendees</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Description</h3>
                <div className="whitespace-pre-line">{event.description}</div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Settings</h3>
                <p>
                  Requires Approval: <span className="font-medium">{event.requiresApproval ? "Yes" : "No"}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Attendees Card */}
          <Card>
            <CardHeader>
              <CardTitle>Attendees ({attendees.length}/{event.capacity})</CardTitle>
            </CardHeader>
            <CardContent>
              {attendees.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No attendees registered yet.</p>
              ) : (
                <div className="divide-y">
                  {attendees.map((attendee) => (
                    <div key={attendee.uid} className="py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-200 mr-3 overflow-hidden">
                          {attendee.photoURL && (
                            <img 
                              src={attendee.photoURL} 
                              alt={attendee.displayName} 
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{attendee.displayName}</p>
                          <p className="text-sm text-slate-500">{attendee.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Requests Card */}
          {event.requiresApproval && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Approval Requests ({approvalRequests.length})</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push("/admin/approvals")}
                >
                  Manage All Approvals
                </Button>
              </CardHeader>
              <CardContent>
                {approvalRequests.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400">No approval requests yet.</p>
                ) : (
                  <div className="divide-y">
                    {approvalRequests.map((request) => (
                      <div key={request.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">User ID: {request.userId}</p>
                          <p className="text-sm text-slate-500">
                            Status: <span className={`font-medium ${
                              request.status === 'approved' ? 'text-green-600' :
                              request.status === 'denied' ? 'text-red-600' :
                              'text-amber-600'
                            }`}>{request.status}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            Requested: {request.requestedAt.toDate().toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => router.push(`/admin/approvals?requestId=${request.id}`)}
                              >
                                Process
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Pre-Approval Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pre-Approval Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Pre-approved Groups */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Pre-approved Groups</h3>
                  {event.preApprovedGroups && event.preApprovedGroups.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {event.preApprovedGroups.length} groups have automatic approval for this event
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/admin/events/${eventId}/groups`)}
                      >
                        Manage Group Approvals
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        No groups are pre-approved for this event
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/admin/events/${eventId}/groups`)}
                      >
                        Add Pre-approved Groups
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Individual Pre-approvals */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Individual Pre-approvals</h3>
                  {event.preApprovedUsers && event.preApprovedUsers.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {event.preApprovedUsers.length} users have individual pre-approval
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/admin/events/${eventId}/users`)}
                      >
                        Manage User Approvals
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        No individual users are pre-approved
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/admin/events/${eventId}/users`)}
                      >
                        Add Pre-approved Users
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="pt-2">
                  <Button 
                    variant={event.requiresApproval ? "default" : "outline"}
                    onClick={() => router.push(`/admin/events/${eventId}/edit`)}
                  >
                    {event.requiresApproval 
                      ? "Event Requires Approval" 
                      : "Event Open to All Users"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}