"use client";

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const LABELS = ["This week", "Next week", "In 2 weeks"] as const;
const MAX_OFFSET = 2;

interface Props {
  weekOffset: number;
  weekOfLabel: string;
}

export default function WeekNav({ weekOffset, weekOfLabel }: Props) {
  const canPrev = weekOffset > 0;
  const canNext = weekOffset < MAX_OFFSET;
  const prevHref = `/schedule?week=${weekOffset - 1}`;
  const nextHref = `/schedule?week=${weekOffset + 1}`;

  const navBtnBase =
    "p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400";
  const navBtnEnabled =
    "hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors";
  const navBtnDisabled = "opacity-40 cursor-not-allowed";

  return (
    <div className="flex items-center gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Schedule</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Week of {weekOfLabel}
          {weekOffset > 0 && (
            <span className="ml-2 inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {LABELS[weekOffset]}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 ml-2">
        {canPrev ? (
          <Link
            href={prevHref}
            className={`${navBtnBase} ${navBtnEnabled}`}
            aria-label="Previous week"
            scroll={false}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Link>
        ) : (
          <span className={`${navBtnBase} ${navBtnDisabled}`} aria-label="Previous week (disabled)">
            <ChevronLeftIcon className="w-4 h-4" />
          </span>
        )}
        {canNext ? (
          <Link
            href={nextHref}
            className={`${navBtnBase} ${navBtnEnabled}`}
            aria-label="Next week"
            scroll={false}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        ) : (
          <span className={`${navBtnBase} ${navBtnDisabled}`} aria-label="Next week (disabled)">
            <ChevronRightIcon className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );
}
