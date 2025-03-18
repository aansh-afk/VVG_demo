"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/context/auth-context";
import { Event, getDocument, queryDocuments } from "@/lib/firestore";
import { where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { QRCodeData, encryptQRData, generateQRCodeData } from "@/lib/qr-utils";
import { toast } from "sonner";
import QRCode from "react-qr-code";

// Client component for search params
function QRCodeContent() {
  const { user, userData, isLoading } = useAuth();
  const router = useRouter();
  
  // Import useSearchParams inside the client component
  const { useSearchParams } = require("next/navigation");
  const searchParams = useSearchParams();
  const highlightedEventId = searchParams?.get("eventId");
  
  const [approvedEvents, setApprovedEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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
        // Fetch events that the user is approved to attend
        const eventsData = await queryDocuments<Event>("events", [
          where("attendees", "array-contains", user.uid)
        ]);
        setApprovedEvents(eventsData);
        
        // If there's a highlighted event ID from URL params, select it
        if (highlightedEventId) {
          const event = eventsData.find(e => e.id === highlightedEventId);
          if (event) {
            setSelectedEvent(event);
            generateQRCode(event);
          }
        }
      } catch (error) {
        console.error("Error fetching approved events:", error);
        toast.error("Failed to load your events");
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchEvents();
  }, [user, highlightedEventId]);

  const generateQRCode = async (event: Event) => {
    if (!user || !event) return;
    
    setIsGenerating(true);
    try {
      console.log("Starting QR code generation...");
      
      // Generate simplified QR code data with just userId and eventId
      const qrData = generateQRCodeData(
        user.uid,
        event.id
      );
      console.log("QR data generated:", qrData);
      
      // Encode the data (no encryption needed)
      console.log("Encoding data...");
      const encodedData = await encryptQRData(qrData);
      console.log("Data encoded successfully");
      
      // Set the QR code value
      setQrCodeValue(encodedData);
      console.log("QR code set successfully");
    } catch (error) {
      // More detailed error logging
      console.error("Error generating QR code:", error);
      console.error("Error type:", error instanceof Error ? error.name : typeof error);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      
      // Show user-friendly error
      toast.error("Failed to generate QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectEvent = async (event: Event) => {
    setSelectedEvent(event);
    generateQRCode(event);
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
        <h1 className="text-2xl font-bold mb-2">Your QR Codes</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Access your event QR codes for quick and secure check-in
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Event List */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Events</CardTitle>
                <CardDescription>
                  Select an event to view its QR code
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isDataLoading ? (
                  <div className="py-4 text-center">Loading your events...</div>
                ) : approvedEvents.length > 0 ? (
                  <div className="space-y-2">
                    {approvedEvents.map((event) => (
                      <Button
                        key={event.id}
                        variant={selectedEvent?.id === event.id ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto py-3 px-4"
                        onClick={() => handleSelectEvent(event)}
                      >
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {formatEventDate(event.datetime.toDate())}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-500 dark:text-slate-400">
                    <p>You haven't registered for any events yet.</p>
                    <Button 
                      asChild 
                      variant="link" 
                      className="mt-2 h-auto p-0"
                    >
                      <a href="/dashboard/events">Browse events</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* QR Code Display */}
          <div className="md:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedEvent ? selectedEvent.title : "QR Code"}
                </CardTitle>
                {selectedEvent && (
                  <CardDescription>
                    {formatEventDate(selectedEvent.datetime.toDate())}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 items-center justify-center">
                {isGenerating ? (
                  <div className="text-center py-8">
                    <p>Generating your QR code...</p>
                  </div>
                ) : selectedEvent && qrCodeValue ? (
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                      <QRCode
                        value={qrCodeValue}
                        size={220}
                        level="H"
                      />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      Present this QR code to security personnel when checking in at the event.
                      This code contains your identity verification information.
                    </p>
                    <div className="mt-4">
                      <Button onClick={() => window.print()}>
                        Print QR Code
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <p className="mb-4">Select an event to view its QR code</p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto opacity-20"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/></svg>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Main page component with Suspense boundary
export default function QRCodesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QRCodeContent />
    </Suspense>
  );
}