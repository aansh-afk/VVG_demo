"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Group, getDocument, queryDocuments, updateDocument } from "@/lib/firestore";
import { arrayUnion, arrayRemove } from "firebase/firestore";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function GroupMembersPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const router = useRouter();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingMembers, setUpdatingMembers] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch all users
        const usersData = await queryDocuments<User>("users");
        setAllUsers(usersData);

        // Separate group members and available users
        const memberUsers: User[] = [];
        const nonMemberUsers: User[] = [];

        usersData.forEach(user => {
          if (groupData.members.includes(user.uid)) {
            memberUsers.push(user);
          } else {
            nonMemberUsers.push(user);
          }
        });

        setMembers(memberUsers);
        setAvailableUsers(nonMemberUsers);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load group and user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [groupId, router]);

  // Filter available users when search query changes
  const filteredAvailableUsers = searchQuery.trim() === ""
    ? availableUsers
    : availableUsers.filter(user => 
        (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const addUserToGroup = async (userId: string) => {
    if (!group) return;
    
    setUpdatingMembers(true);
    try {
      // Add user to group's members
      await updateDocument("groups", groupId, {
        members: arrayUnion(userId)
      });
      
      // Update local state
      const userToAdd = availableUsers.find(u => u.uid === userId);
      if (userToAdd) {
        // Move from available to members
        setMembers([...members, userToAdd]);
        setAvailableUsers(availableUsers.filter(u => u.uid !== userId));
      }
      
      toast.success("User added to group");
    } catch (error) {
      console.error("Error adding user to group:", error);
      toast.error("Failed to add user to group");
    } finally {
      setUpdatingMembers(false);
    }
  };

  const removeUserFromGroup = async (userId: string) => {
    if (!group) return;
    
    setUpdatingMembers(true);
    try {
      // Remove user from group's members
      await updateDocument("groups", groupId, {
        members: arrayRemove(userId)
      });
      
      // Update local state
      const userToRemove = members.find(u => u.uid === userId);
      if (userToRemove) {
        // Move from members to available
        setAvailableUsers([...availableUsers, userToRemove]);
        setMembers(members.filter(u => u.uid !== userId));
      }
      
      toast.success("User removed from group");
    } catch (error) {
      console.error("Error removing user from group:", error);
      toast.error("Failed to remove user from group");
    } finally {
      setUpdatingMembers(false);
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <p className="text-center py-10">Loading...</p>
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
          <div>
            <h1 className="text-3xl font-bold">Manage Group Members</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {group.name}
            </p>
          </div>
          <div>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/admin/groups/${groupId}`)}
            >
              Back to Group
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Group Members */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Current Members ({members.length})</h2>
              {members.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                  No members in this group
                </p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {members.map((user) => (
                    <div key={user.uid} className="p-3 border rounded-md flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                          <AvatarFallback>{user.displayName ? getInitials(user.displayName) : "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName || "Unnamed User"}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => removeUserFromGroup(user.uid)}
                        disabled={updatingMembers}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Users */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Add Users</h2>
              <div className="mb-4">
                <Label htmlFor="search-users">Search Users</Label>
                <Input
                  id="search-users"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {filteredAvailableUsers.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                  {searchQuery ? "No matching users found" : "No additional users available"}
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredAvailableUsers.map((user) => (
                    <div key={user.uid} className="p-3 border rounded-md flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                          <AvatarFallback>{user.displayName ? getInitials(user.displayName) : "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName || "Unnamed User"}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => addUserToGroup(user.uid)}
                        disabled={updatingMembers}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}