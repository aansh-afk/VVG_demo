"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { Event, queryDocuments } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const eventsData = await queryDocuments<Event>("events");
        // Sort events by date (newest first)
        eventsData.sort((a, b) => {
          return b.datetime.toMillis() - a.datetime.toMillis();
        });
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Failed to load events");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Format date for display
  const formatEventDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Events Management</h1>
          <Button onClick={() => router.push("/admin/events/create")}>
            Create New Event
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <p className="text-lg text-foreground">
                  No events found. Create your first event to get started.
                </p>
                <Button 
                  onClick={() => router.push("/admin/events/create")}
                  className="mt-4"
                >
                  Create New Event
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 bg-card-lighter">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">{event.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          {formatEventDate(event.datetime)}
                        </p>
                        <p className="text-sm mt-1 text-foreground">
                          Location: {event.location}
                        </p>
                        <p className="text-sm mt-1 text-foreground">
                          Capacity: {event.capacity} | Requires Approval: {event.requiresApproval ? "Yes" : "No"}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin/events/${event.id}`}>View Details</Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-foreground">
                      {event.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}