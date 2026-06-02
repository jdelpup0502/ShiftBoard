import { db } from "./db";

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
}
