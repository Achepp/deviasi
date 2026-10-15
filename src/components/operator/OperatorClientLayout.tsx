"use client";

import React from "react";
import OperatorHeader from "./OperatorHeader";
import OperatorBottomNav from "./OperatorBottomNav";
import { AuthSession } from "@/types";

interface OperatorClientLayoutProps {
  user: AuthSession;
  children: React.ReactNode;
}

export default function OperatorClientLayout({ user, children }: OperatorClientLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center transition-colors">
      {/* Responsive mobile portrait container 9:16 */}
      <div className="w-full sm:max-w-md min-h-screen bg-white dark:bg-slate-900 sm:border-x border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col relative">
        <OperatorHeader user={user} />

        {/* Main content area */}
        <main className="flex-1 p-4 sm:p-5 pb-24 sm:pb-28">
          {children}
        </main>

        <OperatorBottomNav />
      </div>
    </div>
  );
}
