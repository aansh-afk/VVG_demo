"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocument, updateDocument, deleteDocument, queryDocuments, Group, User, Event } from "@/lib/firestore";
import { toast } from "sonner";
import { where } from "firebase/firestore";

export default function GroupDetailPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const router = useRouter();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [preApprovedEvents, setPreApprovedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const fetchGroupData = async () => {
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
        setFormData({
          name: groupData.name,
          description: groupData.description || "",
        });

        // Fetch members
        if (groupData.members.length > 0) {
          const memberPromises = groupData.members.map(async (memberId) => {
            const userData = await getDocument<User>("users", memberId);
            return userData;
          });
          const memberResults = await Promise.all(memberPromises);
          setMembers(memberResults.filter((user): user is User => user !== null));
        }

        // Fetch pre-approved events
        if (groupData.preApprovedEvents && groupData.preApprovedEvents.length > 0) {
          const eventPromises = groupData.preApprovedEvents.map(async (eventId) => {
            const eventData = await getDocument<Event>("events", eventId);
            return eventData;
          });
          const eventResults = await Promise.all(eventPromises);
          setPreApprovedEvents(eventResults.filter((event): event is Event => event !== null));
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
        toast.error("Failed to load group details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!group) return;
    
    setIsSaving(true);
    try {
      await updateDocument("groups", groupId, {
        name: formData.name,
        description: formData.description,
      });
      
      // Update local state
      setGroup({
        ...group,
        name: formData.name,
        description: formData.description,
      });
      
      toast.success("Group updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Failed to update group");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!group) return;
    
    if (!confirm(`Are you sure you want to delete the group "${group.name}"? This action cannot be undone.`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteDocument("groups", groupId);
      toast.success("Group deleted successfully");
      router.push("/admin/groups");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <p className="text-center py-10">Loading group details...</p>
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
          <h1 className="text-3xl font-bold">
            {isEditing ? "Edit Group" : "Group Details"}
          </h1>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => router.push("/admin/groups")}
            >
              Back to Groups
            </Button>
            {!isEditing && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Group
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Group"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Group Details Card */}
          <Card className="lg:col-span-3">
            {isEditing ? (
              <CardContent className="pt-6">
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Group Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Description</h3>
                      <p className="text-slate-700 dark:text-slate-300">
                        {group.description || "No description provided"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
          
          {/* Members Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                  No members in this group
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.uid} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden">
                          {member.photoURL && (
                            <img 
                              src={member.photoURL} 
                              alt={member.displayName || ""} 
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{member.displayName || "Unnamed User"}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/admin/groups/${groupId}/members`)}
                >
                  Manage Members
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Pre-approved Events Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Pre-approved Events ({preApprovedEvents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {preApprovedEvents.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                  This group has no pre-approved events
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {preApprovedEvents.map((event) => (
                    <div key={event.id} className="p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm">
                          {event.datetime.toDate().toLocaleDateString()} | {event.location}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/admin/events/${event.id}`)}
                      >
                        View Event
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/admin/groups/${groupId}/events`)}
                >
                  Manage Pre-approved Events
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}