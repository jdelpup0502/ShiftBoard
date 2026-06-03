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
    );
  }
  if (user.isAdmin) {
    moreLinks.push(
      { href: "/manage/audit", label: "Audit Log", icon: ClipboardDocumentListIcon },
    );
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch justify-around h-16">
          {primary.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                  active ? "text-accent" : "text-ink-muted"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-accent rounded-full" />
                )}
                <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2 : 1.6} />
                <span className="text-[10.5px] font-medium leading-none tracking-tight">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] text-ink-muted"
          >
            <Bars3Icon className="w-[22px] h-[22px]" strokeWidth={1.6} />
            <span className="text-[10.5px] font-medium leading-none tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="relative bg-surface rounded-t-2xl border-t border-line shadow-[0_-12px_30px_-12px_oklch(0_0_0/0.25)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line-soft">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-soft border border-accent-edge flex items-center justify-center text-sm font-semibold text-accent uppercase shrink-0">
                  {user.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink leading-tight">
                    {user.name}
                  </div>
                  {isManagerLike && (
                    <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted mt-0.5">
                      {user.isAdmin ? "Admin" : "Manager"}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMoreOpen(false)}
                className="p-2.5 -mr-1 text-ink-muted hover:text-ink"
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
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-[15px] ${
                      active
                        ? "bg-accent-soft text-accent font-semibold"
                        : "text-ink hover:bg-sunken"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-line-soft">
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <ThemeToggle />
                <span>Theme</span>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-ink bg-sunken hover:bg-line-soft"
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
