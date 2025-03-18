"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/context/auth-context";
import { Event, ApprovalRequest, getDocument, queryDocuments, updateDocument, deleteDocument } from "@/lib/firestore";
import { where, arrayRemove } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function RegistrationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [approvedEvents, setApprovedEvents] = useState<Event[]>([]);
  const [pendingRequests, setPendingRequests] = useState<(ApprovalRequest & { eventDetails?: Event })[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!user) return;
      
      setIsDataLoading(true);
      try {
        // Fetch approved events
        const approvedEventsData = await queryDocuments<Event>("events", [
          where("attendees", "array-contains", user.uid)
        ]);
        setApprovedEvents(approvedEventsData);
        
        // Fetch pending requests
        const pendingRequestsData = await queryDocuments<ApprovalRequest>("approvalRequests", [
          where("userId", "==", user.uid),
          where("status", "==", "pending")
        ]);
        
        // Fetch event details for each request
        const pendingWithEvents = await Promise.all(
          pendingRequestsData.map(async (request) => {
            try {
              const eventData = await getDocument<Event>("events", request.eventId);
              return { ...request, eventDetails: eventData || undefined };
            } catch (error) {
              console.error(`Error fetching event for request ${request.id}:`, error);
              return request;
            }
          })
        );
        
        setPendingRequests(pendingWithEvents);
      } catch (error) {
        console.error("Error fetching registrations:", error);
        toast.error("Failed to load your registrations");
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchRegistrations();
  }, [user]);

  const handleCancelRegistration = async () => {
    if (!user || !selectedEventId) return;
    
    setIsCancelling(true);
    try {
      // Remove user from event attendees
      await updateDocument("events", selectedEventId, {
        attendees: arrayRemove(user.uid)
      });
      
      // Update local state
      setApprovedEvents(approvedEvents.filter(event => event.id !== selectedEventId));
      toast.success("Registration cancelled successfully");
    } catch (error) {
      console.error("Error cancelling registration:", error);
      toast.error("Failed to cancel registration");
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
      setSelectedEventId(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!user) return;
    
    try {
      // Delete the approval request
      await deleteDocument("approvalRequests", requestId);
      
      // Update local state
      setPendingRequests(pendingRequests.filter(request => request.id !== requestId));
      toast.success("Request cancelled successfully");
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
    }
  };

  // Format date for event display
  const formatEventDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">My Registrations</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Manage your event registrations and approval requests
        </p>
        
        {/* Approved Events */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Approved Events</CardTitle>
            <CardDescription>
              Events you're registered to attend
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <div className="py-4 text-center">Loading your registrations...</div>
            ) : approvedEvents.length > 0 ? (
              <div className="divide-y">
                {approvedEvents.map((event) => (
                  <div key={event.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatEventDate(event.datetime.toDate())} • {event.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          asChild 
                          variant="outline" 
                          size="sm"
                        >
                          <Link href={`/dashboard/qr-codes?eventId=${event.id}`}>
                            View QR Code
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => {
                            setSelectedEventId(event.id);
                            setShowCancelDialog(true);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-slate-500 dark:text-slate-400">
                <p>You don't have any approved event registrations.</p>
                <Button 
                  asChild 
                  variant="link" 
                  className="mt-2 h-auto p-0"
                >
                  <Link href="/dashboard/events">Browse events</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approval Requests</CardTitle>
            <CardDescription>
              Event registrations awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <div className="py-4 text-center">Loading your requests...</div>
            ) : pendingRequests.length > 0 ? (
              <div className="divide-y">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-medium">
                          {request.eventDetails?.title || "Event"}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Requested on {request.requestedAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                          Pending
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          Cancel Request
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-slate-500 dark:text-slate-400">
                <p>You don't have any pending approval requests.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Registration Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Event Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your registration for this event?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This action cannot be undone. You will need to register again if you change your mind.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Registration
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelRegistration}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel Registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}