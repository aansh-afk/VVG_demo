"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { AdminProvider, useAdmin } from "@/context/admin-context";
import { AdminLayout } from "@/components/admin/admin-layout";

function AdminDashboardContent() {
  const { isAdmin, isLoading } = useAdmin();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/auth/admin/login");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return <div>Loading admin dashboard...</div>;
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <Card className="mb-8">
          <CardHeader className="bg-blue-50 dark:bg-blue-950">
            <CardTitle>Welcome, Admin</CardTitle>
            <CardDescription>
              You are logged in as an administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-lg">
              Email: {user?.email}
            </p>
            <p className="text-lg">
              Name: {user?.displayName}
            </p>
            <p className="mt-4">
              From this dashboard, you can manage events, users, and approval requests.
            </p>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
              <CardDescription>Manage embassy events</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Create, edit, and delete events</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <p>View and manage user profiles</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Approvals</CardTitle>
              <CardDescription>Manage approval requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Review and process approval requests</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminDashboard() {
  return <AdminDashboardContent />;
}