"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApprovalRequest, User, Event, queryDocuments, getDocument, updateDocument } from "@/lib/firestore";
import { where, Timestamp, arrayUnion } from "firebase/firestore";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export default function AdminApprovalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [processedRequests, setProcessedRequests] = useState<ApprovalRequest[]>([]);
  const [requestUsers, setRequestUsers] = useState<Record<string, User>>({});
  const [requestEvents, setRequestEvents] = useState<Record<string, Event>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    const fetchApprovalRequests = async () => {
      setIsLoading(true);
      try {
        // Fetch all approval requests
        const requestsData = await queryDocuments<ApprovalRequest>("approvalRequests");
        
        // Sort by requestedAt, newest first
        requestsData.sort((a, b) => 
          (b.requestedAt?.toMillis() || 0) - (a.requestedAt?.toMillis() || 0)
        );
        
        setApprovalRequests(requestsData);
        
        // Separate pending and processed requests
        const pending = requestsData.filter(req => req.status === "pending");
        const processed = requestsData.filter(req => req.status !== "pending");
        
        setPendingRequests(pending);
        setProcessedRequests(processed);
        
        // Fetch users and events data
        const userPromises: Record<string, Promise<User | null>> = {};
        const eventPromises: Record<string, Promise<Event | null>> = {};
        
        requestsData.forEach(request => {
          if (!userPromises[request.userId]) {
            userPromises[request.userId] = getDocument<User>("users", request.userId);
          }
          
          if (!eventPromises[request.eventId]) {
            eventPromises[request.eventId] = getDocument<Event>("events", request.eventId);
          }
        });
        
        // Resolve all promises
        const userResults: Record<string, User> = {};
        const eventResults: Record<string, Event> = {};
        
        await Promise.all(Object.entries(userPromises).map(async ([userId, promise]) => {
          const userData = await promise;
          if (userData) {
            userResults[userId] = userData;
          }
        }));
        
        await Promise.all(Object.entries(eventPromises).map(async ([eventId, promise]) => {
          const eventData = await promise;
          if (eventData) {
            eventResults[eventId] = eventData;
          }
        }));
        
        setRequestUsers(userResults);
        setRequestEvents(eventResults);
      } catch (error) {
        console.error("Error fetching approval requests:", error);
        toast.error("Failed to load approval requests");
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovalRequests();
  }, []);

  const handleApproval = async (requestId: string, approve: boolean) => {
    if (!user) return;
    
    // Find the request
    const request = approvalRequests.find(req => req.id === requestId);
    if (!request) {
      toast.error("Request not found");
      return;
    }
    
    setProcessingRequest(requestId);
    try {
      // Update the approval request status
      await updateDocument("approvalRequests", requestId, {
        status: approve ? "approved" : "denied",
        processedAt: Timestamp.now(),
        processedBy: user.uid
      });
      
      // If approved, add user to event attendees
      if (approve) {
        await updateDocument("events", request.eventId, {
          attendees: arrayUnion(request.userId)
        });
      }
      
      // Update local state
      const updatedRequests = approvalRequests.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: approve ? "approved" : "denied",
              processedAt: Timestamp.now(),
              processedBy: user.uid
            } 
          : req
      );
      
      setApprovalRequests(updatedRequests);
      setPendingRequests(updatedRequests.filter(req => req.status === "pending"));
      setProcessedRequests(updatedRequests.filter(req => req.status !== "pending"));
      
      toast.success(`Request ${approve ? "approved" : "denied"} successfully`);
    } catch (error) {
      console.error(`Error ${approve ? "approving" : "denying"} request:`, error);
      toast.error(`Failed to ${approve ? "approve" : "deny"} request`);
    } finally {
      setProcessingRequest(null);
    }
  };

  // Format date for display
  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "N/A";
    
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

  // Render request card
  const renderRequestCard = (request: ApprovalRequest) => {
    const requestUser = requestUsers[request.userId];
    const requestEvent = requestEvents[request.eventId];
    const isPending = request.status === "pending";
    
    return (
      <Card key={request.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between">
            <div>
              <div className="flex items-center mb-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mr-2 ${
                  request.status === 'approved' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : request.status === 'denied'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                }`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
                <span className="text-slate-500 text-sm">
                  Requested: {formatDate(request.requestedAt)}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold">
                {requestEvent?.title || "Unknown Event"}
              </h3>
              
              <div className="mt-1">
                <p className="text-sm">
                  <span className="font-medium">Requester:</span> {requestUser?.displayName || requestUser?.email || request.userId}
                </p>
                {requestEvent && (
                  <p className="text-sm">
                    <span className="font-medium">Event Date:</span> {formatDate(requestEvent.datetime)}
                  </p>
                )}
                {request.processedAt && (
                  <p className="text-sm text-slate-500">
                    Processed on {formatDate(request.processedAt)}
                  </p>
                )}
              </div>
            </div>
            
            {isPending ? (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleApproval(request.id, true)}
                  disabled={processingRequest === request.id}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  Approve
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => handleApproval(request.id, false)}
                  disabled={processingRequest === request.id}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Deny
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/events/${request.eventId}`)}
                >
                  View Event
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Approval Requests</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <p>Loading approval requests...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Requests */}
            <div>
              <h2 className="text-xl font-bold mb-4">Pending Requests ({pendingRequests.length})</h2>
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-500">No pending requests</p>
                  </CardContent>
                </Card>
              ) : (
                pendingRequests.map(request => renderRequestCard(request))
              )}
            </div>
            
            {/* Recent Processed Requests */}
            <div>
              <h2 className="text-xl font-bold mb-4">Recent Processed Requests</h2>
              {processedRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-500">No processed requests</p>
                  </CardContent>
                </Card>
              ) : (
                processedRequests.slice(0, 10).map(request => renderRequestCard(request))
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}