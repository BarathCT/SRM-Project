import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function LogDialog({ open, onOpenChange }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobileOrTablet = useMediaQuery('(max-width: 1024px)');

  useEffect(() => {
    if (!open) {
      setLogs([]);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);

    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/user-logs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch logs' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle different response structures
        let logsData = [];
        if (Array.isArray(data)) {
          logsData = data;
        } else if (data.data && Array.isArray(data.data)) {
          logsData = data.data;
        } else if (data.logs && Array.isArray(data.logs)) {
          logsData = data.logs;
        } else if (data.success && Array.isArray(data.data)) {
          logsData = data.data;
        }
        
        // Filter out invalid logs and ensure required fields exist
        logsData = logsData.filter(log => log && (log.action || log.timestamp));
        
        // Sort by timestamp descending (most recent first)
        logsData = logsData.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeB - timeA;
        });

        setLogs(logsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user logs:', err);
        setError(err.message || 'Failed to load logs');
        setLogs([]);
        setLoading(false);
      }
    };

    fetchLogs();
  }, [open]);

  // Helper to get changed fields for update logs
  const getChangedFields = (before, after) => {
    if (!before || !after) return [];
    return Object.keys({ ...before, ...after }).filter(
      key => before[key] !== after[key]
    );
  };

  // Shared content component for both Dialog and Sheet
  const LogsContent = () => (
    <>
      <div className={`${isMobileOrTablet ? 'h-full overflow-auto' : 'max-h-[65vh] overflow-auto'} rounded-lg border border-gray-100 bg-white shadow-inner ${isMobileOrTablet ? 'm-2' : 'mt-2 mb-3'}`}>
        {loading ? (
          <div className="py-12 text-center text-gray-500 font-medium">Loading logs...</div>
        ) : error ? (
          <div className="py-12 text-center">
            <div className="text-red-600 font-medium mb-2">Error loading logs</div>
            <div className="text-sm text-gray-500">{error}</div>
          </div>
        ) : (
          <div className={isMobileOrTablet ? 'overflow-x-auto' : ''}>
            <table className="min-w-full text-xs border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="bg-gray-200 p-3 border-b border-gray-300 sticky top-0 z-10 text-left font-semibold">Time</th>
                  <th className="bg-gray-200 p-3 border-b border-gray-300 sticky top-0 z-10 text-left font-semibold">Action</th>
                  <th className="bg-gray-200 p-3 border-b border-gray-300 sticky top-0 z-10 text-left font-semibold">Actor</th>
                  <th className="bg-gray-200 p-3 border-b border-gray-300 sticky top-0 z-10 text-left font-semibold">Target User</th>
                  <th className="bg-gray-200 p-3 border-b border-gray-300 sticky top-0 z-10 text-left font-semibold">Details</th>
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
                {logs.length === 0 && !loading && !error && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-12 text-lg bg-gray-50">
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  // Mobile/Tablet: Full-screen Sheet with back button
  if (isMobileOrTablet) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-screen w-screen max-w-none rounded-none p-0 flex flex-col gap-0 bg-white [&>button.absolute]:hidden"
        >
          <SheetHeader className="px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100 -ml-2"
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Button>
              <SheetTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-blue-400">
                  <circle cx="12" cy="12" r="10" fill="#e0ecff"/>
                  <path d="M12 7v5m0 4h.01" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                User Activity Logs
              </SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-hidden bg-gray-50">
            <LogsContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl min-w-[900px] border-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 shadow-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle>
            <span className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="text-blue-400">
                <circle cx="12" cy="12" r="10" fill="#e0ecff"/>
                <path d="M12 7v5m0 4h.01" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              User Activity Logs
            </span>
          </DialogTitle>
        </DialogHeader>
        <LogsContent />
      </DialogContent>
    </Dialog>
  );
}