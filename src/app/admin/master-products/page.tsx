"use client";

import React from "react";
import MasterProdukView from "@/components/MasterProdukView";
import { AuthSession } from "@/types";

export default function AdminMasterProductsPage() {
  const adminUser: AuthSession = {
    userId: "ADMIN",
    nama: "Administrator",
    email: "admin@packaging.local",
    role: "Admin",
  };

  return (
    <div className="space-y-4">
      <MasterProdukView user={adminUser} />
    </div>
  );
}
