"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/context/auth-context";
import { Event, queryDocuments } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { orderBy, where, Timestamp } from "firebase/firestore";

export default function EventsPage() {
  const { user, userData, isLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      
      setIsDataLoading(true);
      try {
        // Fetch all events, ordered by date (newest first)
        const now = Timestamp.now();
        const eventsData = await queryDocuments<Event>("events", [
          where("datetime", ">=", now),
          orderBy("datetime", "asc")
        ]);
        setEvents(eventsData);
        setFilteredEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  // Filter events when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEvents(events);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = events.filter(
        (event) =>
          event.title.toLowerCase().includes(lowercaseQuery) ||
          event.description.toLowerCase().includes(lowercaseQuery) ||
          event.location.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, events]);

  // Format date for event display
  const formatEventDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  // Check if user is pre-approved for an event
  const isPreApproved = (event: Event) => {
    if (!user || !userData) return false;
    
    // Check if user is directly pre-approved
    if (event.preApprovedUsers && event.preApprovedUsers.includes(user.uid)) {
      return true;
    }
    
    // Check if user belongs to a pre-approved group
    if (userData.groups && userData.groups.length > 0 && event.preApprovedGroups && event.preApprovedGroups.length > 0) {
      return event.preApprovedGroups.some(groupId => userData.groups.includes(groupId));
    }
    
    return false;
  };

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">Upcoming Events</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Browse and register for upcoming events
            </p>
          </div>
        </div>

        {/* Search and filter */}
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Events Grid */}
        {isDataLoading ? (
          <div className="flex justify-center items-center py-12">
            <p>Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>{formatEventDate(event.datetime)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-2">
                    {event.description}
                  </p>
                  <div className="flex items-center space-x-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span className="text-slate-500 dark:text-slate-400">
                      {event.location}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t pt-4">
                  {event.requiresApproval ? (
                    isPreApproved(event) ? (
                      <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Pre-approved
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-1 rounded">
                        Requires approval
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded">
                      Open registration
                    </span>
                  )}
                  <Button asChild>
                    <Link href={`/dashboard/events/${event.id}`}>
                      View Details
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg font-medium">No events found</p>
            <p className="text-slate-500 dark:text-slate-400">
              Try adjusting your search or check back later for new events
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}