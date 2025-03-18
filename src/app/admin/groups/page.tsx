"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Group, queryDocuments } from "@/lib/firestore";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const groupsData = await queryDocuments<Group>("groups");
        setGroups(groupsData);
        setFilteredGroups(groupsData);
      } catch (error) {
        console.error("Error fetching groups:", error);
        toast.error("Failed to load groups");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Filter groups when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredGroups(groups);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = groups.filter(
        (group) =>
          group.name.toLowerCase().includes(lowercaseQuery) ||
          (group.description && group.description.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Group Management</h1>
          <Button onClick={() => router.push("/admin/groups/create")}>
            Create New Group
          </Button>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search groups by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-lg"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <p>Loading groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  {searchQuery 
                    ? "No groups found matching your search." 
                    : "No groups found. Create your first group to get started."}
                </p>
                {!searchQuery && (
                  <Button 
                    onClick={() => router.push("/admin/groups/create")}
                    className="mt-4"
                  >
                    Create New Group
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold">{group.name}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {group.description || "No description"}
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {group.members.length} members
                        </span>
                        {group.preApprovedEvents && group.preApprovedEvents.length > 0 && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {group.preApprovedEvents.length} pre-approved events
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <Link href={`/admin/groups/${group.id}/members`}>Manage Members</Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <Link href={`/admin/groups/${group.id}`}>Group Details</Link>
                      </Button>
                    </div>
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