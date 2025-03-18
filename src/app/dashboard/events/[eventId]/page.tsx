"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/context/auth-context";
import { Event, User, Group, getDocument, addDocument, updateDocument, queryDocuments, ApprovalRequest } from "@/lib/firestore";
import { registerForEvent } from "@/lib/functions";
import { Timestamp, arrayUnion, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function EventDetailPage() {
  const { user, userData, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null);
  const [localUserData, setLocalUserData] = useState<any>(userData);
  
  useEffect(() => {
    // Redirect if not logged in
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId || !user) return;
      
      setIsEventLoading(true);
      try {
        // Fetch event data
        const eventData = await getDocument<Event>("events", eventId);
        if (!eventData) {
          toast.error("Event not found");
          router.push("/dashboard/events");
          return;
        }
        
        setEvent(eventData);
        
        // Get all groups that this user is a member of to ensure accurate data
        const groupsQueryResult = await queryDocuments<Group>("groups", [
          where("members", "array-contains", user.uid)
        ]);
        
        // Extract group IDs
        const userGroupIds = groupsQueryResult.map(group => group.id);
        
        // Fetch the user's document to compare with actual group membership
        const freshUserData = await getDocument<User>("users", user.uid);
        
        // If the user document exists and has different group data than the actual memberships,
        // update the user document to match reality
        if (freshUserData && 
            (!freshUserData.groups || 
             JSON.stringify([...(freshUserData.groups || [])].sort()) !== 
             JSON.stringify([...userGroupIds].sort()))) {
             
          // Try to update user document with correct group memberships
          try {
            await updateDocument("users", user.uid, {
              groups: userGroupIds
            });
          } catch (error) {
            console.error("Error updating user groups in document:", error);
          }
        }
        
        // Create a merged user data object that has the correct group memberships
        // This ensures the pre-approval check works even if the database update failed
        const mergedUserData = {
          ...(freshUserData || userData || {}),
          groups: userGroupIds
        };
        
        // Set this as our local user data for accurate pre-approval checking
        setLocalUserData(mergedUserData);
        
        // Check if user has an existing approval request for this event
        const approvalRequests = await queryDocuments<ApprovalRequest>("approvalRequests", [
          where("eventId", "==", eventId),
          where("userId", "==", user.uid)
        ]);
        
        if (approvalRequests.length > 0) {
          setApprovalRequest(approvalRequests[0]);
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
        toast.error("Failed to load event details");
      } finally {
        setIsEventLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, router, user, userData]);

  // Check if user is pre-approved for this event
  const isPreApproved = () => {
    if (!user || !event) return false;
    
    // Use local user data which is guaranteed to be fresh
    const currentUserData = localUserData || userData;
    if (!currentUserData) return false;
    
    // Check if user is directly pre-approved
    if (event.preApprovedUsers && event.preApprovedUsers.includes(user.uid)) {
      return true;
    }
    
    // Check if user belongs to a pre-approved group
    if (currentUserData.groups && currentUserData.groups.length > 0 && 
        event.preApprovedGroups && event.preApprovedGroups.length > 0) {
      
      // Check for any matching groups
      for (const userGroup of currentUserData.groups) {
        if (event.preApprovedGroups.includes(userGroup)) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Check if user is already registered for this event
  const isRegistered = () => {
    if (!user || !event) return false;
    return event.attendees.includes(user.uid);
  };

  // Handle direct registration using the secure Cloud Function
  const handleRegister = async () => {
    if (!user || !event) return;
    
    setIsRegistering(true);
    try {
      // Use the Cloud Function to register the user
      // This runs with admin permissions on the server and handles all security checks
      const result = await registerForEvent(event.id);
      
      // Update the local state to reflect the registration
      setEvent({
        ...event,
        attendees: [...(event.attendees || []), user.uid]
      });
      
      toast.success(result.message || "Successfully registered for the event!");
    } catch (error: any) {
      console.error("Error registering for event:", error);
      toast.error(error.message || "Failed to register for event. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle approval request submission
  const handleRequestApproval = async () => {
    if (!user || !event) return;
    
    setIsRequesting(true);
    try {
      // Create approval request in Firestore
      await addDocument("approvalRequests", {
        eventId: event.id,
        userId: user.uid,
        status: "pending",
        requestedAt: Timestamp.now(),
        processedAt: null,
        processedBy: null
      });
      
      toast.success("Approval request submitted successfully!");
      setShowApprovalDialog(false);
    } catch (error) {
      console.error("Error requesting approval:", error);
      toast.error("Failed to submit approval request");
    } finally {
      setIsRequesting(false);
    }
  };

  // Format date for event display
  const formatEventDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  if (isEventLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <p>Loading event details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <a href="/dashboard/events">Back to Events</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
      
        <Button 
          variant="outline" 
          className="mb-6"
          onClick={() => router.push("/dashboard/events")}
        >
          ← Back to Events
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{event.title}</CardTitle>
            <CardDescription className="text-base">
              {formatEventDate(event.datetime)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {event.description}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Location</h3>
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{event.location}</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Attendance</h3>
              <p className="text-slate-700 dark:text-slate-300">
                {event.attendees.length} people registered
                {event.capacity > 0 && ` (${event.capacity - event.attendees.length} spots remaining)`}
              </p>
            </div>
            
            {/* Show approval status notice */}
            {event.requiresApproval && (
              <div className={`p-4 rounded-md ${
                isPreApproved() 
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
                  : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
              }`}>
                {isPreApproved() ? (
                  <>
                    <h3 className="text-green-800 dark:text-green-400 font-medium mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      Pre-Approved
                    </h3>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      You are pre-approved for this event. You can register without requesting approval.
                    </p>
                    {isRegistered() ? (
                      <div className="mt-2 text-sm text-green-700 dark:text-green-300 font-medium">
                        You are already registered for this event.
                      </div>
                    ) : (
                      <Button 
                        className="mt-2" 
                        size="sm"
                        onClick={handleRegister}
                        disabled={isRegistering}
                      >
                        {isRegistering ? "Registering..." : "Register Now"}
                      </Button>
                    )}
                  </>
                ) : approvalRequest ? (
                  <>
                    <h3 className="text-amber-800 dark:text-amber-400 font-medium mb-1">
                      {approvalRequest.status === 'pending' 
                        ? "Approval Request Pending" 
                        : approvalRequest.status === 'approved'
                          ? "Approval Request Approved"
                          : "Approval Request Denied"
                      }
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300 text-sm">
                      {approvalRequest.status === 'pending' 
                        ? "Your request to attend this event is currently pending review."
                        : approvalRequest.status === 'approved'
                          ? "Your request to attend this event has been approved."
                          : "Your request to attend this event has been denied."
                      }
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-amber-800 dark:text-amber-400 font-medium mb-1">
                      Approval Required
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300 text-sm">
                      This event requires approval from embassy staff before you can attend.
                    </p>
                  </>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-4 border-t pt-6">
            {isRegistered() ? (
              <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-md text-green-700 dark:text-green-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                You're registered for this event
              </div>
            ) : isPreApproved() ? (
              <Button 
                onClick={handleRegister}
                disabled={isRegistering}
              >
                {isRegistering ? "Registering..." : "Register for Event"} 
                <span className="ml-2 text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 px-2 py-1 rounded-full">Pre-approved</span>
              </Button>
            ) : approvalRequest ? (
              <div className={`px-4 py-2 rounded-md flex items-center ${
                approvalRequest.status === 'approved' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                  : approvalRequest.status === 'denied'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
              }`}>
                {approvalRequest.status === 'approved' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Your request was approved
                    <Button 
                      className="ml-3"
                      onClick={handleRegister}
                      disabled={isRegistering}
                    >
                      {isRegistering ? "Registering..." : "Register Now"}
                    </Button>
                  </>
                ) : approvalRequest.status === 'denied' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    Your request was denied
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Your approval request is pending
                  </>
                )}
              </div>
            ) : event.requiresApproval ? (
              <Button 
                onClick={() => setShowApprovalDialog(true)}
              >
                Request Approval
              </Button>
            ) : (
              <Button 
                onClick={handleRegister}
                disabled={isRegistering}
              >
                {isRegistering ? "Registering..." : "Register for Event"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Approval Request Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Approval for Event</DialogTitle>
            <DialogDescription>
              This event requires approval from embassy staff. Submit a request to attend this event.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your request will be reviewed by embassy staff. You'll receive a notification once your request has been processed.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowApprovalDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRequestApproval}
              disabled={isRequesting}
            >
              {isRequesting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}