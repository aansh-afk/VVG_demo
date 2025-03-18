"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { User, Group, getDocument, queryDocuments, updateDocument } from "@/lib/firestore";
import { arrayUnion, arrayRemove } from "firebase/firestore";

export default function UserGroupsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingGroups, setUpdatingGroups] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch user details
        const userData = await getDocument<User>("users", userId);
        if (!userData) {
          toast.error("User not found");
          router.push("/admin/users");
          return;
        }
        setUser(userData);

        // Fetch all groups
        const groupsData = await queryDocuments<Group>("groups");
        setAllGroups(groupsData);

        // Separate user's groups and available groups
        const userGroups: Group[] = [];
        const availableGroups: Group[] = [];

        groupsData.forEach(group => {
          if (group.members.includes(userId)) {
            userGroups.push(group);
          } else {
            availableGroups.push(group);
          }
        });

        setUserGroups(userGroups);
        setAvailableGroups(availableGroups);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load user and group data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, router]);

  // Filter available groups when search query changes
  const filteredAvailableGroups = searchQuery.trim() === ""
    ? availableGroups
    : availableGroups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const addUserToGroup = async (groupId: string) => {
    if (!user) return;
    
    setUpdatingGroups(true);
    try {
      // Add user to group's members
      await updateDocument("groups", groupId, {
        members: arrayUnion(userId)
      });
      
      // Add group to user's groups array
      await updateDocument("users", userId, {
        groups: arrayUnion(groupId)
      });
      
      // Update local state
      const groupToAdd = availableGroups.find(g => g.id === groupId);
      if (groupToAdd) {
        // Move from available to user groups
        setUserGroups([...userGroups, {...groupToAdd, members: [...groupToAdd.members, userId]}]);
        setAvailableGroups(availableGroups.filter(g => g.id !== groupId));
      }
      
      toast.success("User added to group");
    } catch (error) {
      console.error("Error adding user to group:", error);
      toast.error("Failed to add user to group");
    } finally {
      setUpdatingGroups(false);
    }
  };

  const removeUserFromGroup = async (groupId: string) => {
    if (!user) return;
    
    setUpdatingGroups(true);
    try {
      // Remove user from group's members
      await updateDocument("groups", groupId, {
        members: arrayRemove(userId)
      });
      
      // Remove group from user's groups array
      await updateDocument("users", userId, {
        groups: arrayRemove(groupId)
      });
      
      // Update local state
      const groupToRemove = userGroups.find(g => g.id === groupId);
      if (groupToRemove) {
        // Move from user groups to available
        setAvailableGroups([...availableGroups, {
          ...groupToRemove, 
          members: groupToRemove.members.filter(m => m !== userId)
        }]);
        setUserGroups(userGroups.filter(g => g.id !== groupId));
      }
      
      toast.success("User removed from group");
    } catch (error) {
      console.error("Error removing user from group:", error);
      toast.error("Failed to remove user from group");
    } finally {
      setUpdatingGroups(false);
    }
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

  if (!user) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <p className="text-center py-10">User not found.</p>
          <div className="flex justify-center">
            <Button onClick={() => router.push("/admin/users")}>
              Back to Users
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
            <h1 className="text-3xl font-bold">Manage User Groups</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {user.displayName} ({user.email})
            </p>
          </div>
          <div>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/admin/users/${userId}`)}
            >
              Back to User
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User's Current Groups */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Current Groups</h2>
              {userGroups.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                  User is not assigned to any groups
                </p>
              ) : (
                <div className="space-y-3">
                  {userGroups.map((group) => (
                    <div key={group.id} className="p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {group.description || "No description"}
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => removeUserFromGroup(group.id)}
                        disabled={updatingGroups}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Groups */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Available Groups</h2>
              <div className="mb-4">
                <Label htmlFor="search-groups">Search Groups</Label>
                <Input
                  id="search-groups"
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {filteredAvailableGroups.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                  {searchQuery ? "No matching groups found" : "No additional groups available"}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredAvailableGroups.map((group) => (
                    <div key={group.id} className="p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {group.description || "No description"}
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => addUserToGroup(group.id)}
                        disabled={updatingGroups}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex justify-center">
                <Button 
                  onClick={() => router.push("/admin/groups/create")}
                >
                  Create New Group
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}