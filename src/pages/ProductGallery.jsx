import React, { useState } from 'react';
import { ArrowLeft, ShoppingCart, CheckCircle, Info, Calendar } from 'lucide-react';
import { useCart } from '../store/CartContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ImageZoomModal from '../components/common/ImageZoomModal';

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

    const { cartItems, addBatchToCart } = useCart();
    const navigate = useNavigate();

    const [activeImage, setActiveImage] = useState(
        product.images && product.images.length > 0 ? product.images[0] : null
    );

    const handleAddSingleItemToCart = (variant, qty, e) => {
        let finalQty = qty;
        if (finalQty === 0) finalQty = 1; // Default to 1 if not adjusted

        addBatchToCart([{ product, variant, quantity: finalQty }], '');
        toast.success(`Added ${finalQty} item(s) to cart!`);

        // Fly to cart animation
        if (e && e.currentTarget) {
            const button = e.currentTarget;
            const cartIcon = document.getElementById('cart-icon-nav');

            if (button && cartIcon) {
                const btnRect = button.getBoundingClientRect();
                const cartRect = cartIcon.getBoundingClientRect();

                const flyImg = document.createElement('img');
                flyImg.src = `http://localhost:5000${variant.url}`;
                flyImg.style.position = 'fixed';
                flyImg.style.top = `${btnRect.top}px`;
                flyImg.style.left = `${btnRect.left + btnRect.width / 2}px`;
                flyImg.style.width = '60px';
                flyImg.style.height = '75px';
                flyImg.style.objectFit = 'cover';
                flyImg.style.borderRadius = '8px';
                flyImg.style.zIndex = '9999';
                flyImg.style.pointerEvents = 'none';
                flyImg.style.transform = 'translate(-50%, -50%) scale(1)';
                flyImg.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)';
                flyImg.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

                document.body.appendChild(flyImg);

                // Trigger animation
                setTimeout(() => {
                    flyImg.style.top = `${cartRect.top + cartRect.height / 2}px`;
                    flyImg.style.left = `${cartRect.left + cartRect.width / 2}px`;
                    flyImg.style.transform = 'translate(-50%, -50%) scale(0.2)';
                    flyImg.style.opacity = '0.5';
                    flyImg.style.borderRadius = '50%';
                }, 10);

                // Remove dot and bounce cart icon
                setTimeout(() => {
                    flyImg.remove();
                    cartIcon.style.transition = 'transform 0.2s ease-in-out';
                    cartIcon.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        cartIcon.style.transform = 'scale(1)';
                    }, 200);
                }, 800);
            }
        }

        // Reset local qty for this variant
        onSetVariantQty(variant.id, 0, variant.quantity);
    };

    return (
        <div className="space-y-6 animate-fade-in text-left pb-24 max-w-7xl mx-auto lg:px-6 mt-2">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-semibold text-navy-dark flex items-center gap-3">
                        {product.name}
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md tracking-wider">
                            {product.product_code}
                        </span>
                    </h1>
                    <div className="text-sm text-slate-500 mt-2 flex items-center gap-4">
                        <span>Select a variant from the grid below and add to your order.</span>
                    </div>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors bg-white shadow-xs shrink-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Catalog
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

            {/* Grid of Variants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 pb-20">
                {(product.images || []).map(variant => {
                    const qty = variantQuantities[variant.id] || 0;
                    const isOutOfStock = variant.quantity <= 0;
                    const variantInCart = cartItems.some(item => item.variant.id === variant.id);

                    const isInactive = product.status === 'REJECTED';
                    const statusBg = isInactive ? 'text-slate-500' : 'text-emerald-600';
                    const statusDot = isInactive ? 'bg-slate-400' : 'bg-emerald-500';
                    const statusText = isInactive ? 'INACTIVE' : 'ACTIVE';

                    const stockBg = isOutOfStock ? 'bg-rose-600' : 'bg-navy-dark';

                    return (
                        <div key={variant.id} className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${qty > 0 ? 'border-blue-600 shadow-sm ring-1 ring-blue-600/20' : 'border border-slate-100 shadow-xs hover:shadow-md'}`}>
                            {/* Image Section */}
                            <div className="w-full aspect-square bg-slate-50 relative group overflow-hidden border-b border-slate-50">
                                <ImageZoomModal
                                    src={`http://localhost:5000${variant.url}`}
                                    alt={variant.color}
                                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-70 grayscale-[30%]' : ''}`}
                                />
                                {isOutOfStock && (
                                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-10">
                                        <span className="bg-rose-500 text-white text-xs font-medium uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg">Out of Stock</span>
                                    </div>
                                )}
                                {/* Status Pill */}
                                <div className={`absolute top-3 left-3 bg-white ${statusBg} text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                                    {statusText}
                                </div>
                                {/* Stock Pill */}
                                <div className={`absolute top-3 right-3 ${stockBg} text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm`}>
                                    {variant.quantity} PCS
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="p-4 flex flex-col flex-grow">
                                <div className="mb-1">
                                    <span className="text-[13px] font-semibold text-blue-600">
                                        {variant.color || 'NEW ARRIVAL'}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-navy-dark text-[16px] leading-tight mb-2 truncate" title={product.name}>{product.name}</h3>

                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                        CODE: {product.product_code}
                                    </span>
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase">
                                        {product.material || 'PURE SILK'}
                                    </span>
                                    {variant.created_at && (
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(variant.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-end justify-between mb-4 border-t border-slate-100 pt-3 mt-auto">
                                    <div>
                                        <div className="text-[15px] font-bold text-blue-700 flex items-baseline gap-1">
                                            ₹ {parseFloat(product.price).toLocaleString('en-IN')}
                                            <span className="text-[10px] text-slate-400 font-medium">/ PCS</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[11px] text-emerald-700 font-medium">Min Order</div>
                                        <div className="text-[11px] font-bold text-slate-600">{product.moq || 10} PCS</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Stepper */}
                                    <div className="flex items-center justify-between border border-slate-200 rounded-lg px-1 py-0.5 h-10 w-24 shrink-0">
                                        <button
                                            type="button"
                                            disabled={isOutOfStock || qty === 0 || variantInCart}
                                            onClick={() => onUpdateVariantQty(variant.id, -1, variant.quantity)}
                                            className="text-slate-500 hover:text-navy-dark hover:bg-slate-100 rounded w-7 h-7 flex items-center justify-center text-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed select-none transition-all cursor-pointer"
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
                                            disabled={isOutOfStock || variantInCart}
                                            className="w-8 text-center bg-transparent border-0 outline-none font-bold text-sm text-slate-800 focus:ring-0 p-0"
                                        />
                                        <button
                                            type="button"
                                            disabled={isOutOfStock || qty >= variant.quantity || variantInCart}
                                            onClick={() => onUpdateVariantQty(variant.id, 1, variant.quantity)}
                                            className="text-slate-500 hover:text-navy-dark hover:bg-slate-100 rounded w-7 h-7 flex items-center justify-center text-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed select-none transition-all cursor-pointer"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Add Button */}
                                    <button
                                        type="button"
                                        disabled={isOutOfStock || variantInCart}
                                        onClick={(e) => handleAddSingleItemToCart(variant, qty, e)}
                                        className={`flex-1 h-10 rounded-xl text-[14px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-90 ${variantInCart ? 'bg-emerald-500 text-white border border-emerald-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
                                    >
                                        {variantInCart ? <CheckCircle className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                                        {variantInCart ? 'Added' : 'Add to Cart'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default ProductGallery;
