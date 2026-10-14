"use client";

import React, { useState, useEffect } from "react";
import WeighingForm from "@/components/WeighingForm";
import { AuthSession } from "@/types";

export default function OperatorInputPage() {
  const [user, setUser] = useState<AuthSession>({
    userId: "OPERATOR",
    nama: "Operator",
    email: "operator@packaging.local",
    role: "Operator",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.user) {
          setUser(json.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <WeighingForm user={user} />
    </div>
  );
}
