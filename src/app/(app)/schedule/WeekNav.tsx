"use client";

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const LABELS: Record<number, string> = {
  [-1]: "Previous week",
  0: "This week",
  1: "Next week",
  2: "In 2 weeks",
};
const MIN_OFFSET = -1;
const MAX_OFFSET = 2;

interface Props {
  weekOffset: number;
  weekOfLabel: string;
}

export default function WeekNav({ weekOffset, weekOfLabel }: Props) {
  const canPrev = weekOffset > MIN_OFFSET;
  const canNext = weekOffset < MAX_OFFSET;
  const prevHref = `/schedule?week=${weekOffset - 1}`;
  const nextHref = `/schedule?week=${weekOffset + 1}`;

  const navBtnBase =
    "flex items-center justify-center w-9 h-9 rounded-md border border-line text-ink-muted bg-surface";
  const navBtnEnabled =
    "hover:bg-accent-soft hover:text-accent hover:border-accent-edge transition-colors";
  const navBtnDisabled = "opacity-35 cursor-not-allowed";

  return (
    <div className="flex items-end justify-between gap-3 w-full">
      <div className="min-w-0">
        <h1 className="display text-[34px] md:text-[44px] text-ink leading-none">Schedule</h1>
        <p className="mt-2 text-[13px] text-ink-muted flex items-center gap-2 flex-wrap">
          <span>Week of <span className="font-mono tnum text-ink-soft">{weekOfLabel}</span></span>
          {weekOffset !== 0 && (
            <span
              className={`inline-block text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded-sm ${
                weekOffset < 0
                  ? "bg-sunken text-ink-muted"
                  : "bg-accent-soft text-accent"
              }`}
            >
              {LABELS[weekOffset]}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {canPrev ? (
          <Link href={prevHref} className={`${navBtnBase} ${navBtnEnabled}`} aria-label="Previous week" scroll={false}>
            <ChevronLeftIcon className="w-4 h-4" />
          </Link>
        ) : (
          <span className={`${navBtnBase} ${navBtnDisabled}`} aria-label="Previous week (disabled)">
            <ChevronLeftIcon className="w-4 h-4" />
          </span>
        )}
        {canNext ? (
          <Link href={nextHref} className={`${navBtnBase} ${navBtnEnabled}`} aria-label="Next week" scroll={false}>
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
