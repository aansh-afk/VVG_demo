"use client";

import { useState, useEffect, useRef } from "react";
import { QrReader } from "react-qr-reader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { verifyQRCode } from "@/lib/security/qr-scanner";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { toast } from "sonner";

interface EventInfo {
  id: string;
  title: string;
  date: Date;
  location: string;
}

export default function SecurityScanPage() {
  const [scanning, setScanning] = useState(true);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  
  const router = useRouter();

  // Fetch upcoming events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const eventsRef = collection(db, "events");
        
        // First, let's try to query with the correct field name structure based on your data model
        // Try different field names and formats used in the data model
        const possibleQueries = [
          // Try using "date" field
          query(eventsRef, where("date", ">=", today), orderBy("date", "asc")),
          // Try using "datetime" field
          query(eventsRef, where("datetime", ">=", today), orderBy("datetime", "asc")),
          // Try using "eventDate" field
          query(eventsRef, where("eventDate", ">=", today), orderBy("eventDate", "asc"))
        ];
        
        let eventsData: EventInfo[] = [];
        let querySuccess = false;
        
        // Try each possible query until we find one that works
        for (const q of possibleQueries) {
          try {
            console.log("Trying to fetch events...");
            const querySnapshot = await getDocs(q);
            
            // If we made it here without error, query succeeded
            querySuccess = true;
            
            // Log results
            console.log(`Found ${querySnapshot.size} events`);
            
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              console.log("Event data:", data);
              
              // Get date from whichever field is available
              const eventDate = data.date?.toDate() || 
                               data.datetime?.toDate() || 
                               data.eventDate?.toDate() || 
                               new Date();
              
              eventsData.push({
                id: doc.id,
                title: data.title || "Untitled Event",
                date: eventDate,
                location: data.location || "No location"
              });
            });
            
            // If we found events, break out of the loop
            if (eventsData.length > 0) {
              break;
            }
          } catch (err) {
            // If this query fails, we'll try the next format
            console.log("Query failed, trying another format");
          }
        }
        
        // If queries worked but no events found, or if no queries worked
        if (eventsData.length === 0) {
          console.log("No events found in database or queries failed. Using sample data");
          
          // Fetch all events without filtering to see what's available
          try {
            const allEvents = await getDocs(collection(db, "events"));
            console.log(`Found ${allEvents.size} total events in database`);
            
            allEvents.forEach((doc) => {
              console.log("Available event:", doc.id, doc.data());
            });
          } catch (err) {
            console.error("Error checking all events:", err);
          }
          
          // Add sample events for testing
          eventsData = [
            {
              id: "event1",
              title: "Republic Day Celebration",
              date: new Date(2025, 0, 26, 10, 0),
              location: "Embassy Main Hall"
            },
            {
              id: "event2",
              title: "Independence Day Ceremony",
              date: new Date(2025, 7, 15, 9, 30),
              location: "Embassy Garden"
            },
            {
              id: "event3", 
              title: "Diwali Cultural Night",
              date: new Date(2025, 10, 12, 18, 0),
              location: "Community Center"
            }
          ];
        }
        
        // Sort events by date (in case different fields were used)
        eventsData.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
        // Add fallback sample events
        setEvents([
          {
            id: "event1",
            title: "Republic Day Celebration",
            date: new Date(2025, 0, 26, 10, 0),
            location: "Embassy Main Hall"
          },
          {
            id: "event2",
            title: "Independence Day Ceremony",
            date: new Date(2025, 7, 15, 9, 30),
            location: "Embassy Garden"
          },
          {
            id: "event3",
            title: "Diwali Cultural Night",
            date: new Date(2025, 10, 12, 18, 0),
            location: "Community Center"
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Handle QR scanning result
  const handleScan = async (result: any, error: any) => {
    if (result) {
      setScanning(false);
      setScanResult(result.text);
      await handleVerification(result.text);
    }
    
    if (error) {
      console.error("QR scanning error:", error);
    }
  };

  // Handle verification of the QR code data
  const handleVerification = async (encryptedData: string) => {
    if (!selectedEvent) return;
    
    setIsVerifying(true);
    try {
      const result = await verifyQRCode(encryptedData, selectedEvent.id);
      setVerificationResult(result);
      
      if (result.valid) {
        toast.success("Attendee verified successfully!");
        
        // In a real app, you might want to mark the attendance in the database
        // await markAttendance(result.data.userId, selectedEvent.id);
      } else {
        toast.error(`Verification failed: ${result.reason}`);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        valid: false,
        reason: "Failed to verify QR code"
      });
      toast.error("Failed to verify QR code");
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset scanner to scan another QR code
  const handleReset = () => {
    setScanResult(null);
    setVerificationResult(null);
    setScanning(true);
    setShowScanner(false);
  };

  // Select an event for verification
  const handleEventSelect = (event: EventInfo) => {
    setSelectedEvent(event);
    setScanResult(null);
    setVerificationResult(null);
    setScanning(true);
    setShowScanner(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Select an Event</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Choose the event you want to scan QR codes for
            </p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card key={event.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleEventSelect(event)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>
                    {event.date.toLocaleDateString()} at {event.date.toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{event.location}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Scan QR Codes for this Event</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Upcoming Events</CardTitle>
              <CardDescription>
                There are no events available for scanning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-slate-500 dark:text-slate-400 my-6">
                No events were found in the database. Please contact an administrator if you believe this is an error.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Events
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{selectedEvent.title}</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {selectedEvent.date.toLocaleDateString()} at {selectedEvent.location}
          </p>
        </div>
        <Button variant="outline" onClick={() => setSelectedEvent(null)} className="mt-4 md:mt-0">
          Change Event
        </Button>
      </div>

      {scanning && !scanResult ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Scan Attendee QR Code</CardTitle>
            <CardDescription>
              Upload a QR code image to verify attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mx-auto max-w-md">
              {showScanner ? (
                // QR Scanner component
                <div className="border rounded-lg overflow-hidden">
                  <QrReader
                    onResult={handleScan}
                    constraints={{ facingMode: "environment" }}
                    scanDelay={1000}
                    videoStyle={{ width: '100%', height: '100%' }}
                    videoContainerStyle={{ 
                      width: '100%', 
                      height: '300px',
                      borderRadius: '0.5rem',
                      overflow: 'hidden'
                    }}
                    containerStyle={{ width: '100%' }}
                    ViewFinder={() => (
                      <div className="absolute inset-0 border-[3px] border-primary/20 rounded-lg">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-primary rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-primary rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-primary rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-primary rounded-br-lg"></div>
                      </div>
                    )}
                  />
                </div>
              ) : (
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  
                  <h3 className="mt-4 text-sm font-medium text-slate-900 dark:text-slate-200">
                    Start QR Code Scanner
                  </h3>
                  
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Scan QR codes from images using your device camera
                  </p>
                  
                  <Button
                    onClick={() => setShowScanner(true)}
                    className="mt-6"
                    size="lg"
                  >
                    Start Scanning
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          
          {showScanner && (
            <CardFooter>
              <Button 
                onClick={() => setShowScanner(false)}
                variant="outline"
                className="w-full"
              >
                Cancel Scanning
              </Button>
            </CardFooter>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent mr-2"></div>
                  Verifying...
                </>
              ) : verificationResult?.valid ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Attendee Verified
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Verification Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isVerifying ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : verificationResult?.valid ? (
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-500 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-700 dark:text-green-400">Valid QR code for this event</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-md">
                  {verificationResult.data?.photoReference && (
                    <div className="w-24 h-24 relative rounded-md overflow-hidden">
                      <Image 
                        src={verificationResult.data.photoReference} 
                        alt={verificationResult.data.name || "Attendee"}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-semibold">{verificationResult.data?.name || "Unnamed Attendee"}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      User ID: {verificationResult.data?.userId || "Unknown"}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      QR Generated: {verificationResult.data?.timestamp ? new Date(verificationResult.data.timestamp).toLocaleString() : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-500 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-400">{verificationResult?.reason || "QR code verification failed"}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleReset} className="w-full">
              Scan Another QR Code
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}