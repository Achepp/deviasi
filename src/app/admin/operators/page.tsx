"use client";

import React from "react";
import UserManagementView from "@/components/UserManagementView";
import { AuthSession } from "@/types";

export default function AdminOperatorsPage() {
  const adminUser: AuthSession = {
    userId: "ADMIN",
    nama: "Administrator",
    email: "admin@packaging.local",
    role: "Admin",
  };

  return (
    <div className="space-y-4">
      <UserManagementView user={adminUser} />
    </div>
  );
}
