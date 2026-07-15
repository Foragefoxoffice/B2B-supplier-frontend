import React, { useState, useEffect } from 'react';
import { getOrdersApi, updateOrderStatusApi, deleteOrderApi } from '../commonApi/api';
import {
  FileText, XCircle, Search, Calendar, ChevronDown,
  RefreshCw, FileClock, Users, CalendarDays, Receipt, Check, Download, Package,
  CheckCircle, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';
import ImageZoomModal from '../components/common/ImageZoomModal';
import { TableRowsSkeleton } from '../components/common/SkeletonLoader';
import SelectField from '../components/common/SelectField';
import OrderDetailsModal from '../components/orders/OrderDetailsModal';
import DeliveryModal from '../components/orders/DeliveryModal';
const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState({ isOpen: false, orderId: null, status: null });
  const [deleteConfirmState, setDeleteConfirmState] = useState({ isOpen: false, orderId: null });
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // API returns these stats
  const [apiStats, setApiStats] = useState({ total: 0, inProgress: 0, shipped: 0, delivered: 0, cancelled: 0 });
  const [totalOrders, setTotalOrders] = useState(0);

  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [supplierFilter, setSupplierFilter] = useState('All Suppliers');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const isSupplier = user?.role === 'SUPPLIER';

  useEffect(() => {
    fetchOrders();

    const handleNotification = (e) => {
      const type = e.detail?.type;
      if (['ORDER_UPDATE', 'NEW_PO'].includes(type)) {
        fetchOrders();
      }
    };
    window.addEventListener('app_notification', handleNotification);
    return () => window.removeEventListener('app_notification', handleNotification);
  }, [page, limit]);

  useEffect(() => {
    setSelectedOrder(prev => {
      if (!prev) return prev;
      const fresh = orders.find(o => o.id === prev.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(prev)) {
        return fresh;
      }
      return prev;
    });
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search,
        status: statusFilter !== 'All Status' ? statusFilter : '',
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      };

      const data = await getOrdersApi(params);
      if (data.success) {
        setOrders(data.data);
        setTotalOrders(data.total);
        if (data.stats) {
          setApiStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('All Status');
    setSupplierFilter('All Suppliers');
    setDateRange({ startDate: '', endDate: '' });
    setPage(1);

    // Defer fetch to ensure state updates
    setTimeout(() => {
      fetchOrders();
    }, 0);
  };

  const handleUpdateStatus = (id, status) => {
    setCancelRemarks('');
    setConfirmState({ isOpen: true, orderId: id, status });
  };

  const confirmUpdateStatus = async (deliveryDetails = null) => {
    if (confirmState.status === 'REJECTED' && !cancelRemarks.trim()) {
      toast.error('Cancellation remarks are required.');
      return;
    }

    try {
      await updateOrderStatusApi(confirmState.orderId, confirmState.status, cancelRemarks, deliveryDetails);
      toast.success(`Order status updated to ${confirmState.status.replace('_', ' ')} successfully!`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status.');
    } finally {
      setConfirmState({ isOpen: false, orderId: null, status: null });
    }
  };

  const confirmDeleteOrder = async () => {
    try {
      await deleteOrderApi(deleteConfirmState.orderId);
      toast.success('Order deleted successfully!');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order.');
    } finally {
      setDeleteConfirmState({ isOpen: false, orderId: null });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SENT': return <span className="px-2.5 py-1 bg-amber-100/50 text-amber-700 text-[11px] rounded-full font-semibold border border-amber-200/50">Pending</span>;
      case 'ACCEPTED': return <span className="px-2.5 py-1 bg-emerald-100/50 text-emerald-700 text-[11px] rounded-full font-semibold border border-emerald-200/50">Approved</span>;
      case 'DISPATCHED': return <span className="px-2.5 py-1 bg-blue-100/50 text-blue-700 text-[11px] rounded-full font-semibold border border-blue-200/50">Dispatched</span>;
      case 'REJECTED': return <span className="px-2.5 py-1 bg-red-100/50 text-red-700 text-[11px] rounded-full font-semibold border border-red-200/50">Rejected</span>;
      case 'COMPLETED': return <span className="px-2.5 py-1 bg-teal-100/50 text-teal-700 text-[11px] rounded-full font-semibold border border-teal-200/50">Delivered</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] rounded-full font-semibold">{status}</span>;
    }
  };

  // Compute stats for top cards based on current data or API stats
  const pendingOrdersCount = apiStats.inProgress; // Using inProgress for Pending Approval
  const totalValue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
  const uniqueSuppliers = new Set(orders.map(o => o.supplier_id)).size;

  // Calculate oldest pending in days
  const pendingOrders = orders.filter(o => o.status === 'SENT');
  let oldestDays = 0;
  let oldestDateStr = '-';
  if (pendingOrders.length > 0) {
    const oldestDate = new Date(Math.min(...pendingOrders.map(o => new Date(o.date))));
    const diffTime = Math.abs(new Date() - oldestDate);
    oldestDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    oldestDateStr = oldestDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalPages = Math.ceil(totalOrders / limit) || 1;

  return (
    <div className="space-y-6 pb-10">

      {/* --- PAGE HEADER --- */}
      <div>
        <h1 className="text-2xl flex items-center gap-2 font-semibold text-[#1e293b] mb-1"><CheckCircle className='text-[#2563EB]' size={24} /> Order Approval</h1>
        <p className="text-[13px] text-slate-500">Review and approve purchase orders from suppliers</p>
      </div>

      {/* --- TOP SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Approval */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
            <FileClock size={24} />
          </div>
          <div>
            <p className="text-[14px] font-medium text-slate-600">Pending Approval</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-1">{apiStats.inProgress || orders.filter(o => o.status === 'SENT').length}</h3>
            <p className="text-[12px] text-emerald-600 mt-1">Orders</p>
          </div>
        </div>

        {/* Total Order Value */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-[14px] font-medium text-slate-600">Total Order Value</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-1">{formatCurrency(totalValue)}</h3>
            <p className="text-[12px] text-emerald-600 mt-1">Across {orders.length} Orders</p>
          </div>
        </div>

        {/* Suppliers */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[14px] font-medium text-slate-600">Suppliers</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-1">{uniqueSuppliers}</h3>
            <p className="text-[12px] text-emerald-600 mt-1">Unique Suppliers</p>
          </div>
        </div>

        {/* Oldest Pending */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
            <CalendarDays size={24} />
          </div>
          <div>
            <p className="text-[14px] font-medium text-slate-600">Oldest Pending</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-1">{oldestDays} Days</h3>
            <p className="text-[12px] text-emerald-600 mt-1">Since {oldestDateStr}</p>
          </div>
        </div>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-wrap lg:flex-nowrap items-end gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[14px] font-semibold text-slate-600 mb-1.5">Search</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by Order ID, PO No., Supplier..."
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            />
          </div>
        </div>



        {/* PO Date Range */}
        <div className="w-[320px] shrink-0">
          <label className="block text-[14px] font-semibold text-slate-600 mb-1.5">PO Date Range</label>
          <div className="relative flex items-center border border-slate-200 rounded-lg bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors overflow-hidden h-[38px]">
            <div className="pl-3 py-2 flex items-center justify-center text-slate-400 border-r border-slate-200 pr-2 bg-slate-50 h-full">
              <Calendar size={14} />
            </div>
            <input
              type="date"
              className="flex-1 px-2 py-2 text-[13px] border-none outline-none bg-transparent h-full w-full [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
            />
            <span className="text-slate-300 mx-1">-</span>
            <input
              type="date"
              className="flex-1 px-2 py-2 text-[13px] border-none outline-none bg-transparent h-full w-full [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
            />
          </div>
        </div>

        {/* Order Value (Placeholder) */}
        <div className="w-32 shrink-0">
          <SelectField
            label="Order Value"
            labelClassName="text-[14px] font-semibold text-slate-600 mb-0"
            className="rounded-lg py-2 text-[13px]"
          >
            <option>All Values</option>
            <option>High to Low</option>
            <option>Low to High</option>
          </SelectField>
        </div>

        {/* Status */}
        <div className="w-40 shrink-0">
          <SelectField
            label="Status"
            labelClassName="text-[14px] font-semibold text-slate-600 mb-0"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg py-2 text-[13px]"
          >
            <option value="All Status">All Status</option>
            <option value="Pending">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </SelectField>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 shrink-0 h-[38px]">
          <button
            onClick={handleResetFilters}
            className="flex items-center justify-center gap-2 px-4 border border-slate-200 text-slate-600 rounded-lg text-[13px] font-medium hover:bg-slate-50 transition-colors h-full"
          >
            <RefreshCw size={14} />
            Reset
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-5 bg-active-btn text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 transition-colors h-full"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        {/* Table Header Controls */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-[14px]">{apiStats.inProgress || orders.filter(o => o.status === 'SENT').length} Orders Pending Approval</h3>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-[13px] font-medium hover:bg-slate-50 transition-colors">
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50/80 text-slate-600 text-[14px] font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 w-12"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" /></th>
                <th className="px-6 py-3 whitespace-nowrap font-semibold">Order Details</th>

                <th className="px-6 py-3 whitespace-nowrap font-semibold">PO Details</th>
                <th className="px-6 py-3 whitespace-nowrap font-semibold">Order Date</th>
                <th className="px-6 py-3 whitespace-nowrap font-semibold">Items / Value</th>
                <th className="px-6 py-3 whitespace-nowrap font-semibold">Status</th>
                <th className="px-6 py-3 text-right whitespace-nowrap font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {loading ? (
                <TableRowsSkeleton columns={7} rows={8} />
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-10 text-center text-slate-500">No purchase orders found.</td></tr>
              ) : (
                orders.map((order) => {
                  const firstItem = order.items?.[0]?.product;
                  const itemImage = firstItem?.images?.find(i => i.is_primary)?.url || firstItem?.images?.[0]?.url;
                  const totalQty = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  const orderDateObj = new Date(order.date);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" /></td>

                      {/* Order Details */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-slate-100 flex-shrink-0 border border-slate-200 overflow-hidden">
                            {itemImage ? (
                              <ImageZoomModal src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${itemImage}`} alt={firstItem?.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-400">
                                <FileText size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{order.po_number}</div>
                            <div className="text-slate-500 text-[12px] truncate max-w-[150px]">{firstItem?.name || 'Multiple Items'}</div>
                            <div className="mt-1">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[11px] font-medium tracking-wide">{firstItem?.product_code || 'Product'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* PO Details */}
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-700">{order.po_number}</div>
                        <div className="text-slate-400 text-[12px] mt-0.5">Rev: 02</div>
                      </td>

                      {/* Order Date */}
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-700">{orderDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-slate-400 text-[12px] mt-0.5">{orderDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      {/* Items / Value */}
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-700">{totalQty} PCS</div>
                        <div className="font-bold text-slate-800 mt-0.5">{formatCurrency(order.total_amount)}</div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {getStatusBadge(order.status)}
                        <div className="text-[11px] text-slate-400 mt-1.5">Requested on<br />{orderDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelectedOrder(order)} className="text-blue-600 text-[13px] font-semibold px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100">
                            View Details
                          </button>

                          {(order.status === 'SENT' || order.status === 'ACCEPTED' || order.status === 'DISPATCHED') && (
                            <>
                              {order.status === 'SENT' && (
                                <>
                                  <button onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')} className="flex items-center gap-1.5 text-emerald-600 text-[13px] font-semibold px-3 py-1.5 border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors">
                                    <Check size={14} /> Approve
                                  </button>
                                  <button onClick={() => handleUpdateStatus(order.id, 'REJECTED')} className="flex items-center gap-1.5 text-red-600 text-[13px] font-semibold px-3 py-1.5 border border-red-200 rounded-md hover:bg-red-50 transition-colors">
                                    <XCircle size={14} /> Reject
                                  </button>
                                </>
                              )}

                              {order.status === 'ACCEPTED' && (
                                <button onClick={() => handleUpdateStatus(order.id, 'DISPATCHED')} className="flex items-center gap-1.5 text-blue-600 text-[13px] font-semibold px-3 py-1.5 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors">
                                  <Package size={14} /> Mark Dispatched
                                </button>
                              )}

                              {order.status === 'DISPATCHED' && (
                                <button onClick={() => handleUpdateStatus(order.id, 'COMPLETED')} className="flex items-center gap-1.5 text-emerald-600 text-[13px] font-semibold px-3 py-1.5 border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors">
                                  <Check size={14} /> Mark Delivered
                                </button>
                              )}
                            </>
                          )}

                          <button onClick={() => setDeleteConfirmState({ isOpen: true, orderId: order.id })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-1" title="Delete Order">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing {totalOrders === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, totalOrders)} of {totalOrders} orders
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <SelectField
                className="py-1.5 text-sm rounded-lg"
                wrapperClassName="w-auto"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
              </SelectField>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronDown size={16} className="rotate-90" />
              </button>

              {/* Simple page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  className={`w-8 h-8 rounded-md text-sm font-medium flex items-center justify-center transition-colors ${page === pageNum ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 bg-white'}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button
                className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronDown size={16} className="-rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen && confirmState.status !== 'COMPLETED'}
        title="Update Order Status"
        message={`Are you sure you want to mark this order as ${confirmState.status?.replace('_', ' ')}?`}
        onConfirm={() => confirmUpdateStatus()}
        onCancel={() => setConfirmState({ isOpen: false, orderId: null, status: null })}
        confirmText="Confirm"
        confirmVariant="primary"
        disableConfirm={confirmState.status === 'REJECTED' && !cancelRemarks.trim()}
      >
        {confirmState.status === 'REJECTED' && (
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Cancellation Remarks <span className="text-red-600">*</span></label>
            <textarea
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
              rows={3}
              required
              placeholder="Why are you canceling this order?"
              value={cancelRemarks}
              onChange={(e) => setCancelRemarks(e.target.value)}
            />
          </div>
        )}
      </ConfirmModal>

      <DeliveryModal
        isOpen={confirmState.isOpen && confirmState.status === 'COMPLETED'}
        onClose={() => setConfirmState({ isOpen: false, orderId: null, status: null })}
        onConfirm={(details) => confirmUpdateStatus(details)}
      />

      <ConfirmModal
        isOpen={deleteConfirmState.isOpen}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        onConfirm={confirmDeleteOrder}
        onCancel={() => setDeleteConfirmState({ isOpen: false, orderId: null })}
        confirmText="Delete"
        confirmVariant="danger"
      />

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdateStatus={handleUpdateStatus} />
      )}
    </div>
  );
};

export default Orders;