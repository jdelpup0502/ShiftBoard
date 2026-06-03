import Link from "next/link";
import { logout } from "@/app/actions/auth";
import type { User } from "@prisma/client";
import {
  CalendarDaysIcon,
  HomeIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowRightStartOnRectangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/schedule", label: "Schedule", icon: CalendarDaysIcon },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBagIcon },
  { href: "/availability", label: "Availability", icon: CheckCircleIcon },
];

const managerLinks = [
  { href: "/manage/staffing", label: "Staffing", icon: ClipboardDocumentListIcon },
  { href: "/manage/employees", label: "Employees", icon: UserGroupIcon },
  { href: "/manage/availability", label: "Availability", icon: CheckCircleIcon },
];

const adminLinks = [
  { href: "/manage/audit", label: "Audit", icon: ClipboardDocumentListIcon },
];

const linkClass =
  "flex items-center gap-2 px-3 h-14 text-[13px] text-ink-soft hover:text-ink hover:bg-sunken transition-colors";

export default function Nav({ user }: { user: User }) {
  return (
    <nav className="hidden md:block bg-surface border-b border-line">
      <div className="px-6 lg:px-8 flex items-center justify-between h-14">
        <div className="flex items-center gap-10">
          {/* Wordmark */}
          <Link href="/dashboard" className="flex items-baseline gap-1.5 shrink-0 group">
            <span className="wordmark text-[22px] text-ink leading-none">shiftboard</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent translate-y-[-1px] transition-transform group-hover:scale-125" />
          </Link>

          <div className="flex items-center">
            {navLinks.filter(({ href }) => !(href === "/availability" && user.role === "MANAGER")).map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={linkClass}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

            {(user.role === "MANAGER" || user.isAdmin) && (
              <>
                <div className="w-px h-4 bg-line mx-2" />
                {managerLinks.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className={linkClass}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
                {user.isAdmin && adminLinks.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className={linkClass}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/account" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-accent-soft border border-accent-edge flex items-center justify-center text-[11px] font-semibold text-accent uppercase shrink-0">
              {user.name[0]}
            </div>
            <div className="text-right leading-none">
              <div className="text-[13px] font-medium text-ink">{user.name}</div>
              {(user.role === "MANAGER" || user.isAdmin) && (
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-muted mt-1 tnum">
                  {user.isAdmin ? "Admin" : "Manager"}
                </div>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-1 border-l border-line pl-3">
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                title="Sign out"
                className="flex items-center p-2.5 rounded-md text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
              >
                <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
