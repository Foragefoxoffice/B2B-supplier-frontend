import React, { useState, useEffect } from 'react';
import { getOrdersApi, updateOrderStatusApi } from '../commonApi/api';
import { Search, Calendar, RefreshCcw, FileText, CheckCircle, Package, Truck, XCircle, Clock, ChevronRight, X, LocateFixedIcon, PackageOpen, ArrowUp, ArrowDown, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import OrderDetailsModal from '../components/orders/OrderDetailsModal';
import ImageZoomModal from '../components/common/ImageZoomModal';
import { TableRowsSkeleton } from '../components/common/SkeletonLoader';
import SelectField from '../components/common/SelectField';
import ConfirmModal from '../components/common/ConfirmModal';
import Pagination from '../components/common/Pagination';

const getFrontImageUrl = (item) => {
    if (!item?.product?.images || item.product.images.length === 0) return null;
    const frontImage = item.product.images.find(img => img.is_primary);
    return `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${(frontImage || item.product.images[0]).url}`;
};

const OrderTracking = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [appliedStartDate, setAppliedStartDate] = useState('');
    const [appliedEndDate, setAppliedEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalOrders, setTotalOrders] = useState(0);
    const [stats, setStats] = useState({ total: 0, inProgress: 0, shipped: 0, delivered: 0, cancelled: 0 });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [confirmState, setConfirmState] = useState({ isOpen: false, orderId: null, status: null });
    const [cancelRemarks, setCancelRemarks] = useState('');

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
    }, [appliedSearch, statusFilter, appliedStartDate, appliedEndDate, page, limit]);

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
            const data = await getOrdersApi({
                search: appliedSearch,
                status: statusFilter,
                startDate: appliedStartDate,
                endDate: appliedEndDate,
                page,
                limit
            });
            if (data.success) {
                setOrders(data.data);
                setTotalOrders(data.total || 0);
                if (data.stats) setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        setAppliedSearch(searchTerm);
        setAppliedStartDate(startDate);
        setAppliedEndDate(endDate);
    };

    const handleReset = () => {
        setSearchTerm('');
        setAppliedSearch('');
        setStatusFilter('All Status');
        setStartDate('');
        setEndDate('');
        setAppliedStartDate('');
        setAppliedEndDate('');
        setPage(1);
    };

    const handleUpdateStatus = (id, status) => {
        setCancelRemarks('');
        setConfirmState({ isOpen: true, orderId: id, status });
    };

    const confirmUpdateStatus = async () => {
        if (confirmState.status === 'REJECTED' && !cancelRemarks.trim()) {
            toast.error('Cancellation remarks are required.');
            return;
        }

        try {
            await updateOrderStatusApi(confirmState.orderId, confirmState.status, cancelRemarks);
            toast.success(`Order status updated to ${confirmState.status.replace('_', ' ')} successfully!`);
            fetchOrders();
            if (selectedOrder) {
                // If a modal is open, we can close it or let it re-fetch (useEffect will update it)
                setSelectedOrder(null);
            }
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Failed to update order status.');
        } finally {
            setConfirmState({ isOpen: false, orderId: null, status: null });
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'SENT':
                return { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500', step: 1 };
            case 'ACCEPTED':
                return { label: 'Approved', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-600', step: 2 };
            case 'DISPATCHED':
                return { label: 'Dispatched', color: 'text-indigo-600', bg: 'bg-indigo-50', dot: 'bg-indigo-500', step: 3 };
            case 'COMPLETED':
                return { label: 'Delivered', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500', step: 4 };
            case 'REJECTED':
                return { label: 'Cancelled', color: 'text-rose-600', bg: 'bg-rose-50', dot: 'bg-rose-500', step: -1 };
            default:
                return { label: status, color: 'text-slate-600', bg: 'bg-slate-50', dot: 'bg-slate-500', step: 0 };
        }
    };

    const StatCard = ({ icon: Icon, title, value, percentage, colorClass, iconBg, delay, trend }) => {
        const isPositive = trend === 'up';
        return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300"
        >
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg} bg-opacity-50`}>
                    <Icon className={`w-7 h-7 ${colorClass}`} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
                    <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">{value}</h3>
                    {trend ? (
                        <p className={`text-xs mt-1 font-medium flex items-center ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                            {percentage}
                        </p>
                    ) : (
                        <p className="text-xs text-emerald-600 mt-1 font-medium">{percentage}</p>
                    )}
                </div>
            </div>
        </motion.div>
    )};

    const Stepper = ({ currentStep }) => {
        const steps = ['Pending', 'Approved', 'Dispatched', 'Delivered'];

        if (currentStep === -1) {
            return (
                <div className="flex items-center w-full min-w-[300px] max-w-[320px]">
                    <div className="flex flex-col items-center flex-1">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] z-10 ring-4 ring-rose-50"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                        </motion.div>
                        <span className="text-[11px] font-semibold text-rose-600 mt-2">Cancelled</span>
                    </div>
                    <div className="h-0.5 w-full bg-slate-100 -mt-5 mx-1 border-dashed border-t-2"></div>
                    <div className="flex flex-col items-center flex-1 opacity-40">
                        <div className="w-3 h-3 rounded-full bg-slate-200 z-10"></div>
                    </div>
                    <div className="h-0.5 w-full bg-slate-100 -mt-5 mx-1"></div>
                    <div className="flex flex-col items-center flex-1 opacity-40">
                        <div className="w-3 h-3 rounded-full bg-slate-200 z-10"></div>
                    </div>
                    <div className="h-0.5 w-full bg-slate-100 -mt-5 mx-1"></div>
                    <div className="flex flex-col items-center flex-1 opacity-40">
                        <div className="w-3 h-3 rounded-full bg-slate-200 z-10"></div>
                    </div>
                </div>
            );
        }

        const getStepStyles = (num) => {
            switch(num) {
                case 1: return { bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-100 shadow-amber-200' };
                case 2: return { bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-100 shadow-blue-200' };
                case 3: return { bg: 'bg-indigo-500', text: 'text-indigo-600', ring: 'ring-indigo-100 shadow-indigo-200' };
                case 4: return { bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-100 shadow-emerald-200' };
                default: return { bg: 'bg-slate-200', text: 'text-slate-400', ring: 'ring-slate-50' };
            }
        };

        return (
            <div className="flex items-center w-full min-w-[300px] max-w-[320px]">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber <= currentStep;
                    const isCurrent = stepNumber === currentStep;
                    const isLast = index === steps.length - 1;
                    const styles = getStepStyles(stepNumber);

                    return (
                        <React.Fragment key={step}>
                            <div className="flex flex-col items-center flex-1 relative group">
                                <motion.div
                                    initial={isCurrent ? { scale: 0.8 } : false}
                                    animate={isCurrent ? { scale: 1 } : false}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${isCompleted ? `${styles.bg} ring-4 ${styles.ring} ${isCurrent && stepNumber !== 4 ? 'shadow-lg' : ''}` : 'bg-slate-200'}`}
                                >
                                    {isCompleted && stepNumber !== currentStep && stepNumber !== 4 && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                                        </motion.div>
                                    )}
                                    {isCompleted && stepNumber === 4 && (
                                        <div className="relative w-3.5 h-3.5">
                                            <motion.div
                                                animate={{ opacity: [1, 0, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                <Package className="w-3.5 h-3.5 text-white" />
                                            </motion.div>
                                            <motion.div
                                                animate={{ opacity: [0, 1, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                <PackageOpen className="w-3.5 h-3.5 text-white" />
                                            </motion.div>
                                        </div>
                                    )}
                                </motion.div>
                                <span className={`text-[11px] font-semibold mt-2 absolute top-6 whitespace-nowrap transition-colors duration-300 ${isCompleted ? styles.text : 'text-slate-400'}`}>{step}</span>
                            </div>
                            {!isLast && (
                                <div className="relative mx-1 -mt-6" style={{ flex: 2 }}>
                                    <div className="absolute inset-0 h-0.5 top-3 bg-slate-100 w-full rounded-full"></div>
                                    <motion.div
                                        initial={{ width: "0%" }}
                                        animate={{ width: isCompleted && stepNumber < currentStep ? "100%" : "0%" }}
                                        transition={{ duration: 0.8, ease: "easeInOut" }}
                                        className={`absolute top-3 inset-0 h-0.5 ${styles.bg} rounded-full`}
                                    ></motion.div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    const totalPages = Math.ceil(totalOrders / limit);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 max-w-[1600px] mx-auto pb-8"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-2xl font-semibold text-slate-800 tracking-tight flex items-center"
                    >
                        <LocateFixedIcon className='text-blue-600 mr-2 w-8 h-8 ' /> Order Tracking
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-sm text-slate-500 mt-1"
                    >
                        Monitor and manage your shipments in real-time
                    </motion.p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-wrap items-center gap-4"
            >
                <div className="flex-1 min-w-[280px] relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by Order ID, PO No. or Item Name..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <div className="w-48 relative group">
                    <SelectField
                        className="w-full py-2.5 bg-slate-50/50 hover:bg-slate-50 rounded-xl text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:bg-white cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option>All Status</option>
                        <option>Pending</option>
                        <option>Approved</option>
                        <option>Dispatched</option>
                        <option>Delivered</option>
                        <option>Cancelled</option>
                    </SelectField>
                </div>

                <div className="relative flex items-center border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:bg-white transition-all overflow-hidden h-[42px] px-3 gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="date"
                        className="w-[110px] bg-transparent border-none outline-none text-sm text-slate-600 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            setAppliedStartDate(e.target.value);
                            setPage(1);
                        }}
                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    />
                    <span className="text-slate-400 text-sm font-medium">to</span>
                    <input
                        type="date"
                        className="w-[110px] bg-transparent border-none outline-none text-sm text-slate-600 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value);
                            setAppliedEndDate(e.target.value);
                            setPage(1);
                        }}
                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    />
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
                    >
                        <RefreshCcw className="w-4 h-4" /> Reset
                    </button>
                    <button
                        onClick={handleSearch}
                        className="px-6 py-2.5 bg-active-btn text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-xs shadow-blue-600/20 transition-all active:scale-95"
                    >
                        Search
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                <StatCard
                    icon={FileText} title="Total Orders" value={stats.total} percentage={`${stats.trends?.total?.value || '0%'} from last week`} trend={stats.trends?.total?.trend || 'up'}
                    colorClass="text-blue-600" iconBg="bg-blue-50" delay={0.3}
                />
                <StatCard
                    icon={Package} title="In Progress" value={stats.inProgress} percentage={`${stats.trends?.inProgress?.value || '0%'} from last week`} trend={stats.trends?.inProgress?.trend || 'up'}
                    colorClass="text-indigo-600" iconBg="bg-indigo-50" delay={0.4}
                />
                <StatCard
                    icon={Truck} title="Shipped" value={stats.shipped} percentage={`${stats.trends?.shipped?.value || '0%'} from last week`} trend={stats.trends?.shipped?.trend || 'up'}
                    colorClass="text-amber-600" iconBg="bg-amber-50" delay={0.5}
                />
                <StatCard
                    icon={CheckCircle} title="Delivered" value={stats.delivered} percentage={`${stats.trends?.delivered?.value || '0%'} from last week`} trend={stats.trends?.delivered?.trend || 'up'}
                    colorClass="text-emerald-600" iconBg="bg-emerald-50" delay={0.6}
                />
                <StatCard
                    icon={XCircle} title="Cancelled" value={stats.cancelled} percentage={`${stats.trends?.cancelled?.value || '0%'} from last week`} trend={stats.trends?.cancelled?.trend || 'down'}
                    colorClass="text-rose-600" iconBg="bg-rose-50" delay={0.7}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden relative min-h-[400px]"
            >
                <AnimatePresence>
                </AnimatePresence>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-medium text-[15px]">
                            <tr>
                                <th className="px-6 py-5 font-semibold min-w-[250px]">Order Details</th>
                                <th className="px-6 py-5 font-semibold min-w-[160px]">Order Date</th>
                                <th className="px-6 py-5 font-semibold min-w-[120px]">Items</th>
                                <th className="px-6 py-5 font-semibold min-w-[140px]">Order Value</th>
                                <th className="px-6 py-5 font-semibold min-w-[160px]">Status</th>
                                <th className="px-6 py-5 font-semibold min-w-[320px]">Tracking Timeline</th>
                                <th className="px-6 py-5 font-semibold text-right min-w-[120px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <TableRowsSkeleton columns={7} rows={8} />
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Package className="w-12 h-12 mb-3 text-slate-300" />
                                            <p className="text-base font-medium text-slate-600">No orders found</p>
                                            <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
                                            <button
                                                onClick={handleReset}
                                                className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                                            >
                                                Clear Filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence>
                                    {!loading && orders.map((order, index) => {
                                        const statusInfo = getStatusInfo(order.status);
                                        const firstItem = order.items?.[0]?.product;
                                        const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                                        const totalDesigns = order.items?.length || 0;
                                        const date = new Date(order.date);

                                        return (
                                            <motion.tr
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                key={order.id}
                                                className="hover:bg-blue-50/30 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-blue-200 group-hover:shadow-md transition-all">
                                                            <ImageZoomModal src={getFrontImageUrl(order.items?.[0]) || `https://ui-avatars.com/api/?name=${firstItem?.name || 'O'}&background=random&color=fff&rounded=false&size=128`} alt={firstItem?.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="relative group/tooltip">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-semibold text-slate-800 text-[14px] hover:text-blue-600 cursor-pointer transition-colors">{order.po_number}</span>
                                                                <div className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">PO</div>
                                                            </div>
                                                            <p className="text-xs font-medium text-slate-500 truncate max-w-[180px] cursor-help border-b border-dashed border-slate-300 pb-0.5 inline-block">{firstItem?.name || 'Multiple Items'}</p>
                                                            
                                                            {order.supplier && (
                                                                <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-4 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-50">
                                                                    <div className="flex items-start gap-3 mb-3 border-b border-slate-50 pb-3">
                                                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                                                                            {order.supplier.name?.charAt(0)}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="font-bold text-slate-800 text-sm truncate">{order.supplier.name}</h4>
                                                                            <p className="text-[11px] text-slate-500 font-medium">Code: {order.supplier.supplier_code}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {order.supplier.phone && (
                                                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                                                {order.supplier.phone}
                                                                            </div>
                                                                        )}
                                                                        {order.supplier.city && (
                                                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                                <span className="truncate">{order.supplier.city}{order.supplier.state ? `, ${order.supplier.state}` : ''}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-slate-700">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="font-semibold text-[13px]">{date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1.5 text-slate-500">
                                                        <Clock className="w-3.5 h-3.5 opacity-0" />
                                                        <span className="text-xs">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-semibold text-xs flex items-center gap-1.5 border border-slate-200 shadow-xs">
                                                            <Package className="w-3.5 h-3.5 text-blue-500" />
                                                            {order.items?.length || 0} Items
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-800 text-[14px]">₹ {parseFloat(order.total_amount).toLocaleString('en-IN')}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start">
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${statusInfo.bg} ${statusInfo.color} text-xs font-semibold border border-current/10 shadow-xs`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${statusInfo.dot}`}></span>
                                                            {statusInfo.label}
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 mt-2 font-medium">
                                                            {statusInfo.step === 4 ? `Delivered: ${date.toLocaleDateString()}` :
                                                                statusInfo.step === -1 ? `Cancelled: ${date.toLocaleDateString()}` :
                                                                    statusInfo.step === 3 ? `Shipped: ${date.toLocaleDateString()}` :
                                                                        'Est. Dispatch: Processing'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 min-w-[340px]">
                                                    <div className="pt-2 pb-6">
                                                        <Stepper currentStep={statusInfo.step} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => setSelectedOrder(order)} className="px-4 py-2 bg-white border border-slate-200 text-blue-600 font-semibold text-xs rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all active:scale-95">
                                                            Details
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    itemsPerPage={limit}
                    onItemsPerPageChange={(val) => {
                        setLimit(val);
                        setPage(1);
                    }}
                    totalItems={totalOrders}
                />
            </motion.div>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title="Update Order Status"
                message={`Are you sure you want to mark this order as ${confirmState.status?.replace('_', ' ')}?`}
                onConfirm={confirmUpdateStatus}
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

            {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdateStatus={handleUpdateStatus} />}
        </motion.div>
    );
};

export default OrderTracking;

