import { db } from "./db";

const MAX_AUDIT_ROWS = 100;

export async function writeAuditLog(
  actorId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  await db.auditLog.create({
    data: {
      actorId,
      action,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      metadata: JSON.stringify(metadata ?? {}),
    },
  });

  // Keep only the most recent MAX_AUDIT_ROWS entries
  const cutoff = await db.auditLog.findFirst({
    skip: MAX_AUDIT_ROWS - 1,
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (cutoff) {
    await db.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff.createdAt } },
    });
  }
}
