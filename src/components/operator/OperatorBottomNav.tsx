"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, History, User } from "lucide-react";

export default function OperatorBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Beranda",
      href: "/operator/home",
      icon: Home,
    },
    {
      name: "Input",
      href: "/operator/input",
      icon: PlusCircle,
    },
    {
      name: "Riwayat",
      href: "/operator/history",
      icon: History,
    },
    {
      name: "Profil",
      href: "/operator/profile",
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Operator"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full sm:max-w-2xl md:max-w-3xl z-40 bg-white dark:bg-slate-900 border-t sm:border-x border-slate-200/90 dark:border-slate-800 shadow-[0_-2px_12px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom,0px)] transition-colors"
    >
      <div className="w-full grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/operator/input" && pathname.startsWith("/operator/input"));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] h-full transition-colors select-none ${
                isActive
                  ? "text-blue-600 dark:text-blue-500 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
              }`}
            >
              {/* Active top line indicator */}
              {isActive && (
                <span className="absolute top-0 w-10 sm:w-12 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-full" />
              )}
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? "stroke-[2.5] scale-105" : "stroke-[1.75]"
                }`}
              />
              <span className="text-[11px] sm:text-xs leading-none tracking-tight">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
