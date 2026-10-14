"use client";

import React, { useState, useEffect } from "react";
import HistoryTable from "@/components/HistoryTable";
import SessionDetailModal from "@/components/SessionDetailModal";
import { HasilTimbangan, AuthSession } from "@/types";

export default function AdminWeighingPage() {
  const [sessions, setSessions] = useState<HasilTimbangan[]>([]);
  const [selectedSession, setSelectedSession] = useState<HasilTimbangan | null>(null);

  const adminSession: AuthSession = {
    userId: "ADMIN",
    nama: "Administrator",
    email: "admin@packaging.local",
    role: "Admin",
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/weighing");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSessions(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Data Riwayat Penimbangan
        </h1>
      </div>

      <HistoryTable
        sessions={sessions}
        user={adminSession}
        onSelectSession={(s) => setSelectedSession(s)}
        onRefresh={fetchSessions}
      />

      <SessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
