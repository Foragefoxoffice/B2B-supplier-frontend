import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Load from localStorage if available
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('cartItems');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse cart items from localStorage', e);
                return [];
            }
        }
        return [];
    });

    // Save to localStorage whenever cartItems change
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    // itemsToAdd: array of { product, variant, quantity }
    const addBatchToCart = (itemsToAdd, remarks) => {
        setCartItems(prev => {
            const newCart = [...prev];
            
            itemsToAdd.forEach(item => {
                const existingIndex = newCart.findIndex(
                    cartItem => cartItem.variant.id === item.variant.id
                );

                if (existingIndex >= 0) {
                    // Update existing item
                    newCart[existingIndex].quantity += item.quantity;
                    // Cap at variant max quantity if we know it
                    if (item.variant.quantity && newCart[existingIndex].quantity > item.variant.quantity) {
                        newCart[existingIndex].quantity = item.variant.quantity;
                    }
                } else {
                    // Add new item
                    newCart.push({ ...item, remarks: remarks || '' });
                }
            });

            return newCart;
        });
    };

    const updateQuantity = (variantId, newQty, maxQty) => {
        setCartItems(prev => prev.map(item => {
            if (item.variant.id === variantId) {
                let qty = newQty;
                if (qty < 1) qty = 1;
                if (maxQty && qty > maxQty) qty = maxQty;
                return { ...item, quantity: qty };
            }
            return item;
        }));
    };

    const updateRemarks = (variantId, remarks) => {
        setCartItems(prev => prev.map(item => {
            if (item.variant.id === variantId) {
                return { ...item, remarks };
            }
            return item;
        }));
    }

    const removeFromCart = (variantId) => {
        setCartItems(prev => prev.filter(item => item.variant.id !== variantId));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    // Calculate totals
    const cartStats = cartItems.reduce((stats, item) => {
        stats.totalItems += item.quantity;
        const itemSubtotal = item.quantity * parseFloat(item.product.price || 0);
        const gstPercent = parseFloat(item.product.gst) || 5;
        const gstAmount = itemSubtotal * (gstPercent / 100);
        stats.subtotal += itemSubtotal;
        stats.gstTotal += gstAmount;
        stats.grandTotal += (itemSubtotal + gstAmount);
        return stats;
    }, { totalItems: 0, subtotal: 0, gstTotal: 0, grandTotal: 0 });

    return (
        <CartContext.Provider value={{
            cartItems,
            addBatchToCart,
            updateQuantity,
            updateRemarks,
            removeFromCart,
            clearCart,
            cartStats
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
