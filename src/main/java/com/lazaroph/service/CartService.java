package com.lazaroph.service;

import com.lazaroph.model.CartItem;
import com.lazaroph.repository.DataStore;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CartService {
    private static final CartService INSTANCE = new CartService();
    public static CartService getInstance() { return INSTANCE; }

    private final DataStore store = DataStore.getInstance();

    private CartService() {}

    public Map<String, Object> getCartSummary(String sessionKey) {
        List<CartItem> items = store.getCartItems(sessionKey);
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalQuantity = 0;

        for (CartItem item : items) {
            if (item.getSubtotal() != null) {
                subtotal = subtotal.add(item.getSubtotal());
            }
            totalQuantity += item.getQuantity();
        }

        BigDecimal shippingFee = subtotal.compareTo(BigDecimal.ZERO) > 0 ? new BigDecimal("150.00") : BigDecimal.ZERO;
        BigDecimal grandTotal = subtotal.add(shippingFee);

        Map<String, Object> result = new HashMap<>();
        result.put("items", items);
        result.put("subtotal", subtotal);
        result.put("shippingFee", shippingFee);
        result.put("total", grandTotal);
        result.put("totalQuantity", totalQuantity);

        return result;
    }

    public void addItem(String sessionKey, int productId, int variantId, int quantity, String customData) {
        store.addCartItem(sessionKey, productId, variantId, quantity, customData);
    }

    public void updateQuantity(String sessionKey, int cartItemId, int quantity) {
        store.updateCartItemQuantity(sessionKey, cartItemId, quantity);
    }

    public void removeItem(String sessionKey, int cartItemId) {
        store.removeCartItem(sessionKey, cartItemId);
    }

    public void clearCart(String sessionKey) {
        store.clearCart(sessionKey);
    }
}
