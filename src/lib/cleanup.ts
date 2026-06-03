import { addDays, startOfWeek } from "date-fns";
import { db } from "./db";

export async function pruneOldShifts(): Promise<number> {
  const currentTuesday = startOfWeek(new Date(), { weekStartsOn: 2 });
  const cutoff = addDays(currentTuesday, -7);
  const result = await db.shift.deleteMany({
    where: { date: { lt: cutoff } },
  });
  return result.count;
}
