import React from 'react';
import { FileText, Package, X, Check, XCircle, Download, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageZoomModal from '../common/ImageZoomModal';
import { downloadOrderPdfApi, viewOrderHtmlApi } from '../../commonApi/api';

const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
    };

    for (const [unit, seconds] of Object.entries(intervals)) {
        const interval = Math.floor(diffInSeconds / seconds);
        if (interval >= 1) {
            return `Age: ${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    return 'Age: Just now';
};

const getOrderedImageObj = (item, orderRemarks) => {
    if (!item?.product?.images || item.product.images.length === 0) return null;

    const targetRemarks = item.remarks || orderRemarks;

    if (targetRemarks && targetRemarks.includes('Color:')) {
        const colorPart = targetRemarks.split('Color:')[1].split('\n')[0].trim().split('|')[0].trim();
        const matchedImage = item.product.images.find(img => img.color && img.color.toLowerCase() === colorPart.toLowerCase());
        if (matchedImage) return matchedImage;
    }

    if (targetRemarks) {
        const sortedImages = [...item.product.images].sort((a, b) => (b.color || '').length - (a.color || '').length);
        const matchedImage = sortedImages.find(img => img.color && targetRemarks.includes(img.color));
        if (matchedImage) return matchedImage;
    }

    const frontImage = item.product.images.find(img => img.is_primary);
    return frontImage || item.product.images[0];
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
    const [isProcessingPdf, setIsProcessingPdf] = React.useState(false);

    if (!order) return null;
    const date = new Date(order.date);
    const statusInfo = getStatusInfo(order.status);

    const handleDownloadPdf = async () => {
        try {
            setIsProcessingPdf(true);
            const blob = await downloadOrderPdfApi(order.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${order.po_number}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error("Failed to download PDF", error);
        } finally {
            setIsProcessingPdf(false);
        }
    };

    const handleViewPdf = async () => {
        try {
            setIsProcessingPdf(true);
            const html = await viewOrderHtmlApi(order.id);
            const blob = new Blob([html], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error("Failed to view Order Form", error);
        } finally {
            setIsProcessingPdf(false);
        }
    };

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
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[16px] font-semibold text-red-500 hidden sm:block">Order Form:</span>
                                <div className="flex rounded-lg shadow-xs border border-slate-200">
                                    <button
                                        onClick={handleViewPdf}
                                        disabled={isProcessingPdf}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-l-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-sm font-medium border-r border-slate-200 disabled:opacity-50"
                                        title="View Order Form"
                                    >
                                        <Eye className="w-4 h-4" /> View
                                    </button>
                                    <button
                                        onClick={handleDownloadPdf}
                                        disabled={isProcessingPdf}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-50"
                                        title="Download Order Form"
                                    >
                                        <Download className="w-4 h-4" /> Download
                                    </button>
                                </div>
                            </div>
                            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
                            <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
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

                        {order.status === 'COMPLETED' && (order.tracking_number || order.booking_copy_url || order.invoice_copy_url) && (
                            <div className="mb-8">
                                <h3 className="text-[17px] font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <Package className="w-[18px] h-[18px] text-teal-600" /> Delivery Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-[#f6fcf9] p-5 rounded-2xl border border-teal-100/60">
                                    {order.tracking_number && (
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[13px] font-semibold text-teal-800 tracking-wide">Tracking Number</p>
                                            <div className="bg-white px-4 py-2.5 rounded-xl border border-teal-50 shadow-[0_2px_10px_-4px_rgba(20,116,105,0.1)] font-semibold text-slate-800 text-[14px]">
                                                {order.tracking_number}
                                            </div>
                                        </div>
                                    )}
                                    {order.booking_copy_url && (
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[13px] font-semibold text-teal-800 tracking-wide">Booking Copy (LR)</p>
                                            <a href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${order.booking_copy_url}`} target="_blank" rel="noreferrer" className="bg-white px-4 py-2.5 rounded-xl border border-teal-50 shadow-[0_2px_10px_-4px_rgba(20,116,105,0.1)] hover:bg-teal-50/50 hover:border-teal-100 transition-all font-medium text-teal-700 text-[14px] inline-flex items-center gap-2.5 w-fit">
                                                <FileText className="w-4 h-4 text-teal-600" /> View File
                                            </a>
                                        </div>
                                    )}
                                    {order.invoice_copy_url && (
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[13px] font-semibold text-teal-800 tracking-wide">Invoice Copy</p>
                                            <a href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${order.invoice_copy_url}`} target="_blank" rel="noreferrer" className="bg-white px-4 py-2.5 rounded-xl border border-teal-50 shadow-[0_2px_10px_-4px_rgba(20,116,105,0.1)] hover:bg-teal-50/50 hover:border-teal-100 transition-all font-medium text-teal-700 text-[14px] inline-flex items-center gap-2.5 w-fit">
                                                <FileText className="w-4 h-4 text-teal-600" /> View File
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500" /> Ordered Items
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                            {order.items?.map((item, idx) => {
                                const matchedImage = getOrderedImageObj(item, order.remarks);
                                const imageUrl = matchedImage ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${matchedImage.url}` : `https://ui-avatars.com/api/?name=${item.product?.name || 'O'}&background=random&color=fff&rounded=false&size=128`;

                                let color = null;
                                const targetRemarks = item.remarks || order.remarks;
                                if (targetRemarks && targetRemarks.includes('Color:')) {
                                    color = targetRemarks.split('Color:')[1].split('\n')[0].trim().split('|')[0].trim();
                                }
                                if (!color && matchedImage?.color) {
                                    color = matchedImage.color;
                                }

                                let ageDisplay = '';
                                const creationDate = matchedImage?.created_at || item.product?.created_at;
                                if (creationDate) {
                                    ageDisplay = getTimeAgo(creationDate);
                                }

                                return (
                                    <div key={idx} className="flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-blue-100 hover:shadow-lg transition-all group relative">
                                        <div className="relative h-48 sm:h-56 w-full bg-slate-50 overflow-hidden shrink-0">
                                            <ImageZoomModal src={imageUrl} alt={item.product?.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            {color && (
                                                <div className="absolute bottom-2 left-2 px-2.5 py-0.5  bg-amber-50 border border-amber-100 rounded text-[12px] font-medium text-amber-800 tracking-wider z-10">
                                                    {color}
                                                </div>
                                            )}
                                            {ageDisplay && (
                                                <span className="absolute top-2 right-2 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {ageDisplay}
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-3 flex flex-col flex-1">
                                            <h4 className="font-semibold text-slate-800 text-[14px] group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight mb-2">
                                                {item.product?.name || 'Product'}
                                            </h4>

                                            <div className="flex items-center justify-between mb-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                                                    {item.product?.product_code?.toUpperCase() || 'N/A'}
                                                </span>
                                            </div>

                                            <div className="mt-auto pt-2 border-t border-slate-50 flex items-end justify-between">
                                                <div className="flex flex-col">
                                                    <p className="text-[11px] font-medium text-slate-500 mb-0.5">
                                                        {item.quantity} {item.product?.unit || 'pcs'} × ₹{parseFloat(item.rate).toLocaleString('en-IN')}
                                                    </p>
                                                    <p className="font-bold text-slate-800 text-[15px]">
                                                        ₹{parseFloat(item.amount).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
