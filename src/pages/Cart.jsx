import React, { useState, useEffect } from 'react';
import { useCart } from '../store/CartContext';
import {
    ShoppingCart, Trash2, ArrowLeft, Package, Info, ShieldCheck, ClipboardList,
    Truck, Headset,
    LocateIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createOrderApi } from '../commonApi/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ImageZoomModal from '../components/common/ImageZoomModal';

import { getTransportersApi } from '../commonApi/api';
import TruckButton from '../components/ui/TruckButton';
import SelectField from '../components/common/SelectField';

const Cart = () => {
    const { cartItems, updateQuantity, removeFromCart, clearCart, cartStats } = useCart();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderStatus, setOrderStatus] = useState('idle');
    const [supplierTransporters, setSupplierTransporters] = useState({});
    const [selectedTransporters, setSelectedTransporters] = useState({});
    const [selectedSupplierId, setSelectedSupplierId] = useState(null);

    const supplierGroups = React.useMemo(() => {
        return cartItems.reduce((acc, item) => {
            const sId = item.product.supplier_id;
            if (!acc[sId]) {
                acc[sId] = {
                    supplierId: sId,
                    supplierName: item.product.supplier?.name || `Supplier #${sId}`,
                    items: [],
                };
            }
            acc[sId].items.push(item);
            return acc;
        }, {});
    }, [cartItems]);

    useEffect(() => {
        const sIds = Object.keys(supplierGroups);
        if (sIds.length > 0 && (!selectedSupplierId || !sIds.includes(selectedSupplierId.toString()))) {
            setSelectedSupplierId(parseInt(sIds[0]));
        } else if (sIds.length === 0) {
            setSelectedSupplierId(null);
        }
    }, [supplierGroups, selectedSupplierId]);

    const selectedGroup = React.useMemo(() => selectedSupplierId ? supplierGroups[selectedSupplierId] : null, [selectedSupplierId, supplierGroups]);
    const selectedItems = React.useMemo(() => selectedGroup ? selectedGroup.items : [], [selectedGroup]);

    const selectedStats = React.useMemo(() => {
        return selectedItems.reduce((stats, item) => {
            stats.totalItems += item.quantity;
            const itemSubtotal = item.quantity * parseFloat(item.product.price || 0);
            const gstPercent = parseFloat(item.product.gst) || 5;
            const gstAmount = itemSubtotal * (gstPercent / 100);
            stats.subtotal += itemSubtotal;
            stats.gstTotal += gstAmount;
            stats.grandTotal += (itemSubtotal + gstAmount);
            return stats;
        }, { totalItems: 0, subtotal: 0, gstTotal: 0, grandTotal: 0 });
    }, [selectedItems]);

    // Order details state
    const [orderGivenBy, setOrderGivenBy] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [orderRemarks, setOrderRemarks] = useState('');

    useEffect(() => {
        const fetchTransporters = async () => {
            const supplierIds = [...new Set(cartItems.map(item => item.product?.supplier_id))].filter(Boolean);
            if (supplierIds.length === 0) return;

            const transportersMap = {};
            for (const id of supplierIds) {
                try {
                    const res = await getTransportersApi({ supplier_id: id });
                    if (res.success && res.data?.length > 0) {
                        transportersMap[id] = res.data;
                    }
                } catch (err) {
                    console.error('Failed to fetch transporters for supplier', id);
                }
            }
            setSupplierTransporters(transportersMap);
        };
        fetchTransporters();
    }, [cartItems]);

    const handlePlaceOrder = async () => {
        if (!selectedSupplierId || selectedItems.length === 0) {
            toast.error('No items selected for checkout.');
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                supplier_id: selectedSupplierId,
                transporter_id: selectedTransporters[selectedSupplierId] || null,
                order_given_by: orderGivenBy,
                phone_number: phoneNumber,
                remarks: orderRemarks,
                items: selectedItems.map(item => ({
                    product_id: item.product.id,
                    variant_id: item.variant.id,
                    quantity: item.quantity,
                    rate: item.product.price,
                    remarks: `Color: ${item.variant.color || 'Default'}${item.remarks ? ` | Notes: ${item.remarks}` : ''}`
                }))
            };

            const data = await createOrderApi(payload);
            if (data.success) {
                setOrderStatus('success');
            } else {
                toast.error('Failed to place order. Please try again.');
                setOrderStatus('idle');
            }
        } catch (error) {
            console.error('Order submission error:', error);
            toast.error('An error occurred while placing the order.');
            setOrderStatus('idle');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in">
                <div className="bg-slate-100 p-8 rounded-full mb-6">
                    <ShoppingCart className="w-16 h-16 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-navy-dark mb-3">Your Cart is Empty</h2>
                <p className="text-slate-500 mb-8 text-center max-w-sm">
                    Looks like you haven't added any products to your cart yet.
                </p>
                <button
                    onClick={() => navigate('/products')}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium shadow-md hover:bg-blue-700 transition-all hover:-translate-y-0.5"
                >
                    Continue Shopping
                </button>
            </div>
        );
    }

    const features = [
        {
            icon: <ClipboardList className="w-6 h-6 text-blue-500" />,
            title: "Best Wholesale Prices",
            desc: "Get the best prices on bulk purchases and regular orders.",
            bg: "bg-blue-50"
        },
        {
            icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
            title: "Secure Payments",
            desc: "100% secure payments with multiple payment options.",
            bg: "bg-green-50"
        },
        {
            icon: <Truck className="w-6 h-6 text-orange-500" />,
            title: "Fast Delivery",
            desc: "Timely delivery across India with real-time tracking.",
            bg: "bg-orange-50"
        },
        {
            icon: <Headset className="w-6 h-6 text-purple-500" />,
            title: "Dedicated Support",
            desc: "24/7 support from our dedicated account team.",
            bg: "bg-purple-50"
        }
    ];

    return (
        <>
            <div className="space-y-6 animate-fade-in pb-24 max-w-7xl mx-auto lg:px-6 mt-2">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-semibold text-navy-dark flex items-baseline gap-2">
                            My Cart <span className="text-sm font-medium text-slate-500">({cartItems.length} Items)</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Review your selected products before placing an order.</p>
                    </div>
                    <button
                        onClick={() => navigate('/products')}
                        className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white shadow-xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Continue Shopping
                    </button>
                </div>

                <div className="bg-[#f0f4f8] border border-blue-100 rounded-xl p-3 flex items-center gap-3 mb-6">
                    <div className="bg-blue-600 rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                        <Info className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm text-blue-900">
                        <span className="font-semibold text-blue-600">Prices are exclusive of GST.</span> Taxes will be calculated at checkout.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 sticky top-6 self-start h-fit max-h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar">
                        {Object.values(supplierGroups).map(group => {
                            const isSelected = selectedSupplierId === group.supplierId;
                            return (
                                <div
                                    key={group.supplierId}
                                    className={`bg-white rounded-2xl border shadow-sm p-6 mb-6 transition-all cursor-pointer ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-100'}`}
                                    onClick={() => setSelectedSupplierId(group.supplierId)}
                                >
                                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <input type="radio" checked={isSelected} readOnly className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                            <h3 className="font-semibold text-navy-dark text-lg">{group.supplierName}</h3>
                                        </div>
                                        <span className="text-sm font-medium text-slate-500">{group.items.length} Products</span>
                                    </div>

                                    {/* Table Header */}
                                    <div className="hidden md:grid grid-cols-12 text-md font-semibold text-navy-dark border-b border-slate-100 pb-4 mb-4">
                                        <div className="col-span-6">Product</div>
                                        <div className="col-span-2 text-center">Price</div>
                                        <div className="col-span-2 text-center">Quantity</div>
                                        <div className="col-span-2 text-right">Total</div>
                                    </div>

                                    {/* Cart Items */}
                                    <div className="space-y-2">
                                        {group.items.map(item => {
                                            const itemTotal = item.quantity * parseFloat(item.product.price);
                                            return (
                                                <div key={item.variant.id} className="grid grid-cols-1 md:grid-cols-12 items-center py-5 border-b border-slate-50 last:border-0 relative group gap-4 md:gap-0">
                                                    {/* Product Col */}
                                                    <div className="col-span-1 md:col-span-6 flex gap-4">
                                                        <div className="w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative">
                                                            {item.variant.url ? (
                                                                <ImageZoomModal src={`http://localhost:5000${item.variant.url}`} alt={item.product.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-slate-300" /></div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col justify-center">
                                                            <h3 className="font-semibold text-navy-dark text-[16px] leading-tight mb-1" title={item.product.name}>
                                                                {item.product.name}
                                                            </h3>
                                                            <p className="text-[13px] text-slate-500">{item.product.category?.name || item.variant.color || 'Premium Quality'}</p>
                                                            <p className="text-[12px] text-slate-400 mt-1">SKU: {item.product.product_code}</p>
                                                        </div>
                                                    </div>

                                                    {/* Price Col */}
                                                    <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-center font-semibold text-slate-800">
                                                        <span className="md:hidden text-slate-500 font-normal">Price</span>
                                                        ₹ {parseFloat(item.product.price).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                                    </div>

                                                    {/* Quantity Col */}
                                                    <div className="col-span-1 md:col-span-2 flex items-center justify-between md:flex-col md:justify-center gap-2 md:gap-0">
                                                        <span className="md:hidden text-slate-500 font-normal">Quantity</span>
                                                        <div className="flex items-center justify-between border border-slate-200 rounded-lg px-1 py-0.5 h-10 w-24">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); updateQuantity(item.variant.id, item.quantity - 1, item.variant.quantity); }}
                                                                className="text-slate-500 hover:text-navy-dark hover:bg-slate-100 rounded w-8 h-8 flex items-center justify-center text-lg font-medium transition-all"
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="text"
                                                                value={item.quantity}
                                                                onChange={(e) => { e.stopPropagation(); updateQuantity(item.variant.id, parseInt(e.target.value) || 1, item.variant.quantity); }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-8 text-center bg-transparent border-0 outline-none font-bold text-sm text-slate-800 focus:ring-0 p-0"
                                                            />
                                                            <button
                                                                type="button"
                                                                disabled={item.quantity >= item.variant.quantity}
                                                                onClick={(e) => { e.stopPropagation(); updateQuantity(item.variant.id, item.quantity + 1, item.variant.quantity); }}
                                                                className="text-slate-500 hover:text-navy-dark hover:bg-slate-100 rounded w-8 h-8 flex items-center justify-center text-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <div className="text-[11px] font-medium text-emerald-500 md:mt-1.5 hidden md:block">
                                                            Stock: {item.variant.quantity}+ pcs
                                                        </div>
                                                    </div>

                                                    {/* Total & Delete Col */}
                                                    <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-4 relative">
                                                        <span className="md:hidden text-slate-500 font-normal">Total</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-bold text-navy-dark text-[15px]">
                                                                ₹ {itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                                            </span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); removeFromCart(item.variant.id); }}
                                                                className="w-9 h-9 flex items-center justify-center text-rose-400 border border-rose-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors md:ml-2 shrink-0"
                                                                title="Remove item"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Global Cart Actions */}
                        <div className="flex items-center justify-between mt-2 mb-8 px-2">
                            <button
                                onClick={clearCart}
                                className="flex items-center gap-2 px-5 py-2.5 border border-rose-200 text-rose-500 font-semibold rounded-xl hover:bg-rose-50 transition-colors text-sm bg-white"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear Entire Cart
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-1 sticky top-6 self-start h-fit">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-navy-dark mb-6">Order Summary</h2>

                            <div className="space-y-4 text-sm mb-6">
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Subtotal ({selectedStats.totalItems} Items)</span>
                                    <span className="font-semibold text-navy-dark">₹ {selectedStats.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                                </div>

                                <div className="flex justify-between items-center text-slate-600">
                                    <span className="flex items-center gap-1">Shipping Charges <Info className="w-3.5 h-3.5 text-slate-400" /></span>
                                    <span className="font-bold text-emerald-500">FREE</span>
                                </div>

                                <div className="flex justify-between items-center text-slate-600 border-b border-slate-100 pb-4">
                                    <span>GST (5%)</span>
                                    <span className="font-semibold text-navy-dark">₹ {selectedStats.gstTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div>
                                        <div className="font-semibold text-navy-dark text-[17px]">Total Amount</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">Incl. of GST</div>
                                    </div>
                                    <span className="font-semibold text-navy-dark text-xl">₹ {selectedStats.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                                </div>
                            </div>

                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-start gap-3 mb-6">
                                <Truck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-emerald-700">You are eligible for free shipping!</p>
                                    <p className="text-xs text-emerald-600/80 mt-0.5">Place order above ₹ 25,000</p>
                                </div>
                            </div>

                            <div className="mb-6 space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <h3 className="text-sm font-semibold text-navy-dark flex items-center gap-2 mb-2">
                                    <ClipboardList className="w-4 h-4 text-slate-500" />
                                    Order Details
                                </h3>
                                <div>
                                    <label className="text-[13px] font-semibold text-slate-600 mb-1 block">Order Given By</label>
                                    <input
                                        type="text"
                                        value={orderGivenBy}
                                        onChange={(e) => setOrderGivenBy(e.target.value)}
                                        placeholder="e.g. John Doe"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[13px] font-semibold text-slate-600 mb-1 block">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="Enter phone number"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[13px] font-semibold text-slate-600 mb-1 block">Order Remarks / Notes</label>
                                    <textarea
                                        value={orderRemarks}
                                        onChange={(e) => setOrderRemarks(e.target.value)}
                                        placeholder="Any special instructions..."
                                        rows={2}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
                                    />
                                </div>
                            </div>

                            {selectedSupplierId && supplierTransporters[selectedSupplierId] && supplierTransporters[selectedSupplierId].length > 0 && (
                                <div className="mb-6 space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                    <h3 className="text-sm font-semibold text-navy-dark flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-slate-500" />
                                        Select Transporter
                                    </h3>
                                    <SelectField
                                        value={selectedTransporters[selectedSupplierId] || ''}
                                        onChange={(e) => setSelectedTransporters({ ...selectedTransporters, [selectedSupplierId]: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg text-sm"
                                    >
                                        <option value="">-- Let Supplier Decide --</option>
                                        {supplierTransporters[selectedSupplierId].map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </SelectField>
                                </div>
                            )}

                            <div className="space-y-3">
                                <TruckButton
                                    onClick={handlePlaceOrder}
                                    disabled={!selectedSupplierId || selectedItems.length === 0 || isSubmitting}
                                    className="w-full bg-active-btn !text-white h-12"
                                    successText="Order Processed!"
                                >
                                    Proceed to Checkout
                                </TruckButton>
                            </div>
                        </div>

                        <div className="mt-6 flex items-start gap-3 px-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-navy-dark">Secure Checkout</p>
                                <p className="text-[13px] text-slate-500 mt-0.5 leading-snug">Your data is protected with 256-bit SSL encryption.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-12 mt-12 border-t border-slate-100 mb-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                            <div className={`w-12 h-12 rounded-full ${feature.bg} flex items-center justify-center shrink-0`}>
                                {feature.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-navy-dark text-sm mb-1">{feature.title}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed pr-4">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-xs text-slate-400 mt-12 flex justify-between items-center border-t border-slate-100 pt-6">
                    <p>© 2025 Kannan Silks Buyer Portal. All rights reserved.</p>
                    <div className="flex items-center gap-2 font-medium">
                        Need help?
                        <button className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700">
                            <Headset className="w-4 h-4" />
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {orderStatus === 'success' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
                            className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl w-full max-w-md relative overflow-hidden"
                        >
                            {/* Decorative background blur */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-emerald-50 blur-3xl rounded-full opacity-60 z-0 pointer-events-none"></div>

                            <div className="relative flex justify-center items-center mb-8 mt-4 z-10">
                                {/* Confetti Explosion */}
                                {Array.from({ length: 45 }).map((_, i) => {
                                    const angle = (Math.PI * 2 * i) / 45;
                                    const distance = 100 + Math.random() * 150;
                                    const size = 6 + Math.random() * 8;
                                    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-400', 'bg-rose-500', 'bg-purple-500', 'bg-orange-400'];
                                    const color = colors[Math.floor(Math.random() * colors.length)];
                                    const isCircle = Math.random() > 0.5;

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                                            animate={{
                                                x: Math.cos(angle) * distance,
                                                y: Math.sin(angle) * distance + (Math.random() * 100), // Gravity effect
                                                scale: [0, 1, 0],
                                                opacity: [1, 1, 0],
                                                rotate: Math.random() * 360 + 180
                                            }}
                                            transition={{
                                                duration: 1.5 + Math.random(),
                                                delay: 1.2, // explode when checkmark appears
                                                ease: "easeOut"
                                            }}
                                            className={`absolute top-1/2 left-1/2 -mt-1 -ml-1 ${color} ${isCircle ? 'rounded-full' : 'rounded-sm'}`}
                                            style={{ width: size, height: size, zIndex: -1 }}
                                        />
                                    );
                                })}

                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                                    className="relative w-28 h-28"
                                >
                                    {/* Ripples */}
                                    <motion.div
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 2.5, opacity: 0 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1.4 }}
                                        className="absolute inset-0 bg-emerald-400 rounded-full"
                                    />
                                    <motion.div
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 2.5, opacity: 0 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 2.4 }}
                                        className="absolute inset-0 bg-emerald-400 rounded-full"
                                    />

                                    {/* Solid background container */}
                                    <motion.div className="absolute inset-0 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200/50 overflow-hidden">

                                        {/* Truck driving sequence */}
                                        <motion.div
                                            initial={{ x: -100, opacity: 0 }}
                                            animate={{ x: [-100, 0, 0, 100], opacity: [0, 1, 1, 0] }}
                                            transition={{ times: [0, 0.3, 0.7, 1], duration: 1.2, ease: "easeInOut", delay: 0.2 }}
                                            className="absolute inset-0 flex items-center justify-center"
                                        >
                                            <Truck className="w-12 h-12 text-white" />
                                        </motion.div>

                                        {/* Animated Checkmark that pops in after truck leaves */}
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 1.3, type: "spring", stiffness: 200, damping: 15 }}
                                            className="absolute inset-0 flex items-center justify-center bg-emerald-500"
                                        >
                                            <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <motion.path
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 0.6, ease: "easeOut", delay: 1.5 }}
                                                    d="M20 6L9 17l-5-5"
                                                />
                                            </svg>
                                        </motion.div>
                                    </motion.div>
                                </motion.div>
                            </div>

                            <motion.h3
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.7, type: "spring", stiffness: 100 }}
                                className="text-2xl md:text-3xl font-semibold text-navy-dark mb-3 text-center z-10"
                            >
                                Order Confirmed!
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.8, type: "spring", stiffness: 100 }}
                                className="text-slate-500 text-center mb-10 px-4 text-sm md:text-base z-10"
                            >
                                Your order has been successfully placed. You will receive updates shortly on your registered email.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
                                className="flex flex-col w-full gap-3 z-10"
                            >
                                <button
                                    onClick={() => {
                                        selectedItems.forEach(item => removeFromCart(item.variant.id));
                                        setOrderStatus('idle');
                                        navigate('/orders');
                                    }}
                                    className="w-full bg-active-btn flex items-center justify-center gap-2 text-white font-medium py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                                >
                                    <LocateIcon className='scale-110' /> Track My Order
                                </button>
                                <button
                                    onClick={() => {
                                        selectedItems.forEach(item => removeFromCart(item.variant.id));
                                        setOrderStatus('idle');
                                        if (cartItems.length === selectedItems.length) {
                                            navigate('/products');
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                                >
                                    <ArrowLeft /> Continue Shopping
                                </button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Cart;
