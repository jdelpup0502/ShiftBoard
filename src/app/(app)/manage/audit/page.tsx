import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export default async function AuditPage() {
  await requireAdmin();

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { name: true } } },
  });

  return (
    <div className="max-w-5xl">
      <div className="mb-8 md:mb-10">
        <h1 className="display text-[34px] md:text-[44px] text-ink leading-none">Audit log</h1>
        <p className="text-[13px] text-ink-muted mt-3">
          Most recent <span className="font-mono tnum text-ink-soft">{logs.length}</span> manager actions (rolling)
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="border border-dashed border-line rounded-xl p-12 text-center bg-sunken/40">
          <p className="text-[13px] text-ink-faint italic">No audit log entries yet.</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-2.5">
            {logs.map((log) => {
              const meta = JSON.parse(log.metadata || "{}") as Record<string, string>;
              const entries = Object.entries(meta);
              return (
                <div key={log.id} className="bg-surface border border-line rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-accent truncate">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-ink-faint tabular-nums shrink-0 uppercase tracking-[0.1em]">
                      {log.createdAt.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[14px] font-medium text-ink">
                    {log.actor.name}
                  </div>
                  {entries.length > 0 && (
                    <dl className="text-xs space-y-1 pt-2 border-t border-line-soft">
                      {entries.map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <dt className="text-ink-muted font-semibold uppercase tracking-[0.14em] text-[10px] mt-0.5 shrink-0">
                            {k}
                          </dt>
                          <dd className="text-ink-soft break-all font-mono tnum">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-sunken">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Time</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Manager</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Action</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {logs.map((log) => {
                  const meta = JSON.parse(log.metadata || "{}") as Record<string, string>;
                  const details = Object.entries(meta)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ");
                  return (
                    <tr key={log.id} className="hover:bg-sunken transition-colors">
                      <td className="px-4 py-3 text-ink-muted whitespace-nowrap tabular-nums text-[12px] font-mono">
                        {log.createdAt.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-ink text-[13px]">{log.actor.name}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-accent">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-ink-soft text-[12px] font-mono">
                        {details || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
