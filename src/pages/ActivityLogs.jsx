import React, { useState, useEffect } from 'react';
import { Activity, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getActivityLogsApi } from '../commonApi/api';
import { TableSkeleton } from '../components/common/SkeletonLoader';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getActivityLogsApi({ page: currentPage, limit: itemsPerPage });
      if (data.success) {
        setLogs(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const setLogsDirectly = setLogs; // using the setter properly

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="h-full flex flex-col p-0 animate-fade-in relative z-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800 tracking-tight flex items-center">
            <Activity className="mr-3 h-8 w-8 text-blue-600" />
            Activity Logs
          </h1>
          <p className="text-slate-500 mt-1">Monitor system activities and user actions.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton columns={5} />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="px-6 py-4 font-semibold">Date & Time</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Module</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {log.user ? (
                          <div>
                            <p className="font-medium">{log.user.first_name} {log.user.last_name}</p>
                            <p className="text-xs text-slate-500">{log.user.email}</p>
                          </div>
                        ) : 'System'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                          {log.module}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[200px]" title={log.details}>
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No activity logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-600">
              Page <span className="font-medium text-slate-800">{currentPage}</span> of <span className="font-medium text-slate-800">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
