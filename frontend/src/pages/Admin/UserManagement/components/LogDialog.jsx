import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function LogDialog({ open, onOpenChange }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    fetch('/api/admin/user-logs', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLogs([]);
        setLoading(false);
      });
  }, [open]);

  // Helper to get changed fields for update logs
  const getChangedFields = (before, after) => {
    if (!before || !after) return [];
    return Object.keys({ ...before, ...after }).filter(
      key => before[key] !== after[key]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl min-w-[900px] border-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 shadow-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle>
            <span className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="text-blue-400"><circle cx="12" cy="12" r="10" fill="#e0ecff"/><path d="M12 7v5m0 4h.01" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              User Activity Logs
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[65vh] overflow-auto rounded-lg border border-gray-100 bg-white shadow-inner mt-2 mb-3">
          {loading ? (
            <div className="py-12 text-center text-gray-500 font-medium">Loading logs...</div>
          ) : (
            <table className="min-w-full text-xs border-separate border-spacing-0">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 text-gray-700">
                  <th className="p-3 border-b border-gray-200 sticky top-0 z-10 text-left font-semibold">Time</th>
                  <th className="p-3 border-b border-gray-200 sticky top-0 z-10 text-left font-semibold">Action</th>
                  <th className="p-3 border-b border-gray-200 sticky top-0 z-10 text-left font-semibold">Actor</th>
                  <th className="p-3 border-b border-gray-200 sticky top-0 z-10 text-left font-semibold">Target User</th>
                  <th className="p-3 border-b border-gray-200 sticky top-0 z-10 text-left font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr
                    key={log._id || Math.random()}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="p-3 border-b border-gray-100 whitespace-nowrap text-gray-700">
                      {log.timestamp ? (
                        <span className="bg-gray-50 px-2 py-1 rounded text-gray-700 font-mono text-xs border border-gray-100">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      ) : ""}
                    </td>
                    <td className="p-3 border-b border-gray-100">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold tracking-wide border ${
                          log.action === 'create'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : log.action === 'update'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : log.action === 'delete'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {log.action?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 border-b border-gray-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-gray-900">{log.actor?.name || "-"}</span>
                        <span className="text-xs text-gray-700">{log.actor?.email}</span>
                        <span className="text-[10px] text-gray-400">{log.actor?.role}</span>
                      </div>
                    </td>
                    <td className="p-3 border-b border-gray-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-black">{log.targetUser?.name || "-"}</span>
                        <span className="text-xs text-gray-700">{log.targetUser?.email}</span>
                        <span className="text-[10px] text-gray-400">{log.targetUser?.role}</span>
                      </div>
                    </td>
                    <td className="p-3 border-b border-gray-100 w-[320px] max-w-[320px]">
                      {log.action === 'update' ? (
                        <details>
                          <summary className="cursor-pointer text-blue-600 underline font-medium">Changed Fields</summary>
                          <ul className="my-2 ml-3 list-disc text-gray-700">
                            {getChangedFields(log.before, log.after).map(key => (
                              <li key={key}>
                                <span className="font-semibold">{key}:</span>{' '}
                                <span className="text-gray-600 bg-gray-100 px-1 rounded">{(log.before || {})[key] ?? ''}</span>
                                <span className="mx-1 text-gray-400">→</span>
                                <span className="text-blue-800 bg-blue-50 px-1 rounded">{(log.after || {})[key] ?? ''}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : log.action === 'create' ? (
                        <span className="text-blue-700 font-medium">User created</span>
                      ) : log.action === 'delete' ? (
                        <span className="text-red-700 font-medium">User deleted</span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-12 text-lg bg-gray-50">
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" className="bg-gray-700 text-white hover:bg-gray-800" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}