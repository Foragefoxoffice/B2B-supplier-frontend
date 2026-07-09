import React, { useState } from 'react';
import { ChevronLeft, ShoppingCart, Package, Info, FileText, CheckCircle, Truck, ShoppingBag, MessageSquare } from 'lucide-react';

const resolveSingleColor = (colorName) => {
    if (!colorName) return '#CBD5E1';
    const color = colorName.toLowerCase().trim();
    if (color.includes('red') || color.includes('crimson') || color.includes('ruby')) return '#EF4444';
    if (color.includes('dark blue') || color.includes('navy')) return '#1E3A8A';
    if (color.includes('blue') || color.includes('royal')) return '#3B82F6';
    if (color.includes('green') || color.includes('emerald') || color.includes('olive')) return '#10B981';
    if (color.includes('yellow') || color.includes('amber')) return '#F59E0B';
    if (color.includes('pink') || color.includes('rose') || color.includes('magenta')) return '#EC4899';
    if (color.includes('purple') || color.includes('violet') || color.includes('lavender') || color.includes('plum')) return '#8B5CF6';
    if (color.includes('orange') || color.includes('coral')) return '#F97316';
    if (color.includes('black') || color.includes('charcoal')) return '#1E293B';
    if (color.includes('white') || color.includes('cream') || color.includes('ivory')) return '#F8FAFC';
    if (color.includes('grey') || color.includes('gray') || color.includes('slate')) return '#64748B';
    if (color.includes('gold') || color.includes('bronze') || color.includes('mustard')) return '#D97706';
    if (color.includes('brown') || color.includes('chocolate') || color.includes('coffee') || color.includes('tan')) return '#78350F';
    if (color.includes('cyan') || color.includes('teal') || color.includes('turquoise')) return '#14B8A6';

    let hash = 0;
    for (let i = 0; i < colorName.length; i++) {
        hash = colorName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 65%, 55%)`;
};

const getColorDotStyle = (colorName) => {
    if (!colorName) return { backgroundColor: '#CBD5E1' };

    const parts = colorName.split(/[\+\/]|and/i).map(part => part.trim()).filter(Boolean);

    if (parts.length === 1) {
        return { backgroundColor: resolveSingleColor(parts[0]) };
    } else if (parts.length > 1) {
        const colors = parts.map(resolveSingleColor);
        if (colors.length === 2) {
            return { background: `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)` };
        } else {
            const gradientParts = colors.map((col, idx) => {
                const start = (idx / colors.length) * 100;
                const end = ((idx + 1) / colors.length) * 100;
                return `${col} ${start}%, ${col} ${end}%`;
            });
            return { background: `linear-gradient(135deg, ${gradientParts.join(', ')})` };
        }
    }
    return { backgroundColor: '#CBD5E1' };
};

const ProductGallery = ({
    product,
    onBack,
    variantQuantities,
    onUpdateVariantQty,
    onSetVariantQty,
    onPlaceBatchOrder,
    isSubmitting
}) => {
    if (!product) return null;

    const [activeImage, setActiveImage] = useState(
        product.images && product.images.length > 0 ? product.images[0] : null
    );
    const [remarks, setRemarks] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Compute selected items
    const selectedItems = (product.images || [])
        .map(variant => ({
            variant,
            quantity: variantQuantities[variant.id] || 0
        }))
        .filter(item => item.quantity > 0);

    const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = totalQuantity * parseFloat(product.price);
    const gstPercent = parseInt(product.gst) || 0;
    const gstAmount = subtotal * (gstPercent / 100);
    const grandTotal = subtotal + gstAmount;

    const handleConfirmOrder = () => {
        setShowConfirmModal(false);
        onPlaceBatchOrder(product, selectedItems, remarks);
    };

    return (
        <div className="space-y-6 animate-fade-in text-left">
            {/* Header breadcrumb line */}
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-2xs">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm font-semibold text-secondary cursor-pointer transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Supplier Catalog
                </button>
                <span className="text-[13px] text-slate-400 font-semibold">
                    Order Workspace
                </span>
            </div>

            {/* Split Pane Details & Order Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* LEFT COLUMN: Media Gallery & Specs (7 cols) */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Main Visual Display */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                        <div className="w-full aspect-[8/9] max-h-[500px] rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center relative group">
                            {activeImage ? (
                                <img
                                    src={`http://localhost:5000${activeImage.url}`}
                                    alt={`${product.name} - Display`}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <Package className="h-12 w-12 text-slate-300" />
                                    <span className="text-xs uppercase tracking-wider font-extrabold">No image selected</span>
                                </div>
                            )}

                            {activeImage?.color && (
                                <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 bg-navy-dark/95 backdrop-blur-xs text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/10 shadow-md">
                                    <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={getColorDotStyle(activeImage.color)}></span>
                                    {activeImage.color}
                                </span>
                            )}
                        </div>

                        {/* Color Variant Thumbnail Gallery */}
                        {product.images && product.images.length > 1 && (
                            <div className="w-full mt-4">
                                <span className="text-[13px] font-semibold text-slate-600 block mb-2 px-1">View Color Variants ({product.images.length})</span>
                                <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
                                    {product.images.map(img => {
                                        const isActive = activeImage?.id === img.id;
                                        const orderQty = variantQuantities[img.id] || 0;
                                        return (
                                            <button
                                                key={img.id}
                                                onClick={() => setActiveImage(img)}
                                                className={`h-16 w-14 rounded-lg overflow-hidden border-2 shrink-0 relative transition-all duration-200 cursor-pointer ${isActive ? 'border-secondary scale-103 shadow-md' : 'border-slate-200 hover:border-slate-400'
                                                    }`}
                                            >
                                                <img src={`http://localhost:5000${img.url}`} alt={img.color} className="h-full w-full object-cover" />
                                                {orderQty > 0 && (
                                                    <span className="absolute top-1 right-1 bg-secondary text-white text-[8.5px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                                                        {orderQty}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Specifications Sheet */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest block">Product Specifications</span>
                            <h3 className="text-lg font-semibold text-navy-dark uppercase tracking-wide mt-1">{product.name}</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-50/80 border border-slate-200/60 p-3.5 rounded-xl flex flex-col justify-center">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Design Code</span>
                                <p className="font-semibold text-navy-dark tracking-wide uppercase">{product.product_code}</p>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-200/60 p-3.5 rounded-xl flex flex-col justify-center">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Base Price</span>
                                <p className="font-semibold text-navy-dark">₹{parseFloat(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-200/60 p-3.5 rounded-xl flex flex-col justify-center">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">GST Percent</span>
                                <p className="font-semibold text-navy-dark">{product.gst || '5%'}</p>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-200/60 p-3.5 rounded-xl flex flex-col justify-center">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Material</span>
                                <p className="font-semibold text-navy-dark uppercase tracking-wide">{product.material || 'Silk / Saree'}</p>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-200/60 p-3.5 rounded-xl flex flex-col justify-center">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Category</span>
                                <p className="font-semibold text-navy-dark uppercase tracking-wide">{product.category?.name || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-200/60 p-3.5 rounded-xl flex flex-col justify-center">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Min Order Qty</span>
                                <p className="font-semibold text-navy-dark">{product.moq || 1} {product.unit || 'pcs'}</p>
                            </div>
                        </div>

                        {product.description && (
                            <div className="border-t border-slate-100 mt-4 pt-4 space-y-1">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9.5px]">Design Description</span>
                                <p className="text-xs text-slate-650 leading-relaxed font-medium">{product.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Multi-variant Ordering Panel (5 cols) */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
                        <div className="border-b border-slate-100 pb-3 mb-4">
                            <span className="text-[14px] font-semibold text-secondary block mb-2">Configure Order</span>
                            <h3 className="text-xl font-semibold text-navy-dark mt-0.5 flex items-center gap-1.5">
                                <ShoppingBag className="w-4.5 h-4.5 text-secondary" />
                                Select Quantities per Color
                            </h3>
                        </div>

                        {/* Colors Variant Table List */}
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                            {product.images && product.images.length > 0 ? (
                                product.images.map(variant => {
                                    const qty = variantQuantities[variant.id] || 0;
                                    const isOutOfStock = variant.quantity <= 0;
                                    const isLowStock = variant.quantity > 0 && variant.quantity <= 10;

                                    return (
                                        <div
                                            key={variant.id}
                                            className={`flex items-center justify-between p-3.5 border rounded-xl transition-all duration-300 ${qty > 0
                                                ? 'bg-blue-50/20 border-secondary/50 shadow-xs ring-1 ring-secondary/10'
                                                : 'bg-white border-slate-200/70 hover:bg-slate-50/50 hover:border-slate-350'
                                                }`}
                                        >
                                            {/* Left: Thumbnail & Color Dot Details */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveImage(variant)}
                                                    className="h-11 w-9 rounded-md overflow-hidden bg-slate-50 border border-slate-200 shrink-0 cursor-pointer shadow-2xs hover:scale-102 transition-transform"
                                                    title="Click to view image"
                                                >
                                                    <img src={`http://localhost:5000${variant.url}`} alt={variant.color} className="h-full w-full object-cover" />
                                                </button>
                                                <div className="min-w-0">
                                                    <span className="font-semibold text-sm text-slate-800 block truncate">
                                                        {variant.color || 'Not Specified'}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 text-[12px] font-semibold mt-0.5 ${isOutOfStock
                                                        ? 'text-rose-500'
                                                        : isLowStock
                                                            ? 'text-amber-500'
                                                            : 'text-emerald-500'
                                                        }`}>
                                                        <span className={`w-1 h-1 rounded-full ${isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}></span>
                                                        {isOutOfStock ? 'Out of Stock' : `${variant.quantity} available`}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right: Price & Stepper */}
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-sm font-semibold text-slate-700">
                                                    ₹{parseFloat(product.price).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                                </span>

                                                {/* Stepper block */}
                                                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-1 py-1 h-9 w-24 shadow-inner">
                                                    <button
                                                        type="button"
                                                        disabled={isOutOfStock || qty === 0}
                                                        onClick={() => onUpdateVariantQty(variant.id, -1, variant.quantity)}
                                                        className="text-slate-500 hover:text-navy-dark hover:bg-slate-200/60 rounded-md w-7 h-7 flex items-center justify-center text-sm font-extrabold disabled:opacity-30 disabled:cursor-not-allowed select-none transition-all cursor-pointer"
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={qty}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            onSetVariantQty(variant.id, val, variant.quantity);
                                                        }}
                                                        disabled={isOutOfStock}
                                                        className="w-7 text-center bg-transparent border-0 outline-none font-black text-xs text-slate-800 focus:ring-0 p-0"
                                                    />
                                                    <button
                                                        type="button"
                                                        disabled={isOutOfStock || qty >= variant.quantity}
                                                        onClick={() => onUpdateVariantQty(variant.id, 1, variant.quantity)}
                                                        className="text-slate-500 hover:text-navy-dark hover:bg-slate-200/60 rounded-md w-7 h-7 flex items-center justify-center text-sm font-extrabold disabled:opacity-30 disabled:cursor-not-allowed select-none transition-all cursor-pointer"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-slate-400 font-medium">No variants found.</div>
                            )}
                        </div>

                        {/* Remarks Section */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-left">
                            <span className="text-[14px] font-semibold text-slate-450 px-0.5 flex items-center gap-1.5 mb-2">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                Delivery Notes / Special Instructions
                            </span>
                            <textarea
                                placeholder="e.g. Please label boxes with design code, urgent dispatch requested..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/25 h-24 resize-none transition-all text-sm bg-slate-50/50 text-slate-800"
                            />
                        </div>

                        {/* Total Summary Block */}
                        <div className="bg-slate-50/55 border border-slate-200 rounded-2xl p-4.5 mt-5 space-y-3 text-xs text-left shadow-inner">
                            <div className="flex justify-between items-center text-slate-500 font-semibold">
                                <span>Total Items selected</span>
                                <span className="text-navy-dark font-black bg-white px-2 py-0.5 rounded border border-slate-200/50">{totalQuantity} {product.unit || 'pcs'}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-500 font-semibold">
                                <span>Subtotal Rate</span>
                                <span className="text-navy-dark font-black">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-500 font-semibold border-b border-slate-200/80 pb-3">
                                <span>GST Tax (5%)</span>
                                <span className="text-navy-dark font-black">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-1">
                                <span className="font-semibold text-navy-dark">Total Order Amount</span>
                                <span className="font-black text-secondary text-base">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        {/* Place Order CTA */}
                        <button
                            type="button"
                            disabled={totalQuantity === 0 || isSubmitting}
                            onClick={() => setShowConfirmModal(true)}
                            className="w-full bg-gradient-to-r from-secondary to-primary hover:from-blue-500 hover:to-blue-700 text-white py-3.5 rounded-xl text-md font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all border-0 shadow-sm shadow-secondary/20 hover:shadow-md hover:shadow-secondary/20 mt-5 select-none"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            <span>Place Purchase Order ({totalQuantity})</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Verification B2B Order Modal Overlay */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-navy-dark/75 backdrop-blur-xs transition-opacity" onClick={() => setShowConfirmModal(false)}></div>

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-scale-in text-left">

                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-navy-dark to-[#102450] text-white px-5 py-4 border-b border-navy-dark flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-wider text-secondary flex items-center gap-1.5">
                                    <FileText className="w-4.5 h-4.5" />
                                    Order Review Sheet
                                </h3>
                                <p className="text-[10px] text-slate-300 font-medium">Verify your purchase orders before final submission.</p>
                            </div>
                            <span className="text-[10px] bg-white/10 text-white border border-white/15 px-2 py-0.5 rounded uppercase tracking-wider font-extrabold">
                                B2B PO
                            </span>
                        </div>

                        {/* Modal Content */}
                        <div className="p-5 overflow-y-auto flex-1 space-y-4">
                            <div className="bg-slate-50/70 border border-slate-200/65 rounded-xl p-4 text-xs grid grid-cols-2 gap-y-2.5 gap-x-4">
                                <div>
                                    <span className="text-slate-400 font-extrabold block uppercase tracking-wider text-[8.5px]">Design Name</span>
                                    <span className="font-bold text-navy-dark uppercase text-xs">{product.name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-extrabold block uppercase tracking-wider text-[8.5px]">Design Code</span>
                                    <span className="font-bold text-navy-dark uppercase text-xs bg-slate-200/50 px-2 py-0.5 rounded inline-block">{product.product_code}</span>
                                </div>
                                <div className="col-span-2 border-t border-slate-250/50 pt-2.5 mt-1">
                                    <span className="text-slate-400 font-extrabold block uppercase tracking-wider text-[8.5px]">Supplier Name</span>
                                    <span className="font-bold text-navy-dark uppercase text-xs">{product.supplier?.name || "Kannan Silks Supplier"}</span>
                                </div>
                            </div>

                            {/* Order items detail listing */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block px-0.5">Order Items</span>
                                <div className="border border-slate-200/70 rounded-xl overflow-hidden shadow-2xs">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-50/90 border-b border-slate-200/70 text-slate-450 text-[9px] font-bold uppercase tracking-wider">
                                                <th className="py-2.5 px-4 font-bold text-slate-500">Color</th>
                                                <th className="py-2.5 px-4 text-center font-bold text-slate-500">Qty</th>
                                                <th className="py-2.5 px-4 text-right font-bold text-slate-500">Rate</th>
                                                <th className="py-2.5 px-4 text-right font-bold text-slate-500">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                                            {selectedItems.map(({ variant, quantity }) => (
                                                <tr key={variant.id} className="hover:bg-slate-50/55 transition-colors">
                                                    <td className="py-2.5 px-4 font-semibold uppercase flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full border border-slate-200" style={getColorDotStyle(variant.color)}></span>
                                                        {variant.color || 'Not Specified'}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center font-bold text-navy-dark">{quantity} {product.unit || 'pcs'}</td>
                                                    <td className="py-2.5 px-4 text-right text-slate-500">₹{parseFloat(product.price).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</td>
                                                    <td className="py-2.5 px-4 text-right font-bold text-navy-dark">₹{(quantity * parseFloat(product.price)).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {remarks && (
                                <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-3.5 text-xs text-left">
                                    <span className="text-amber-800 font-extrabold uppercase tracking-wider text-[8.5px] block">Order Notes</span>
                                    <p className="text-slate-650 font-medium leading-relaxed mt-1">{remarks}</p>
                                </div>
                            )}

                            {/* Price calculations block */}
                            <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-4 space-y-2.5 text-xs text-left">
                                <div className="flex justify-between items-center text-slate-500 font-semibold">
                                    <span>Subtotal Rate ({totalQuantity} items)</span>
                                    <span className="text-navy-dark font-black">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-500 font-semibold border-b border-slate-200/50 pb-2.5">
                                    <span>GST Tax (5%)</span>
                                    <span className="text-navy-dark font-black">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-0.5">
                                    <span className="font-extrabold text-navy-dark">Grand Total</span>
                                    <span className="font-black text-secondary text-base">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmOrder}
                                className="px-6 py-2.5 bg-gradient-to-r from-secondary to-primary hover:from-blue-500 hover:to-blue-700 text-white font-black rounded-xl transition-colors cursor-pointer text-xs uppercase tracking-wider shadow-sm shadow-secondary/25"
                            >
                                Confirm & Place Order
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default ProductGallery;
