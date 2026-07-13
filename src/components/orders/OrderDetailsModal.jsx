import React from 'react';
import { FileText, Package, X, Check, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageZoomModal from '../common/ImageZoomModal';

const getOrderedImageUrl = (item, orderRemarks) => {
    if (!item?.product?.images || item.product.images.length === 0) return null;

    const targetRemarks = item.remarks || orderRemarks;

    if (targetRemarks && targetRemarks.includes('Color:')) {
        const colorPart = targetRemarks.split('Color:')[1].split('\n')[0].trim().split('|')[0].trim();
        const matchedImage = item.product.images.find(img => img.color && img.color.toLowerCase() === colorPart.toLowerCase());
        if (matchedImage) return `http://localhost:5000${matchedImage.url}`;
    }

    if (targetRemarks) {
        const sortedImages = [...item.product.images].sort((a, b) => (b.color || '').length - (a.color || '').length);
        const matchedImage = sortedImages.find(img => img.color && targetRemarks.includes(img.color));
        if (matchedImage) return `http://localhost:5000${matchedImage.url}`;
    }

    const frontImage = item.product.images.find(img => img.is_primary);
    return `http://localhost:5000${(frontImage || item.product.images[0]).url}`;
};

const getStatusInfo = (status) => {
    switch (status) {
        case 'SENT': return { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' };
        case 'ACCEPTED': return { label: 'Approved', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-600' };
        case 'DISPATCHED': return { label: 'Dispatched', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' };
        case 'COMPLETED': return { label: 'Delivered', color: 'text-teal-600', bg: 'bg-teal-50', dot: 'bg-teal-500' };
        case 'REJECTED': return { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' };
        default: return { label: status, color: 'text-slate-600', bg: 'bg-slate-50', dot: 'bg-slate-500' };
    }
};

const OrderDetailsModal = ({ order, onClose, onUpdateStatus }) => {
    if (!order) return null;
    const date = new Date(order.date);
    const statusInfo = getStatusInfo(order.status);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">Order Details</h2>
                            <p className="text-sm text-slate-500 mt-1">PO Number: <span className="font-semibold text-slate-700">{order.po_number}</span></p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-[14px] font-semibold text-slate-600 mb-1 block">Order Date</p>
                                <p className="font-semibold text-slate-800">{date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-[14px] font-semibold text-slate-600 mb-1 block">Current Status</p>
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${statusInfo.bg} ${statusInfo.color} text-sm font-semibold border border-current/10 mt-1`}>
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${statusInfo.dot}`}></span>
                                    {statusInfo.label}
                                </div>
                            </div>
                            {(order.order_given_by || order.phone_number) && (
                                <>
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <p className="text-[14px] font-semibold text-slate-600 mb-1 block">Order Given By</p>
                                        <p className="font-semibold text-slate-800">{order.order_given_by || '-'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <p className="text-[14px] font-semibold text-slate-600 mb-1 block">Phone Number</p>
                                        <p className="font-semibold text-slate-800">{order.phone_number || '-'}</p>
                                    </div>
                                </>
                            )}
                            {(order.remarks && order.remarks !== 'Multiple items order') && (
                                <div className={`col-span-2 p-4 rounded-xl border ${order.status === 'REJECTED' ? 'bg-rose-50 border-rose-100' : 'bg-yellow-50 border-yellow-100'}`}>
                                    <p className={`text-md font-semibold mb-1 flex items-center gap-1.5 ${order.status === 'REJECTED' ? 'text-rose-800' : 'text-yellow-800'}`}>
                                        <FileText className="w-3.5 h-3.5" />
                                        {order.status === 'REJECTED' ? 'Cancellation Remarks' : 'Order Remarks'}
                                    </p>
                                    <p className={`font-medium text-sm mt-1 ${order.status === 'REJECTED' ? 'text-rose-900' : 'text-yellow-900'}`}>{order.remarks}</p>
                                </div>
                            )}
                        </div>

                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500" /> Ordered Items
                        </h3>

                        <div className="space-y-3 mb-6">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex flex-col p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-100 hover:shadow-[0_4px_20px_-4px_rgba(6,81,237,0.1)] transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 group-hover:border-blue-200 transition-colors">
                                                <ImageZoomModal src={getOrderedImageUrl(item, order.remarks) || `https://ui-avatars.com/api/?name=${item.product?.name || 'O'}&background=random&color=fff&rounded=false&size=128`} alt={item.product?.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 text-[16px] group-hover:text-blue-600 transition-colors">{item.product?.name || 'Product'}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">{item.product?.product_code || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end justify-center">
                                            <p className="font-bold text-slate-800 text-lg">₹ {parseFloat(item.amount).toLocaleString('en-IN')}</p>
                                            <p className="text-xs font-medium text-slate-500 mt-1">{item.quantity} {item.product?.unit || 'Units'} × ₹ {parseFloat(item.rate).toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                    {item.remarks && (
                                        <div className="mt-4 px-3 py-1 bg-amber-50/50 border border-amber-100 rounded-lg">
                                            <p className="text-amber-800 text-sm font-medium">{item.remarks}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        {onUpdateStatus && (order.status === 'SENT' || order.status === 'ACCEPTED' || order.status === 'DISPATCHED') ? (
                            <div className="flex items-center gap-2">
                                {order.status === 'SENT' && (
                                    <>
                                        <button onClick={() => { onUpdateStatus(order.id, 'ACCEPTED'); onClose(); }} className="flex items-center gap-1.5 text-emerald-600 text-[13px] font-semibold px-4 py-2 border border-emerald-600 rounded-xl bg-white hover:bg-emerald-50 shadow-xs transition-all">
                                            <Check size={16} /> Approve Order
                                        </button>
                                        <button onClick={() => { onUpdateStatus(order.id, 'REJECTED'); onClose(); }} className="flex items-center gap-1.5 text-red-600 text-[13px] font-semibold px-4 py-2 border border-red-600 rounded-xl bg-white hover:bg-red-50 shadow-xs transition-all">
                                            <XCircle size={16} /> Reject Order
                                        </button>
                                    </>
                                )}
                                {order.status === 'ACCEPTED' && (
                                    <button onClick={() => { onUpdateStatus(order.id, 'DISPATCHED'); onClose(); }} className="flex items-center gap-1.5 text-blue-600 text-[13px] font-semibold px-4 py-2 border border-blue-600 rounded-xl bg-white hover:bg-blue-50 shadow-xs transition-all">
                                        <Package size={16} /> Mark Dispatched
                                    </button>
                                )}
                                {order.status === 'DISPATCHED' && (
                                    <button onClick={() => { onUpdateStatus(order.id, 'COMPLETED'); onClose(); }} className="flex items-center gap-1.5 text-emerald-600 text-[13px] font-semibold px-4 py-2 border border-emerald-600 rounded-xl bg-white hover:bg-emerald-50 shadow-xs transition-all">
                                        <Check size={16} /> Mark Delivered
                                    </button>
                                )}
                            </div>
                        ) : <div />}

                        <div className="flex flex-col items-end shrink-0">
                            <p className="text-slate-500 font-medium">Total Amount</p>
                            <p className="text-xl font-bold text-blue-600">₹ {parseFloat(order.total_amount).toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default OrderDetailsModal;
