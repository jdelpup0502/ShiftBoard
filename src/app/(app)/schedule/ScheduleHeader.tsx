"use client";

import { isSameDay, format } from "date-fns";

function parseLocal(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function ScheduleHeader({ dayStrs }: { dayStrs: string[] }) {
  return (
    <>
      {dayStrs.map((s) => {
        const d = parseLocal(s);
        const isToday = isSameDay(d, new Date());
        return (
          <th
            key={s}
            className={`px-2 py-3 text-center border-l border-gray-200 dark:border-gray-700 ${isToday ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-gray-100 dark:bg-gray-700"}`}
          >
            <div className={`text-xs font-semibold uppercase tracking-wide ${isToday ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"}`}>
              {format(d, "EEE")}
            </div>
            <div className={`text-base font-bold mt-0.5 ${isToday ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"}`}>
              {format(d, "d")}
            </div>
            {isToday && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mx-auto mt-1" />}
          </th>
        );
      })}
    </>
  );
}
