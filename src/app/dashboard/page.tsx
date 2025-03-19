"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Event, ApprovalRequest, queryDocuments } from "@/lib/firestore";
import { where, limit, orderBy, Timestamp } from "firebase/firestore";
import { Preloader } from "@/components/ui/preloader";

export default function DashboardPage() {
  const { user, userData, isLoading } = useAuth();
  const router = useRouter();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<Event[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Fetch data when user is available
    const fetchData = async () => {
      if (!user) return;
      
      setIsDataLoading(true);
      try {
        // Fetch upcoming events (limit to next 5)
        const now = Timestamp.now();
        const upcomingEventsData = await queryDocuments<Event>("events", [
          where("datetime", ">", now),
          orderBy("datetime", "asc"),
          limit(5)
        ]);
        setUpcomingEvents(upcomingEventsData);

        // Fetch user's pending approval requests
        const pendingRequestsData = await queryDocuments<ApprovalRequest>("approvalRequests", [
          where("userId", "==", user.uid),
          where("status", "==", "pending")
        ]);
        setPendingRequests(pendingRequestsData);

        // Fetch user's approved events
        const approvedEventsData = await queryDocuments<Event>("events", [
          where("attendees", "array-contains", user.uid)
        ]);
        setApprovedEvents(approvedEventsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Format date for display
  const formatEventDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Loading state or not authenticated
  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <Preloader />
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user.displayName?.split(' ')[0] || 'Guest'}</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Here's what's happening with your upcoming events
            </p>
          </div>
          <Button asChild className="mt-4 md:mt-0 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all duration-200">
            <Link href="/dashboard/events">Browse All Events</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upcoming Events Card */}
          <Card className="border-gray-200 dark:border-gray-800 hover-effect">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
              <CardDescription>Events happening soon</CardDescription>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="text-center py-4">Loading events...</div>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatEventDate(event.datetime)}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="border-black text-black hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-gray-900 transition-all duration-200"
                      >
                        <Link href={`/dashboard/events/${event.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                  No upcoming events
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Registrations Card */}
          <Card className="border-gray-200 dark:border-gray-800 hover-effect">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">My Registrations</CardTitle>
              <CardDescription>Events you're attending</CardDescription>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="text-center py-4">Loading registrations...</div>
              ) : approvedEvents.length > 0 ? (
                <div className="space-y-3">
                  {approvedEvents.map((event) => (
                    <div key={event.id} className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatEventDate(event.datetime)}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="border-black text-black hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-gray-900 transition-all duration-200"
                      >
                        <Link href={`/dashboard/qr-codes?eventId=${event.id}`}>
                          QR Code
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                  You haven't registered for any events
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Approvals Card */}
          <Card className="border-gray-200 dark:border-gray-800 hover-effect">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              <CardDescription>Your approval requests</CardDescription>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="text-center py-4">Loading requests...</div>
              ) : pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Event Request</p>
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Requested on {request.requestedAt.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                  No pending approval requests
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Button 
                asChild 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center border-black text-black hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-gray-900 transition-all duration-200 hover-effect"
              >
                <Link href="/dashboard/events">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  Browse Events
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center border-black text-black hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-gray-900 transition-all duration-200 hover-effect"
              >
                <Link href="/dashboard/registrations">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  My Registrations
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center border-black text-black hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-gray-900 transition-all duration-200 hover-effect"
              >
                <Link href="/dashboard/qr-codes">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/></svg>
                  My QR Codes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}