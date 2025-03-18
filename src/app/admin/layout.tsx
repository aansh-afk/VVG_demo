"use client";

import { ReactNode } from "react";
import { AdminProvider } from "@/context/admin-context";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      {children}
    </AdminProvider>
  );
}