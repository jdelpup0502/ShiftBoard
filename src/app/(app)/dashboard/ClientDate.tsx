"use client";

import { format } from "date-fns";

export default function ClientDate() {
  return (
    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
      {format(new Date(), "EEEE, MMMM d, yyyy")}
    </p>
  );
}
