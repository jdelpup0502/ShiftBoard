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
  { href: "/manage/audit", label: "Audit Log", icon: ClipboardDocumentListIcon },
];

export default function Nav({ user }: { user: User }) {
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 shrink-0">
            <CalendarDaysIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-200 tracking-tight">ShiftBoard</span>
          </div>

          {/* Nav links */}
          <div className="flex items-center">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 h-14 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

            {user.role === "MANAGER" && (
              <>
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
                {managerLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-1.5 px-3 h-14 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>

        {/* User area */}
        <div className="flex items-center gap-3">
          <Link href="/account" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase shrink-0">
              {user.name[0]}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-none">{user.name}</div>
              {user.role === "MANAGER" && (
                <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Manager</div>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-3">
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                title="Sign out"
                className="flex items-center p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowRightStartOnRectangleIcon className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
