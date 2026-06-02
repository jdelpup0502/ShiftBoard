import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export default async function AuditPage() {
  await requireManager();

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true } } },
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardDocumentListIcon className="w-6 h-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last {logs.length} manager actions</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No audit log entries yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Manager</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map((log) => {
                const meta = JSON.parse(log.metadata || "{}") as Record<string, string>;
                const details = Object.entries(meta)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" · ");
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums text-xs">
                      {log.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{log.actor.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {details || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
