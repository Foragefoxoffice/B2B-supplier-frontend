import React, { useState, useEffect } from 'react';
import { getOrdersApi, updateOrderStatusApi } from '../commonApi/api';
import { FileText, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const isSupplier = user?.role === 'SUPPLIER';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrdersApi();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (window.confirm(`Are you sure you want to mark this order as ${status}?`)) {
      try {
        await updateOrderStatusApi(id, status);
        toast.success(`Order status updated to ${status.replace('_', ' ')} successfully!`);
        fetchOrders();
      } catch (error) {
        console.error('Error updating order:', error);
        toast.error('Failed to update order status.');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SENT': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Pending Acceptance</span>;
      case 'ACCEPTED': return <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full font-medium">Accepted</span>;
      case 'IN_PRODUCTION': return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">In Production</span>;
      case 'DISPATCHED': return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">Dispatched</span>;
      case 'REJECTED': return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">Rejected</span>;
      case 'COMPLETED': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">Completed</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded-full font-medium">{status}</span>;
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-slate-500">Loading Orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Purchase Orders</h2>
        <p className="text-sm text-slate-500 mt-1">Manage and track your B2B purchase orders.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PO Number</th>
              {!isSupplier && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Supplier</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={isSupplier ? "5" : "6"} className="px-6 py-10 text-center text-slate-500">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{order.po_number}</td>
                  {!isSupplier && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {order.supplier?.name} <span className="text-xs text-slate-400 block">{order.supplier?.supplier_code}</span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(order.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {isSupplier && (
                      <>
                        {order.status === 'SENT' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                              className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded font-semibold cursor-pointer"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'REJECTED')}
                              className="text-red-600 hover:text-red-900 bg-red-50 px-2.5 py-1 rounded font-semibold cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {order.status === 'ACCEPTED' && (
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'IN_PRODUCTION')}
                            className="text-amber-600 hover:text-amber-900 bg-amber-50 px-3 py-1 rounded font-semibold cursor-pointer"
                          >
                            Pack Order
                          </button>
                        )}
                        {order.status === 'IN_PRODUCTION' && (
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'DISPATCHED')}
                            className="text-purple-600 hover:text-purple-900 bg-purple-50 px-3 py-1 rounded font-semibold cursor-pointer"
                          >
                            Dispatch Order
                          </button>
                        )}
                        {order.status === 'DISPATCHED' && (
                          <span className="text-slate-400 text-xs font-semibold">Awaiting Delivery</span>
                        )}
                        {order.status === 'COMPLETED' && (
                          <span className="text-emerald-600 text-xs font-semibold">Delivered</span>
                        )}
                        {order.status === 'REJECTED' && (
                          <span className="text-red-600 text-xs font-semibold">Rejected</span>
                        )}
                      </>
                    )}

                    {!isSupplier && (
                      <>
                        {(order.status === 'DISPATCHED' || order.status === 'ACCEPTED' || order.status === 'IN_PRODUCTION') && (
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded font-semibold cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        )}
                        {order.status === 'SENT' && (
                          <span className="text-slate-400 text-xs font-medium">Awaiting Acceptance</span>
                        )}
                        {order.status === 'COMPLETED' && (
                          <span className="text-emerald-600 text-xs font-semibold">Completed</span>
                        )}
                        {order.status === 'REJECTED' && (
                          <span className="text-red-600 text-xs font-semibold">Rejected</span>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
