"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/actions/auth";
import type { User } from "@prisma/client";
import {
  CalendarDaysIcon,
  HomeIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "./ThemeToggle";

type IconType = typeof HomeIcon;

interface TabItem {
  href: string;
  label: string;
  icon: IconType;
}

export default function MobileTabBar({ user }: { user: User }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isManagerLike = user.role === "MANAGER" || user.isAdmin;

  const primary: TabItem[] = [
    { href: "/dashboard", label: "Home", icon: HomeIcon },
    { href: "/schedule", label: "Schedule", icon: CalendarDaysIcon },
    { href: "/marketplace", label: "Market", icon: ShoppingBagIcon },
  ];

  // Managers don't have a personal /availability page; show Account instead
  if (user.role === "MANAGER") {
    primary.push({ href: "/account", label: "Account", icon: UserCircleIcon });
  } else {
    primary.push({ href: "/availability", label: "Avail", icon: CheckCircleIcon });
  }

  const moreLinks: TabItem[] = [];
  if (user.role !== "MANAGER") {
    moreLinks.push({ href: "/account", label: "Account", icon: UserCircleIcon });
  }
  if (isManagerLike) {
    moreLinks.push(
      { href: "/manage/staffing", label: "Staffing", icon: ClipboardDocumentListIcon },
      { href: "/manage/employees", label: "Employees", icon: UserGroupIcon },
      { href: "/manage/availability", label: "Staff Availability", icon: CheckCircleIcon },
      { href: "/manage/audit", label: "Audit Log", icon: ClipboardDocumentListIcon },
    );
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch justify-around h-16">
          {primary.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                  active
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[11px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] text-gray-500 dark:text-gray-400"
          >
            <Bars3Icon className="w-6 h-6" />
            <span className="text-[11px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="relative bg-white dark:bg-gray-900 rounded-t-2xl border-t border-gray-200 dark:border-gray-800 shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 uppercase shrink-0">
                  {user.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {user.name}
                  </div>
                  {isManagerLike && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {user.isAdmin ? "Admin" : "Manager"}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMoreOpen(false)}
                className="p-2.5 -mr-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="px-2 py-2 max-h-[60vh] overflow-y-auto">
              {moreLinks.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base ${
                      active
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <ThemeToggle />
                <span>Theme</span>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
